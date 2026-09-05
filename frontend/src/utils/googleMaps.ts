const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

export interface ParsedCoordinates {
  latitude: number
  longitude: number
}

// Matches a raw "lat, lng" pair, e.g. copied from Google Maps' right-click menu.
const RAW_COORD_REGEX = /^(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/
// Matches the "@lat,lng,zoom" segment present in Google Maps URLs.
const MAPS_URL_COORD_REGEX = /@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/

export function parseCoordinatesFromInput(value: string): ParsedCoordinates | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const match = trimmed.match(RAW_COORD_REGEX) ?? trimmed.match(MAPS_URL_COORD_REGEX)
  if (!match) return null

  const latitude = Number(match[1])
  const longitude = Number(match[2])
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null

  return { latitude, longitude }
}

export function openGoogleMaps(): void {
  window.open('https://www.google.com/maps', '_blank', 'noopener,noreferrer')
}

let loadPromise: Promise<typeof google> | null = null

declare global {
  interface Window {
    [key: string]: unknown
  }
}

export function loadGoogleMapsScript(): Promise<typeof google> {
  if (window.google?.maps?.Map) {
    return Promise.resolve(window.google)
  }
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error('Google Maps API key is not configured.'))
  }
  if (loadPromise) {
    return loadPromise
  }

  loadPromise = new Promise((resolve, reject) => {
    // The bare script tag's `onload` fires as soon as the small bootstrap
    // loader arrives, well before the actual Map/Marker/Places classes are
    // ready (Google now loads those asynchronously behind the scenes). The
    // `callback` param is what Google's own docs recommend instead — it only
    // fires once the full API (including every requested library) is usable.
    const callbackName = `__googleMapsLoaded_${Date.now()}`
    window[callbackName] = () => {
      delete window[callbackName]
      if (window.google?.maps?.Map) {
        resolve(window.google)
      } else {
        reject(new Error('Google Maps failed to load.'))
      }
    }

    const script = document.createElement('script')
    const params = new URLSearchParams({
      key: GOOGLE_MAPS_API_KEY,
      libraries: 'places',
      callback: callbackName,
      loading: 'async',
    })
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`
    script.async = true
    script.onerror = () => {
      delete window[callbackName]
      reject(new Error('Failed to load the Google Maps script.'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}
