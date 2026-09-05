export interface Coordinates {
  latitude: number
  longitude: number
}

export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => reject(new Error(error.message || 'Unable to retrieve your location.')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  })
}
