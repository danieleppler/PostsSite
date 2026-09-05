export type PostCategory = 'buy&sale' | 'events'

export interface Location {
  latitude: number
  longitude: number
}

export interface User {
  id: string
  name: string
  avatar: string
}

export interface Post {
  id: string
  title: string
  description: string
  postImage: string
  category: PostCategory
  location: Location | null
  datePosted: string
  userPosted: User
}

export interface PagedPosts {
  pageNumber: number
  itemCount: number
  totalCount: number
  totalPages: number
  items: Post[]
}

export interface PostDto {
  title: string
  description: string
  postImage: string
  category: PostCategory
  location: Location | null
  userPosted: User
}

export interface PostFilters {
  q: string
  category: PostCategory | ''
  dateFrom: string
  dateTo: string
}
