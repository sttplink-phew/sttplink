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

type RouteLogValue = {
  full20?: number;
  full40?: number;
  fullOther?: number;
  empty20?: number;
  empty40?: number;
  emptyOther?: number;
};

type DailyRouteLogRow = {
  work_date: string;
  route_logs: Record<string, RouteLogValue> | null;
};

type RouteSummary = {
  routeId: string;
  title: string;
  full20: number;
  full40: number;
  fullOther: number;
  empty20: number;
  empty40: number;
  emptyOther: number;
};

type RecentDaySummary = {
  workDate: string;
  full: number;
  empty: number;
};

function sumFull(log: RouteLogValue) {
  return (
    (log.full20 ?? 0) +
    (log.full40 ?? 0) +
    (log.fullOther ?? 0)
  );
}

function sumEmpty(log: RouteLogValue) {
  return (
    (log.empty20 ?? 0) +
    (log.empty40 ?? 0) +
    (log.emptyOther ?? 0)
  );
}

function formatMonthLabel() {
  const now = new Date();
  return `${now.getMonth() + 1}월`;
}

export default function DriverMyPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [routeSummaries, setRouteSummaries] = useState<RouteSummary[]>([]);
  const [recentDays, setRecentDays] = useState<RecentDaySummary[]>([]);
  const [fullTotal, setFullTotal] = useState(0);
  const [emptyTotal, setEmptyTotal] = useState(0);
  const [workDays, setWorkDays] = useState(0);
  const [loading, setLoading] = useState(true);

  const monthLabel = formatMonthLabel();

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
        console.error("내정보 차량 조회 실패:", driverError);
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

      const [{ data: routeRows, error: routeError }, { data: monthRows, error: logError }] =
        await Promise.all([
          supabase
            .from("driver_routes")
            .select("id, title")
            .eq("user_id", user.id),
          supabase
            .from("daily_route_logs")
            .select("work_date, route_logs")
            .eq("user_id", user.id)
            .gte("work_date", monthStart)
            .order("work_date", { ascending: false }),
        ]);

      if (routeError) {
        console.error("노선 조회 실패:", routeError);
      }

      if (logError) {
        console.error("월간 운행일지 조회 실패:", logError);
        setLoading(false);
        return;
      }

      const routeTitleMap = new Map<string, string>(
        (routeRows ?? []).map((route) => [
          String(route.id),
          route.title || "노선",
        ])
      );

      const summaryMap = new Map<string, RouteSummary>();
      const daySummaryMap = new Map<string, RecentDaySummary>();

      let monthFull = 0;
      let monthEmpty = 0;
      let workedDayCount = 0;

      (monthRows ?? []).forEach((row: DailyRouteLogRow) => {
        const routeLogs = row.route_logs ?? {};
        let dayFull = 0;
        let dayEmpty = 0;

        Object.entries(routeLogs).forEach(([routeId, log]) => {
          const full = sumFull(log);
          const empty = sumEmpty(log);

          dayFull += full;
          dayEmpty += empty;
          monthFull += full;
          monthEmpty += empty;

          const title = routeTitleMap.get(routeId) ?? "노선";

          const existing = summaryMap.get(routeId) ?? {
            routeId,
            title,
            full20: 0,
            full40: 0,
            fullOther: 0,
            empty20: 0,
            empty40: 0,
            emptyOther: 0,
          };

          existing.full20 += log.full20 ?? 0;
          existing.full40 += log.full40 ?? 0;
          existing.fullOther += log.fullOther ?? 0;
          existing.empty20 += log.empty20 ?? 0;
          existing.empty40 += log.empty40 ?? 0;
          existing.emptyOther += log.emptyOther ?? 0;

          summaryMap.set(routeId, existing);
        });

        if (dayFull > 0 || dayEmpty > 0) {
          workedDayCount += 1;

          daySummaryMap.set(row.work_date, {
            workDate: row.work_date,
            full: dayFull,
            empty: dayEmpty,
          });
        }
      });

      const sortedRouteSummaries = Array.from(summaryMap.values()).sort(
        (a, b) => {
          const aTotal =
            a.full20 +
            a.full40 +
            a.fullOther +
            a.empty20 +
            a.empty40 +
            a.emptyOther;

          const bTotal =
            b.full20 +
            b.full40 +
            b.fullOther +
            b.empty20 +
            b.empty40 +
            b.emptyOther;

          return bTotal - aTotal;
        }
      );

      const sortedRecentDays = Array.from(daySummaryMap.values())
        .sort((a, b) => b.workDate.localeCompare(a.workDate))
        .slice(0, 5);

      setFullTotal(monthFull);
      setEmptyTotal(monthEmpty);
      setWorkDays(workedDayCount);
      setRouteSummaries(sortedRouteSummaries);
      setRecentDays(sortedRecentDays);
      setLoading(false);
    }

    loadMyPage();
  }, [router, supabase]);

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

      <main className="min-h-screen overflow-x-hidden bg-[#080808] px-4 pb-16 pt-24 text-white">
        <div className="mx-auto w-full max-w-lg">
          {/* 내 정보 */}
          <section className="rounded-2xl border border-white/10 bg-zinc-900 p-4 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold text-orange-500">
                  STTP LINK
                </p>

                <h1 className="mt-1 truncate text-xl font-black">
                  {profile.vehicle_number
                    ? `${profile.vehicle_number.slice(-4)}님`
                    : "내 정보"}
                </h1>

                {profile.vehicle_number && (
                  <p className="mt-1 truncate text-sm text-zinc-400">
                    {profile.vehicle_number}
                  </p>
                )}
              </div>

              <Link
                href="/"
                className="shrink-0 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-zinc-300 transition active:scale-95"
              >
                홈
              </Link>
            </div>
          </section>

          {/* 이번 달 운행 종합 */}
          <section className="mt-3 rounded-2xl border border-orange-500/20 bg-zinc-900 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-500">
                  {monthLabel} 운행
                </p>
                <h2 className="mt-1 text-lg font-black">
                  이번 달 운행 종합
                </h2>
              </div>

              <span className="rounded-lg bg-orange-500/10 px-2 py-1 text-xs font-bold text-orange-400">
                현재까지
              </span>
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
          </section>

          {/* 노선별 상세 */}
          <section className="mt-3 rounded-2xl border border-white/10 bg-zinc-900 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="font-black">노선별 운행 상세</h2>
              <span className="text-xs text-zinc-500">{monthLabel}</span>
            </div>

            {routeSummaries.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-white/10 p-5 text-center">
                <p className="text-sm text-zinc-400">
                  이번 달 운행 기록이 없습니다.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {routeSummaries.map((route) => {
                  const routeFull =
                    route.full20 + route.full40 + route.fullOther;

                  const routeEmpty =
                    route.empty20 + route.empty40 + route.emptyOther;

                  return (
                    <div
                      key={route.routeId}
                      className="rounded-2xl border border-white/10 bg-zinc-800/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="truncate font-black text-white">
                          {route.title}
                        </h3>

                        <span className="shrink-0 text-xs font-bold text-zinc-500">
                          총 {routeFull + routeEmpty}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2">
                        <div className="rounded-xl bg-zinc-900/80 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-orange-400">
                              FULL
                            </span>
                            <span className="text-lg font-black text-orange-500">
                              {routeFull}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400">
                            <span>20FT {route.full20}</span>
                            <span>40FT {route.full40}</span>
                            {route.fullOther > 0 && (
                              <span>기타 {route.fullOther}</span>
                            )}
                          </div>
                        </div>

                        <div className="rounded-xl bg-zinc-900/80 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-300">
                              EMPTY
                            </span>
                            <span className="text-lg font-black">
                              {routeEmpty}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400">
                            <span>20FT {route.empty20}</span>
                            <span>40FT {route.empty40}</span>
                            {route.emptyOther > 0 && (
                              <span>기타 {route.emptyOther}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 개인 관리 */}
          <section className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/driver/ledger"
              className="min-h-[132px] rounded-2xl border border-white/10 bg-zinc-900 p-4 text-left shadow-lg transition hover:border-orange-500 active:scale-[0.98]"
            >
              <div className="text-2xl">₩</div>
              <div className="mt-3 font-black">내 차계부</div>
              <div className="mt-1 text-xs leading-5 text-zinc-500">
                고정지출 · 출금일 · 잔여개월
              </div>
            </Link>

            <Link
              href="/driver/documents"
              className="min-h-[132px] rounded-2xl border border-white/10 bg-zinc-900 p-4 text-left shadow-lg transition hover:border-orange-500 active:scale-[0.98]"
            >
              <div className="text-2xl">📁</div>
              <div className="mt-3 font-black">내 서류함</div>
              <div className="mt-1 text-xs leading-5 text-zinc-500">
                차량 · 트레일러 · 사업자 서류
              </div>
            </Link>
          </section>

          {/* 최근 운행 */}
          <section className="mt-3 rounded-2xl border border-white/10 bg-zinc-900 p-4 shadow-lg">
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
              {recentDays.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  이번 달 운행 기록이 없습니다.
                </p>
              ) : (
                recentDays.map((day) => (
                  <div
                    key={day.workDate}
                    className="border-b border-white/5 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="text-sm font-bold">
                      {day.workDate}
                    </div>

                    <div className="mt-1 text-xs text-zinc-400">
                      FULL {day.full}
                      {" · "}
                      EMPTY {day.empty}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <p className="mt-4 px-1 text-center text-[11px] leading-5 text-zinc-600">
            월간 운행 종합은 현재 저장된 운행일지 기록을 기준으로 표시됩니다.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}