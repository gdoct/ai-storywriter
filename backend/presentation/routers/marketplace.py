import json
import threading
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, status, Depends, Query
from domain.models.marketplace import (
    PublishStoryRequest, PublishStoryResponse, MarketStoriesResponse,
    MarketStoryDetail, DownloadResponse, RatingRequest, RatingResponse,
    DonationRequest, DonationResponse, StoriesListResponse, GenresResponse,
    UserCreditsResponse, ClearCacheResponse, MarketStoryListItem, PaginationInfo,
    Genre
)
from infrastructure.database.db import get_db_connection
from infrastructure.database.repositories import UserRepository
from api.middleware.fastapi_auth import get_current_user, get_current_user_optional

router = APIRouter()

# Simple in-memory cache for user credits
_credits_cache = {}
_cache_expiry = {}
CACHE_DURATION_MINUTES = 5

def _get_cached_credits(user_id):
    """Get credits from cache if available and not expired"""
    if user_id in _credits_cache and user_id in _cache_expiry:
        if datetime.utcnow() < _cache_expiry[user_id]:
            return _credits_cache[user_id]
    return None

def _cache_credits(user_id, credits):
    """Cache user credits with expiry time"""
    _credits_cache[user_id] = credits
    _cache_expiry[user_id] = datetime.utcnow() + timedelta(minutes=CACHE_DURATION_MINUTES)

def _clear_user_cache(user_id):
    """Clear cache for specific user"""
    if user_id in _credits_cache:
        del _credits_cache[user_id]
    if user_id in _cache_expiry:
        del _cache_expiry[user_id]

