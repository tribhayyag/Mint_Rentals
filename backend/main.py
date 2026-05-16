from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add tools directory to path so we can import the modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'tools'))

from user_preference_parser import parse_user_preferences
from housing_listing_scraper import get_housing_listings
from google_maps_commute import get_commute_info
from crime_safety_rating import get_safety_rating

app = FastAPI(title="Mint Rentals API", version="1.0.0")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/parse-preferences")
async def parse_preferences_endpoint(user_input: dict):
    """
    Parse user preferences from natural language input.
    Expected input: {"user_input": "I want a furnished single room under $1500..."}
    """
    if "user_input" not in user_input or not isinstance(user_input["user_input"], str):
        raise HTTPException(status_code=400, detail="user_input must be a non-empty string")
    
    result = parse_user_preferences(user_input["user_input"])
    return result

@app.post("/search-listings")
async def search_listings_endpoint(request: dict):
    """
    Search for housing listings based on preferences.
    Expected input: {
        "preference_json": {...},  # Output from parse-preferences
        "craigslist_url": "https://...",  # Optional
        "redfin_url": "https://...",  # Optional
        "max_results_per_source": 10  # Optional
    }
    """
    if "preference_json" not in request:
        raise HTTPException(status_code=400, detail="preference_json is required")
    
    result = get_housing_listings(
        preference_json=request["preference_json"],
        craigslist_url=request.get("craigslist_url"),
        redfin_url=request.get("redfin_url"),
        max_results_per_source=request.get("max_results_per_source", 10)
    )
    return result

@app.post("/commute-info")
async def commute_info_endpoint(request: dict):
    """
    Get commute info for a listing based on preferences.
    Expected input: {
        "listing": {...},  # Listing object
        "preferences": {...}  # Preferences object
    }
    """
    if "listing" not in request or "preferences" not in request:
        raise HTTPException(status_code=400, detail="Both listing and preferences are required")
    
    result = get_commute_info(request["listing"], request["preferences"])
    return result

@app.post("/safety-rating")
async def safety_rating_endpoint(request: dict):
    """
    Get safety rating for a listing.
    Expected input: {
        "listing": {...}  # Listing object
    }
    """
    if "listing" not in request:
        raise HTTPException(status_code=400, detail="listing is required")
    
    result = get_safety_rating(request["listing"])
    return result

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Mint Rentals API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)