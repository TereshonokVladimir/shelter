import { apiFetch } from '@/lib/api/client'
import type { ActionResult } from '@/types/common'
import type { ContentPackageDetail, ContentPackageSummary } from '@/lib/api/types'

function adminFetch<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      'X-Admin-Token': token,
    },
  })
}

function toResult<T>(promise: Promise<T>): Promise<ActionResult<T>> {
  return promise
    .then((data) => ({ ok: true as const, data }))
    .catch((error: unknown) => ({
      ok: false as const,
      error: error instanceof Error ? error.message : String(error),
    }))
}

export async function adminListPackages(token: string) {
  return toResult(adminFetch<ContentPackageSummary[]>('/api/admin/packages', token))
}

export async function adminGetPackage(token: string, id: string) {
  return toResult(adminFetch<ContentPackageDetail>(`/api/admin/packages/${id}`, token))
}

export async function adminCreatePackage(
  token: string,
  body: {
    slug: string
    title: string
    description?: string
    rating?: string
    topic?: string
    isActive?: boolean
    sortOrder?: number
  },
) {
  return toResult(
    adminFetch('/api/admin/packages', token, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  )
}

export async function adminUpdatePackage(
  token: string,
  id: string,
  body: Record<string, unknown>,
) {
  return toResult(
    adminFetch(`/api/admin/packages/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  )
}

export async function adminDeletePackage(token: string, id: string) {
  return toResult(
    adminFetch(`/api/admin/packages/${id}`, token, { method: 'DELETE' }),
  )
}

export async function adminCreateDisaster(
  token: string,
  packageId: string,
  body: { title: string; description: string },
) {
  return toResult(
    adminFetch(`/api/admin/packages/${packageId}/disasters`, token, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  )
}

export async function adminDeleteDisaster(token: string, id: string) {
  return toResult(adminFetch(`/api/admin/disasters/${id}`, token, { method: 'DELETE' }))
}

export async function adminCreateBunker(
  token: string,
  packageId: string,
  body: { title: string; description: string },
) {
  return toResult(
    adminFetch(`/api/admin/packages/${packageId}/bunkers`, token, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  )
}

export async function adminDeleteBunker(token: string, id: string) {
  return toResult(adminFetch(`/api/admin/bunkers/${id}`, token, { method: 'DELETE' }))
}

export async function adminCreateCharacteristic(
  token: string,
  packageId: string,
  body: { category: string; title: string; description?: string },
) {
  return toResult(
    adminFetch(`/api/admin/packages/${packageId}/characteristics`, token, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  )
}

export async function adminDeleteCharacteristic(token: string, id: string) {
  return toResult(
    adminFetch(`/api/admin/characteristics/${id}`, token, { method: 'DELETE' }),
  )
}
