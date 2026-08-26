"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/client";

type TripLog = {
  id: string;
  direction: "IN" | "OUT";
  container_size: number | null;
};

export default function HomePage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [loggedIn, setLoggedIn] =
    useState(false);

  const [
    vehicleNumber,
    setVehicleNumber,
  ] = useState("");

  const [todayLogs, setTodayLogs] =
    useState<TripLog[]>([]);

  const [loading, setLoading] =
    useState(true);

  // =====================================
  // 오늘 날짜
  // =====================================

  function getToday() {
    const now = new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        now.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // =====================================
  // 메인 정보
  // =====================================

  useEffect(() => {
    async function loadHome() {
      setLoading(true);

      try {
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!user) {
          setLoggedIn(false);
          setVehicleNumber("");
          setTodayLogs([]);
        } else {
          setLoggedIn(true);

          // -----------------------------
          // 차량번호
          // -----------------------------

          const {
            data: driver,
          } = await supabase
            .from("drivers")
            .select(
              "vehicle_number"
            )
            .eq(
              "user_id",
              user.id
            )
            .maybeSingle();

          setVehicleNumber(
            driver?.vehicle_number ??
              ""
          );

          // -----------------------------
          // 오늘 운행
          // trip_logs 기준
          // -----------------------------

          const {
            data: logs,
            error: logError,
          } = await supabase
            .from("trip_logs")
            .select(
              "id, direction, container_size"
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "work_date",
              getToday()
            )
            .order(
              "created_at",
              {
                ascending: true,
              }
            );

          if (logError) {
            console.error(
              "메인 운행일지 조회 실패:",
              logError
            );

            setTodayLogs([]);
          } else {
            setTodayLogs(
              (logs ??
                []) as TripLog[]
            );
          }
        }

      } finally {
        setLoading(false);
      }
    }

    loadHome();
  }, [supabase]);

  // =====================================
  // 오늘 집계
  // =====================================

  const inboundCount =
    todayLogs.filter(
      (log) =>
        log.direction === "IN"
    ).length;

  const outboundCount =
    todayLogs.filter(
      (log) =>
        log.direction === "OUT"
    ).length;

  const size20Count =
    todayLogs.filter(
      (log) =>
        log.container_size ===
        20
    ).length;

  const size40Count =
    todayLogs.filter(
      (log) =>
        log.container_size ===
        40
    ).length;

  return (
    <>
      <Header />

      <main
        className="min-h-screen overflow-x-hidden bg-zinc-950 bg-cover bg-center bg-no-repeat text-white"
        style={{
          backgroundImage:
            "url('/hero-truck.png')",
        }}
      >
        <div className="min-h-screen bg-black/75">
          <section className="px-4 pb-16 pt-24 sm:px-6 sm:pt-28">
            <div className="mx-auto w-full max-w-xl">
              {/* ================================= */}
              {/* 사용자 */}
              {/* ================================= */}

              <div className="mb-5">
                <div className="text-xs font-black tracking-widest text-orange-500">
                  STTP LINK
                </div>

                <h1 className="mt-1 text-3xl font-black">
                  오늘의 운행
                </h1>

                <div className="mt-2 text-sm font-bold text-zinc-400">
                  {loading
                    ? "정보 확인 중..."
                    : loggedIn
                      ? vehicleNumber
                        ? `내 차량 ${vehicleNumber}`
                        : "차량정보 등록 필요"
                      : "로그인 후 이용할 수 있습니다."}
                </div>
              </div>

              {/* ================================= */}
              {/* 터미널 정보 - 메인 핵심 */}
              {/* ================================= */}

              <Link
                href="/terminal"
                className="block rounded-3xl border border-orange-500/40 bg-black/80 p-6 shadow-2xl backdrop-blur-md transition active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-4xl">
                      ⚓
                    </div>

                    <div className="mt-4 text-3xl font-black">
                      터미널 정보
                    </div>

                    <div className="mt-2 text-sm font-bold leading-6 text-zinc-400">
                      대통(GWCT) · 국제(KITL)
                    </div>
                  </div>

                  <div className="rounded-full bg-orange-600 px-4 py-2 text-sm font-black">
                    조회
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-zinc-900/90 p-4">
                  <div className="text-sm font-black text-orange-400">
                    배차 · 게이트 작업정보
                  </div>

                  <div className="mt-1 text-sm leading-6 text-zinc-400">
                    차량번호로 터미널 정보를 조회하고
                    정상 반입·반출을 운행일지에 바로 저장합니다.
                  </div>
                </div>
              </Link>

              {/* ================================= */}
              {/* 운행일지 + 차량점검 */}
              {/* ================================= */}

              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* 운행일지 */}

                <Link
                  href="/daily"
                  className="rounded-2xl border border-white/10 bg-zinc-900/95 p-5 transition active:scale-[0.99]"
                >
                  <div className="text-3xl">
                    📊
                  </div>

                  <div className="mt-3 text-xl font-black">
                    운행일지
                  </div>

                  {loggedIn ? (
                    <div className="mt-3 space-y-1 text-sm font-bold text-zinc-400">
                      <div>
                        오늘 총{" "}
                        <span className="text-white">
                          {
                            todayLogs.length
                          }
                        </span>
                        건
                      </div>

                      <div>
                        반입{" "}
                        <span className="text-orange-400">
                          {
                            inboundCount
                          }
                        </span>
                        {" · "}
                        반출{" "}
                        <span className="text-blue-400">
                          {
                            outboundCount
                          }
                        </span>
                      </div>

                      <div className="text-xs text-zinc-600">
                        20FT{" "}
                        {
                          size20Count
                        }
                        건 · 40FT{" "}
                        {
                          size40Count
                        }
                        건
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-zinc-500">
                      로그인 필요
                    </div>
                  )}
                </Link>

                {/* 차량 점검 */}

                <Link
                  href="/inspection"
                  className="rounded-2xl border border-white/10 bg-zinc-900/95 p-5 transition active:scale-[0.99]"
                >
                  <div className="text-3xl">
                    ✅
                  </div>

                  <div className="mt-3 text-xl font-black">
                    차량점검
                  </div>

                  <div className="mt-3 text-sm font-bold leading-6 text-zinc-400">
                    일일 점검표
                  </div>

                  <div className="text-xs leading-5 text-zinc-600">
                    월간 체크 · 점검표 확인
                  </div>
                </Link>
              </div>

              {/* ================================= */}
              {/* 게시판 */}
              {/* ================================= */}

              <Link
                href="/board"
                className="mt-6 block rounded-2xl border border-white/10 bg-zinc-950/90 p-5 backdrop-blur transition active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-zinc-500">
                      COMMUNITY
                    </div>

                    <div className="mt-1 text-xl font-black">
                      게시판
                    </div>

                    <div className="mt-2 text-sm text-zinc-500">
                      공지 · 정보 공유
                    </div>
                  </div>

                  <div className="text-2xl text-orange-500">
                    ›
                  </div>
                </div>
              </Link>

              {/* ================================= */}
              {/* 단순 안내 */}
              {/* ================================= */}

              <div className="mt-6 text-center text-xs leading-5 text-zinc-700">
                터미널 조회 · 운행일지 · 차량점검
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}