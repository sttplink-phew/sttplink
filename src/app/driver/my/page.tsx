"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/client";

type DriverProfile = {
  id: number;
  user_id: string;
  vehicle_number: string | null;
};

type DailyLog = {
  work_date: string;
  full20: number;
  full40: number;
  danger20: number;
  danger40: number;
  empty20: number;
  empty40: number;
};

export default function DriverMyPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMyPage() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("id, user_id, vehicle_number")
        .eq("user_id", user.id)
        .limit(1);

      if (driverError) {
        console.error(driverError);
        setLoading(false);
        return;
      }

      if (!driverData || driverData.length === 0) {
        router.push("/driver/profile");
        return;
      }

      setProfile(driverData[0]);

      const now = new Date();

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");

      const monthStart = `${year}-${month}-01`;

      const { data: logData, error: logError } = await supabase
        .from("daily_logs")
        .select(
          "work_date, full20, full40, danger20, danger40, empty20, empty40"
        )
        .eq("user_id", user.id)
        .gte("work_date", monthStart)
        .order("work_date", { ascending: false });

      if (logError) {
        console.error(logError);
        setLogs([]);
      } else {
        setLogs(logData ?? []);
      }

      setLoading(false);
    }

    loadMyPage();
  }, [router, supabase]);

  const fullTotal = logs.reduce(
    (sum, log) =>
      sum +
      (log.full20 ?? 0) +
      (log.full40 ?? 0) +
      (log.danger20 ?? 0) +
      (log.danger40 ?? 0),
    0
  );

  const emptyTotal = logs.reduce(
    (sum, log) =>
      sum +
      (log.empty20 ?? 0) +
      (log.empty40 ?? 0),
    0
  );

  const dangerTotal = logs.reduce(
    (sum, log) =>
      sum +
      (log.danger20 ?? 0) +
      (log.danger40 ?? 0),
    0
  );

  const workDays = logs.filter((log) => {
    const total =
      (log.full20 ?? 0) +
      (log.full40 ?? 0) +
      (log.danger20 ?? 0) +
      (log.danger40 ?? 0) +
      (log.empty20 ?? 0) +
      (log.empty40 ?? 0);

    return total > 0;
  }).length;

  if (loading) {
    return (
      <>
        <Header />

        <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
          불러오는 중...
        </main>
      </>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#080808] px-4 pb-16 pt-24 text-white">
        <div className="mx-auto max-w-lg">

          <div className="mb-6">
            <p className="text-xs font-bold text-orange-500">
              STTP LINK
            </p>

            <h1 className="mt-1 text-2xl font-black">
              내 운행
            </h1>

            {profile.vehicle_number && (
              <p className="mt-2 text-sm text-zinc-400">
                차량번호 {profile.vehicle_number}
              </p>
            )}
          </div>

          <section className="rounded-3xl border border-white/10 bg-zinc-900 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">
                이번 달 운행
              </h2>

              <span className="text-sm text-zinc-500">
                현재까지
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">

              <div className="rounded-2xl bg-zinc-800 p-4">
                <div className="text-sm text-zinc-400">
                  FULL
                </div>

                <div className="mt-1 text-3xl font-black text-orange-500">
                  {fullTotal}
                </div>
              </div>

              <div className="rounded-2xl bg-zinc-800 p-4">
                <div className="text-sm text-zinc-400">
                  EMPTY
                </div>

                <div className="mt-1 text-3xl font-black">
                  {emptyTotal}
                </div>
              </div>

              <div className="rounded-2xl bg-zinc-800 p-4">
                <div className="text-sm text-zinc-400">
                  위험물
                </div>

                <div className="mt-1 text-3xl font-black">
                  {dangerTotal}
                </div>
              </div>

              <div className="rounded-2xl bg-zinc-800 p-4">
                <div className="text-sm text-zinc-400">
                  일한 날
                </div>

                <div className="mt-1 text-3xl font-black">
                  {workDays}
                  <span className="ml-1 text-base text-zinc-400">
                    일
                  </span>
                </div>
              </div>

            </div>
          </section>

          <section className="mt-4 grid grid-cols-2 gap-3">

            <Link
              href="/daily"
              className="rounded-2xl border border-white/10 bg-zinc-900 p-5 transition hover:border-orange-500"
            >
              <div className="text-3xl">📊</div>

              <div className="mt-3 text-lg font-black">
                오늘 운행
              </div>

              <div className="mt-1 text-sm text-zinc-400">
                오늘 기록하기
              </div>
            </Link>

            <Link
  href="/terminal"
  className="rounded-2xl border border-white/10 bg-zinc-900 p-5 transition hover:border-orange-500"
>
  <div className="text-3xl">⚓</div>

  <div className="mt-3 text-lg font-black">
    터미널 정보
  </div>

  <div className="mt-1 text-sm text-zinc-400">
    GWCT · 허치슨
  </div>
</Link>

            <Link
  href="/maintenance"
  className="rounded-2xl border border-white/10 bg-zinc-900 p-5 transition hover:border-orange-500"
>
  <div className="text-3xl">🔧</div>

  <div className="mt-3 text-lg font-black">
    차량 관리
  </div>

  <div className="mt-1 text-sm text-zinc-400">
    고장 · 수리 · 정비
  </div>
</Link>

            <Link
              href="/orders"
              className="rounded-2xl border border-white/10 bg-zinc-900 p-5 transition hover:border-orange-500"
            >
              <div className="text-3xl">🚛</div>

              <div className="mt-3 text-lg font-black">
                알바 찾기
              </div>

              <div className="mt-1 text-sm text-zinc-400">
                남는 시간 일거리
              </div>
            </Link>

          </section>

          <section className="mt-4 rounded-2xl border border-white/10 bg-zinc-900 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-black">
                최근 운행
              </h2>

              <Link
                href="/daily"
                className="text-sm font-bold text-orange-500"
              >
                날짜별 보기
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {logs.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  이번 달 운행 기록이 없습니다.
                </p>
              ) : (
                logs.slice(0, 5).map((log) => (
                  <div
                    key={log.work_date}
                    className="border-b border-white/5 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="font-bold">
                      {log.work_date}
                    </div>

                    <div className="mt-1 text-sm text-zinc-400">
                      FULL{" "}
                      {(log.full20 ?? 0) +
                        (log.full40 ?? 0) +
                        (log.danger20 ?? 0) +
                        (log.danger40 ?? 0)}
                      {" · "}
                      EMPTY{" "}
                      {(log.empty20 ?? 0) +
                        (log.empty40 ?? 0)}
                      {" · "}
                      위험물{" "}
                      {(log.danger20 ?? 0) +
                        (log.danger40 ?? 0)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <button
            type="button"
            onClick={() =>
              router.push("/driver/profile?mode=edit")
            }
            className="mt-4 h-14 w-full rounded-2xl border border-white/15 text-sm font-bold text-zinc-300"
          >
            내 차량정보 수정
          </button>

        </div>
      </main>

      <Footer />
    </>
  );
}