import { useEffect, useRef, useState, type ReactNode } from "react";
import { Minus, Plus, Trash2, X } from "lucide-react";
import type { ColorTag } from "@/lib/dayline/types";
import { formatDur, formatHM, formatRange } from "@/lib/dayline/time";

export type Draft = {
  kind: "create" | "edit";
  id?: string;
  start: number;
  end: number;
  colorId: string;
  memo: string;
};

function SheetFrame({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button type="button" aria-label="閉じる" className="absolute inset-0 bg-scrim" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet-panel sheet-pad relative z-50 max-h-[85dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border-t border-line bg-surface px-4 pt-4"
      >
        {children}
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  onDec,
  onInc,
  decDisabled,
  incDisabled,
}: {
  label: string;
  value: string;
  onDec: () => void;
  onInc: () => void;
  decDisabled: boolean;
  incDisabled: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface-2 p-2">
      <p className="px-1 text-xs text-muted">{label}</p>
      <div className="mt-1 flex items-center justify-between">
        <button
          type="button"
          aria-label={`${label}を15分戻す`}
          disabled={decDisabled}
          onClick={onDec}
          className="flex size-11 items-center justify-center rounded-lg text-fg"
        >
          <Minus className="size-4" />
        </button>
        <span className="text-base font-medium tabular-nums">{value}</span>
        <button
          type="button"
          aria-label={`${label}を15分進める`}
          disabled={incDisabled}
          onClick={onInc}
          className="flex size-11 items-center justify-center rounded-lg text-fg"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function AssignSheet({
  draft,
  colors,
  onChange,
  onClose,
  onSave,
  onDelete,
}: {
  draft: Draft;
  colors: ColorTag[];
  onChange: (next: Draft) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
}) {
  const [armed, setArmed] = useState(false);
  const title = draft.kind === "edit" ? "記録を編集" : "時間を塗る";

  function nudge(which: "start" | "end", delta: number) {
    let start = draft.start;
    let end = draft.end;
    if (which === "start") start = Math.max(0, Math.min(end - 15, start + delta));
    else end = Math.min(1440, Math.max(start + 15, end + delta));
    onChange({ ...draft, start, end });
  }

  return (
    <SheetFrame title={title} onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-3xl leading-none tabular-nums">{formatRange(draft.start, draft.end)}</p>
          <p className="mt-2 text-sm text-muted">{formatDur(draft.end - draft.start)}</p>
        </div>
        <button
          type="button"
          aria-label="閉じる"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-full bg-surface-2 text-fg"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stepper
          label="開始"
          value={formatHM(draft.start)}
          onDec={() => nudge("start", -15)}
          onInc={() => nudge("start", 15)}
          decDisabled={draft.start <= 0}
          incDisabled={draft.start >= draft.end - 15}
        />
        <Stepper
          label="終了"
          value={formatHM(draft.end)}
          onDec={() => nudge("end", -15)}
          onInc={() => nudge("end", 15)}
          decDisabled={draft.end <= draft.start + 15}
          incDisabled={draft.end >= 1440}
        />
      </div>

      <p className="mt-4 text-xs text-muted">色</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {colors.map((color) => {
          const selected = color.id === draft.colorId;
          return (
            <button
              key={color.id}
              type="button"
              onClick={() => onChange({ ...draft, colorId: color.id })}
              aria-pressed={selected}
              className="flex min-h-11 flex-col items-center gap-1 rounded-xl px-1 py-2"
            >
              <span
                className={selected ? "size-8 rounded-full ring-2 ring-accent ring-offset-2 ring-offset-surface" : "size-8 rounded-full ring-1 ring-line"}
                style={{ background: color.color }}
              />
              <span className={selected ? "w-full truncate text-center text-xs font-medium text-fg" : "w-full truncate text-center text-xs text-muted"}>
                {color.name}
              </span>
            </button>
          );
        })}
      </div>

      <label className="mt-3 block">
        <span className="text-xs text-muted">メモ（任意）</span>
        <input
          value={draft.memo}
          maxLength={40}
          enterKeyHint="done"
          autoComplete="off"
          placeholder="ひとこと"
          onChange={(e) => onChange({ ...draft, memo: e.target.value.slice(0, 40) })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSave();
            }
          }}
          className="mt-1 h-12 w-full rounded-xl border border-line bg-surface-2 px-3 text-base text-fg outline-none placeholder:text-muted"
        />
      </label>

      <button
        type="button"
        onClick={onSave}
        className="mt-4 h-12 w-full rounded-xl bg-accent text-base font-medium text-accent-ink"
      >
        {draft.kind === "edit" ? "保存する" : "記録する"}
      </button>
      {onDelete ? (
        <button
          type="button"
          onClick={() => {
            if (!armed) {
              setArmed(true);
              return;
            }
            onDelete();
          }}
          className="mt-2 h-11 w-full text-sm text-muted"
        >
          {armed ? "本当に削除" : "削除"}
        </button>
      ) : null}
    </SheetFrame>
  );
}

export function ColorSheet({
  colors,
  counts,
  onClose,
  onAdd,
  onRename,
  onRecolor,
  onRemove,
}: {
  colors: ColorTag[];
  counts: Record<string, number>;
  onClose: () => void;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onRecolor: (id: string, color: string) => void;
  onRemove: (id: string) => void;
}) {
  const [armedId, setArmedId] = useState<string | null>(null);

  return (
    <SheetFrame title="色" onClose={onClose}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl">色</h2>
        <button
          type="button"
          aria-label="閉じる"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-full bg-surface-2 text-fg"
        >
          <X className="size-5" />
        </button>
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {colors.map((color) => {
          const count = counts[color.id] ?? 0;
          const armed = armedId === color.id;
          return (
            <li key={color.id} className="flex items-center gap-2 rounded-xl bg-surface-2 p-2">
              <input
                type="color"
                aria-label={`${color.name}の色`}
                value={color.color.toLowerCase()}
                onChange={(e) => onRecolor(color.id, e.target.value)}
                className="swatch shrink-0"
              />
              <input
                value={color.name}
                maxLength={16}
                aria-label="色の名前"
                autoComplete="off"
                onChange={(e) => onRename(color.id, e.target.value.slice(0, 16))}
                onBlur={(e) => {
                  const name = e.target.value.trim() || "無題";
                  if (name !== color.name) onRename(color.id, name);
                }}
                className="h-11 min-w-0 flex-1 rounded-lg bg-transparent px-2 text-base text-fg outline-none"
              />
              {count > 0 ? <span className="shrink-0 text-xs text-muted tabular-nums">{count}</span> : null}
              <button
                type="button"
                aria-label={armed ? `${color.name}を本当に削除` : `${color.name}を削除`}
                disabled={colors.length <= 1}
                onClick={() => {
                  if (!armed) {
                    setArmedId(color.id);
                    return;
                  }
                  onRemove(color.id);
                  setArmedId(null);
                }}
                className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 text-base text-fg"
      >
        <Plus className="size-4" />
        色を追加
      </button>
    </SheetFrame>
  );
}
