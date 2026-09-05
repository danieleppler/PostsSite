import { useEffect, useRef, useState } from 'react'
import type { Post, PostCategory, PostFilters } from '../types/post'
import { deletePost, fetchPosts, type DistanceSortOrigin } from '../api/posts'
import { getCurrentUserId } from '../utils/currentUser'
import { getCurrentPosition } from '../utils/geolocation'
import { PostCard } from './PostCard'
import { FilterBar } from './FilterBar'
import './PostGrid.css'

const ITEMS_PER_PAGE = 12
const PAGE_PARAM = 'page'

function getPageFromUrl(): number {
  const page = Number(new URLSearchParams(window.location.search).get(PAGE_PARAM))
  return Number.isInteger(page) && page > 0 ? page : 1
}

function getFiltersFromUrl(): PostFilters {
  const params = new URLSearchParams(window.location.search)
  return {
    q: params.get('q') ?? '',
    category: (params.get('category') as PostCategory | null) ?? '',
    dateFrom: params.get('dateFrom') ?? '',
    dateTo: params.get('dateTo') ?? '',
  }
}

function getSortByDistanceFromUrl(): boolean {
  return new URLSearchParams(window.location.search).get('sortBy') === 'distance'
}

// Only the "sort by distance" flag is safe to put in the URL — the actual
// coordinates are never persisted there (they travel as request headers
// instead) so re-enabling it after a reload or back/forward re-requests
// the browser's current location rather than trusting a stale one from a
// shared or bookmarked link.
function buildUrl(page: number, filters: PostFilters, sortByDistance: boolean): string {
  const params = new URLSearchParams()
  if (page !== 1) params.set(PAGE_PARAM, String(page))
  if (filters.q) params.set('q', filters.q)
  if (filters.category) params.set('category', filters.category)
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  if (sortByDistance) params.set('sortBy', 'distance')
  const query = params.toString()
  return query ? `${window.location.pathname}?${query}` : window.location.pathname
}

function matchesFilters(post: Post, filters: PostFilters): boolean {
  if (filters.q && !post.title.toLowerCase().includes(filters.q.toLowerCase())) return false
  if (filters.category && post.category !== filters.category) return false
  const postDate = post.datePosted.slice(0, 10)
  if (filters.dateFrom && postDate < filters.dateFrom) return false
  if (filters.dateTo && postDate > filters.dateTo) return false
  return true
}

interface PostGridProps {
  newPost?: Post | null
  updatedPost?: Post | null
  onEditRequest: (post: Post) => void
}

