"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type CountKey =
  | "full20"
  | "full40"
  | "danger20"
  | "danger40"
  | "empty20"
  | "empty40";

type SaveState = "idle" | "saving" | "saved" | "error";

const emptyCounts: Record<CountKey, number> = {
  full20: 0,
  full40: 0,
  danger20: 0,
  danger40: 0,
  empty20: 0,
  empty40: 0,
};

const items: {
  key: CountKey;
  title: string;
  sub: string;
}[] = [
  { key: "full20", title: "20 FULL", sub: "20피트 풀" },
  { key: "full40", title: "40 FULL", sub: "40피트 풀" },
  {
    key: "danger20",
    title: "20 위험물",
    sub: "20피트 위험물 FULL",
  },
  {
    key: "danger40",
    title: "40 위험물",
    sub: "40피트 위험물 FULL",
  },
  { key: "empty20", title: "20 EMPTY", sub: "20피트 엠티" },
  { key: "empty40", title: "40 EMPTY", sub: "40피트 엠티" },
];

export default function DailyPage() {
  const supabase = createClient();

  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [counts, setCounts] =
    useState<Record<CountKey, number>>(emptyCounts);

  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const changeCount = (key: CountKey, amount: number) => {
    setCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + amount),
    }));

    setSaveState("idle");
  };

  useEffect(() => {
    const loadDailyLog = async () => {
      setLoading(true);
      setSaveState("idle");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCounts(emptyCounts);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("daily_logs")
        .select(
          "full20, full40, danger20, danger40, empty20, empty40"
        )
        .eq("user_id", user.id)
        .eq("work_date", date)
        .maybeSingle();

      if (error) {
        console.error(error);
        setCounts(emptyCounts);
        setLoading(false);
        return;
      }

      if (!data) {
        setCounts(emptyCounts);
        setLoading(false);
        return;
      }

      setCounts({
        full20: data.full20 ?? 0,
        full40: data.full40 ?? 0,
        danger20: data.danger20 ?? 0,
        danger40: data.danger40 ?? 0,
        empty20: data.empty20 ?? 0,
        empty40: data.empty40 ?? 0,
      });

      setLoading(false);
    };

    loadDailyLog();
  }, [date]);

  const saveDailyLog = async () => {
    if (saveState === "saving") return;

    setSaveState("saving");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaveState("error");
      return;
    }

    const { error } = await supabase
      .from("daily_logs")
      .upsert(
        {
          user_id: user.id,
          work_date: date,
          full20: counts.full20,
          full40: counts.full40,
          danger20: counts.danger20,
          danger40: counts.danger40,
          empty20: counts.empty20,
          empty40: counts.empty40,
        },
        {
          onConflict: "user_id,work_date",
        }
      );

    if (error) {
      console.error(error);
      setSaveState("error");
      return;
    }

    setSaveState("saved");

    setTimeout(() => {
      setSaveState("idle");
    }, 1500);
  };

  const fullTotal =
    counts.full20 +
    counts.full40 +
    counts.danger20 +
    counts.danger40;

  const emptyTotal =
    counts.empty20 + counts.empty40;

  const saveButtonText =
    saveState === "saving"
      ? "저장 중..."
      : saveState === "saved"
      ? "✓ 저장 완료"
      : saveState === "error"
      ? "저장 실패"
      : "오늘 운행 저장";

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-orange-500">
              STTP LINK
            </p>

            <h1 className="mt-1 text-2xl font-black">
              오늘 운행
            </h1>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold"
          >
            홈
          </Link>
        </div>

        <section className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
          <label className="mb-2 block text-sm font-bold text-zinc-300">
            운행 날짜
          </label>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-14 w-full rounded-xl border border-white/10 bg-zinc-800 px-4 text-lg font-bold text-white"
          />
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
            <div className="text-sm text-zinc-400">FULL</div>
            <div className="mt-1 text-3xl font-black text-orange-500">
              {fullTotal}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
            <div className="text-sm text-zinc-400">EMPTY</div>
            <div className="mt-1 text-3xl font-black">
              {emptyTotal}
            </div>
          </div>
        </section>

        {loading && (
          <div className="mt-4 text-center text-sm text-zinc-500">
            불러오는 중...
          </div>
        )}

        <section className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-900 p-4"
            >
              <div>
                <div className="text-lg font-black">
                  {item.title}
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  {item.sub}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => changeCount(item.key, -1)}
                  disabled={loading}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-2xl font-bold disabled:opacity-40"
                >
                  −
                </button>

                <div className="w-8 text-center text-2xl font-black">
                  {counts[item.key]}
                </div>

                <button
                  type="button"
                  onClick={() => changeCount(item.key, 1)}
                  disabled={loading}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600 text-2xl font-bold disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </section>

        <button
          type="button"
          onClick={saveDailyLog}
          disabled={loading || saveState === "saving"}
          className={`mt-6 h-16 w-full rounded-2xl text-lg font-black transition ${
            saveState === "saved"
              ? "bg-green-600"
              : saveState === "error"
              ? "bg-red-600"
              : "bg-orange-600"
          } disabled:opacity-60`}
        >
          {saveButtonText}
        </button>

        {saveState === "error" && (
          <p className="mt-3 text-center text-sm text-red-400">
            저장하지 못했습니다. 로그인 상태를 확인해주세요.
          </p>
        )}
      </div>
    </main>
  );
}