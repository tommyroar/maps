from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Robot Geographical Society API")

class Campsite(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    jurisdiction: str
    available: bool

@app.get("/")
async def root():
    return {"message": "Welcome to the RGS API"}

@app.get("/campsites", response_model=List[Campsite])
async def get_campsites(lat: float, lon: float, radius: float = 50.0):
    # Placeholder for campsite search logic
    return [
        {
            "id": "1",
            "name": "Kalaloch Campground",
            "latitude": 47.6083,
            "longitude": -124.3686,
            "jurisdiction": "National Park",
            "available": True
        }
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
