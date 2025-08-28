import json
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends
from models.scenario import (
    ScenarioCreate, ScenarioUpdate, ScenarioListItem, 
    ScenarioResponse, StoryPreview, StoryDetail, DeleteResponse,
    SaveStoryRequest, SaveStoryResponse
)
from data.db import get_db_connection
from data.repositories import GeneratedTextRepository, ScenarioRepository, UserRepository
from middleware.fastapi_auth import get_current_user

router = APIRouter()

@router.get("/scenario", response_model=List[ScenarioListItem])
async def get_all_scenarios(current_user: dict = Depends(get_current_user)):
    """
    Get all scenarios for the current user
    """
    scenarios = ScenarioRepository.get_scenarios_by_user(current_user['id'])
    
    result = []
    for s in scenarios:
        try:
            scenario_data = json.loads(s['jsondata'])
            result.append(ScenarioListItem(
                id=s['id'],
                title=scenario_data.get('title', ''),
                synopsis=scenario_data.get('synopsis', '')
            ))
        except Exception as e:
            logging.error(f"Error parsing scenario data: {e}")
    
    return result

@router.post("/scenario", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_scenario(
    scenario_data: ScenarioCreate, 
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new scenario
    """
    # Convert Pydantic model to dict, then to JSON string for storage
    data_dict = scenario_data.dict()
    jsondata = json.dumps(data_dict)
    
    # Create scenario
    scenario = ScenarioRepository.create_scenario(
        current_user['id'], 
        scenario_data.title, 
        jsondata
    )
    
    # Parse the stored JSON data back into object
    scenario_response = json.loads(scenario['jsondata'])
    scenario_response['id'] = scenario['id']
    
    return scenario_response

@router.get("/scenario/{scenario_id}", response_model=Dict[str, Any])
async def get_scenario_by_id(
    scenario_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific scenario by ID
    """
    conn = get_db_connection()
    try:
        scenario = conn.execute(
            'SELECT * FROM scenarios WHERE id = ? AND is_deleted = 0', 
            (scenario_id,)
        ).fetchone()
    finally:
        conn.close()
    
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scenario not found"
        )
        
    try:
        # Parse the stored JSON data back into object
        scenario_data = json.loads(scenario['jsondata'])
        scenario_data['id'] = scenario['id']
        return scenario_data
    except Exception as e:
        logging.error(f"Error parsing scenario data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid scenario data"
        )

@router.put("/scenario/{scenario_id}", response_model=Dict[str, Any])
async def update_scenario(
    scenario_id: str,
    scenario_data: ScenarioUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update an existing scenario
    """
    # Convert to dict and handle partial updates
    data_dict = scenario_data.dict(exclude_unset=True)
    
    # If we have data to update
    if data_dict:
        jsondata = json.dumps(data_dict)
        title = data_dict.get('title', '')
        
        # Update the scenario in the database
        ScenarioRepository.update_scenario(scenario_id, title, jsondata)
    
    # Return the updated scenario data with the correct ID
    data_dict['id'] = scenario_id
    return data_dict

@router.delete("/scenario/{scenario_id}", response_model=DeleteResponse)
async def delete_scenario(
    scenario_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a scenario and all associated stories
    """
    # Delete all stories associated with this scenario first
    GeneratedTextRepository.delete_stories_by_scenario(scenario_id)
    
    # Then delete the scenario
    ScenarioRepository.delete_scenario(scenario_id)
    
    return DeleteResponse(success=True)

# --- STORY ENDPOINTS ---

@router.post("/story/{scenario_id}", response_model=SaveStoryResponse)
async def save_story(
    scenario_id: str,
    request: SaveStoryRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Save a new story for a scenario
    """
    # Verify the scenario exists and belongs to the user
    scenario = ScenarioRepository.get_scenario_by_id(scenario_id)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scenario not found"
        )
    
    if scenario['user_id'] != current_user.get('user_id'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to save stories for this scenario"
        )
    
    # Create the story
    created_story = GeneratedTextRepository.create_story(
        scenario_id=scenario_id,
        text=request.content,
        scenario_json=json.dumps(request.scenario)
    )
    
    if not created_story:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create story"
        )
    
    # The create_story method returns the full row, not just the ID
    story = created_story
    
    return SaveStoryResponse(
        id=str(story['id']),
        content=story['text'],
        timestamp=story['created_at'],
        scenario_id=story['scenario_id']
    )

@router.get("/story/single/{story_id}", response_model=StoryDetail)
async def get_single_story(
    story_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a single story by its ID (without requiring scenario ID)
    """
    story = GeneratedTextRepository.get_story_by_id(story_id)
    
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    
    # Verify the story belongs to the current user via scenario ownership
    scenario = ScenarioRepository.get_scenario_by_id(story['scenario_id'])
    if not scenario or scenario['user_id'] != current_user.get('user_id'):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    
    return StoryDetail(
        id=str(story['id']),
        text=story['text'],
        word_count=len(story['text'].split()),
        created_at=story['created_at'],
        scenario_id=story['scenario_id']
    )

@router.get("/story/{scenario_id}", response_model=List[StoryPreview])
async def get_stories(
    scenario_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all stories for a scenario with preview text only (first 50 words)
    """
    stories = GeneratedTextRepository.get_stories_by_scenario(scenario_id)
    result = []
    
    for s in stories:
        # Extract first 50 words from the story text
        words = s['text'].split()
        preview_words = words[:50]
        preview_text = ' '.join(preview_words)
        
        # Add ellipsis if there are more than 50 words
        if len(words) > 50:
            preview_text += "..."
        
        result.append(StoryPreview(
            id=str(s['id']),
            preview_text=preview_text,
            word_count=len(words),
            created_at=s['created_at']
        ))
    
    return result

@router.get("/story/{scenario_id}/{story_id}", response_model=StoryDetail)
async def get_story_detail(
    scenario_id: str,
    story_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get full story details
    """
    story = GeneratedTextRepository.get_story_by_id(story_id)
    
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    
    # Verify the story belongs to the specified scenario
    if story['scenario_id'] != scenario_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found in this scenario"
        )
    
    words = story['text'].split()
    
    return StoryDetail(
        id=story['id'],
        text=story['text'],
        word_count=len(words),
        created_at=story['created_at'],
        scenario_id=story['scenario_id']
    )

@router.delete("/story/{scenario_id}/{story_id}", response_model=DeleteResponse)
async def delete_story(
    scenario_id: str,
    story_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a specific story
    """
    # Verify story exists and belongs to the scenario
    story = GeneratedTextRepository.get_story_by_id(story_id)
    
    if not story or story['scenario_id'] != scenario_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    
    GeneratedTextRepository.delete_story(story_id)
    return DeleteResponse(success=True)