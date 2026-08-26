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
  rank: number | null;
};

type TripLogRow = {
  work_date: string;
  direction: string;
};

type RecentDaySummary = {
  workDate: string;
  inbound: number;
  outbound: number;
};

function formatMonthLabel() {
  const now = new Date();
  return `${now.getMonth() + 1}월`;
}

function getMonthRange() {
  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
  };

  return {
    monthStart: formatDate(start),
    nextMonthStart: formatDate(end),
  };
}

export default function DriverMyPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [recentDays, setRecentDays] = useState<RecentDaySummary[]>([]);
  const [inTotal, setInTotal] = useState(0);
  const [outTotal, setOutTotal] = useState(0);
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
        .select("id, user_id, vehicle_number, rank")
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

      const { monthStart, nextMonthStart } = getMonthRange();

      const { data: tripRows, error: tripError } = await supabase
        .from("trip_logs")
        .select("work_date, direction")
        .eq("user_id", user.id)
        .gte("work_date", monthStart)
        .lt("work_date", nextMonthStart)
        .order("work_date", { ascending: false });

      if (tripError) {
        console.error("월간 운행일지 조회 실패:", tripError);
        setLoading(false);
        return;
      }

      const rows = (tripRows ?? []) as TripLogRow[];

      let inboundTotal = 0;
      let outboundTotal = 0;

      const dayMap = new Map<string, RecentDaySummary>();

      rows.forEach((row) => {
        const direction = row.direction?.toUpperCase();

        if (direction === "IN") {
          inboundTotal += 1;
        }

        if (direction === "OUT") {
          outboundTotal += 1;
        }

        const current = dayMap.get(row.work_date) ?? {
          workDate: row.work_date,
          inbound: 0,
          outbound: 0,
        };

        if (direction === "IN") {
          current.inbound += 1;
        }

        if (direction === "OUT") {
          current.outbound += 1;
        }

        dayMap.set(row.work_date, current);
      });

      const sortedRecentDays = Array.from(dayMap.values())
        .sort((a, b) => b.workDate.localeCompare(a.workDate))
        .slice(0, 5);

      setInTotal(inboundTotal);
      setOutTotal(outboundTotal);
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

  const totalTrips = inTotal + outTotal;

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

                <p className="mt-1 text-xs text-zinc-500">
                  회원등급 {profile.rank ?? 1}
                </p>
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
                <div className="text-xs text-zinc-400">반입</div>
                <div className="mt-1 text-2xl font-black text-orange-500">
                  {inTotal}
                </div>
              </div>

              <div className="rounded-xl bg-zinc-800 p-3">
                <div className="text-xs text-zinc-400">반출</div>
                <div className="mt-1 text-2xl font-black">
                  {outTotal}
                </div>
              </div>

              <div className="rounded-xl bg-zinc-800 p-3">
                <div className="text-xs text-zinc-400">총 운행</div>
                <div className="mt-1 text-2xl font-black">
                  {totalTrips}
                </div>
              </div>
            </div>
          </section>

          {/* 최근 운행 */}
          <section className="mt-3 rounded-2xl border border-white/10 bg-zinc-900 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="font-black">최근 운행</h2>

              <Link
                href="/daily"
                className="text-xs font-bold text-orange-500"
              >
                운행일지 보기
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
                      반입 {day.inbound}
                      {" · "}
                      반출 {day.outbound}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <p className="mt-4 px-1 text-center text-[11px] leading-5 text-zinc-600">
            운행 통계는 정상 반입·반출로 저장된 운행일지를 기준으로 표시됩니다.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}