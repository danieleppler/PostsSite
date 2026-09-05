import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import type { Post, PostCategory, PostDto } from '../types/post'
import { createPost, updatePost } from '../api/posts'
import { uploadImage } from '../api/images'
import { resolveAssetUrl } from '../api/client'
import { MOCK_USER } from '../constants/mockUser'
import { CATEGORY_OPTIONS } from '../constants/postCategory'
import { GoogleMapPicker } from './GoogleMapPicker'
import './PostFormModal.css'

const DEFAULT_IMAGE_PATH = '/images/post-placeholder.svg'
// Tel Aviv — matches the seed data's region, just a sensible starting view.
const DEFAULT_MAP_CENTER = { latitude: 32.0853, longitude: 34.7818 }

interface PostFormModalProps {
  open: boolean
  editingPost?: Post | null
  onClose: () => void
  onSaved: (post: Post) => void
}

interface FormErrors {
  title?: string
  description?: string
}

export function PostFormModal({ open, editingPost = null, onClose, onSaved }: PostFormModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<PostCategory>('buy&sale')
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_MAP_CENTER)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImage, setExistingImage] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [mapSessionKey, setMapSessionKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isEditing = editingPost !== null

  useEffect(() => {
    if (!open) return
    setMapSessionKey((key) => key + 1)
    setTitle(editingPost?.title ?? '')
    setDescription(editingPost?.description ?? '')
    setCategory(editingPost?.category ?? 'buy&sale')
    setSelectedLocation(editingPost?.location ?? DEFAULT_MAP_CENTER)
    setImageFile(null)
    setImagePreview(null)
    setExistingImage(editingPost?.postImage ?? null)
    setErrors({})
    setSubmitError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [open, editingPost])

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  if (!open) return null

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  const validate = (): boolean => {
    const nextErrors: FormErrors = {}
    if (!title.trim()) nextErrors.title = 'Title is required.'
    if (!description.trim()) nextErrors.description = 'Description is required.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const postImage = imageFile ? await uploadImage(imageFile) : (existingImage ?? DEFAULT_IMAGE_PATH)
      const dto: PostDto = {
        title: title.trim(),
        description: description.trim(),
        postImage,
        category,
        location: selectedLocation,
        userPosted: editingPost ? editingPost.userPosted : MOCK_USER,
      }
      const saved = editingPost ? await updatePost(editingPost.id, dto) : await createPost(dto)
      onSaved(saved)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save post')
    } finally {
      setSubmitting(false)
    }
  }

  const previewSrc = imagePreview ?? (existingImage ? resolveAssetUrl(existingImage) : null)

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <h2>{isEditing ? 'Edit Post' : 'New Post'}</h2>
          <button type="button" className="modal__close" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          <label className="modal__field">
            <span className="modal__label">Title</span>
            <input
              type="text"
              className="modal__input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            {errors.title && <span className="modal__error">{errors.title}</span>}
          </label>

          <label className="modal__field">
            <span className="modal__label">Description</span>
            <textarea
              className="modal__textarea"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            {errors.description && <span className="modal__error">{errors.description}</span>}
          </label>

          <label className="modal__field">
            <span className="modal__label">Category</span>
            <select
              className="modal__select"
              value={category}
              onChange={(event) => setCategory(event.target.value as PostCategory)}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="modal__field">
            <span className="modal__label">Location</span>
            <GoogleMapPicker
              key={mapSessionKey}
              latitude={selectedLocation.latitude}
              longitude={selectedLocation.longitude}
              onSelect={(latitude, longitude) => setSelectedLocation({ latitude, longitude })}
            />
            <span className="modal__location-hint">
              📍 {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
            </span>
          </label>

          <label className="modal__field">
            <span className="modal__label">Image</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="modal__file-input"
              onChange={handleImageChange}
            />
            {previewSrc && <img src={previewSrc} alt="Preview" className="modal__image-preview" />}
          </label>

          {submitError && <p className="modal__submit-error">{submitError}</p>}

          <div className="modal__actions">
            <button
              type="button"
              className="modal__cancel"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="modal__save" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
