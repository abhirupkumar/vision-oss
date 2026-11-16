import { useCountryNames } from '@/components/hooks/useCountryNames';
import { useRegionNames } from '@/components/hooks/useRegionNames';
import { useApi } from '../useApi';
import { useLocale } from '../useLocale';

export function useProjectValuesQuery({
  projectId,
  type,
  startDate,
  endDate,
  search,
}: {
  projectId: string;
  type: string;
  startDate: Date;
  endDate: Date;
  search?: string;
}) {
  const { get, useQuery } = useApi();
  const { locale } = useLocale();
  const { countryNames } = useCountryNames(locale);
  const { regionNames } = useRegionNames(locale);

  const names = {
    country: countryNames,
    region: regionNames,
  };

  const getSearch = (type: string, value: string) => {
    if (value) {
      const values = names[type];

      if (values) {
        return (
          Object.keys(values)
            .reduce((arr: string[], key: string) => {
              if (values[key].toLowerCase().includes(value.toLowerCase())) {
                return arr.concat(key);
              }
              return arr;
            }, [])
            .slice(0, 5)
            .join(',') || value
        );
      }

      return value;
    }
  };

  return useQuery({
    queryKey: ['projects:values', { projectId, type, startDate, endDate, search }],
    queryFn: () =>
      get(`/projects/${projectId}/values`, {
        type,
        startAt: +startDate,
        endAt: +endDate,
        search: getSearch(type, search),
      }),
    enabled: !!(projectId && type && startDate && endDate),
  });
}
