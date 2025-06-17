"""
AI Marketplace Processor
Handles AI-powered content generation for marketplace stories including
summary generation and genre classification.
"""

import json
import sqlite3
from typing import Any, Dict, List, Optional

import requests
from data.db import get_db_connection
from llm_services.llm_service import get_active_llm_service


class AIMarketplaceProcessor:
    """Processes stories for marketplace with AI-generated content"""
    
    def __init__(self):
        pass
    
    def _get_llm_service(self):
        """Get the active LLM service"""
        return get_active_llm_service()
    
    def _generate_text(self, prompt: str, max_tokens: int = 200) -> str:
        """Generate text using the active LLM service"""
        try:
            llm_service = self._get_llm_service()
            
            # Prepare the messages in chat format
            messages = [
                {"role": "user", "content": prompt}
            ]
            
            payload = {
                'messages': messages,
                'max_tokens': max_tokens,
                'temperature': 0.7,
                'stream': False
            }
            
            # Use the streaming method but collect all chunks
            response_text = ""
            for chunk in llm_service.chat_completion_stream(payload):
                # Parse the SSE chunk
                chunk_str = chunk.decode('utf-8') if isinstance(chunk, bytes) else chunk
                lines = chunk_str.strip().split('\n')
                
                for line in lines:
                    if line.startswith('data: '):
                        data_str = line[6:].strip()
                        if data_str == '[DONE]':
                            break
                        try:
                            data = json.loads(data_str)
                            if 'choices' in data and len(data['choices']) > 0:
                                delta = data['choices'][0].get('delta', {})
                                content = delta.get('content', '')
                                if content:
                                    response_text += content
                        except json.JSONDecodeError:
                            continue
            
            return response_text.strip()
            
        except Exception as e:
            print(f"Error generating text: {e}")
            return ""
    
    def process_story_for_marketplace(self, market_story_id: int) -> Dict[str, Any]:
        """
        Process a story for marketplace by generating AI summary and genres
        
        Args:
            market_story_id: ID of the story in market_stories table
            
        Returns:
            Dict containing success status and generated content
        """
        try:
            # Get story content
            conn = get_db_connection()
            c = conn.cursor()
            
            c.execute('SELECT title, content FROM market_stories WHERE id = ?', (market_story_id,))
            story = c.fetchone()
            
            if not story:
                return {"success": False, "error": "Story not found"}
            
            title, content = story['title'], story['content']
            
            # Generate AI summary
            summary = self._generate_summary(title, content)
            
            # Generate AI genres
            genres = self._generate_genres(title, content)
            
            # Update the market story with AI-generated content
            c.execute('''
                UPDATE market_stories 
                SET ai_summary = ?, ai_genres = ?
                WHERE id = ?
            ''', (summary, json.dumps(genres), market_story_id))
            
            conn.commit()
            conn.close()
            
            return {
                "success": True,
                "summary": summary,
                "genres": genres
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _generate_summary(self, title: str, content: str) -> str:
        """Generate a compelling summary for the story"""
        
        # Truncate content if too long for context window
        max_content_length = 3000
        truncated_content = content[:max_content_length]
        if len(content) > max_content_length:
            truncated_content += "..."
        
        prompt = f"""You are tasked with creating a compelling, concise summary for a story to be published in a marketplace. The summary should be engaging and help readers decide if they want to read the full story.

Title: {title}

Story content:
{truncated_content}

Please write a summary that:
1. Is 100-200 words long
2. Captures the main plot and characters
3. Is engaging and enticing to potential readers
4. Avoids spoilers
5. Focuses on what makes the story interesting or unique

Summary:"""

        try:
            response = self._generate_text(prompt, max_tokens=250)
            # Clean up the response
            summary = response.strip()
            
            # Ensure it's not too long
            if len(summary) > 400:
                summary = summary[:400] + "..."
                
            return summary
        except Exception as e:
            # Fallback summary
            return f"A story titled '{title}'. {content[:150]}{'...' if len(content) > 150 else ''}"
    
    def _generate_genres(self, title: str, content: str) -> List[str]:
        """Generate appropriate genres for the story"""
        
        # Truncate content if too long
        max_content_length = 2000
        truncated_content = content[:max_content_length]
        if len(content) > max_content_length:
            truncated_content += "..."
        
        # Define available genres
        available_genres = [
            "Fantasy", "Science Fiction", "Mystery", "Romance", "Adventure", 
            "Horror", "Comedy", "Drama", "Thriller", "Historical Fiction",
            "Young Adult", "Children's", "Literary Fiction", "Crime", "Adult",
            "Supernatural", "Action", "Western", "Biography", "Non-Fiction"
        ]
        
        prompt = f"""You are tasked with categorizing a story into appropriate genres. Based on the title and content, select up to 3 most fitting genres from the available list.

Title: {title}

Story content:
{truncated_content}

Available genres: {', '.join(available_genres)}

Please respond with ONLY a comma-separated list of 1-3 genres that best fit this story. For example: "Fantasy, Adventure, Comedy"

Genres:"""

        try:
            response = self._generate_text(prompt, max_tokens=50)
            
            # Parse the response
            genres_text = response.strip()
            
            # Split by comma and clean up
            suggested_genres = [genre.strip() for genre in genres_text.split(',')]
            
            # Filter to only include valid genres and limit to 3
            valid_genres = []
            for genre in suggested_genres:
                if genre in available_genres and len(valid_genres) < 3:
                    valid_genres.append(genre)
            
            # Fallback if no valid genres found
            if not valid_genres:
                valid_genres = ["Fiction"]
                
            return valid_genres
            
        except Exception as e:
            # Fallback genres based on simple keyword matching
            content_lower = (title + " " + content).lower()
            
            fallback_genres = []
            if any(word in content_lower for word in ["magic", "wizard", "dragon", "fantasy"]):
                fallback_genres.append("Fantasy")
            elif any(word in content_lower for word in ["space", "alien", "future", "robot"]):
                fallback_genres.append("Science Fiction")
            elif any(word in content_lower for word in ["love", "romance", "heart"]):
                fallback_genres.append("Romance")
            elif any(word in content_lower for word in ["mystery", "detective", "crime"]):
                fallback_genres.append("Mystery")
            else:
                fallback_genres.append("Fiction")
                
            return fallback_genres[:3]
