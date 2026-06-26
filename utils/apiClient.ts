export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || sessionStorage.getItem('token'))
    : null;

  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    let code = '';
    try {
      const clone = response.clone();
      const data = await clone.json();
      code = data?.code || '';
    } catch {}

    if (!code || ['UNAUTHORIZED', 'TOKEN_EXPIRED', 'INVALID_TOKEN'].includes(code)) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth_401', { detail: { url, code } }));
      }
    } else {
      console.warn('401 received but not logging out:', { url, code });
    }
  }

  return response;
};
