import { Check, Copy } from "lucide-react";
import type { DaySegment } from "@/lib/dayline/logic";
import type { ColorTag, TimeBlock } from "@/lib/dayline/types";
import { formatDur, formatRange, resolveColor } from "@/lib/dayline/time";

const GAP_TAP_MAX = 180;

type Props = {
  segments: DaySegment[];
  colors: ColorTag[];
  copied: boolean;
  onEdit: (block: TimeBlock) => void;
  onGap: (start: number, end: number) => void;
  onCopy: () => void;
};

export function Ledger({ segments, colors, copied, onEdit, onGap, onCopy }: Props) {
  return (
    <section>
      <div className="mb-2 flex items-end justify-between gap-3">
        <h2 className="text-sm font-medium">一覧</h2>
        <button
          type="button"
          onClick={onCopy}
          className="flex h-11 items-center gap-1.5 rounded-full px-3 text-sm text-muted"
        >
          {copied ? <Check className="size-4 text-accent" /> : <Copy className="size-4" />}
          {copied ? "コピーした" : "コピー"}
        </button>
      </div>
      <div className="rounded-2xl border border-line bg-surface px-3">
        {segments.map((segment) =>
          segment.kind === "block" ? (
            <BlockRow key={segment.block.id} block={segment.block} colors={colors} onEdit={onEdit} />
          ) : (
            <GapRow key={`gap-${segment.start}`} start={segment.start} end={segment.end} onGap={onGap} />
          ),
        )}
      </div>
      <p className="mt-3 text-center text-xs text-muted">この端末にだけ残ります。コピーして手帳へ。</p>
    </section>
  );
}

function BlockRow({
  block,
  colors,
  onEdit,
}: {
  block: TimeBlock;
  colors: ColorTag[];
  onEdit: (block: TimeBlock) => void;
}) {
  const tag = resolveColor(colors, block.colorId);
  return (
    <button
      type="button"
      onClick={() => onEdit(block)}
      className="flex w-full items-start gap-3 border-b border-line py-3 text-left last:border-b-0"
    >
      <span className="mt-1 h-10 w-1 shrink-0 rounded-full" style={{ background: tag.color }} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium tabular-nums">{formatRange(block.start, block.end)}</span>
          <span className="text-xs text-muted tabular-nums">{formatDur(block.end - block.start)}</span>
        </span>
        <span className="mt-0.5 block text-base">{tag.name}</span>
        {block.memo ? <span className="mt-0.5 block truncate text-sm text-muted">{block.memo}</span> : null}
      </span>
    </button>
  );
}

function GapRow({
  start,
  end,
  onGap,
}: {
  start: number;
  end: number;
  onGap: (start: number, end: number) => void;
}) {
  const dur = end - start;
  const tappable = dur <= GAP_TAP_MAX;
  const inner = (
    <>
      <span className="mt-1 h-10 w-1 shrink-0 rounded-full bg-line" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-sm tabular-nums">{formatRange(start, end)}</span>
          <span className="text-xs tabular-nums">{formatDur(dur)}</span>
        </span>
        <span className="mt-0.5 block text-sm">{tappable ? "未記録 · タップで塗る" : "未記録"}</span>
      </span>
    </>
  );
  const className = "flex w-full items-start gap-3 border-b border-line py-3 text-left text-muted last:border-b-0";
  if (!tappable) return <div className={className}>{inner}</div>;
  return (
    <button type="button" onClick={() => onGap(start, end)} className={className}>
      {inner}
    </button>
  );
}
