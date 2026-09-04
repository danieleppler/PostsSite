import type { Post } from '../types/post'
import { resolveAssetUrl } from '../api/client'
import './PostCard.css'

const CATEGORY_LABELS: Record<Post['category'], string> = {
  'buy&sale': 'Buy & Sale',
  events: 'Events',
}

function formatDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="post-card">
      <img
        className="post-card__image"
        src={resolveAssetUrl(post.postImage)}
        alt={post.title}
      />

      <div className="post-card__content">
        <div className="post-card__row post-card__row--meta">
          <span className="post-card__category">
            {CATEGORY_LABELS[post.category]}
          </span>
          {post.location && (
            <span className="post-card__location">
              {post.location.latitude.toFixed(4)}, {post.location.longitude.toFixed(4)}
            </span>
          )}
        </div>

        <h3 className="post-card__row post-card__title">{post.title}</h3>

        <p className="post-card__row post-card__description">{post.description}</p>

        <div className="post-card__row post-card__user-row">
          <img
            className="post-card__avatar"
            src={resolveAssetUrl(post.userPosted.avatar)}
            alt={post.userPosted.name}
          />
          <div className="post-card__user-meta">
            <span className="post-card__user-name">{post.userPosted.name}</span>
            <span className="post-card__date">{formatDate(post.datePosted)}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
