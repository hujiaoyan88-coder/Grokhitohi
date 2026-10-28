import { useCallback, useEffect, useState } from "react";
import type { ColorTag, Persisted, TimeBlock } from "@/lib/dayline/types";

const KEY = "hitohi-v1";

export const DEFAULT_COLORS: ColorTag[] = [
  { id: "sleep", name: "睡眠", color: "#7E8CBA" },
  { id: "out", name: "外出", color: "#5E9A78" },
  { id: "work", name: "仕事", color: "#D08A45" },
  { id: "meal", name: "食事", color: "#C46B62" },
];

const SPARE_COLORS = ["#6AA8A1", "#C47A8A", "#8A9A4A", "#4E7CA8", "#A88858", "#7E6A8A", "#5C8F8A", "#B56A4A"];

export function initialPersisted(): Persisted {
  return {
    colors: DEFAULT_COLORS.map((c) => ({ ...c })),
    blocks: [],
    lastColorId: DEFAULT_COLORS[0].id,
  };
}

function isColor(value: unknown): value is ColorTag {
  if (!value || typeof value !== "object") return false;
  const o = value as ColorTag;
  return (
    typeof o.id === "string" &&
    o.id.length > 0 &&
    typeof o.name === "string" &&
    typeof o.color === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(o.color)
  );
}

function isBlock(value: unknown): value is TimeBlock {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(o.date) &&
    typeof o.start === "number" &&
    typeof o.end === "number" &&
    o.start >= 0 &&
    o.end <= 1440 &&
    o.end > o.start &&
    typeof o.colorId === "string" &&
    typeof o.memo === "string"
  );
}

export function loadPersisted(): Persisted {
  if (typeof window === "undefined") return initialPersisted();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialPersisted();
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    const colors = Array.isArray(parsed.colors) ? parsed.colors.filter(isColor) : [];
    const blocks = Array.isArray(parsed.blocks) ? parsed.blocks.filter(isBlock) : [];
    const safeColors = colors.length > 0 ? colors : initialPersisted().colors;
    const last =
      typeof parsed.lastColorId === "string" && safeColors.some((c) => c.id === parsed.lastColorId)
        ? parsed.lastColorId
        : safeColors[0].id;
    return { colors: safeColors, blocks, lastColorId: last };
  } catch {
    return initialPersisted();
  }
}

function writePersisted(data: Persisted) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode / quota — keep the session in memory */
  }
}

export function nextSpareColor(colors: ColorTag[]): string {
  const used = new Set(colors.map((c) => c.color.toLowerCase()));
  return SPARE_COLORS.find((c) => !used.has(c.toLowerCase())) ?? "#8D8376";
}

export function useDayData() {
  const [data, setData] = useState(initialPersisted);

  useEffect(() => {
    setData(loadPersisted());
  }, []);

  const update = useCallback((recipe: (current: Persisted) => Persisted) => {
    setData((prev) => {
      const next = recipe(prev);
      writePersisted(next);
      return next;
    });
  }, []);

  return { data, update };
}
