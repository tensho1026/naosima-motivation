const NAOSHIMA_LATITUDE = 34.4597
const NAOSHIMA_LONGITUDE = 133.9957

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360
}

function calculateUtcHour(date: Date, sunrise: boolean) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0)
  const day = Math.floor((date.getTime() - start) / 86_400_000)
  const longitudeHour = NAOSHIMA_LONGITUDE / 15
  const approximate = day + ((sunrise ? 6 : 18) - longitudeHour) / 24
  const meanAnomaly = 0.9856 * approximate - 3.289
  const trueLongitude = normalizeDegrees(
    meanAnomaly +
      1.916 * Math.sin((Math.PI / 180) * meanAnomaly) +
      0.02 * Math.sin((Math.PI / 90) * meanAnomaly) +
      282.634,
  )
  let rightAscension =
    (180 / Math.PI) *
    Math.atan(0.91764 * Math.tan((Math.PI / 180) * trueLongitude))
  rightAscension = normalizeDegrees(rightAscension)
  rightAscension +=
    Math.floor(trueLongitude / 90) * 90 - Math.floor(rightAscension / 90) * 90
  rightAscension /= 15
  const sinDeclination = 0.39782 * Math.sin((Math.PI / 180) * trueLongitude)
  const cosDeclination = Math.cos(Math.asin(sinDeclination))
  const cosHour =
    (Math.cos((Math.PI / 180) * 90.833) -
      sinDeclination * Math.sin((Math.PI / 180) * NAOSHIMA_LATITUDE)) /
    (cosDeclination * Math.cos((Math.PI / 180) * NAOSHIMA_LATITUDE))
  if (cosHour < -1 || cosHour > 1) return null
  let hourAngle = (180 / Math.PI) * Math.acos(cosHour)
  if (sunrise) hourAngle = 360 - hourAngle
  hourAngle /= 15
  const localMeanTime =
    hourAngle + rightAscension - 0.06571 * approximate - 6.622
  return (((localMeanTime - longitudeHour) % 24) + 24) % 24
}

function formatJapanTime(utcHour: number | null) {
  if (utcHour == null) return '--:--'
  const japanHour = (utcHour + 9) % 24
  const hour = Math.floor(japanHour)
  const minute = Math.round((japanHour - hour) * 60)
  const adjustedHour = minute === 60 ? (hour + 1) % 24 : hour
  return `${String(adjustedHour).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
}

export function calculateNaoshimaSunTimes(date = new Date()) {
  return {
    sunrise: formatJapanTime(calculateUtcHour(date, true)),
    sunset: formatJapanTime(calculateUtcHour(date, false)),
  }
}
