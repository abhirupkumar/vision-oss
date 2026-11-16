import { formatDate } from '@/lib/date';
import { formatLongNumber } from '@/lib/format';

export function renderNumberLabels(label: string) {
  return +label > 1000 ? formatLongNumber(+label) : label;
}

export function renderDateLabels(unit: string, locale: string) {
  return (label: string, index: number, values: any[]) => {
    const value = values?.[index]?.value ?? values?.[index]?.x ?? values?.[index]?.d ?? label;

    if (!value) {
      return label;
    }

    let d = new Date(value);
    const isInvalid = isNaN(d.getTime());

    if (isInvalid) {
      if (typeof value === 'string' && value.includes(' ')) {
        const [datePart, hourPart] = value.split(' ');
        if (datePart && hourPart && hourPart.length === 2) {
          d = new Date(`${datePart}T${hourPart}:00:00`);
        }
      }
    }

    if (isNaN(d.getTime())) {
      return label;
    }

    switch (unit) {
      case 'minute':
        return formatDate(d, 'h:mm', locale);
      case 'hour':
        return formatDate(d, 'p', locale);
      case 'day':
        return formatDate(d, 'PP', locale).replace(/\W*20\d{2}\W*/, ''); // Remove year
      case 'month':
        return formatDate(d, 'MMM', locale);
      case 'year':
        return formatDate(d, 'yyyy', locale);
      default:
        return label;
    }
  };
}
