import tr from './tr.json';

type Dict = { [key: string]: string | Dict };

const dictionaries: Record<string, Dict> = { tr };
let current: Dict = dictionaries.tr;

export function setLocale(locale: string): void {
  current = dictionaries[locale] ?? dictionaries.tr;
}

/**
 * Looks up a dotted key ("menu.adventure") and fills {placeholders}.
 * Returns the key itself if it is missing, so gaps are visible during development.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  let node: string | Dict | undefined = current;
  for (const part of key.split('.')) {
    if (node === undefined || typeof node === 'string') break;
    node = node[part];
  }
  if (typeof node !== 'string') return key;
  if (!params) return node;
  return node.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}

/** Formats milliseconds as seconds with one decimal ("2,4 sn"). */
export function formatSeconds(ms: number): string {
  return t('common.seconds', { n: (ms / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) });
}

export function formatPercent(ratio: number): string {
  return t('common.percent', { n: Math.round(ratio * 100) });
}

export function tableName(table: number): string {
  return t(`tables.${table}`);
}
