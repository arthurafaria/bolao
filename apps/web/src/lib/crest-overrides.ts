const overrides: Record<string, string> = {};

export function getCrest(shortName: string, apiCrest: string): string {
  return overrides[shortName] ?? apiCrest;
}
