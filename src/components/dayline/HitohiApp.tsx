import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Palette } from "lucide-react";
import { blocksForDate, commitBlock, coveredMinutes, segmentsForDay } from "@/lib/dayline/logic";
import { nextSpareColor, useDayData } from "@/lib/dayline/storage";
import type { TimeBlock } from "@/lib/dayline/types";
import { dateParts, formatDayText, formatDur, shiftKey, toKey } from "@/lib/dayline/time";
import { Ledger } from "@/components/dayline/Ledger";
import { AssignSheet, ColorSheet, type Draft } from "@/components/dayline/Sheets";
import { InstallCard } from "@/components/dayline/InstallCard";
import { Timeline } from "@/components/dayline/Timeline";

export function HitohiApp() {
  const { data, update } = useDayData();
  const [date, setDate] = useState<string | null>(null);
  const [today, setToday] = useState<string | null>(null);
  const [nowMin, setNowMin] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const key = toKey(new Date());
    const n = new Date();
    setDate(key);
    setToday(key);
    setNowMin(n.getHours() * 60 + n.getMinutes());
    const id = window.setInterval(() => {
      const next = new Date();
      setNowMin(next.getHours() * 60 + next.getMinutes());
      setToday(toKey(next));
    }, 30000);
    return () => window.clearInterval(id);
  }, []);

  const isToday = date !== null && date === today;
  const parts = date ? dateParts(date) : null;
  const dayBlocks = blocksForDate(data.blocks, date ?? "");
  const segments = segmentsForDay(dayBlocks);
  const covered = coveredMinutes(dayBlocks);
  const free = 1440 - covered;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (draft || colorsOpen || !date) return;
      const target = e.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") setDate((d) => (d ? shiftKey(d, -1) : d));
      if (e.key === "ArrowRight") setDate((d) => (d ? shiftKey(d, 1) : d));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft, colorsOpen, date]);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  function openCreate(start: number, end: number) {
    if (!date) return;
    setColorsOpen(false);
    setDraft({
      kind: "create",
      start,
      end,
      colorId: data.colors.some((c) => c.id === data.lastColorId) ? data.lastColorId : data.colors[0].id,
      memo: "",
    });
  }

  function openEdit(block: TimeBlock) {
    setColorsOpen(false);
    const known = data.colors.some((c) => c.id === block.colorId);
    setDraft({
      kind: "edit",
      id: block.id,
      start: block.start,
      end: block.end,
      colorId: known ? block.colorId : data.colors[0].id,
      memo: block.memo,
    });
  }

  function saveDraft() {
    if (!draft || !draft.colorId || !date) return;
    const id = draft.kind === "edit" && draft.id ? draft.id : crypto.randomUUID();
    update((current) => ({
      ...current,
      lastColorId: draft.colorId,
      blocks: commitBlock(current.blocks, {
        id,
        date,
        start: draft.start,
        end: draft.end,
        colorId: draft.colorId,
        memo: draft.memo,
      }),
    }));
    setDraft(null);
  }

  function deleteDraft() {
    if (!draft?.id) return;
    const id = draft.id;
    update((current) => ({ ...current, blocks: current.blocks.filter((b) => b.id !== id) }));
    setDraft(null);
  }

  async function copyDay() {
    if (!date) return;
    const text = formatDayText(date, dayBlocks, data.colors);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
  }

  const counts: Record<string, number> = {};
  for (const block of data.blocks) counts[block.colorId] = (counts[block.colorId] ?? 0) + 1;

  return (
    <main className="mx-auto flex h-dvh w-full max-w-3xl flex-col bg-bg text-fg md:h-auto md:min-h-dvh">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain md:flex-none md:overflow-visible">
        <div className="flex min-h-full flex-col px-4 pt-5 pb-6">
        <header>
          <h1 className="font-display text-3xl leading-none">ひと日</h1>
          <p className="mt-2 text-sm text-muted">色とメモで、24時間を残す</p>
        </header>
        <InstallCard />

        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line">
          <div className="bg-surface px-4 py-3">
            <p className="text-xs text-muted">記録</p>
            <p className="mt-1 font-display text-lg leading-snug">{formatDur(covered)}</p>
          </div>
          <div className="bg-surface px-4 py-3">
            <p className="text-xs text-muted">空き</p>
            <p className="mt-1 font-display text-lg leading-snug">{formatDur(free)}</p>
          </div>
        </div>

        <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
          {data.colors.map((color) => (
            <li key={color.id} className="flex items-center gap-2 text-sm text-muted">
              <span className="size-3 rounded-full ring-1 ring-line" style={{ background: color.color }} />
              {color.name}
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <Ledger
            segments={segments}
            colors={data.colors}
            copied={copied}
            onEdit={openEdit}
            onGap={openCreate}
            onCopy={() => {
              void copyDay();
            }}
          />
        </div>
        {dayBlocks.length === 0 ? (
          <p className="flex flex-1 items-center justify-center px-6 pt-8 text-center text-sm text-muted">
            下の帯をなぞって、時間に色を付ける
          </p>
        ) : null}
        </div>
      </div>

      <div className="recorder-pad shrink-0 border-t border-line bg-surface px-4 pt-3">
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            aria-label="前の日"
            onClick={() => setDate((d) => (d ? shiftKey(d, -1) : d))}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-fg"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <label className="relative block">
              <span className="font-display text-xl leading-none underline decoration-line underline-offset-4">
                {parts ? `${parts.month}月${parts.day}日` : "—"}
              </span>
              <span className="mt-1 block text-xs text-muted">
                {parts ? `${parts.week}曜日` : "日付"}
                {isToday ? " · 今日" : ""}
                {parts && today && parts.year !== dateParts(today).year ? ` · ${parts.year}` : ""}
              </span>
              <input
                type="date"
                aria-label="日付を選ぶ"
                value={date ?? ""}
                onChange={(e) => {
                  if (e.target.value) setDate(e.target.value);
                }}
                className="absolute inset-0 cursor-pointer text-base opacity-0"
              />
            </label>
            {isToday || !today ? null : (
              <button type="button" onClick={() => setDate(today)} className="mt-1 text-xs text-accent">
                今日へ
              </button>
            )}
          </div>
          <button
            type="button"
            aria-label="次の日"
            onClick={() => setDate((d) => (d ? shiftKey(d, 1) : d))}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-fg"
          >
            <ChevronRight className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(null);
              setColorsOpen(true);
            }}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-line bg-bg px-3 text-sm text-fg"
          >
            <Palette className="size-4" />
            色
          </button>
        </div>
        <Timeline
          blocks={dayBlocks}
          colors={data.colors}
          nowMin={isToday ? nowMin : null}
          onCreate={openCreate}
          onEdit={openEdit}
        />
      </div>

      {draft ? (
        <AssignSheet
          draft={draft}
          colors={data.colors}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSave={saveDraft}
          onDelete={draft.kind === "edit" ? deleteDraft : undefined}
        />
      ) : null}
      {colorsOpen ? (
        <ColorSheet
          colors={data.colors}
          counts={counts}
          onClose={() => setColorsOpen(false)}
          onAdd={() => {
            update((current) => ({
              ...current,
              colors: [
                ...current.colors,
                { id: crypto.randomUUID(), name: "新しい色", color: nextSpareColor(current.colors) },
              ],
            }));
          }}
          onRename={(id, name) => {
            update((current) => ({
              ...current,
              colors: current.colors.map((c) => (c.id === id ? { ...c, name } : c)),
            }));
          }}
          onRecolor={(id, color) => {
            if (!/^#[0-9a-fA-F]{6}$/.test(color)) return;
            update((current) => ({
              ...current,
              colors: current.colors.map((c) => (c.id === id ? { ...c, color } : c)),
            }));
          }}
          onRemove={(id) => {
            update((current) => {
              if (current.colors.length <= 1) return current;
              const colors = current.colors.filter((c) => c.id !== id);
              const lastColorId = colors.some((c) => c.id === current.lastColorId)
                ? current.lastColorId
                : colors[0].id;
              return { ...current, colors, lastColorId };
            });
          }}
        />
      ) : null}
    </main>
  );
}
