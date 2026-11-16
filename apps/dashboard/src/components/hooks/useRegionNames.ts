import regions from '../../../public/iso-3166-2.json';
import { useCountryNames } from './useCountryNames';

export function useRegionNames(locale: string) {
  const { countryNames } = useCountryNames(locale);

  const getRegionName = (regionCode: string, countryCode?: string, withCountry: boolean = true) => {
    if (!regionCode) {
      return null;
    }

    if (!countryCode) {
      return regions[regionCode];
    }

    const region = regionCode?.includes('-') ? regionCode : `${countryCode}-${regionCode}`;

    if (!regions[region]) {
      return region;
    }

    return withCountry ? `${regions[region]}, ${countryNames[countryCode]}` : regions[region];
  };

  return { regionNames: regions, getRegionName };
}
