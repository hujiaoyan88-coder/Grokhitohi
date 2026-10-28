import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  DAY,
  blockAt,
  cell30,
  clampRange,
  minuteFromClientX,
  snapMinute,
} from "@/lib/dayline/logic";
import type { ColorTag, TimeBlock } from "@/lib/dayline/types";
import { formatDur, formatRange, inkOn, resolveColor } from "@/lib/dayline/time";

type Props = {
  blocks: TimeBlock[];
  colors: ColorTag[];
  nowMin: number | null;
  onCreate: (start: number, end: number) => void;
  onEdit: (block: TimeBlock) => void;
};

const MARKS = [0, 6, 12, 18, 24];

export function Timeline({ blocks, colors, nowMin, onCreate, onEdit }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; originX: number; anchor: number; moved: boolean } | null>(null);
  const [live, setLive] = useState<{ start: number; end: number } | null>(null);

  function endDrag(e: ReactPointerEvent<HTMLDivElement>, commit: boolean) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setLive(null);
    if (!commit) return;
    const el = trackRef.current;
    if (!el) return;
    const minute = minuteFromClientX(e.clientX, el.getBoundingClientRect());
    if (!drag.moved) {
      const hit = blockAt(blocks, Math.min(DAY - 0.001, minute));
      if (hit) onEdit(hit);
      else {
        const cell = cell30(minute);
        onCreate(cell.start, cell.end);
      }
      return;
    }
    const range = clampRange(drag.anchor, minute);
    onCreate(range.start, range.end);
  }

  return (
    <div>
      <div className="relative mb-1 h-4 text-xs text-muted tabular-nums">
        {MARKS.map((hour) => (
          <span
            key={hour}
            className={
              hour === 0 ? "absolute left-0" : hour === 24 ? "absolute right-0" : "absolute -translate-x-1/2"
            }
            style={hour === 0 || hour === 24 ? undefined : { left: `${(hour / 24) * 100}%` }}
          >
            {hour}
          </span>
        ))}
      </div>
      <div
        ref={trackRef}
        role="group"
        aria-label="24時間のタイムライン。なぞって範囲を選び、空いているところをタップすると30分を記録します。"
        className="relative h-28 touch-none overflow-hidden rounded-2xl bg-bg select-none"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          const el = trackRef.current;
          if (!el) return;
          try {
            el.setPointerCapture(e.pointerId);
          } catch {
            /* pointer already gone */
          }
          const minute = minuteFromClientX(e.clientX, el.getBoundingClientRect());
          dragRef.current = {
            pointerId: e.pointerId,
            originX: e.clientX,
            anchor: snapMinute(minute),
            moved: false,
          };
        }}
        onPointerMove={(e) => {
          const drag = dragRef.current;
          const el = trackRef.current;
          if (!drag || !el || drag.pointerId !== e.pointerId) return;
          if (Math.abs(e.clientX - drag.originX) > 8) drag.moved = true;
          if (!drag.moved) return;
          const minute = minuteFromClientX(e.clientX, el.getBoundingClientRect());
          setLive(clampRange(drag.anchor, minute));
        }}
        onPointerUp={(e) => endDrag(e, true)}
        onPointerCancel={(e) => endDrag(e, false)}
      >
        {Array.from({ length: 23 }, (_, i) => i + 1).map((hour) => (
          <span
            key={hour}
            aria-hidden
            className={
              hour % 6 === 0
                ? "pointer-events-none absolute top-0 bottom-0 w-px bg-line"
                : "pointer-events-none absolute top-3 bottom-3 w-px bg-line opacity-50"
            }
            style={{ left: `${(hour / 24) * 100}%` }}
          />
        ))}
        {blocks.map((block) => {
          const tag = resolveColor(colors, block.colorId);
          const pct = ((block.end - block.start) / DAY) * 100;
          return (
            <div
              key={block.id}
              className="absolute top-1.5 bottom-1.5 z-10 overflow-hidden rounded-md"
              style={{
                left: `${(block.start / DAY) * 100}%`,
                width: `${pct}%`,
                background: tag.color,
                color: inkOn(tag.color),
              }}
            >
              {pct >= 12 ? (
                <span className="block truncate px-1.5 pt-1 text-xs font-medium">{tag.name}</span>
              ) : null}
            </div>
          );
        })}
        {live ? (
          <div
            className="absolute top-0 bottom-0 z-20 bg-accent/25 ring-2 ring-accent ring-inset"
            style={{
              left: `${(live.start / DAY) * 100}%`,
              width: `${((live.end - live.start) / DAY) * 100}%`,
            }}
          />
        ) : null}
        {nowMin != null ? (
          <span
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 z-30 w-0.5 bg-accent"
            style={{ left: `${(nowMin / DAY) * 100}%` }}
          >
            <span className="absolute top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-accent" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 h-5 text-center text-sm text-muted tabular-nums">
        {live ? (
          <span className="text-accent">
            {formatRange(live.start, live.end)} · {formatDur(live.end - live.start)}
          </span>
        ) : (
          "なぞって選ぶ · タップで30分"
        )}
      </p>
    </div>
  );
}
