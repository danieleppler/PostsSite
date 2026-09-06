# Architecture Decisions

## Decisions made

1. **Storage hidden behind `IPostRepository`, ready to swap to SQL Server later**
   The JSON file (`Data/posts.json`) was a requirement of the task, but all
   access to it goes through an `IPostRepository` interface, with
   `PostRepository` as the current file-backed implementation (guarded by a
   `SemaphoreSlim` for concurrent access). Endpoints in `Program.cs` only ever
   depend on the interface, so swapping in a SQL Server-backed implementation
   later (e.g. via EF Core) is a matter of adding a new class and changing the
   DI registration — no changes to the API layer.

2. **Location sent as a per-request header, never persisted**
   Distance sort takes the user's coordinates via `X-User-Latitude` /
   `X-User-Longitude` request headers and computes Haversine distance
   server-side per request, instead of storing coordinates in the URL,
   cookies, or a saved user profile. Only the `sortBy=distance` flag is
   persisted to the URL. This keeps a sensitive value (exact location)
   ephemeral and out of browser history / shareable links.

3. **Dedicated DTOs per direction instead of exposing the domain model**
   The API never sends or accepts the `Post` model directly. Input has its
   own `PostDto` (POST/PUT body) and `PostQueryDto` (GET query params, bound
   via `[AsParameters]`); output has its own `PostResponseDto` and
   `PagedPostResponseDto`, with `PostMappingExtensions` converting between
   them and `Post`. This keeps the wire contract explicit and independent of
   the internal model — the domain can gain fields (or change shape) without
   automatically over-exposing them, and the query-string shape isn't forced
   to match either model.

4. **URL as the source of truth for list state, no router library**
   Page number, filters, and sort-by-distance live in the URL query string,
   synced via `history.pushState`/`replaceState` and a `popstate` listener,
   rather than pulling in react-router. Keeps the list state shareable/
   bookmarkable and makes back/forward work, without the overhead of a
   routing library for what is currently a single-view app.

## With more time

1. **Browser-side response caching, keyed by the URL query params** — since
   page number, filters, and sort are already fully encoded in the URL
   (`buildUrl` in `PostGrid.tsx`), that query string is a natural cache key.
   Caching `fetchPosts` responses by it would let Back/Forward and re-applying
   the same filter combo reuse an in-memory result instead of re-hitting the
   API every time.

2. **Real authentication + server-side authorization** — currently
   "the logged-in user" is a mock id pinned to a cookie on first load
   (`frontend/src/utils/currentUser.ts`), and edit/delete ownership is only
   checked client-side (`post.userPosted.id !== currentUserId` in
   `PostGrid.tsx`). Anyone can call `PUT`/`DELETE` directly. Add real auth and
   move ownership checks into the backend.

3. **Automated tests** — there currently are none. Add backend unit tests for
   `PostRepository` (filtering, paging, distance sort, validation) and
   endpoint integration tests, plus frontend component tests for `PostGrid`/
   `FilterBar` and a couple of end-to-end flows (create/edit/delete a post).

4. **Crash-safe writes to `posts.json`** — `WriteAllAsync` (`PostRepository.cs`)
   truncates the file via `File.Create` and serializes straight into it, with
   no atomic write and no try/catch around `ReadAllAsync`'s deserialize. If the
   process dies mid-write, the file is left corrupted and every subsequent
   request throws. Fix: write to a temp file and atomically rename it into
   place, and handle a corrupt/unreadable file on read instead of crashing.
