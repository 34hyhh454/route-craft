export const RESULT_LABEL = 'Custom graph algorithm on built-in offline dataset'

export function formatDuration(hours) {
  if (hours == null) return '—'
  const total = Math.round(hours * 60)
  return `${Math.floor(total / 60)} h ${total % 60} min`
}
