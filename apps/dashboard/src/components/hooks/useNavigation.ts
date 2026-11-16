import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { buildPath } from '@/lib/url';

export function useNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const segments = pathname.split('/').filter(Boolean);
  const isGlobal = ['admin', 'onboarding', 'settings', 'share', 'api'].includes(segments[0]);

  const reservedPaths = [
    'links',
    'pixels',
    'boards',
    'settings',
    'console',
    'organizations',
    'members',
    'integrations',
  ];
  const organizationId = !isGlobal ? segments[0] : undefined;
  const projectId =
    !isGlobal && segments.length >= 2 && !reservedPaths.includes(segments[1])
      ? segments[1]
      : undefined;
  const [queryParams, setQueryParams] = useState(Object.fromEntries(searchParams));

  const updateParams = (params?: Record<string, string | number>) => {
    return buildPath(pathname, { ...queryParams, ...params });
  };

  const replaceParams = (params?: Record<string, string | number>) => {
    return buildPath(pathname, params);
  };

  const renderUrl = (path: string, params?: Record<string, string | number> | false) => {
    const isGlobal =
      path.startsWith('/organizations') ||
      path.startsWith('/onboarding') ||
      path.startsWith('/admin');
    const baseUrl = organizationId && !isGlobal ? `/${organizationId}${path}` : path;

    return buildPath(baseUrl, params === false ? {} : { ...queryParams, ...params });
  };

  useEffect(() => {
    setQueryParams(Object.fromEntries(searchParams));
  }, [searchParams.toString()]);

  return {
    router,
    pathname,
    searchParams,
    query: queryParams,
    organizationId,
    projectId,
    updateParams,
    replaceParams,
    renderUrl,
  };
}
