import type { ColorTag, TimeBlock } from "@/lib/dayline/types";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

export function shiftKey(key: string, days: number): string {
  const dt = parseKey(key);
  dt.setDate(dt.getDate() + days);
  return toKey(dt);
}

export function formatHM(min: number): string {
  if (min >= 1440) return "24:00";
  const h = Math.floor(Math.max(0, min) / 60);
  const m = Math.max(0, min) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatRange(start: number, end: number): string {
  return `${formatHM(start)}〜${formatHM(end)}`;
}

export function formatDur(min: number): string {
  const safe = Math.max(0, min);
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export function dateParts(key: string): { year: number; month: number; day: number; week: string } {
  const d = parseKey(key);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    week: WEEK[d.getDay()] ?? "日",
  };
}

export function formatDateLong(key: string): string {
  const p = dateParts(key);
  return `${p.year}年${p.month}月${p.day}日 ${p.week}曜日`;
}

export function inkOn(hex: string): string {
  const raw = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return "var(--color-fg)";
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const y = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return y > 0.64 ? "var(--color-bg)" : "var(--color-fg)";
}

export function resolveColor(colors: ColorTag[], id: string): { name: string; color: string } {
  const found = colors.find((c) => c.id === id);
  if (found) return { name: found.name, color: found.color };
  return { name: "未設定", color: "var(--color-line)" };
}

export function formatDayText(date: string, blocks: TimeBlock[], colors: ColorTag[]): string {
  const lines = [formatDateLong(date)];
  const sorted = [...blocks].sort((a, b) => a.start - b.start);
  if (sorted.length === 0) {
    lines.push("（記録なし）");
    return lines.join("\n");
  }
  for (const b of sorted) {
    const name = colors.find((c) => c.id === b.colorId)?.name ?? "未設定";
    const memo = b.memo.trim();
    lines.push(memo ? `${formatRange(b.start, b.end)} ${name} ${memo}` : `${formatRange(b.start, b.end)} ${name}`);
  }
  return lines.join("\n");
}
