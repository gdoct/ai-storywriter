"""
Marketplace Controller
Handles all marketplace-related API endpoints for publishing, browsing, rating, and donating.
"""

import json
import sqlite3
import threading
from datetime import datetime, timedelta

from ai_marketplace_processor import AIMarketplaceProcessor
from data.db import get_db_connection
from data.repositories import UserRepository
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

marketplace_bp = Blueprint('marketplace', __name__)

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

@marketplace_bp.route('/api/marketplace/publish/<int:original_story_id>', methods=['POST'])
@jwt_required()
def publish_story(original_story_id):
    """Publish a story to the marketplace"""
    try:
        username = get_jwt_identity()
        user = UserRepository.get_user_by_username(username)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user['id']
        
        data = request.get_json()
        title = data.get('title', '').strip()
        allow_ai = data.get('allow_ai', True)
        terms_accepted = data.get('terms_accepted', False)
        
        if not title:
            return jsonify({'error': 'Title is required'}), 400
        
        if not terms_accepted:
            return jsonify({'error': 'You must accept the terms and conditions'}), 400
        
        conn = get_db_connection()
        c = conn.cursor()
        
        # Check if the original story exists and belongs to the user
        c.execute('''
            SELECT s.id, s.text, s.created_at, s.scenario_json, sc.title as scenario_title, sc.jsondata
            FROM stories s
            JOIN scenarios sc ON s.scenario_id = sc.id
            WHERE s.id = ? AND sc.user_id = ? AND sc.is_deleted = 0
        ''', (original_story_id, user_id))
        
        story = c.fetchone()
        if not story:
            return jsonify({'error': 'Story not found or access denied'}), 404
        
        # Check if story is already published
        c.execute('SELECT id FROM market_stories WHERE original_story_id = ?', (original_story_id,))
        existing = c.fetchone()
        if existing:
            return jsonify({'error': 'Story is already published to marketplace'}), 409
        
        # Extract image URI from scenario's JSON data
        image_uri = None
        if story['jsondata']:
            try:
                import json
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
            original_story_id, user_id, title, story['text'],
            story['created_at'], datetime.utcnow().isoformat(), image_uri, story['scenario_json']
        ))
        
        market_story_id = c.lastrowid
        conn.commit()
        conn.close()
        
        # Process with AI if requested (asynchronous)
        if allow_ai:
            def process_ai():
                processor = AIMarketplaceProcessor()
                processor.process_story_for_marketplace(market_story_id)
            
            thread = threading.Thread(target=process_ai)
            thread.daemon = True
            thread.start()
        
        return jsonify({
            'success': True,
            'market_story_id': market_story_id,
            'message': 'Story published successfully!'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/api/marketplace/market-stories', methods=['GET'])
def get_market_stories():
    """Get list of published marketplace stories with filtering and sorting"""
    try:
        # Parse query parameters
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)  # Max 100 per page
        search = request.args.get('search', '').strip()
        genre = request.args.get('genre', '').strip()
        min_rating = request.args.get('min_rating', type=float)
        sort_by = request.args.get('sort_by', 'published_at')  # published_at, rating, downloads, donations
        sort_order = request.args.get('sort_order', 'desc')  # asc, desc
        
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
            story = dict(row)
            # Parse AI genres from JSON
            if story['ai_genres']:
                try:
                    story['ai_genres'] = json.loads(story['ai_genres'])
                except:
                    story['ai_genres'] = []
            else:
                story['ai_genres'] = []
            stories.append(story)
        
        conn.close()
        
        return jsonify({
            'stories': stories,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total_count,
                'pages': (total_count + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/api/marketplace/market-stories/<int:market_story_id>', methods=['GET'])
def get_market_story(market_story_id):
    """Get details for a single marketplace story"""
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
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
            return jsonify({'error': 'Story not found'}), 404
        
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
        try:
            username = get_jwt_identity()
            if username:
                user = UserRepository.get_user_by_username(username)
                if user:
                    c.execute('''
                        SELECT rating FROM market_story_ratings 
                        WHERE market_story_id = ? AND user_id = ?
                    ''', (market_story_id, user['id']))
                    rating_row = c.fetchone()
                    if rating_row:
                        user_rating = rating_row['rating']
        except:
            # User not authenticated, continue without rating
            pass
        
        story_data['user_rating'] = user_rating
        
        conn.close()
        
        return jsonify(story_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/api/marketplace/market-stories/<int:market_story_id>/download', methods=['POST'])
def download_story(market_story_id):
    """Increment download count for a story"""
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Check if story exists
        c.execute('SELECT id FROM market_stories WHERE id = ?', (market_story_id,))
        if not c.fetchone():
            return jsonify({'error': 'Story not found'}), 404
        
        # Increment download count
        c.execute('''
            UPDATE market_stories 
            SET total_downloads = total_downloads + 1 
            WHERE id = ?
        ''', (market_story_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/api/marketplace/market-stories/<int:market_story_id>/rate', methods=['POST'])
@jwt_required()
def rate_story(market_story_id):
    """Submit or update a rating for a story"""
    try:
        username = get_jwt_identity()
        user = UserRepository.get_user_by_username(username)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user['id']
        
        data = request.get_json()
        rating = data.get('rating')
        
        if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be an integer between 1 and 5'}), 400
        
        conn = get_db_connection()
        c = conn.cursor()
        
        # Check if story exists
        c.execute('SELECT id FROM market_stories WHERE id = ?', (market_story_id,))
        if not c.fetchone():
            return jsonify({'error': 'Story not found'}), 404
        
        # Insert or update rating
        c.execute('''
            INSERT OR REPLACE INTO market_story_ratings 
            (market_story_id, user_id, rating, rated_at)
            VALUES (?, ?, ?, ?)
        ''', (market_story_id, user_id, rating, datetime.utcnow().isoformat()))
        
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
        conn.close()
        
        return jsonify({
            'success': True,
            'average_rating': round(avg_rating, 1),
            'rating_count': rating_count
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/api/marketplace/market-stories/<int:market_story_id>/donate', methods=['POST'])
@jwt_required()
def donate_credits(market_story_id):
    """Donate credits to a story's author"""
    try:
        username = get_jwt_identity()
        user = UserRepository.get_user_by_username(username)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user['id']
        
        data = request.get_json()
        credits = data.get('credits')
        
        if not credits or not isinstance(credits, int) or credits <= 0:
            return jsonify({'error': 'Credits must be a positive integer'}), 400
        
        conn = get_db_connection()
        c = conn.cursor()
        
        # Get story and check if it exists
        c.execute('''
            SELECT user_id FROM market_stories WHERE id = ?
        ''', (market_story_id,))
        story = c.fetchone()
        
        if not story:
            return jsonify({'error': 'Story not found'}), 404
        
        recipient_user_id = story['user_id']
        
        # Check if user is trying to donate to their own story
        if recipient_user_id == user_id:
            return jsonify({'error': 'You cannot donate to your own story'}), 400
        
        # TODO: Check if user has enough credits (requires credits system implementation)
        # For now, we'll just record the donation
        
        # Record the donation
        c.execute('''
            INSERT INTO market_story_donations 
            (market_story_id, donor_user_id, recipient_user_id, credits_donated, donated_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (market_story_id, user_id, recipient_user_id, credits, datetime.utcnow().isoformat()))
        
        # Update total donated credits for the story
        c.execute('''
            UPDATE market_stories 
            SET total_donated_credits = total_donated_credits + ?
            WHERE id = ?
        ''', (credits, market_story_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Successfully donated {credits} credits!'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Section endpoints for homepage
@marketplace_bp.route('/api/marketplace/sections/top-rated', methods=['GET'])
def get_top_rated():
    """Get top rated stories"""
    try:
        limit = min(int(request.args.get('limit', 10)), 20)
        
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            SELECT 
                ms.id, ms.title, u.username as author, ms.ai_summary,
                ms.ai_genres, ms.average_rating, ms.rating_count,
                ms.total_downloads, ms.is_staff_pick, ms.image_uri
            FROM market_stories ms
            JOIN users u ON ms.user_id = u.id
            WHERE ms.rating_count >= 3
            ORDER BY ms.average_rating DESC, ms.rating_count DESC
            LIMIT ?
        ''', (limit,))
        
        stories = []
        for row in c.fetchall():
            story = dict(row)
            if story['ai_genres']:
                try:
                    story['ai_genres'] = json.loads(story['ai_genres'])
                except:
                    story['ai_genres'] = []
            else:
                story['ai_genres'] = []
            stories.append(story)
        
        conn.close()
        return jsonify({'stories': stories})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/api/marketplace/sections/most-popular', methods=['GET'])
def get_most_popular():
    """Get most popular stories by downloads"""
    try:
        limit = min(int(request.args.get('limit', 10)), 20)
        
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            SELECT 
                ms.id, ms.title, u.username as author, ms.ai_summary,
                ms.ai_genres, ms.average_rating, ms.rating_count,
                ms.total_downloads, ms.is_staff_pick, ms.image_uri
            FROM market_stories ms
            JOIN users u ON ms.user_id = u.id
            ORDER BY ms.total_downloads DESC
            LIMIT ?
        ''', (limit,))
        
        stories = []
        for row in c.fetchall():
            story = dict(row)
            if story['ai_genres']:
                try:
                    story['ai_genres'] = json.loads(story['ai_genres'])
                except:
                    story['ai_genres'] = []
            else:
                story['ai_genres'] = []
            stories.append(story)
        
        conn.close()
        return jsonify({'stories': stories})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/api/marketplace/sections/latest', methods=['GET'])
def get_latest():
    """Get latest published stories"""
    try:
        limit = min(int(request.args.get('limit', 10)), 20)
        
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            SELECT 
                ms.id, ms.title, u.username as author, ms.ai_summary,
                ms.ai_genres, ms.average_rating, ms.rating_count,
                ms.total_downloads, ms.is_staff_pick, ms.image_uri
            FROM market_stories ms
            JOIN users u ON ms.user_id = u.id
            ORDER BY ms.published_at DESC
            LIMIT ?
        ''', (limit,))
        
        stories = []
        for row in c.fetchall():
            story = dict(row)
            if story['ai_genres']:
                try:
                    story['ai_genres'] = json.loads(story['ai_genres'])
                except:
                    story['ai_genres'] = []
            else:
                story['ai_genres'] = []
            stories.append(story)
        
        conn.close()
        return jsonify({'stories': stories})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/api/marketplace/sections/staff-picks', methods=['GET'])
def get_staff_picks():
    """Get staff recommended stories"""
    try:
        limit = min(int(request.args.get('limit', 10)), 20)
        
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            SELECT 
                ms.id, ms.title, u.username as author, ms.ai_summary,
                ms.ai_genres, ms.average_rating, ms.rating_count,
                ms.total_downloads, ms.is_staff_pick, ms.image_uri
            FROM market_stories ms
            JOIN users u ON ms.user_id = u.id
            WHERE ms.is_staff_pick = 1
            ORDER BY ms.published_at DESC
            LIMIT ?
        ''', (limit,))
        
        stories = []
        for row in c.fetchall():
            story = dict(row)
            if story['ai_genres']:
                try:
                    story['ai_genres'] = json.loads(story['ai_genres'])
                except:
                    story['ai_genres'] = []
            else:
                story['ai_genres'] = []
            stories.append(story)
        
        conn.close()
        return jsonify({'stories': stories})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/api/marketplace/sections/genre/<genre_name>', methods=['GET'])
def get_by_genre(genre_name):
    """Get stories by genre"""
    try:
        limit = min(int(request.args.get('limit', 10)), 20)
        
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            SELECT 
                ms.id, ms.title, u.username as author, ms.ai_summary,
                ms.ai_genres, ms.average_rating, ms.rating_count,
                ms.total_downloads, ms.is_staff_pick, ms.image_uri
            FROM market_stories ms
            JOIN users u ON ms.user_id = u.id
            WHERE ms.ai_genres LIKE ?
            ORDER BY ms.average_rating DESC, ms.total_downloads DESC
            LIMIT ?
        ''', (f'%"{genre_name}"%', limit))
        
        stories = []
        for row in c.fetchall():
            story = dict(row)
            if story['ai_genres']:
                try:
                    story['ai_genres'] = json.loads(story['ai_genres'])
                except:
                    story['ai_genres'] = []
            else:
                story['ai_genres'] = []
            stories.append(story)
        
        conn.close()
        return jsonify({'stories': stories})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/api/marketplace/user/credits', methods=['GET'])
@jwt_required()
def get_user_credits():
    """Get current user's credit balance with light caching"""
    try:
        username = get_jwt_identity()
        user = UserRepository.get_user_by_username(username)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user['id']
        
        # Check cache first
        cached_credits = _get_cached_credits(user_id)
        if cached_credits is not None:
            return jsonify({
                'credits': cached_credits,
                'cached': True
            })
        
        # Calculate credits from transactions
        credits = UserRepository.get_user_credit_balance(user_id)
        
        # Cache the result
        _cache_credits(user_id, credits)
        
        return jsonify({
            'credits': credits,
            'cached': False
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/api/marketplace/user/credits/clear-cache', methods=['POST'])
@jwt_required()
def clear_user_credits_cache():
    """Clear the credits cache for the current user (useful after transactions)"""
    try:
        username = get_jwt_identity()
        user = UserRepository.get_user_by_username(username)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user['id']
        _clear_user_cache(user_id)
        
        return jsonify({'message': 'Cache cleared successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
