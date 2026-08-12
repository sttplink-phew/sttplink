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
      sum + (log.empty20 ?? 0) + (log.empty40 ?? 0),
    0
  );

  const dangerTotal = logs.reduce(
    (sum, log) =>
      sum + (log.danger20 ?? 0) + (log.danger40 ?? 0),
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

          {/* 내 정보 */}
          <section className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-500">
                  STTP LINK
                </p>

                <h1 className="mt-1 text-xl font-black">
                  {profile.vehicle_number
                    ? `${profile.vehicle_number.slice(-4)}님`
                    : "내 정보"}
                </h1>

                {profile.vehicle_number && (
                  <p className="mt-1 text-sm text-zinc-400">
                    {profile.vehicle_number}
                  </p>
                )}
              </div>

              <Link
                href="/"
                className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-zinc-300"
              >
                홈
              </Link>
            </div>
          </section>

          {/* 이번 달 예상금액 */}
          <section className="mt-3 rounded-2xl border border-orange-500/20 bg-zinc-900 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-zinc-400">
                  이번 달 예상금액
                </p>

                <div className="mt-2 text-3xl font-black text-orange-500">
                  -
                  <span className="ml-1 text-base text-zinc-400">
                    원
                  </span>
                </div>
              </div>

              <span className="rounded-lg bg-orange-500/10 px-2 py-1 text-xs font-bold text-orange-400">
                예상
              </span>
            </div>

            <p className="mt-3 text-xs text-zinc-500">
              노선별 단가표를 등록하면 운행기록을 기준으로 자동 계산됩니다.
            </p>
          </section>

          {/* 이번 달 운행 실적 */}
          <section className="mt-3 rounded-2xl border border-white/10 bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black">이번 달 운행 실적</h2>
              <span className="text-xs text-zinc-500">현재까지</span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-zinc-800 p-3">
                <div className="text-xs text-zinc-400">FULL</div>
                <div className="mt-1 text-2xl font-black text-orange-500">
                  {fullTotal}
                </div>
              </div>

              <div className="rounded-xl bg-zinc-800 p-3">
                <div className="text-xs text-zinc-400">EMPTY</div>
                <div className="mt-1 text-2xl font-black">
                  {emptyTotal}
                </div>
              </div>

              <div className="rounded-xl bg-zinc-800 p-3">
                <div className="text-xs text-zinc-400">일한 날</div>
                <div className="mt-1 text-2xl font-black">
                  {workDays}
                  <span className="ml-1 text-xs text-zinc-400">일</span>
                </div>
              </div>
            </div>

            <div className="mt-2 rounded-xl bg-zinc-800/70 px-3 py-2">
              <span className="text-xs text-zinc-400">위험물</span>
              <span className="ml-2 font-black">{dangerTotal}</span>
            </div>
          </section>

          {/* 노선별 상세 */}
          <section className="mt-3 rounded-2xl border border-white/10 bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black">노선별 운행 상세</h2>
              <span className="text-xs text-zinc-500">이번 달</span>
            </div>

            <div className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-center">
              <p className="text-sm text-zinc-400">
                노선별 FULL · EMPTY · 20FT · 40FT
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                운행일지 데이터 연결 예정
              </p>
            </div>
          </section>

          {/* 개인 관리 */}
          <section className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-2xl border border-white/10 bg-zinc-900 p-4 text-left"
            >
              <div className="text-2xl">₩</div>
              <div className="mt-3 font-black">단가표 관리</div>
              <div className="mt-1 text-xs text-zinc-500">
                노선별 운송단가
              </div>
            </button>

            <button
              type="button"
              className="rounded-2xl border border-white/10 bg-zinc-900 p-4 text-left"
            >
              <div className="text-2xl">📅</div>
              <div className="mt-3 font-black">월별 정산</div>
              <div className="mt-1 text-xs text-zinc-500">
                월별 운행 · 예상금액
              </div>
            </button>

            <button
              type="button"
              onClick={() => router.push("/driver/profile?mode=edit")}
              className="rounded-2xl border border-white/10 bg-zinc-900 p-4 text-left"
            >
              <div className="text-2xl">🚛</div>
              <div className="mt-3 font-black">차량 정보</div>
              <div className="mt-1 text-xs text-zinc-500">
                차량 · 운송차주 정보
              </div>
            </button>

            <button
              type="button"
              className="rounded-2xl border border-white/10 bg-zinc-900 p-4 text-left"
            >
              <div className="text-2xl">🛣️</div>
              <div className="mt-3 font-black">노선 관리</div>
              <div className="mt-1 text-xs text-zinc-500">
                내 운행노선 설정
              </div>
            </button>
          </section>

          {/* 최근 운행 */}
          <section className="mt-3 rounded-2xl border border-white/10 bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black">최근 운행</h2>

              <Link
                href="/daily"
                className="text-xs font-bold text-orange-500"
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
                    <div className="text-sm font-bold">
                      {log.work_date}
                    </div>

                    <div className="mt-1 text-xs text-zinc-400">
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
        </div>
      </main>

      <Footer />
    </>
  );
}