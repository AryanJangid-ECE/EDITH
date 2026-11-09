export class ApiError extends Error {
  status: number
  code: string
  details: Record<string, unknown>

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

let tokenProvider: (() => string | null) | null = null

export function setTokenProvider(provider: (() => string | null) | null) {
  tokenProvider = provider
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/api'
  const url = `${baseUrl}${path}`

  const headers = new Headers(init.headers ?? {})
  const token = tokenProvider?.()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (!(init.body instanceof FormData) && !headers.has('Content-Type') && init.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers,
      signal: init.signal,
    })

    if (response.status === 204) {
      return undefined as T
    }

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      const errorBody = payload?.error as { code?: string; message?: string; details?: Record<string, unknown> } | null
      throw new ApiError(
        response.status,
        errorBody?.code ?? 'HTTP_ERROR',
        errorBody?.message ?? 'Request failed',
        errorBody?.details ?? {},
      )
    }

    return payload as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }

    throw new ApiError(0, 'NETWORK_ERROR', 'Network error occurred')
  }
}
