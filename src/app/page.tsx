"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/client";

type TripLog = {
  id: string;
  direction: "IN" | "OUT";
  container_size: number | null;
  container_status: string | null;
};

type TerminalItem = {
  type?: string;
  containerNo?: string;

  shippingLine?: string;

  size?: string;
  rawSize?: string;
  fe?: string;

  receivedAt?: string;
  vehicleCardNo?: string;
  waitingCount?: string;

  shippingStatus?: string;
  sizeType?: string;
  sentAt?: string;
  completed?: boolean;

  yardLocation?: string;
  status?: string;
};

type TerminalInfo = {
  ok?: boolean;

  terminal?: string;
  terminalName?: string;

  phase?: string;

  hasInfo?: boolean;
  hasAnyInfo?: boolean;

  message?: string;

  counts?: {
    total?: number;
    active?: number;
    inbound?: number;
    outbound?: number;
  };

  inbound?: TerminalItem[];
  outbound?: TerminalItem[];
  items?: TerminalItem[];
};

type TerminalCode =
  | "GWCT"
  | "KITL"
  | null;

export default function HomePage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  // =====================================
  // 로그인 / 차량
  // =====================================

  const [
    loggedIn,
    setLoggedIn,
  ] = useState(false);

  const [
    vehicleNumber,
    setVehicleNumber,
  ] = useState("");

  const [
    todayLogs,
    setTodayLogs,
  ] = useState<TripLog[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  // =====================================
  // 1차 터미널 조회
  // =====================================

  const [
    gwctInfo,
    setGwctInfo,
  ] = useState<TerminalInfo | null>(
    null
  );

  const [
    kitlInfo,
    setKitlInfo,
  ] = useState<TerminalInfo | null>(
    null
  );

  const [
    terminalPolling,
    setTerminalPolling,
  ] = useState(false);

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
          // -----------------------------

          const {
            data: logs,
            error: logError,
          } = await supabase
            .from("trip_logs")
            .select(
              "id, direction, container_size, container_status"
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
  // 차량번호 뒤 4자리
  // =====================================

  function getTruckNo() {
    const truckNo =
      vehicleNumber.slice(-4);

    if (!/^\d{4}$/.test(truckNo)) {
      return null;
    }

    return truckNo;
  }

  // =====================================
  // 공통 터미널 조회
  // =====================================

  async function fetchTerminal(
    terminal: "GWCT" | "KITL"
  ): Promise<TerminalInfo | null> {
    const truckNo =
      getTruckNo();

    if (!truckNo) {
      return null;
    }

    const endpoint =
      terminal === "GWCT"
        ? "/api/terminal/gwct"
        : "/api/terminal/kitl";

    try {
      const response =
        await fetch(endpoint, {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            truckNo,
            phase: "pre",
          }),
        });

      const data: TerminalInfo =
        await response.json();

      return data;
    } catch (error) {
      console.error(
        `${terminal} 조회 실패:`,
        error
      );

      return null;
    }
  }

  // =====================================
  // 1차 조회
  // 대통 + 국제 동시
  // =====================================

  async function checkFirstInfo() {
    const truckNo =
      getTruckNo();

    if (!truckNo) {
      return false;
    }

    const [gwct, kitl] =
      await Promise.all([
        fetchTerminal("GWCT"),
        fetchTerminal("KITL"),
      ]);

    if (gwct) {
      setGwctInfo(gwct);

      localStorage.setItem(
        "latestGwctInfo",
        JSON.stringify(gwct)
      );
    }

    if (kitl) {
      setKitlInfo(kitl);

      localStorage.setItem(
        "latestKitlInfo",
        JSON.stringify(kitl)
      );
    }

    localStorage.setItem(
      "latestTerminalCheckedAt",
      new Date().toISOString()
    );

    const foundInfo =
      Boolean(gwct?.hasInfo) ||
      Boolean(kitl?.hasInfo);

    if (foundInfo) {
      setTerminalPolling(false);
    }

    return foundInfo;
  }

  // =====================================
  // 30초 자동 재조회
  // =====================================

  useEffect(() => {
    if (
      !terminalPolling ||
      !vehicleNumber
    ) {
      return;
    }

    let cancelled = false;
    let running = false;

    async function run() {
      if (running) {
        return;
      }

      running = true;

      try {
        const foundInfo =
          await checkFirstInfo();

        if (
          !cancelled &&
          foundInfo
        ) {
          setTerminalPolling(false);
        }
      } finally {
        running = false;
      }
    }

    // 시작 즉시 1회
    run();

    const timer =
      setInterval(() => {
        run();
      }, 30000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [
    terminalPolling,
    vehicleNumber,
  ]);

  // =====================================
  // 조회 시작 / 중지
  // =====================================

  function togglePolling() {
    if (terminalPolling) {
      setTerminalPolling(false);
      return;
    }

    const truckNo =
      getTruckNo();

    if (!truckNo) {
      alert(
        "차량번호 뒤 4자리를 확인해주세요."
      );

      return;
    }

    // 새 조회
    setGwctInfo(null);
    setKitlInfo(null);

    setTerminalPolling(true);
  }

  // =====================================
  // 1차 결과 터미널
  // =====================================

  const firstTerminal:
    TerminalCode =
      gwctInfo?.hasInfo
        ? "GWCT"
        : kitlInfo?.hasInfo
          ? "KITL"
          : null;

  // =====================================
  // 1차 결과 작업정보
  // =====================================

  function pickFirstItem(
    info: TerminalInfo | null
  ) {
    if (!info) {
      return null;
    }

    const items = [
      ...(info.inbound ?? []),
      ...(info.outbound ?? []),
      ...(info.items ?? []),
    ];

    if (items.length === 0) {
      return null;
    }

    const activeItem =
      items.find(
        (item) =>
          item.completed !== true
      );

    return activeItem ?? items[0];
  }

  const firstInfo =
    firstTerminal === "GWCT"
      ? gwctInfo
      : firstTerminal === "KITL"
        ? kitlInfo
        : null;

  const firstItem =
    pickFirstItem(firstInfo);

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

  const fullCount =
    todayLogs.filter(
      (log) =>
        log.container_status ===
        "FULL"
    ).length;

  const emptyCount =
    todayLogs.filter(
      (log) =>
        log.container_status ===
        "EMPTY"
    ).length;

  // =====================================
  // 화면
  // =====================================

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
              {/* 터미널 정보 - 1차 조회 */}
              {/* ================================= */}

              <section className="rounded-3xl border border-orange-500/40 bg-black/80 p-6 shadow-2xl backdrop-blur-md">

              <div>
  <div className="text-4xl">
    ⚓
  </div>

  <div className="mt-4 text-3xl font-black">
    터미널 정보
  </div>

  <div className="mt-3 text-lg font-black text-orange-400">
    대통 · 국제 동시 조회
  </div>

  <div className="mt-1 text-sm font-bold leading-6 text-zinc-400">
    게이트 진입 전 두 터미널의 배차정보를 동시에 확인합니다.
  </div>
</div>

                {/* 조회버튼 */}

                <button
  type="button"
  onClick={togglePolling}
  disabled={
    loading ||
    !loggedIn ||
    !vehicleNumber ||
    Boolean(gwctInfo?.hasInfo) ||
    Boolean(kitlInfo?.hasInfo)
  }
  className={`mt-6 h-16 w-full rounded-2xl text-lg font-black transition active:scale-[0.99] ${
    terminalPolling ||
    Boolean(gwctInfo?.hasInfo) ||
    Boolean(kitlInfo?.hasInfo)
      ? "bg-zinc-700 text-zinc-300"
      : "bg-orange-600 text-white"
  }`}
>
  {gwctInfo?.hasInfo || kitlInfo?.hasInfo
    ? "배차정보 확인됨"
    : terminalPolling
      ? "조회 중지"
      : "정보 조회 시작"}
</button>
                {/* 조회중 */}

                {terminalPolling && (
                  <div className="mt-3 text-center text-sm font-bold text-orange-400">
                    정보 없음 · 30초 자동 재조회 중
                  </div>
                )}

                {/* ================================= */}
                {/* 조회 전 */}
                {/* ================================= */}

                {!terminalPolling &&
                  !gwctInfo &&
                  !kitlInfo && (
                    <div className="mt-5 rounded-2xl bg-zinc-900/90 p-4">
                      <div className="text-sm font-black text-orange-400">
                        배차정보 조회
                      </div>

                      <div className="mt-1 text-sm leading-6 text-zinc-500">
                        대통과 국제를 동시에 조회합니다.
                        정보가 없으면 30초마다 자동으로
                        다시 조회합니다.
                      </div>
                    </div>
                  )}

                {/* ================================= */}
                {/* 조회 완료 - 정보 없음 */}
                {/* ================================= */}

                {!terminalPolling &&
                  (gwctInfo ||
                    kitlInfo) &&
                  !firstTerminal && (
                    <div className="mt-5 rounded-2xl bg-zinc-900 p-4 text-center">
                      <div className="font-black text-zinc-400">
                        현재 배차정보가 없습니다.
                      </div>

                      <div className="mt-1 text-xs text-zinc-600">
                        다시 조회하려면 정보 조회 시작을 누르세요.
                      </div>
                    </div>
                  )}

                {/* ================================= */}
                {/* 배차 결과 */}
                {/* ================================= */}

                {firstTerminal &&
                  firstItem && (
                    <div className="mt-5 space-y-4">

                      <div className="rounded-2xl border border-orange-500/30 bg-zinc-950 p-5">

                        <div className="text-xs font-black text-orange-400">
                          배차 확인
                        </div>

                        <div className="mt-2 text-2xl font-black tracking-wide">
                          {firstItem.containerNo ||
                            "-"}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <div className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-black">
                            {firstItem.fe ||
                              "-"}
                          </div>

                          <div className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-black">
                            {firstItem.type ||
                              "-"}
                          </div>

                          <div className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-black">
                            {firstItem.size
                              ? `${firstItem.size}FT`
                              : firstItem.sizeType ||
                                firstItem.rawSize ||
                                "-"}
                          </div>
                        </div>
                      </div>

                      <div className="text-center text-sm font-black text-orange-400">
                        게이트 통과 후 조회시작
                      </div>

                      {/* 터미널 버튼 */}

                      <div className="grid grid-cols-2 gap-3">

                        {firstTerminal ===
                        "GWCT" ? (
                          <Link
                            href="/terminal?terminal=GWCT"
                            className="flex h-20 items-center justify-center rounded-2xl border border-orange-400 bg-orange-600 text-center text-lg font-black text-white shadow-[0_0_30px_rgba(249,115,22,0.65)] transition active:scale-[0.98]"
                          >
                            <div>
                              <div>
                                대통
                              </div>

                              <div className="mt-1 text-xs opacity-80">
                                GWCT
                              </div>
                            </div>
                          </Link>
                        ) : (
                          <div className="flex h-20 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-center text-lg font-black text-zinc-600">
                            <div>
                              <div>
                                대통
                              </div>

                              <div className="mt-1 text-xs">
                                GWCT
                              </div>
                            </div>
                          </div>
                        )}

                        {firstTerminal ===
                        "KITL" ? (
                          <Link
                            href="/terminal?terminal=KITL"
                            className="flex h-20 items-center justify-center rounded-2xl border border-orange-400 bg-orange-600 text-center text-lg font-black text-white shadow-[0_0_30px_rgba(249,115,22,0.65)] transition active:scale-[0.98]"
                          >
                            <div>
                              <div>
                                국제
                              </div>

                              <div className="mt-1 text-xs opacity-80">
                                KITL
                              </div>
                            </div>
                          </Link>
                        ) : (
                          <div className="flex h-20 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-center text-lg font-black text-zinc-600">
                            <div>
                              <div>
                                국제
                              </div>

                              <div className="mt-1 text-xs">
                                KITL
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* ================================= */}
                {/* 1차 조회 안 하고 바로 2차 */}
                {/* ================================= */}

                {!firstTerminal && (
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <div className="text-center text-sm font-bold leading-5 text-zinc-400">
  이미 게이트를 통과했다면 바로 조회하세요.
</div>

<Link
  href="/terminal"
  className="mt-3 flex h-14 w-full items-center justify-center rounded-xl bg-orange-600 text-base font-black text-white transition active:scale-[0.99]"
>
  게이트 통과 후 직접 조회
</Link>
                  </div>
                )}
              </section>

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

                      <div className="text-xs text-zinc-600">
                        FULL{" "}
                        {
                          fullCount
                        }
                        건 · EMPTY{" "}
                        {
                          emptyCount
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
                    <div className="text-xs font-black text-orange-500">
                      STTP LINK
                    </div>

                    <div className="mt-1 text-xl font-black">
                      소식 및 추천
                    </div>

                    <div className="mt-2 text-sm text-zinc-500">
                      맛집 · 현장 · 자유
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