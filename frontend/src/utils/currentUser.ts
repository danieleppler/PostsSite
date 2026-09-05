import { MOCK_USER } from '../constants/mockUser'

const CURRENT_USER_COOKIE = 'currentUserId'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR_SECONDS}`
}

// No real auth yet, so we stand in for "the logged-in user" by pinning the
// mock user's id to a cookie the first time it's read.
export function getCurrentUserId(): string {
  const existing = readCookie(CURRENT_USER_COOKIE)
  if (existing) return existing

  writeCookie(CURRENT_USER_COOKIE, MOCK_USER.id)
  return MOCK_USER.id
}
