import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { SHARE_TOKEN_HEADER } from '@/lib/constants';
import { type FetchResponse, httpDelete, httpGet, httpPost, httpPut } from '@/lib/fetch';
import { useApp } from '@/store/app';
import { useAuth } from '@clerk/nextjs';

const selector = (state: { shareToken: { token?: string } }) => state.shareToken;

async function handleResponse(res: FetchResponse): Promise<any> {
  if (!res.ok) {
    const { message, code, status } = res?.data?.error || {};

    return Promise.reject(Object.assign(new Error(message), { code, status }));
  }
  return Promise.resolve(res.data);
}

export function useApi() {
  const shareToken = useApp(selector);
  const { getToken } = useAuth();

  const defaultHeaders = {
    [SHARE_TOKEN_HEADER]: shareToken?.token,
  };

  const basePath = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const getUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    const apiPath = `${url.startsWith('/') ? '' : '/'}${url}`;
    return `${basePath}${apiPath}`;
  };

  const getHeaders = async (headers: any = {}) => {
    const token = await getToken();
    return {
      ...defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    };
  };

  return {
    get: useCallback(
      async (url: string, params: object = {}, headers: object = {}) => {
        const resolvedHeaders = await getHeaders(headers);
        return httpGet(getUrl(url), params, resolvedHeaders).then(handleResponse);
      },
      [getToken, shareToken],
    ),

    post: useCallback(
      async (url: string, params: object = {}, headers: object = {}) => {
        const resolvedHeaders = await getHeaders(headers);
        return httpPost(getUrl(url), params, resolvedHeaders).then(handleResponse);
      },
      [getToken, shareToken],
    ),

    put: useCallback(
      async (url: string, params: object = {}, headers: object = {}) => {
        const resolvedHeaders = await getHeaders(headers);
        return httpPut(getUrl(url), params, resolvedHeaders).then(handleResponse);
      },
      [getToken, shareToken],
    ),

    patch: useCallback(
      async (url: string, params: object = {}, headers: object = {}) => {
        const { httpPatch } = await import('@/lib/fetch');
        const resolvedHeaders = await getHeaders(headers);
        return httpPatch(getUrl(url), params, resolvedHeaders).then(handleResponse);
      },
      [getToken, shareToken],
    ),

    del: useCallback(
      async (url: string, params: object = {}, headers: object = {}) => {
        const resolvedHeaders = await getHeaders(headers);
        return httpDelete(getUrl(url), params, resolvedHeaders).then(handleResponse);
      },
      [getToken, shareToken],
    ),
    useQuery,
    useMutation,
  };
}
