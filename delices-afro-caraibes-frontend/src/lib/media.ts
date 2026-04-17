const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const resolveMediaUrl = (url?: string | null) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  const normalized = url.startsWith('/') ? url : `/${url}`
  const uploadBase = process.env.NEXT_PUBLIC_UPLOAD_API?.trim()

  if (uploadBase) {
    return `${trimTrailingSlash(uploadBase)}${normalized}`
  }

  if (typeof window !== 'undefined') {
    return `${trimTrailingSlash(window.location.origin)}${normalized}`
  }

  return normalized
}
