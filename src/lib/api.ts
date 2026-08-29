import type { ApiResult, Application, EligibilityInput, EligibilityResult, EntryPoint, VisaType } from './types'

export class ApiError extends Error { constructor(message: string, public status = 500, public fields?: Record<string, string>) { super(message) } }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...init, headers: { ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...init?.headers } })
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new ApiError('The service returned an unreadable response.', response.status)
  }
  if (!response.ok) {
    if (isApiErrorResult(payload)) throw new ApiError(payload.error.message, response.status, payload.error.fields)
    throw new ApiError('Request failed. Please try again.', response.status)
  }
  if (!isApiSuccessResult<T>(payload)) {
    if (isApiErrorResult(payload)) throw new ApiError(payload.error.message, response.status, payload.error.fields)
    throw new ApiError('The service returned an invalid response.', response.status)
  }
  return payload.data
}

function isApiSuccessResult<T>(value: unknown): value is { ok: true; data: T } {
  return Boolean(value && typeof value === 'object' && (value as { ok?: unknown }).ok === true && 'data' in value)
}

function isApiErrorResult(value: unknown): value is { ok: false; error: { message: string; fields?: Record<string, string> } } {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { ok?: unknown; error?: unknown }
  if (candidate.ok !== false || !candidate.error || typeof candidate.error !== 'object') return false
  return typeof (candidate.error as { message?: unknown }).message === 'string'
}

const adminHeaders = { 'X-Demo-Admin': 'evisa-review-demo' }

export const api = {
  createApplication: (body: unknown) => request<Application>('/applications', { method: 'POST', body: JSON.stringify(body) }),
  getApplication: (id: string) => request<Application>(`/applications/${id}`),
  getDashboard: (id: string) => request<Application>(`/applications/${id}/dashboard`),
  updateApplication: (id: string, body: unknown) => request<{ updatedAt: string; version: number }>(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  submitApplication: (id: string) => request<Application>(`/applications/${id}/submit`, { method: 'POST' }),
  uploadDocument: (id: string, form: FormData) => request<Application>(`/applications/${id}/documents`, { method: 'POST', body: form }),
  simulatePayment: (id: string, body: unknown) => request<Application>(`/applications/${id}/payments`, { method: 'POST', body: JSON.stringify(body) }),
  findApplication: (body: unknown) => request<{ publicId: string }>('/applications/find', { method: 'POST', body: JSON.stringify(body) }),
  checkEligibility: (body: EligibilityInput) => request<EligibilityResult>('/eligibility', { method: 'POST', body: JSON.stringify(body) }),
  publicData: () => request<{ visaTypes: VisaType[]; entryPoints: EntryPoint[] }>('/public-data'),
  adminApplications: (query = '') => request<Application[]>(`/admin/applications${query}`, { headers: adminHeaders }),
  adminApplication: (id: string) => request<Application>(`/admin/applications/${id}`, { headers: adminHeaders }),
  adminAction: (id: string, action: string, body: unknown) => request<Application>(`/admin/applications/${id}/${action}`, { method: 'POST', headers: adminHeaders, body: JSON.stringify(body) }),
}
