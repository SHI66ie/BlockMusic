"""
FastAPI wrapper for GenLayer intelligent contracts.
Provides HTTP endpoints to interact with AI-powered contracts.
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
import structlog

load_dotenv()

logger = structlog.get_logger()

app = FastAPI(
    title="BlockMusic GenLayer API",
    description="AI-powered intelligent contracts for music moderation, copyright verification, and recommendations",
    version="1.0.0"
)

# Request models
class ModerationRequest(BaseModel):
    track_id: str
    track_title: str
    artist_name: str
    album_name: str
    genre: str
    description: str
    is_explicit: bool

class CopyrightRequest(BaseModel):
    track_id: str
    track_title: str
    artist_name: str
    claimed_original: bool
    sample_sources: str

class RecommendationRequest(BaseModel):
    genres_listened: str
    favorite_artists: str
    recent_tracks: str
    available_track_ids: str

class RecommendationResponse(BaseModel):
    recommendations: List[str]
    status: str

# Response models
class ModerationResponse(BaseModel):
    track_id: str
    status: str
    result: str

class CopyrightResponse(BaseModel):
    track_id: str
    status: str
    result: str

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "BlockMusic GenLayer API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "genlayer_network": os.getenv("GENLAYER_NETWORK", "simulator"),
        "music_nft_contract": os.getenv("MUSIC_NFT_CONTRACT")
    }

@app.post("/moderate", response_model=ModerationResponse)
async def moderate_content(request: ModerationRequest, background_tasks: BackgroundTasks):
    """
    Submit content for AI moderation.
    
    This endpoint analyzes music metadata for policy violations
    using the GenLayer MusicContentModerator contract.
    """
    try:
        logger.info("Content moderation request", track_id=request.track_id)
        
        # TODO: Integrate with actual GenLayer contract
        # For now, return a mock response
        result = {
            "track_id": request.track_id,
            "status": "APPROVED",
            "result": "Content passed moderation check"
        }
        
        logger.info("Content moderation completed", track_id=request.track_id, result=result["status"])
        return result
        
    except Exception as e:
        logger.error("Moderation failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/copyright", response_model=CopyrightResponse)
async def verify_copyright(request: CopyrightRequest, background_tasks: BackgroundTasks):
    """
    Verify copyright status of a track.
    
    This endpoint checks for potential copyright infringement
    using the GenLayer CopyrightVerifier contract.
    """
    try:
        logger.info("Copyright verification request", track_id=request.track_id)
        
        # TODO: Integrate with actual GenLayer contract
        # For now, return a mock response
        result = {
            "track_id": request.track_id,
            "status": "CLEAR",
            "result": "No copyright issues detected"
        }
        
        logger.info("Copyright verification completed", track_id=request.track_id, result=result["status"])
        return result
        
    except Exception as e:
        logger.error("Copyright verification failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """
    Get AI-powered music recommendations.
    
    This endpoint generates personalized recommendations
    using the GenLayer MusicRecommender contract.
    """
    try:
        logger.info("Recommendation request")
        
        # TODO: Integrate with actual GenLayer contract
        # For now, return mock recommendations
        result = {
            "recommendations": request.available_track_ids.split(",")[:5],
            "status": "success"
        }
        
        logger.info("Recommendations generated", count=len(result["recommendations"]))
        return result
        
    except Exception as e:
        logger.error("Recommendation failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/moderation/{track_id}")
async def get_moderation_status(track_id: str):
    """Get moderation status for a specific track"""
    try:
        # TODO: Query GenLayer contract for actual status
        return {
            "track_id": track_id,
            "status": "NOT_MODERATED"
        }
    except Exception as e:
        logger.error("Failed to get moderation status", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/copyright/{track_id}")
async def get_copyright_status(track_id: str):
    """Get copyright status for a specific track"""
    try:
        # TODO: Query GenLayer contract for actual status
        return {
            "track_id": track_id,
            "status": "NOT_VERIFIED"
        }
    except Exception as e:
        logger.error("Failed to get copyright status", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
