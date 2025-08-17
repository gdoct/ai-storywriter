import json
import logging
from fastapi import APIRouter, HTTPException, status, Depends, File, UploadFile, Form
from fastapi.responses import FileResponse
from models.scenario_image import (
    UploadScenarioImageResponse, DeleteScenarioImageResponse,
    UploadImageWithDataResponse
)
from data.repositories import UserRepository
from middleware.fastapi_auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

# Configuration
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename: str) -> bool:
    """Check if the file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@router.post("/scenario/{scenario_id}/upload-image", response_model=UploadScenarioImageResponse)
async def upload_scenario_image(
    scenario_id: str,
    current_user: dict = Depends(get_current_user),
    image: UploadFile = File(...)
):
    """Upload an image for a scenario."""
    try:
        logger.info(f"Starting scenario image upload for scenario {scenario_id}")
        
        user_id = current_user['id']
        
        if not image.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='No file selected'
            )
        
        if not allowed_file(image.filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed.'
            )
        
        # Read file data
        file_data = await image.read()
        
        # Use service to upload image
        from services.scenario_image_service import ScenarioImageService
        result = ScenarioImageService.upload_image_for_scenario(
            scenario_id, user_id, file_data, image.filename
        )
        
        return UploadScenarioImageResponse(
            imageId=result['imageId'],
            imageUrl=result['imageUrl'],
            scenario=result['scenario'],
            message='Image uploaded successfully'
        )
        
    except ValueError as e:
        logger.error(f"Validation error in upload_scenario_image: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in upload_scenario_image: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to upload image'
        )

@router.get("/scenario-images/{image_id}")
async def serve_scenario_image(image_id: str):
    """Serve scenario image files directly."""
    try:
        # Use service to serve the image
        from services.scenario_image_service import ScenarioImageService
        return ScenarioImageService.serve_image_file(image_id)
        
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Image not found'
        )
    except Exception as e:
        logger.error(f"Error serving scenario image: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to serve image'
        )

@router.delete("/scenario/{scenario_id}/delete-image", response_model=DeleteScenarioImageResponse)
async def delete_scenario_image(
    scenario_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete the image for a scenario."""
    try:
        logger.info(f"Deleting image for scenario {scenario_id}")
        
        user_id = current_user['id']
        
        # Use service to delete image
        from services.scenario_image_service import ScenarioImageService
        result = ScenarioImageService.delete_image_from_scenario(scenario_id, user_id)
        
        return DeleteScenarioImageResponse(
            success=True,
            message='Image deleted successfully',
            deletedFiles=len(result['deleted_files'])
        )
        
    except ValueError as e:
        logger.error(f"Validation error in delete_scenario_image: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error deleting scenario image: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to delete image'
        )

@router.post("/scenario/upload-image-with-data", response_model=UploadImageWithDataResponse)
async def upload_image_with_scenario_data(
    current_user: dict = Depends(get_current_user),
    image: UploadFile = File(...),
    scenarioData: str = Form(...)
):
    """Upload an image along with scenario data - saves/updates the scenario with image."""
    try:
        logger.info("Starting image upload with scenario data")
        
        user_id = current_user['id']
        
        # Parse scenario data
        try:
            scenario_data = json.loads(scenarioData)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Invalid scenario data format'
            )
        
        if not image.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='No file selected'
            )
        
        if not allowed_file(image.filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed.'
            )
        
        # Read file data
        file_data = await image.read()
        
        # Use service to upload image with scenario data
        from services.scenario_image_service import ScenarioImageService
        result = ScenarioImageService.upload_image_with_scenario_data(
            user_id, scenario_data, file_data, image.filename
        )
        
        return UploadImageWithDataResponse(
            scenario=result['scenario'],
            imageId=result['imageId'],
            imageUrl=result['imageUrl'],
            message='Image uploaded and scenario saved successfully'
        )
        
    except ValueError as e:
        logger.error(f"Validation error in upload_image_with_scenario_data: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in upload_image_with_scenario_data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to upload image and save scenario'
        )