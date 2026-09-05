import { loadGoogleMapsScript } from './googleMaps'

// Cache reverse-geocode lookups by exact coordinate so re-rendering the same
// post (pagination, re-fetches) never re-requests it. Geocoding API is a
// billed, separate product from Maps JavaScript API / Places API — this
// caching also keeps that cost down.
const cache = new Map<string, Promise<string | null>>()

export function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  const key = `${latitude},${longitude}`
  const cached = cache.get(key)
  if (cached) return cached

  const promise = loadGoogleMapsScript()
    .then((googleApi) => {
      const geocoder = new googleApi.maps.Geocoder()
      return geocoder.geocode({ location: { lat: latitude, lng: longitude } })
    })
    .then((response) => {
      const result = response.results[0]
      if (!result) return null
      return stripStreetNumber(result.formatted_address, result.address_components)
    })
    .catch(() => null)

  cache.set(key, promise)
  return promise
}

// Google's formatted_address includes the street number (e.g. "123 Main St, City"),
// which is more precise than we want to show for a post's location — drop it.
function stripStreetNumber(
  formattedAddress: string,
  addressComponents: google.maps.GeocoderAddressComponent[],
): string {
  const streetNumber = addressComponents.find((component) =>
    component.types.includes('street_number'),
  )?.long_name
  if (!streetNumber) return formattedAddress

  const escaped = streetNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return formattedAddress
    .replace(new RegExp(`(^|,\\s*)${escaped}\\s+`), '$1')
    .replace(new RegExp(`\\s+${escaped}(?=,|$)`), '')
    .trim()
}
