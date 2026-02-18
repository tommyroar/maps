# RGS API Specification

## Endpoints

### `GET /campsites`
Search for campsites within a specific radius of a location.

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `lat` | Float | Yes | Latitude |
| `lon` | Float | Yes | Longitude |
| `radius` | Float | No | Search radius in miles (default: 50.0) |

**Response**: `200 OK`
```json
[
  {
    "id": "1",
    "name": "Kalaloch Campground",
    "latitude": 47.6083,
    "longitude": -124.3686,
    "jurisdiction": "National Park",
    "available": true
  }
]
```

### `POST /reminders`
Create a new reservation reminder for a user.

**Request Body**:
```json
{
  "campsite_id": "1",
  "target_date": "2026-06-15",
  "user_email": "user@example.com"
}
```

**Response**: `201 Created`
```json
{
  "id": "uuid-1234",
  "status": "pending",
  "release_date": "2026-03-15"
}
```
