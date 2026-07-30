export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
export const TOKEN_KEY = 'ls_token'

export function getBrowserToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setBrowserToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token)
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}

export async function ensureBrowserAuth(): Promise<string> {
  const existing = getBrowserToken()
  const response = await fetch(`${API_URL}/api/auth/anonymous`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(existing ? { Authorization: `Bearer ${existing}` } : {}),
    },
    body: JSON.stringify(existing ? { token: existing } : {}),
  })

  if (!response.ok) {
    throw new Error('Не удалось создать анонимную сессию')
  }

  const data = (await response.json()) as { token: string; userId: string }
  setBrowserToken(data.token)
  return data.token
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { token?: string },
): Promise<T> {
  const token = init?.token ?? (await ensureBrowserAuth())
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message =
      (payload as { message?: string | string[] }).message ??
      (payload as { code?: string }).code ??
      'Request failed'
    throw new Error(Array.isArray(message) ? message.join(', ') : String(message))
  }

  return payload as T
}
