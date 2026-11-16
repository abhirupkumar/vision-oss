export function getSeverityColor(level: string) {
  switch (level?.toLowerCase()) {
    case 'fatal':
    case 'error':
      return 'bg-destructive';
    case 'warning':
      return 'bg-amber-500';
    case 'info':
    default:
      return 'bg-muted-foreground/50';
  }
}

export function getErrorCategory(message: string, errorType?: string): { type: string; severity: 'high' | 'medium' | 'low' } {
  const t = (errorType || message || '').toLowerCase();
  
  if (t.includes('network') || t.includes('fetch') || t.includes('axios')) {
    return { type: 'Network', severity: 'medium' };
  }
  if (t.includes('referenceerror') || t.includes('typeerror')) {
    return { type: 'JavaScript', severity: 'high' };
  }
  if (t.includes('react') || t.includes('render')) {
    return { type: 'React', severity: 'high' };
  }
  return { type: errorType || 'Unknown', severity: 'low' };
}
