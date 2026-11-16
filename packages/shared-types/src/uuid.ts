export function uuid(): string {
  return (globalThis as any).crypto.randomUUID();
}
