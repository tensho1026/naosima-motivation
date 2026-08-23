import { differenceInCalendarDays } from 'date-fns'

export const DEFAULT_JOURNEY_DISTANCE = 1000
export const NAOSHIMA_COORDINATES = { latitude: 34.4597, longitude: 133.9957 }

export function calculateJourney(
  totalXp: number,
  totalDistance = DEFAULT_JOURNEY_DISTANCE,
) {
  const distance = Math.max(totalDistance, 1)
  const progressKm = Math.min(Math.max(totalXp, 0) / 10, distance)
  const remainingKm = Math.max(distance - progressKm, 0)
  return {
    progressKm,
    remainingKm,
    progressPercent: (progressKm / distance) * 100,
    totalDistance: distance,
  }
}

export function calculateCountdown(targetDate: string, today = new Date()) {
  const days = differenceInCalendarDays(
    new Date(`${targetDate}T00:00:00`),
    today,
  )
  return { days: Math.max(days, 0), reached: days <= 0 }
}

export function calculateJourneyDays(startDate: string, today = new Date()) {
  return Math.max(
    differenceInCalendarDays(today, new Date(`${startDate}T00:00:00`)) + 1,
    1,
  )
}

export function summersUntil(targetDate: string, today = new Date()) {
  const target = new Date(`${targetDate}T00:00:00`)
  if (target <= today) return 0
  let summers = 0
  for (
    let year = today.getFullYear();
    year <= target.getFullYear();
    year += 1
  ) {
    const summer = new Date(year, 5, 1)
    if (summer > today && summer <= target) summers += 1
  }
  return summers
}

export function haversineDistanceKm(
  from: { latitude: number; longitude: number },
  to = NAOSHIMA_COORDINATES,
) {
  const radians = (value: number) => (value * Math.PI) / 180
  const latitudeDelta = radians(to.latitude - from.latitude)
  const longitudeDelta = radians(to.longitude - from.longitude)
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
