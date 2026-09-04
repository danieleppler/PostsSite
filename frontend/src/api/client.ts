export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export function resolveAssetUrl(path: string): string {
  if (!path) return path
  return path.startsWith('http') ? path : `${API_BASE_URL}${path}`
}
