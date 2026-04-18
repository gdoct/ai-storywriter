"""
Generate Similar Scenario Router
Endpoints for generating synopsis and full scenarios similar to an existing one.
"""

import json
import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

from api.middleware.fastapi_auth import get_current_user
from domain.services.generate_similar_service import GenerateSimilarService
from domain.services.llm_proxy_service import LLMProxyService
from infrastructure.database.repositories import ScenarioRepository

router = APIRouter()
logger = logging.getLogger(__name__)


class GenerateSynopsisRequest(BaseModel):
    user_instructions: str = ""


class GenerateSynopsisResponse(BaseModel):
    title: str
    synopsis: str


class GenerateFullScenarioRequest(BaseModel):
    title: str
    synopsis: str


@router.post(
    "/scenarios/{scenario_id}/generate-similar-synopsis",
    response_model=GenerateSynopsisResponse,
)
async def generate_similar_synopsis(
    scenario_id: str,
    request_body: GenerateSynopsisRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate a new title and synopsis similar to the given scenario.
    The user can accept or request another one with different instructions.
    """
    user_id = current_user.get("user_id") or current_user.get("id")

    scenario = ScenarioRepository.get_scenario_by_id(scenario_id, user_id)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scenario not found",
        )

    try:
        scenario_data = json.loads(scenario["jsondata"])
    except (json.JSONDecodeError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid scenario data",
        )

    byok_headers = LLMProxyService.extract_byok_headers(dict(request.headers))

    try:
        result = await GenerateSimilarService.generate_synopsis(
            scenario_data=scenario_data,
            user_instructions=request_body.user_instructions,
            user_id=user_id,
            byok_headers=byok_headers,
        )
        return GenerateSynopsisResponse(**result)
    except ValueError as e:
        logger.error(f"Synopsis generation validation error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Synopsis generation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate synopsis",
        )


@router.post(
    "/scenarios/{scenario_id}/generate-similar-full",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
)
async def generate_similar_full(
    scenario_id: str,
    request_body: GenerateFullScenarioRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate and save a full scenario from an accepted title and synopsis.
    Uses the source scenario as a writing style reference.
    Returns the newly created scenario.
    """
    user_id = current_user.get("user_id") or current_user.get("id")

    scenario = ScenarioRepository.get_scenario_by_id(scenario_id, user_id)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scenario not found",
        )

    try:
        scenario_data = json.loads(scenario["jsondata"])
    except (json.JSONDecodeError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid scenario data",
        )

    logger.info(f"[generate_similar_full] source scenario_id={scenario_id}, characters in jsondata: {len(scenario_data.get('characters', []))}")

    byok_headers = LLMProxyService.extract_byok_headers(dict(request.headers))

    try:
        new_scenario = await GenerateSimilarService.generate_full_scenario(
            source_scenario_data=scenario_data,
            accepted_title=request_body.title,
            accepted_synopsis=request_body.synopsis,
            user_id=user_id,
            byok_headers=byok_headers,
        )
        return new_scenario
    except ValueError as e:
        logger.error(f"Full scenario generation validation error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Full scenario generation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate scenario",
        )
