export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }

  // Handle empty responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  return response.json();
}
