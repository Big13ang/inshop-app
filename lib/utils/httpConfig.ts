export function getBaseUrl(overrideUrl?: string): string {
  const url = overrideUrl || process.env.NEXT_PUBLIC_API_URL;
  return url ? url.replace(/\/$/, '') : '';
}

export function setLanguageHeader({ request }: { request?: Request }): void {
  if (request && request.headers && typeof request.headers.set === 'function') {
    if (!request.headers.has('Accept-Language')) {
      request.headers.set('Accept-Language', 'fa');
    }
  }
}

export function handleUnauthorizedRedirect({ response }: { response?: Response }): void {
  if (response && response.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
}
