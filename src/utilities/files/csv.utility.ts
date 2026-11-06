// Cells starting with these run as formulas in spreadsheet apps (CSV injection), so they are escaped.
const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r']

const toCell = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value)
  const safe = FORMULA_PREFIXES.some((prefix) => text.startsWith(prefix)) ? `'${text}` : text
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/** RFC 4180 CSV with a header row and CRLF line endings. */
export const toCsv = (headers: readonly string[], rows: readonly (readonly unknown[])[]): string =>
  [headers, ...rows].map((row) => row.map(toCell).join(',')).join('\r\n') + '\r\n'