export function PostGrid({ newPost, updatedPost, onEditRequest }: PostGridProps) {
  const [currentUserId] = useState(getCurrentUserId)
  const [pageNumber, setPageNumber] = useState(getPageFromUrl)
  const [filters, setFilters] = useState<PostFilters>(getFiltersFromUrl)
  const [posts, setPosts] = useState<Post[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortByDistance, setSortByDistance] = useState(getSortByDistanceFromUrl)
  const [userCoords, setUserCoords] = useState<DistanceSortOrigin | null>(null)
  const [locatingUser, setLocatingUser] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)
  const isFirstRender = useRef(true)
  const isPopStateNavigation = useRef(false)
  const lastHandledPostId = useRef<string | null>(null)

  const sortOrigin = sortByDistance ? userCoords : null

  // Coordinates are never persisted (to the URL or otherwise), so whenever
  // distance sort is on but we don't have a fresh reading yet — first
  // enabling it, a reload with ?sortBy=distance in the URL, or navigating
  // back to that state — ask the browser for the current position again.
  useEffect(() => {
    if (!sortByDistance || userCoords) return

    let cancelled = false
    setError(null)
    setLocatingUser(true)
    getCurrentPosition()
      .then((coords) => {
        if (!cancelled) setUserCoords(coords)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Unable to get your location')
        setSortByDistance(false)
      })
      .finally(() => {
        if (!cancelled) setLocatingUser(false)
      })
    return () => {
      cancelled = true
    }
  }, [sortByDistance, userCoords])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchPosts(pageNumber, ITEMS_PER_PAGE, filters, sortOrigin)
      .then((page) => {
        if (cancelled) return
        setPosts(page.items)
        setTotalPages(Math.max(1, page.totalPages))
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load posts')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [pageNumber, filters, sortOrigin, reloadTick])

  // A freshly created post is already in hand (createPost returns it), so on
  // page 1 we splice it into the existing list instead of refetching from the
  // API. That fast path assumes date-descending order, so it only applies
  // when distance sort is off; with it on, force a real refetch instead so
  // the post lands at its correct distance-sorted position. Off page 1 the
  // post isn't part of the loaded data, so jump to page 1 and let the normal
  // fetch above pull it in. If it wouldn't match the active filters anyway,
  // leave the list untouched.
  useEffect(() => {
    if (!newPost || newPost.id === lastHandledPostId.current) return
    lastHandledPostId.current = newPost.id

    if (pageNumber !== 1) {
      setPageNumber(1)
      return
    }

    if (!matchesFilters(newPost, filters)) return

    if (sortOrigin) {
      setReloadTick((t) => t + 1)
      return
    }

    const updated = [newPost, ...posts].slice(0, ITEMS_PER_PAGE)
    setPosts(updated)
  }, [newPost, pageNumber])

  // An edited post is only ever reachable from a card already in the current
  // page. Patch it in place by id, unless the edit moved it outside the
  // active filters, in which case drop it from view.
  useEffect(() => {
    if (!updatedPost) return
    setPosts((prev) =>
      matchesFilters(updatedPost, filters)
        ? prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
        : prev.filter((p) => p.id !== updatedPost.id),
    )
  }, [updatedPost])

  useEffect(() => {
    const url = buildUrl(pageNumber, filters, sortByDistance)
    if (isFirstRender.current || isPopStateNavigation.current) {
      isFirstRender.current = false
      isPopStateNavigation.current = false
      window.history.replaceState({ page: pageNumber, filters, sortByDistance }, '', url)
    } else {
      window.history.pushState({ page: pageNumber, filters, sortByDistance }, '', url)
    }
  }, [pageNumber, filters, sortByDistance])

  useEffect(() => {
    const onPopState = () => {
      isPopStateNavigation.current = true
      setPageNumber(getPageFromUrl())
      setFilters(getFiltersFromUrl())
      setSortByDistance(getSortByDistanceFromUrl())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const goToPrevPage = () => setPageNumber((prev) => Math.max(1, prev - 1))
  const goToNextPage = () => setPageNumber((prev) => (prev < totalPages ? prev + 1 : prev))

  const updateFilters = (partial: Partial<PostFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }))
    setPageNumber(1)
  }

  const handleToggleSortByDistance = () => {
    setSortByDistance((prev) => !prev)
    setPageNumber(1)
  }

  const handleEditRequest = (post: Post) => {
    if (post.userPosted.id !== currentUserId) return
    onEditRequest(post)
  }

  const handleDelete = async (post: Post) => {
    if (post.userPosted.id !== currentUserId) return
    if (!window.confirm(`Delete "${post.title}"?`)) return
    try {
      await deletePost(post.id)
      setPosts((prev) => prev.filter((p) => p.id !== post.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post')
    }
  }

  return (
    <div className="post-grid-wrapper">
      <FilterBar
        q={filters.q}
        category={filters.category}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        sortByDistance={sortByDistance}
        locatingUser={locatingUser}
        onSearchChange={(q) => updateFilters({ q })}
        onCategoryChange={(category) => updateFilters({ category })}
        onDateRangeApply={(dateFrom, dateTo) => updateFilters({ dateFrom, dateTo })}
        onToggleSortByDistance={handleToggleSortByDistance}
      />

      <div className="post-grid">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isOwner={post.userPosted.id === currentUserId}
            onEdit={handleEditRequest}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {error && <p className="post-grid__error">{error}</p>}
      {loading && <p className="post-grid__status">Loading…</p>}
      {!loading && !error && posts.length === 0 && (
        <p className="post-grid__status">No posts match these filters.</p>
      )}

      <div className="post-grid__pagination">
        <button
          type="button"
          className="post-grid__page-button"
          onClick={goToPrevPage}
          disabled={pageNumber === 1 || loading}
        >
          Previous
        </button>
        <span className="post-grid__page-number">
          Page {pageNumber} of {totalPages}
        </span>
        <button
          type="button"
          className="post-grid__page-button"
          onClick={goToNextPage}
          disabled={pageNumber >= totalPages || loading}
        >
          Next
        </button>
      </div>
    </div>
  )
}
