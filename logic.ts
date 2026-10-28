import type { TimeBlock } from "@/lib/dayline/types";

export const DAY = 1440;
export const SNAP = 15;

export function snapMinute(min: number): number {
  const n = Math.round(min / SNAP) * SNAP;
  return Math.max(0, Math.min(DAY, n));
}

export function minuteFromClientX(clientX: number, rect: { left: number; width: number }): number {
  const width = rect.width || 1;
  const x = Math.min(Math.max(clientX - rect.left, 0), width);
  return (x / width) * DAY;
}

export function clampRange(start: number, end: number): { start: number; end: number } {
  let s = snapMinute(start);
  let e = snapMinute(end);
  if (e < s) [s, e] = [e, s];
  if (e - s < SNAP) {
    if (s + SNAP <= DAY) e = s + SNAP;
    else {
      e = DAY;
      s = DAY - SNAP;
    }
  }
  return { start: s, end: e };
}

export function cell30(minute: number): { start: number; end: number } {
  const m = Math.min(DAY - 0.001, Math.max(0, minute));
  const start = Math.floor(m / 30) * 30;
  return { start, end: start + 30 };
}

export function blockAt(blocks: TimeBlock[], minute: number): TimeBlock | undefined {
  return blocks.find((b) => minute >= b.start && minute < b.end);
}

export function blocksForDate(blocks: TimeBlock[], date: string): TimeBlock[] {
  return blocks
    .filter((b) => b.date === date)
    .sort((a, b) => a.start - b.start || a.end - b.end);
}

export function coveredMinutes(blocks: TimeBlock[]): number {
  const sorted = [...blocks].sort((a, b) => a.start - b.start);
  let total = 0;
  let cursor = 0;
  for (const b of sorted) {
    const start = Math.max(b.start, cursor);
    if (b.end > start) {
      total += b.end - start;
      cursor = b.end;
    }
  }
  return total;
}

function cutOverlaps(blocks: TimeBlock[], start: number, end: number): TimeBlock[] {
  const out: TimeBlock[] = [];
  for (const b of blocks) {
    if (b.end <= start || b.start >= end) {
      out.push(b);
      continue;
    }
    if (b.start < start) out.push({ ...b, end: start });
    if (b.end > end) out.push({ ...b, id: crypto.randomUUID(), start: end });
  }
  return out;
}

function mergeAdjacent(blocks: TimeBlock[]): TimeBlock[] {
  const sorted = [...blocks].sort((a, b) => a.start - b.start);
  const out: TimeBlock[] = [];
  for (const b of sorted) {
    const last = out[out.length - 1];
    if (last && last.end === b.start && last.colorId === b.colorId && last.memo === b.memo) {
      last.end = b.end;
    } else {
      out.push({ ...b });
    }
  }
  return out;
}

export function commitBlock(existing: TimeBlock[], next: TimeBlock): TimeBlock[] {
  const range = clampRange(next.start, next.end);
  const block: TimeBlock = {
    ...next,
    start: range.start,
    end: range.end,
    memo: next.memo.trim().slice(0, 40),
  };
  const others = existing.filter((b) => b.date !== block.date);
  const day = existing.filter((b) => b.date === block.date && b.id !== block.id);
  return [...others, ...mergeAdjacent([...cutOverlaps(day, block.start, block.end), block])];
}

export type DaySegment =
  | { kind: "block"; block: TimeBlock }
  | { kind: "gap"; start: number; end: number };

export function segmentsForDay(blocks: TimeBlock[]): DaySegment[] {
  const sorted = [...blocks].sort((a, b) => a.start - b.start || a.end - b.end);
  const out: DaySegment[] = [];
  let cursor = 0;
  for (const block of sorted) {
    if (block.start > cursor) out.push({ kind: "gap", start: cursor, end: block.start });
    out.push({ kind: "block", block });
    cursor = Math.max(cursor, block.end);
  }
  if (cursor < DAY) out.push({ kind: "gap", start: cursor, end: DAY });
  return out;
}
