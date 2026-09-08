export const APP_TIME_ZONE = 'Asia/Tokyo'

function datePart(parts: Intl.DateTimeFormatPart[], type: string) {
  return parts.find((part) => part.type === type)?.value ?? ''
}

function appDateParts(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
}

export function formatAppDate(date = new Date()) {
  const parts = appDateParts(date)
  return `${datePart(parts, 'year')}-${datePart(parts, 'month')}-${datePart(parts, 'day')}`
}

export function formatAppMonth(date = new Date()) {
  return formatAppDate(date).slice(0, 7)
}

export function appMonthEnd(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  return `${month}-${String(lastDay).padStart(2, '0')}`
}
