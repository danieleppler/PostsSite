import { useState } from 'react'
import { PostGrid } from './components/PostGrid'
import { PostFormModal } from './components/PostFormModal'
import type { Post } from './types/post'
import './App.css'

type FormModalState = { open: false } | { open: true; editingPost: Post | null }

function App() {
  const [formModal, setFormModal] = useState<FormModalState>({ open: false })
  const [newPost, setNewPost] = useState<Post | null>(null)
  const [updatedPost, setUpdatedPost] = useState<Post | null>(null)

  const editingPost = formModal.open ? formModal.editingPost : null

  return (
    <div className="page">
      <header className="page__header">
        <h1>Posts</h1>
      </header>

      <button
        type="button"
        className="add-post-fab"
        aria-label="Add post"
        onClick={() => setFormModal({ open: true, editingPost: null })}
      >
        +
      </button>

      <PostGrid
        newPost={newPost}
        updatedPost={updatedPost}
        onEditRequest={(post) => setFormModal({ open: true, editingPost: post })}
      />

      <PostFormModal
        open={formModal.open}
        editingPost={editingPost}
        onClose={() => setFormModal({ open: false })}
        onSaved={(post) => {
          setFormModal({ open: false })
          if (editingPost) {
            setUpdatedPost(post)
          } else {
            setNewPost(post)
          }
        }}
      />
    </div>
  )
}

export default App
