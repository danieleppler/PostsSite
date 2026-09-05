import { API_BASE_URL } from './client'
import type { PagedPosts, Post, PostDto, PostFilters } from '../types/post'

export interface DistanceSortOrigin {
  latitude: number
  longitude: number
}

export async function fetchPosts(
  pageNumber: number,
  itemCount: number,
  filters?: PostFilters,
  sortOrigin?: DistanceSortOrigin | null,
): Promise<PagedPosts> {
  const params = new URLSearchParams({
    pageNumber: String(pageNumber),
    itemCount: String(itemCount),
  })
  if (filters?.q) params.set('q', filters.q)
  if (filters?.category) params.set('category', filters.category)
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters?.dateTo) params.set('dateTo', filters.dateTo)

  const headers: HeadersInit = {}
  if (sortOrigin) {
    params.set('sortBy', 'distance')
    headers['X-User-Latitude'] = String(sortOrigin.latitude)
    headers['X-User-Longitude'] = String(sortOrigin.longitude)
  }

  const response = await fetch(`${API_BASE_URL}/api/posts?${params}`, { headers })
  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.status}`)
  }
  return response.json()
}

export async function createPost(dto: PostDto): Promise<Post> {
  const response = await fetch(`${API_BASE_URL}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  })
  if (!response.ok) {
    throw new Error(`Failed to create post: ${response.status}`)
  }
  return response.json()
}

export async function updatePost(id: string, dto: PostDto): Promise<Post> {
  const response = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  })
  if (!response.ok) {
    throw new Error(`Failed to update post: ${response.status}`)
  }
  return response.json()
}

export async function deletePost(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`Failed to delete post: ${response.status}`)
  }
}
