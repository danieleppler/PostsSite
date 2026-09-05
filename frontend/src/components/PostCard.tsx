import type { Post } from '../types/post'
import { resolveAssetUrl } from '../api/client'
import { CATEGORY_LABELS } from '../constants/postCategory'
import { PlaceLabel } from './PlaceLabel'
import './PostCard.css'

function formatDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface PostCardProps {
  post: Post
  isOwner: boolean
  onEdit: (post: Post) => void
  onDelete: (post: Post) => void
}

export function PostCard({ post, isOwner, onEdit, onDelete }: PostCardProps) {
  return (
    <article className="post-card">
      <div className="post-card__image-wrapper">
        <img
          className="post-card__image"
          src={resolveAssetUrl(post.postImage)}
          alt={post.title}
        />
        {isOwner && (
          <div className="post-card__image-actions">
            <button
              type="button"
              className="post-card__icon-button"
              onClick={() => onEdit(post)}
              aria-label="Edit post"
            >
              ✎
            </button>
            <button
              type="button"
              className="post-card__icon-button post-card__icon-button--danger"
              onClick={() => onDelete(post)}
              aria-label="Delete post"
            >
              🗑
            </button>
          </div>
        )}
      </div>

      <div className="post-card__content">
        <div className="post-card__row post-card__row--meta">
          <span className="post-card__category">
            {CATEGORY_LABELS[post.category]}
          </span>
          {post.location && (
            <PlaceLabel latitude={post.location.latitude} longitude={post.location.longitude} />
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
