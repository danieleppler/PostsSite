import { useCallback, useEffect, useRef, useState } from 'react'
import type { Post } from '../types/post'
import { fetchPosts } from '../api/posts'
import { PostCard } from './PostCard'
import './PostGrid.css'

const ITEMS_PER_PAGE = 12

export function PostGrid() {
  const [posts, setPosts] = useState<Post[]>([])
  const [pageNumber, setPageNumber] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const loadingRef = useRef(false)

  const loadNextPage = useCallback(async () => {
    if (loadingRef.current || !hasMore) return
    loadingRef.current = true
    setLoading(true)
    setError(null)
    try {
      const page = await fetchPosts(pageNumber, ITEMS_PER_PAGE)
      setPosts((prev) => [...prev, ...page.items])
      setHasMore(page.items.length === ITEMS_PER_PAGE)
      setPageNumber((prev) => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts')
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [pageNumber, hasMore])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNextPage()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadNextPage])

  return (
    <div className="post-grid-wrapper">
      <div className="post-grid">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {error && <p className="post-grid__error">{error}</p>}
      {loading && <p className="post-grid__status">Loading more posts…</p>}
      {!hasMore && !loading && posts.length > 0 && (
        <p className="post-grid__status">You've reached the end.</p>
      )}

      <div ref={sentinelRef} className="post-grid__sentinel" />
    </div>
  )
}