@router.post("/marketplace/publish/{original_story_id}", response_model=PublishStoryResponse)
async def publish_story(
    original_story_id: int,
    data: PublishStoryRequest,
    current_user: dict = Depends(get_current_user)
):
    """Publish a story to the marketplace"""
    user_id = current_user['id']
    
    if not data.terms_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='You must accept the terms and conditions'
        )
    
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        # Check if the original story exists and belongs to the user
        c.execute('''
            SELECT s.id, s.text, s.created_at, s.scenario_json, sc.title as scenario_title, sc.jsondata
            FROM stories s
            JOIN scenarios sc ON s.scenario_id = sc.id
            WHERE s.id = ? AND sc.user_id = ? AND sc.is_deleted = 0
        ''', (original_story_id, user_id))
        
        story = c.fetchone()
        if not story:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Story not found or access denied'
            )
        
        # Check if story is already published
        c.execute('SELECT id FROM market_stories WHERE original_story_id = ?', (original_story_id,))
        existing = c.fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='Story is already published to marketplace'
            )
        
        # Extract image URI from scenario's JSON data
        image_uri = None
        if story['jsondata']:
            try:
                scenario_data = json.loads(story['jsondata'])
                image_uri = scenario_data.get('imageUrl')
            except:
                # If JSON parsing fails, continue without image
                pass
        
        # Create marketplace story entry
        c.execute('''
            INSERT INTO market_stories (
                original_story_id, user_id, title, content, 
                created_at_original, published_at, image_uri, scenario_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            original_story_id, user_id, data.title, story['text'],
            story['created_at'], datetime.utcnow().isoformat(), image_uri, story['scenario_json']
        ))
        
        market_story_id = c.lastrowid
        conn.commit()
        
        # Process with AI if requested (asynchronous)
        if data.allow_ai:
            def process_ai():
                from ai_marketplace_processor import AIMarketplaceProcessor
                processor = AIMarketplaceProcessor()
                processor.process_story_for_marketplace(market_story_id)
            
            thread = threading.Thread(target=process_ai)
            thread.daemon = True
            thread.start()
        
        return PublishStoryResponse(
            success=True,
            market_story_id=market_story_id,
            message='Story published successfully!'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        conn.close()

@router.get("/marketplace/market-stories", response_model=MarketStoriesResponse)
async def get_market_stories(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    genre: Optional[str] = Query(default=None),
    min_rating: Optional[float] = Query(default=None),
    sort_by: str = Query(default='published_at', regex='^(published_at|rating|downloads|donations|title)$'),
    sort_order: str = Query(default='desc', regex='^(asc|desc)$')
):
    """Get list of published marketplace stories with filtering and sorting"""
    # Build the query
    where_conditions = []
    params = []
    
    if search:
        where_conditions.append('(ms.title LIKE ? OR u.username LIKE ? OR ms.content LIKE ?)')
        search_param = f'%{search}%'
        params.extend([search_param, search_param, search_param])
    
    if genre:
        where_conditions.append('ms.ai_genres LIKE ?')
        params.append(f'%"{genre}"%')
    
    if min_rating is not None:
        where_conditions.append('ms.average_rating >= ?')
        params.append(min_rating)
    
    where_clause = ''
    if where_conditions:
        where_clause = 'WHERE ' + ' AND '.join(where_conditions)
    
    # Validate sort parameters
    valid_sort_fields = {
        'published_at': 'ms.published_at',
        'rating': 'ms.average_rating',
        'downloads': 'ms.total_downloads',
        'donations': 'ms.total_donated_credits',
        'title': 'ms.title'
    }
    
    sort_field = valid_sort_fields.get(sort_by, 'ms.published_at')
    sort_direction = 'ASC' if sort_order.lower() == 'asc' else 'DESC'
    
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        # Get total count
        count_query = f'''
            SELECT COUNT(*)
            FROM market_stories ms
            JOIN users u ON ms.user_id = u.id
            {where_clause}
        '''
        c.execute(count_query, params)
        total_count = c.fetchone()[0]
        
        # Get stories
        offset = (page - 1) * per_page
        stories_query = f'''
            SELECT 
                ms.id, ms.title, u.username as author, ms.ai_summary,
                ms.ai_genres, ms.average_rating, ms.rating_count,
                ms.total_downloads, ms.total_donated_credits, ms.published_at,
                ms.is_staff_pick, ms.image_uri
            FROM market_stories ms
            JOIN users u ON ms.user_id = u.id
            {where_clause}
            ORDER BY {sort_field} {sort_direction}
            LIMIT ? OFFSET ?
        '''
        c.execute(stories_query, params + [per_page, offset])
        
        stories = []
        for row in c.fetchall():
            story_data = dict(row)
            # Parse AI genres from JSON
            if story_data['ai_genres']:
                try:
                    story_data['ai_genres'] = json.loads(story_data['ai_genres'])
                except:
                    story_data['ai_genres'] = []
            else:
                story_data['ai_genres'] = []
            
            stories.append(MarketStoryListItem(**story_data))
        
        total_pages = (total_count + per_page - 1) // per_page
        
        return MarketStoriesResponse(
            stories=stories,
            pagination=PaginationInfo(
                page=page,
                per_page=per_page,
                total=total_count,
                pages=total_pages
            )
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        conn.close()

@router.get("/marketplace/market-stories/{market_story_id}", response_model=MarketStoryDetail)
async def get_market_story(
    market_story_id: int,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Get details for a single marketplace story"""
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        c.execute('''
            SELECT 
                ms.id, ms.title, u.username as author, ms.content,
                ms.ai_summary, ms.ai_genres, ms.average_rating, ms.rating_count,
                ms.total_downloads, ms.total_donated_credits, ms.published_at,
                ms.is_staff_pick, u.id as author_id, ms.image_uri, ms.scenario_json
            FROM market_stories ms
            JOIN users u ON ms.user_id = u.id
            WHERE ms.id = ?
        ''', (market_story_id,))
        
        story = c.fetchone()
        if not story:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Story not found'
            )
        
        story_data = dict(story)
        
        # Parse AI genres from JSON
        if story_data['ai_genres']:
            try:
                story_data['ai_genres'] = json.loads(story_data['ai_genres'])
            except:
                story_data['ai_genres'] = []
        else:
            story_data['ai_genres'] = []
        
        # Get user's rating if authenticated
        user_rating = None
        if current_user:
            c.execute('''
                SELECT rating FROM market_story_ratings 
                WHERE market_story_id = ? AND user_id = ?
            ''', (market_story_id, current_user['id']))
            rating_row = c.fetchone()
            if rating_row:
                user_rating = rating_row['rating']
        
        story_data['user_rating'] = user_rating
        
        return MarketStoryDetail(**story_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        conn.close()

@router.post("/marketplace/market-stories/{market_story_id}/download", response_model=DownloadResponse)
async def download_story(market_story_id: int):
    """Increment download count for a story"""
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        # Check if story exists
        c.execute('SELECT id FROM market_stories WHERE id = ?', (market_story_id,))
        if not c.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Story not found'
            )
        
        # Increment download count
        c.execute('''
            UPDATE market_stories 
            SET total_downloads = total_downloads + 1 
            WHERE id = ?
        ''', (market_story_id,))
        
        conn.commit()
        
        return DownloadResponse(success=True)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        conn.close()

@router.post("/marketplace/market-stories/{market_story_id}/rate", response_model=RatingResponse)
async def rate_story(
    market_story_id: int,
    rating_data: RatingRequest,
    current_user: dict = Depends(get_current_user)
):
    """Submit or update a rating for a story"""
    user_id = current_user['id']
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        # Check if story exists
        c.execute('SELECT id FROM market_stories WHERE id = ?', (market_story_id,))
        if not c.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Story not found'
            )
        
        # Insert or update rating
        c.execute('''
            INSERT OR REPLACE INTO market_story_ratings 
            (market_story_id, user_id, rating, rated_at)
            VALUES (?, ?, ?, ?)
        ''', (market_story_id, user_id, rating_data.rating, datetime.utcnow().isoformat()))
        
        # Recalculate average rating
        c.execute('''
            SELECT AVG(rating) as avg_rating, COUNT(*) as count
            FROM market_story_ratings 
            WHERE market_story_id = ?
        ''', (market_story_id,))
        
        result = c.fetchone()
        avg_rating = result['avg_rating'] or 0.0
        rating_count = result['count'] or 0
        
        # Update story with new average
        c.execute('''
            UPDATE market_stories 
            SET average_rating = ?, rating_count = ?
            WHERE id = ?
        ''', (avg_rating, rating_count, market_story_id))
        
        conn.commit()
        
        return RatingResponse(
            success=True,
            average_rating=round(avg_rating, 1),
            rating_count=rating_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        conn.close()

@router.post("/marketplace/market-stories/{market_story_id}/donate", response_model=DonationResponse)
async def donate_credits(
    market_story_id: int,
    donation_data: DonationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Donate credits to a story's author"""
    user_id = current_user['id']
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        # Get story and check if it exists
        c.execute('''
            SELECT user_id FROM market_stories WHERE id = ?
        ''', (market_story_id,))
        story = c.fetchone()
        
        if not story:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Story not found'
            )
        
        recipient_user_id = story['user_id']
        
        # Check if user is trying to donate to their own story
        if recipient_user_id == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='You cannot donate to your own story'
            )
        
        # TODO: Check if user has enough credits (requires credits system implementation)
        # For now, we'll just record the donation
        
        # Record the donation
        c.execute('''
            INSERT INTO market_story_donations 
            (market_story_id, donor_user_id, recipient_user_id, credits_donated, donated_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (market_story_id, user_id, recipient_user_id, donation_data.credits, datetime.utcnow().isoformat()))
        
        # Update total donated credits for the story
        c.execute('''
            UPDATE market_stories 
            SET total_donated_credits = total_donated_credits + ?
            WHERE id = ?
        ''', (donation_data.credits, market_story_id))
        
        conn.commit()
        
        return DonationResponse(
            success=True,
            message=f'Successfully donated {donation_data.credits} credits!'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        conn.close()

# Section endpoints for homepage
@router.get("/marketplace/sections/top-rated", response_model=StoriesListResponse)
async def get_top_rated(limit: int = Query(default=10, le=20)):
    """Get top rated stories"""
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        c.execute('''
            SELECT 
                ms.id, ms.title, u.username as author, ms.ai_summary,
                ms.ai_genres, ms.average_rating, ms.rating_count,
                ms.total_downloads, ms.total_donated_credits, ms.published_at,
                ms.is_staff_pick, ms.image_uri
            FROM market_stories ms
            JOIN users u ON ms.user_id = u.id
            WHERE ms.rating_count >= 1
            ORDER BY ms.average_rating DESC, ms.rating_count DESC
            LIMIT ?
        ''', (limit,))
        
        stories = []
        for row in c.fetchall():
            story_data = dict(row)
            if story_data['ai_genres']:
                try:
                    story_data['ai_genres'] = json.loads(story_data['ai_genres'])
                except:
                    story_data['ai_genres'] = []
            else:
                story_data['ai_genres'] = []
            stories.append(MarketStoryListItem(**story_data))
        
        return StoriesListResponse(stories=stories)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        conn.close()

@router.get("/marketplace/sections/most-popular", response_model=StoriesListResponse)
async def get_most_popular(limit: int = Query(default=10, le=20)):
    """Get most popular stories by downloads"""
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        c.execute('''
            SELECT 
                ms.id, ms.title, u.username as author, ms.ai_summary,
                ms.ai_genres, ms.average_rating, ms.rating_count,
                ms.total_downloads, ms.total_donated_credits, ms.published_at,
                ms.is_staff_pick, ms.image_uri
            FROM market_stories ms
            JOIN users u ON ms.user_id = u.id
            ORDER BY ms.total_downloads DESC
            LIMIT ?
        ''', (limit,))
        
        stories = []
        for row in c.fetchall():
            story_data = dict(row)
            if story_data['ai_genres']:
                try:
                    story_data['ai_genres'] = json.loads(story_data['ai_genres'])
                except:
                    story_data['ai_genres'] = []
            else:
                story_data['ai_genres'] = []
            stories.append(MarketStoryListItem(**story_data))
        
        return StoriesListResponse(stories=stories)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        conn.close()

@router.get("/marketplace/sections/latest", response_model=StoriesListResponse)
async def get_latest(limit: int = Query(default=10, le=20)):
    """Get latest published stories"""
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        c.execute('''
            SELECT 
                ms.id, ms.title, u.username as author, ms.ai_summary,
                ms.ai_genres, ms.average_rating, ms.rating_count,
                ms.total_downloads, ms.total_donated_credits, ms.published_at,
                ms.is_staff_pick, ms.image_uri
            FROM market_stories ms
            JOIN users u ON ms.user_id = u.id
            ORDER BY ms.published_at DESC
            LIMIT ?
        ''', (limit,))
        
        stories = []
        for row in c.fetchall():
            story_data = dict(row)
            if story_data['ai_genres']:
                try:
                    story_data['ai_genres'] = json.loads(story_data['ai_genres'])
                except:
                    story_data['ai_genres'] = []
            else:
                story_data['ai_genres'] = []
            stories.append(MarketStoryListItem(**story_data))
        
        return StoriesListResponse(stories=stories)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        conn.close()

@router.get("/marketplace/sections/staff-picks", response_model=StoriesListResponse)
async def get_staff_picks(limit: int = Query(default=10, le=20)):
    """Get staff recommended stories"""
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        c.execute('''
            SELECT 
                ms.id, ms.title, u.username as author, ms.ai_summary,
                ms.ai_genres, ms.average_rating, ms.rating_count,
                ms.total_downloads, ms.total_donated_credits, ms.published_at,
                ms.is_staff_pick, ms.image_uri
            FROM market_stories ms
            JOIN users u ON ms.user_id = u.id
            WHERE ms.is_staff_pick = 1
            ORDER BY ms.published_at DESC
            LIMIT ?
        ''', (limit,))
        
        stories = []
        for row in c.fetchall():
            story_data = dict(row)
            if story_data['ai_genres']:
                try:
                    story_data['ai_genres'] = json.loads(story_data['ai_genres'])
                except:
                    story_data['ai_genres'] = []
            else:
                story_data['ai_genres'] = []
            stories.append(MarketStoryListItem(**story_data))
        
        return StoriesListResponse(stories=stories)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        conn.close()

@router.get("/marketplace/sections/genre/{genre_name}", response_model=StoriesListResponse)
async def get_by_genre(genre_name: str, limit: int = Query(default=10, le=20)):
    """Get stories by genre"""
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        c.execute('''
            SELECT 
                ms.id, ms.title, u.username as author, ms.ai_summary,
                ms.ai_genres, ms.average_rating, ms.rating_count,
                ms.total_downloads, ms.total_donated_credits, ms.published_at,
                ms.is_staff_pick, ms.image_uri
            FROM market_stories ms
            JOIN users u ON ms.user_id = u.id
            WHERE ms.ai_genres LIKE ?
            ORDER BY ms.average_rating DESC, ms.total_downloads DESC
            LIMIT ?
        ''', (f'%"{genre_name}"%', limit))
        
        stories = []
        for row in c.fetchall():
            story_data = dict(row)
            if story_data['ai_genres']:
                try:
                    story_data['ai_genres'] = json.loads(story_data['ai_genres'])
                except:
                    story_data['ai_genres'] = []
            else:
                story_data['ai_genres'] = []
            stories.append(MarketStoryListItem(**story_data))
        
        return StoriesListResponse(stories=stories)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        conn.close()

@router.get("/marketplace/genres", response_model=GenresResponse)
async def get_available_genres():
    """Get all distinct genres from marketplace stories with story counts"""
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        # Get all stories with genres
        c.execute('''
            SELECT ai_genres 
            FROM market_stories 
            WHERE ai_genres IS NOT NULL AND ai_genres != ''
        ''')
        
        genre_counts = {}
        
        for row in c.fetchall():
            if row['ai_genres']:
                try:
                    genres = json.loads(row['ai_genres'])
                    for genre in genres:
                        if genre and isinstance(genre, str):
                            genre = genre.strip()
                            if genre:
                                genre_counts[genre] = genre_counts.get(genre, 0) + 1
                except:
                    continue
        
        # Sort genres by count (most popular first)
        sorted_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)
        
        # Return list of genres with their counts
        genres = [Genre(name=genre, count=count) for genre, count in sorted_genres]
        
        return GenresResponse(genres=genres)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        conn.close()

@router.get("/marketplace/user/credits", response_model=UserCreditsResponse)
async def get_user_credits(current_user: dict = Depends(get_current_user)):
    """Get current user's credit balance with light caching"""
    user_id = current_user['id']
    
    try:
        # Check cache first
        cached_credits = _get_cached_credits(user_id)
        if cached_credits is not None:
            return UserCreditsResponse(
                credits=cached_credits,
                cached=True
            )
        
        # Calculate credits from transactions
        credits = UserRepository.get_user_credit_balance(user_id)
        
        # Cache the result
        _cache_credits(user_id, credits)
        
        return UserCreditsResponse(
            credits=credits,
            cached=False
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/marketplace/user/credits/clear-cache", response_model=ClearCacheResponse)
async def clear_user_credits_cache(current_user: dict = Depends(get_current_user)):
    """Clear the credits cache for the current user (useful after transactions)"""
    user_id = current_user['id']
    
    try:
        _clear_user_cache(user_id)
        return ClearCacheResponse(message='Cache cleared successfully')
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )