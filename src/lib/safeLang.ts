export function getSafeText(val: any, lang: string = 'ar', fallback: string = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    return (
      val[lang] ??
      val.ar ??
      val.en ??
      (Object.values(val).find((v) => typeof v === 'string' && (v as string).trim() !== '') as string) ??
      fallback
    );
  }
  return fallback;
}

export function getSafeArray(val: any, lang: string = 'ar'): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') {
    const arr = val[lang] ?? val.ar ?? val.en;
    if (Array.isArray(arr)) return arr;
  }
  return [];
}
