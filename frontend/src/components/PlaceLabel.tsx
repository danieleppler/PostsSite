import { useEffect, useState } from 'react'
import { reverseGeocode } from '../utils/geocoding'

interface PlaceLabelProps {
  latitude: number
  longitude: number
}

export function PlaceLabel({ latitude, longitude }: PlaceLabelProps) {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLabel(null)
    reverseGeocode(latitude, longitude).then((placeName) => {
      if (!cancelled) setLabel(placeName ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
    })
    return () => {
      cancelled = true
    }
  }, [latitude, longitude])

  if (label === null) {
    return <span className="post-card__location post-card__location--loading">Loading location…</span>
  }

  return <span className="post-card__location">{label}</span>
}
