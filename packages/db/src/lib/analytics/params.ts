import { FILTER_COLUMNS, OPERATORS } from './constants';
import type { Filter, QueryFilters, QueryOptions } from '@vision/shared-types';

export function parseFilterValue(param: any) {
  if (typeof param === 'string') {
    const operatorValues = Object.values(OPERATORS).join('|');

    const regex = new RegExp(`^(${operatorValues})\\.(.*)$`);

    const [, operator, value] = param.match(regex) || [];

    return { operator: operator || OPERATORS.equals, value: value || param };
  }

  return { operator: OPERATORS.equals, value: param };
}

export function filtersObjectToArray(filters: QueryFilters, options: QueryOptions = {}): Filter[] {
  if (!filters) {
    return [];
  }

  return Object.keys(filters).reduce((arr: Filter[], key) => {
    const filter = filters[key];

    if (filter === undefined || filter === null) {
      return arr;
    }

    if ((filter as any)?.name && (filter as any)?.value !== undefined) {
      return arr.concat({ ...(filter as any), ...(filter as any), column: options?.columns?.[key] ?? FILTER_COLUMNS[key] });
    }

    const { operator, value } = parseFilterValue(filter);

    return arr.concat({
      ...(filter as any),
      name: key,
      column: options?.columns?.[key] ?? FILTER_COLUMNS[key],
      operator,
      value,
      prefix: options?.prefix,
    });
  }, []);
}
