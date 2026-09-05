import { API_BASE_URL } from './client'

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(`${API_BASE_URL}/api/images/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Failed to upload image: ${response.status}`)
  }

  const data = (await response.json()) as { url: string }
  return data.url
}
