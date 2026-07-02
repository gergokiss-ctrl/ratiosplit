export const HUF_MINOR_UNIT = 2;
export const MICROS = 1_000_000;
export const BPS = 10_000;
export function monthKeyFromDate(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
export function parseMoneyToMinor(value: string | number): number { const n = Number(String(value).replace(",", ".")); if (!Number.isFinite(n)) throw new Error("Invalid amount."); return Math.round(n * 100); }
export function parseRateToMicros(value: string | number): number { const n = Number(String(value).replace(",", ".")); if (!Number.isFinite(n) || n <= 0) throw new Error("Invalid exchange rate."); return Math.round(n * MICROS); }
export function parsePercentToBps(value: string | number): number { const n = Number(String(value).replace(",", ".")); if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error("Invalid percentage."); return Math.round(n * 100); }
export function convertToHufMinor(amountOriginalMinor: number, exchangeRateToHufMicros: number): number { return Math.round((amountOriginalMinor * exchangeRateToHufMicros) / MICROS); }
export function formatHuf(minor: number): string { return new Intl.NumberFormat("en-US", { style: "currency", currency: "HUF", maximumFractionDigits: 0 }).format(minor / 100); }
export function formatOriginal(minor: number, currency: string): string { return new Intl.NumberFormat("en-US", { style: "currency", currency: currency === "OTHER" ? "HUF" : currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(minor / 100); }
export function bpsToPercent(bps: number | null | undefined): number | null { if (bps === null || bps === undefined) return null; return bps / 100; }
