import { useEffect, useState } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function InstallCard() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setHidden(true);
      return;
    }
    if ("serviceWorker" in navigator) {
      const base = import.meta.env.BASE_URL || "./";
      void navigator.serviceWorker.register(`${base}sw.js`).catch(() => {});
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden) return null;

  return (
    <section className="mt-4 rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-medium">スマホに入れる</h2>
        <button type="button" onClick={() => setHidden(true)} className="text-xs text-muted">
          閉じる
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">
        Chromeの10月の更新で、「インストール」がグレーのままになることがあります。その行は押せません。下の「ショートカット」はブラウザの中で開くだけです。PlayストアでChromeをもう一度更新すると、入ることがあります。
      </p>
      {prompt ? (
        <button
          type="button"
          onClick={() => {
            void prompt.prompt().then(() => setHidden(true));
          }}
          className="mt-3 h-11 w-full rounded-xl bg-accent text-sm font-medium text-accent-ink"
        >
          ホーム画面に追加
        </button>
      ) : null}
    </section>
  );
}
