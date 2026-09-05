import { useEffect, useRef, useState } from 'react'
import { loadGoogleMapsScript, openGoogleMaps, parseCoordinatesFromInput } from '../utils/googleMaps'
import './GoogleMapPicker.css'

interface GoogleMapPickerProps {
  latitude: number
  longitude: number
  onSelect: (latitude: number, longitude: number) => void
}

export function GoogleMapPicker({ latitude, longitude, onSelect }: GoogleMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [searchAvailable, setSearchAvailable] = useState(true)
  const [fallbackInput, setFallbackInput] = useState('')
  const [pendingPosition, setPendingPosition] = useState<{ lat: number; lng: number } | null>(null)

  // Read inside the effect via a ref so the map only initializes once, but
  // callbacks registered at init time still call the latest onSelect.
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    let cancelled = false

    loadGoogleMapsScript()
      .then((googleApi) => {
        if (cancelled || !mapContainerRef.current) return

        const center = { lat: latitude, lng: longitude }
        const map = new googleApi.maps.Map(mapContainerRef.current, {
          center,
          zoom: 13,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        })

        const marker = new googleApi.maps.Marker({ position: center, map, draggable: true })

        // Moving the pin only stages a position — it's committed via the
        // "Set location" button so an accidental click/drag can't silently
        // change the post's location without confirmation.
        const applyPosition = (position: google.maps.LatLng) => {
          marker.setPosition(position)
          setPendingPosition({ lat: position.lat(), lng: position.lng() })
        }

        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) applyPosition(event.latLng)
        })

        marker.addListener('dragend', () => {
          const position = marker.getPosition()
          if (position) applyPosition(position)
        })

        // The address search box is a nice-to-have on top of the map itself
        // (click/drag already fully cover picking a location), and depends
        // on the separate "Places API" being enabled for the key — which a
        // demo/restricted key may not have. Don't let that take down the map.
        if (searchInputRef.current) {
          try {
            const autocomplete = new googleApi.maps.places.Autocomplete(searchInputRef.current, {
              fields: ['geometry'],
            })
            autocomplete.addListener('place_changed', () => {
              const position = autocomplete.getPlace().geometry?.location
              if (!position) return
              map.panTo(position)
              map.setZoom(15)
              applyPosition(position)
            })
          } catch {
            setSearchAvailable(false)
          }
        }

        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
    // The map is initialized once; latitude/longitude here are only the
    // starting position, not a value to keep re-syncing on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'error') {
    return (
      <div className="google-map-picker">
        <p className="modal__error">
          Couldn't load Google Maps. Paste a Maps link or "lat, lng" instead.
        </p>
        <div className="modal__location-row">
          <input
            type="text"
            className="modal__input"
            value={fallbackInput}
            onChange={(event) => {
              const value = event.target.value
              setFallbackInput(value)
              const parsed = parseCoordinatesFromInput(value)
              if (parsed) onSelectRef.current(parsed.latitude, parsed.longitude)
            }}
            placeholder="Paste a Google Maps link or lat, lng"
          />
          <button type="button" className="modal__location-button" onClick={openGoogleMaps}>
            Open Google Maps
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="google-map-picker">
      {searchAvailable && (
        <input
          ref={searchInputRef}
          type="text"
          className="modal__input google-map-picker__search"
          placeholder="Search for an address…"
          disabled={status !== 'ready'}
        />
      )}
      <div ref={mapContainerRef} className="google-map-picker__map" />
      {status === 'loading' && <p className="google-map-picker__status">Loading map…</p>}
      {status === 'ready' && !searchAvailable && (
        <p className="google-map-picker__status">
          Address search isn't available for this key — click or drag the pin instead.
        </p>
      )}
      {status === 'ready' && (
        <button
          type="button"
          className="google-map-picker__confirm"
          disabled={!pendingPosition}
          onClick={() => {
            if (!pendingPosition) return
            onSelectRef.current(pendingPosition.lat, pendingPosition.lng)
            setPendingPosition(null)
          }}
        >
          Set location
        </button>
      )}
    </div>
  )
}
