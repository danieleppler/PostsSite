# Local Posts

A small marketplace/events board: browse posts, filter and sort them (including by
distance from you), and create, edit or delete your own.

## Stack

- **Backend**: ASP.NET Core 8 minimal API (`Backend/`), storing posts in a JSON file
  (`Backend/Data/posts.json`) behind an `IPostRepository` abstraction.
- **Frontend**: React 19 + TypeScript + Vite (`frontend/`).

## Running it

### Backend

```bash
cd Backend
dotnet run
```

Runs on `http://localhost:5282` by default (see `Backend/Properties/launchSettings.json`
to change it).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`. It reads its config from `frontend/.env`:

- `VITE_API_BASE_URL` — must point at the running backend (e.g. `http://localhost:5282`).
- `VITE_GOOGLE_MAPS_API_KEY` — used for the map picker when creating/editing a post's location.

Open `http://localhost:5173` once both are running.

## Features

- Paginated grid of posts, with a search box, category filter, and date range filter.
- Sort by distance from your current location (via the browser's geolocation) instead
  of newest-first.
- Create, edit, and delete posts, including an image upload and a map picker for the
  post's location.
- Filters, page number, and sort mode are reflected in the URL, so a filtered view is
  shareable/bookmarkable and works with the browser's Back/Forward buttons.

See `decisions.md` for the reasoning behind some of the architecture choices, and what
would be tackled next with more time.
