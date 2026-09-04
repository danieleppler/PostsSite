import { API_BASE_URL } from './client'
import type { PagedPosts } from '../types/post'

export async function fetchPosts(pageNumber: number, itemCount: number): Promise<PagedPosts> {
  const params = new URLSearchParams({
    pageNumber: String(pageNumber),
    itemCount: String(itemCount),
  })
  const response = await fetch(`${API_BASE_URL}/api/posts?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.status}`)
  }
  return response.json()
}
