from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the RGS API"}

def test_get_campsites():
    response = client.get("/campsites?lat=47.6083&lon=-124.3686")
    assert response.status_code == 200
    assert len(response.json()) > 0
    assert response.json()[0]["name"] == "Kalaloch Campground"
