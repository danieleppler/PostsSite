import type { PostCategory } from '../types/post'

export const CATEGORY_OPTIONS: { value: PostCategory; label: string }[] = [
  { value: 'buy&sale', label: 'Buy & Sale' },
  { value: 'events', label: 'Events' },
]

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  'buy&sale': 'Buy & Sale',
  events: 'Events',
}
