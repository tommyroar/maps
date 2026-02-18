# Robot Geographical Society (RGS)

## Project Goals
Robot Geographical Society is an experimental mapping application designed to empower outdoor enthusiasts in Washington State. It bridges the gap between searching for campsites and successfully booking them, specifically targeting the complex "release windows" of National and State Parks.

## Key Features
- **Unified Search**: Search across NPS, USFS, and WA State Parks in a single interface.
- **Visual Exploration**: Map-centric discovery powered by Mapbox GL JS.
- **Reservation Scheduling**: Track exactly when booking windows open for your target dates.
- **Automated Reminders**: Get notified via email or webhooks before reservations go live.

## Architecture
- **Frontend**: React SPA using Vite, Tailwind CSS, and Mapbox GL JS.
- **API**: FastAPI (Python) for campsite data aggregation and user management.
- **Scheduler**: APScheduler (Python) for monitoring reservation windows.
- **Database**: NoSQL (MongoDB Atlas recommended).

## Development Setup
1.  **Mapbox Token**: Add your token to `page/.env.local` as `VITE_MAPBOX_ACCESS_TOKEN`.
2.  **API**: Install requirements in `api/requirements.txt` and run `uvicorn main:app`.
3.  **Frontend**: Run `npm run dev` in the `page` directory.
