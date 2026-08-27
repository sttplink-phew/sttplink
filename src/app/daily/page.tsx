"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type TripLog = {
  id: string;
  user_id: string;
  work_date: string;

  terminal: string | null;
  direction: "IN" | "OUT";

  container_no: string | null;
  container_size: number | null;
  container_status: string | null;

  region: string | null;
  region_custom: string | null;

  yard_location: string | null;

  is_dangerous: boolean;
  entry_source: "TERMINAL" | "MANUAL";

  created_at: string;
};

type RegionType =
  | ""
  | "여수"
  | "셔틀"
  | "기타지역";

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthRange(date: string) {
  const [year, month] = date
    .split("-")
    .map(Number);

  const start =
    `${year}-${String(month).padStart(2, "0")}-01`;

  const next =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(
          2,
          "0"
        )}-01`;

  return {
    start,
    next,
  };
}

export default function DailyPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [workDate, setWorkDate] =
    useState(getToday);

  const [dailyLogs, setDailyLogs] =
    useState<TripLog[]>([]);

  const [monthlyLogs, setMonthlyLogs] =
    useState<TripLog[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  // -----------------------------
  // 수기 추가
  // -----------------------------

  const [showManual, setShowManual] =
    useState(false);

  const [manualDirection, setManualDirection] =
    useState<"IN" | "OUT">("IN");

  const [manualSize, setManualSize] =
    useState<20 | 40>(40);

    const [manualContainerStatus, setManualContainerStatus] =
  useState<"FULL" | "EMPTY">("FULL");

  const [manualRegion, setManualRegion] =
    useState<RegionType>("");

  const [
    manualRegionCustom,
    setManualRegionCustom,
  ] = useState("");

  const [
    manualContainerNo,
    setManualContainerNo,
  ] = useState("");

  const [manualSaving, setManualSaving] =
    useState(false);

  // -----------------------------
  // DB 조회
  // -----------------------------

  async function loadLogs() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      setErrorMessage(
        "로그인 정보를 확인할 수 없습니다."
      );
      return;
    }

    const { start, next } =
      getMonthRange(workDate);

    const [
      dailyResult,
      monthlyResult,
    ] = await Promise.all([
      supabase
        .from("trip_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("work_date", workDate)
        .order("created_at", {
          ascending: true,
        }),

      supabase
        .from("trip_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("work_date", start)
        .lt("work_date", next)
        .order("work_date", {
          ascending: true,
        })
        .order("created_at", {
          ascending: true,
        }),
    ]);

    if (dailyResult.error) {
      setLoading(false);
      setErrorMessage(
        `일별 운행 조회 실패: ${dailyResult.error.message}`
      );
      return;
    }

    if (monthlyResult.error) {
      setLoading(false);
      setErrorMessage(
        `월별 운행 조회 실패: ${monthlyResult.error.message}`
      );
      return;
    }

    setDailyLogs(
      (dailyResult.data ?? []) as TripLog[]
    );

    setMonthlyLogs(
      (monthlyResult.data ??
        []) as TripLog[]
    );

    setLoading(false);
  }
  const deleteLog = async (id: string) => {
    const ok = window.confirm("이 운행기록을 삭제할까요?");
    if (!ok) return;
  
    const { error } = await supabase
      .from("trip_logs")
      .delete()
      .eq("id", id);
  
    if (error) {
      alert(`삭제 실패: ${error.message}`);
      return;
    }
  
    await loadLogs();
  };
  useEffect(() => {
    loadLogs();
  }, [workDate]);

  // -----------------------------
  // 당일 집계
  // -----------------------------

  const dailyInbound =
    dailyLogs.filter(
      (log) => log.direction === "IN"
    ).length;

  const dailyOutbound =
    dailyLogs.filter(
      (log) => log.direction === "OUT"
    ).length;

  const daily20 =
    dailyLogs.filter(
      (log) => log.container_size === 20
    ).length;

  const daily40 =
    dailyLogs.filter(
      (log) => log.container_size === 40
    ).length;

    const dailyFull =
  dailyLogs.filter(
    (log) => log.container_status === "FULL"
  ).length;

const dailyEmpty =
  dailyLogs.filter(
    (log) => log.container_status === "EMPTY"
  ).length;

  // -----------------------------
  // 월 집계
  // -----------------------------

  const monthlyInbound =
    monthlyLogs.filter(
      (log) => log.direction === "IN"
    ).length;

  const monthlyOutbound =
    monthlyLogs.filter(
      (log) => log.direction === "OUT"
    ).length;

  const monthly20 =
    monthlyLogs.filter(
      (log) => log.container_size === 20
    ).length;

  const monthly40 =
    monthlyLogs.filter(
      (log) => log.container_size === 40
    ).length;

    const monthlyFull =
    monthlyLogs.filter(
      (log) => log.container_status === "FULL"
    ).length;
  
  const monthlyEmpty =
    monthlyLogs.filter(
      (log) => log.container_status === "EMPTY"
    ).length;

  const monthlyYeosu =
    monthlyLogs.filter(
      (log) => log.region === "여수"
    ).length;

  const monthlyShuttle =
    monthlyLogs.filter(
      (log) => log.region === "셔틀"
    ).length;

  const monthlyOther =
    monthlyLogs.filter(
      (log) => log.region === "기타지역"
    ).length;

  // -----------------------------
  // 수기 운행 추가
  // -----------------------------

  async function updateDriverRank(userId: string) {
    try {
      const { count, error: countError } = await supabase
        .from("trip_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
  
      if (countError) {
        console.error("등급용 운행 건수 조회 실패:", countError);
        return;
      }
  
      const total = count ?? 0;
  
      let nextRank = 1;
  
      if (total >= 60) {
        nextRank = 4;
      } else if (total >= 30) {
        nextRank = 3;
      } else if (total >= 10) {
        nextRank = 2;
      }
  
      const { error: rankError } = await supabase
        .from("drivers")
        .update({ rank: nextRank })
        .eq("user_id", userId);
  
      if (rankError) {
        console.error("회원등급 업데이트 실패:", rankError);
      }
    } catch (error) {
      console.error("회원등급 처리 오류:", error);
    }
  }

  async function saveManualTrip() {
    if (!manualRegion) {
      alert("지역을 선택해주세요.");
      return;
    }

    if (
      manualRegion === "기타지역" &&
      !manualRegionCustom.trim()
    ) {
      alert(
        "기타지역 이름을 입력해주세요."
      );
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    setManualSaving(true);

    const containerNo =
      manualContainerNo
        .trim()
        .toUpperCase() || null;

    const { error } = await supabase
      .from("trip_logs")
      .insert({
        user_id: user.id,
        work_date: workDate,

        terminal: "MANUAL",

        direction:
          manualDirection,

        container_no:
          containerNo,

        container_size:
          manualSize,

          container_status:
         manualContainerStatus,

        region:
          manualRegion,

        region_custom:
          manualRegion === "기타지역"
            ? manualRegionCustom.trim()
            : null,

        yard_location: null,

        is_dangerous: false,

        entry_source: "MANUAL",
      });

    setManualSaving(false);

    if (error) {
      if (error.code === "23505") {
        alert(
          "이미 저장된 운행입니다."
        );
        return;
      }

      alert(
        `운행 추가 실패: ${error.message}`
      );
      return;
    }

    await updateDriverRank(user.id);
    
    setManualDirection("IN");
    setManualSize(40);
    setManualRegion("");
    setManualRegionCustom("");
    setManualContainerNo("");
    setShowManual(false);

    await loadLogs();
  }

  // -----------------------------
  // 표시용
  // -----------------------------

  function getRegionText(log: TripLog) {
    if (log.region === "기타지역") {
      return (
        log.region_custom ||
        "기타지역"
      );
    }

    return log.region || "-";
  }

  return (
    <main className="min-h-screen bg-black px-4 py-7 text-white">
      <div className="mx-auto max-w-xl">
        {/* 헤더 */}

        <header className="flex items-center justify-between">
          <div>
            <div className="text-xs font-black text-orange-500">
              STTP LINK
            </div>

            <h1 className="mt-1 text-3xl font-black">
              운행일지
            </h1>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-zinc-300"
          >
            홈
          </Link>
        </header>

        {/* 날짜 */}

        <section className="mt-6 rounded-2xl border border-white/10 bg-zinc-900 p-5">
          <div className="mb-2 text-sm font-black text-zinc-300">
            운행 날짜
          </div>

          <input
            type="date"
            value={workDate}
            onChange={(event) =>
              setWorkDate(
                event.target.value
              )
            }
            className="h-14 w-full rounded-xl border border-white/10 bg-zinc-800 px-4 text-lg font-black text-white outline-none focus:border-orange-500"
          />
        </section>

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">
            {errorMessage}
          </div>
        )}

        {/* 오늘 집계 */}

        <section className="mt-5">
          <h2 className="mb-3 text-xl font-black">
            오늘 운행
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-orange-500/30 bg-zinc-900 p-5">
              <div className="text-sm font-bold text-zinc-400">
                반입
              </div>

              <div className="mt-2 text-4xl font-black text-orange-400">
                {dailyInbound}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-500/30 bg-zinc-900 p-5">
              <div className="text-sm font-bold text-zinc-400">
                반출
              </div>

              <div className="mt-2 text-4xl font-black text-blue-400">
                {dailyOutbound}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
              <div className="text-sm text-zinc-500">
                20FT
              </div>

              <div className="mt-1 text-2xl font-black">
                {daily20}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
              <div className="text-sm text-zinc-500">
                40FT
              </div>

              <div className="mt-1 text-2xl font-black">
                {daily40}
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
  <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
    <div className="text-sm text-zinc-500">
      FULL
    </div>

    <div className="mt-1 text-2xl font-black">
      {dailyFull}
    </div>
  </div>

  <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
    <div className="text-sm text-zinc-500">
      EMPTY
    </div>

    <div className="mt-1 text-2xl font-black">
      {dailyEmpty}
    </div>
  </div>
</div>
        </section>

        {/* 오늘 상세 */}

        <section className="mt-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">
              운행 기록
            </h2>

            <div className="text-sm font-bold text-zinc-500">
              총 {dailyLogs.length}건
            </div>
          </div>

          {loading ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-zinc-900 p-5 text-center text-zinc-500">
              운행일지 불러오는 중...
            </div>
          ) : dailyLogs.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-zinc-900 p-7 text-center">
              <div className="text-lg font-black text-zinc-400">
                운행 기록 없음
              </div>

              <div className="mt-2 text-sm text-zinc-600">
                터미널에서 정상 작업을
                저장하면 자동으로 등록됩니다.
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {dailyLogs.map(
                (log, index) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-white/10 bg-zinc-900 p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div
                          className={`text-xl font-black ${
                            log.direction ===
                            "IN"
                              ? "text-orange-400"
                              : "text-blue-400"
                          }`}
                        >
                          {index + 1}.{" "}
                          {log.direction ===
                          "IN"
                            ? "반입"
                            : "반출"}
                        </div>

                        <div className="mt-2 text-2xl font-black">
                          {log.container_no ||
                            "기타 운행"}
                        </div>
                      </div>

                      <div className="rounded-lg bg-black px-3 py-2 text-sm font-black">
                        {log.container_size
                          ? `${log.container_size}FT`
                          : "-"}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl bg-black p-3">
                        <div className="text-xs text-zinc-600">
                          지역
                        </div>

                        <div className="mt-1 font-black">
                          {getRegionText(log)}
                        </div>
                      </div>

                      <div className="rounded-xl bg-black p-3">
                        <div className="text-xs text-zinc-600">
                          터미널
                        </div>

                        <div className="mt-1 font-black">
                          {log.terminal ||
                            "-"}
                        </div>
                      </div>
                    </div>

                    {log.yard_location && (
                      <div className="mt-2 rounded-xl bg-black p-3">
                        <div className="text-xs text-zinc-600">
                          장치장
                        </div>

                        <div className="mt-1 text-lg font-black text-orange-400">
                          {log.yard_location}
                        </div>
                      </div>
                    )}

<div className="mt-3 flex items-center justify-between">
  <div className="text-xs font-bold text-zinc-600">
    {log.entry_source === "MANUAL"
      ? "수기 등록"
      : ""}
  </div>

  <button
    type="button"
    onClick={() => deleteLog(log.id)}
    className="text-xs font-black text-red-400"
  >
    삭제
  </button>
</div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* 수기 추가 */}

        <section className="mt-7">
          {!showManual ? (
            <button
              type="button"
              onClick={() =>
                setShowManual(true)
              }
              className="h-14 w-full rounded-2xl border border-dashed border-white/20 bg-zinc-950 text-sm font-black text-zinc-300"
            >
              + 기타 반입 · 반출 직접 추가
            </button>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
              <h2 className="text-xl font-black">
                기타 운행 추가
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setManualDirection(
                      "IN"
                    )
                  }
                  className={`h-14 rounded-xl font-black ${
                    manualDirection ===
                    "IN"
                      ? "bg-orange-600"
                      : "bg-black text-zinc-500"
                  }`}
                >
                  반입
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setManualDirection(
                      "OUT"
                    )
                  }
                  className={`h-14 rounded-xl font-black ${
                    manualDirection ===
                    "OUT"
                      ? "bg-blue-600"
                      : "bg-black text-zinc-500"
                  }`}
                >
                  반출
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {[20, 40].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      setManualSize(
                        size as 20 | 40
                      )
                    }
                    className={`h-14 rounded-xl font-black ${
                      manualSize === size
                        ? "bg-orange-600"
                        : "bg-black text-zinc-500"
                    }`}
                  >
                    {size}FT
                  </button>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
  {(["FULL", "EMPTY"] as const).map((status) => (
    <button
      key={status}
      type="button"
      onClick={() => setManualContainerStatus(status)}
      className={`h-14 rounded-xl font-black ${
        manualContainerStatus === status
          ? "bg-orange-600"
          : "bg-black text-zinc-500"
      }`}
    >
      {status}
    </button>
  ))}
</div>

              <input
                type="text"
                value={manualContainerNo}
                onChange={(event) =>
                  setManualContainerNo(
                    event.target.value
                      .toUpperCase()
                  )
                }
                placeholder="컨테이너 번호 (선택)"
                className="mt-3 h-14 w-full rounded-xl border border-white/10 bg-black px-4 text-lg font-black text-white outline-none focus:border-orange-500"
              />

              <div className="mt-4 text-sm font-black text-zinc-300">
                지역
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  "여수",
                  "셔틀",
                  "기타지역",
                ].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setManualRegion(
                        value as RegionType
                      )
                    }
                    className={`h-12 rounded-xl text-sm font-black ${
                      manualRegion === value
                        ? "bg-orange-600"
                        : "bg-black text-zinc-500"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>

              {manualRegion ===
                "기타지역" && (
                <input
                  type="text"
                  value={
                    manualRegionCustom
                  }
                  onChange={(event) =>
                    setManualRegionCustom(
                      event.target.value
                    )
                  }
                  placeholder="지역 직접 입력"
                  className="mt-3 h-14 w-full rounded-xl border border-white/10 bg-black px-4 font-bold text-white outline-none focus:border-orange-500"
                />
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowManual(false);
                    setManualRegion("");
                    setManualRegionCustom(
                      ""
                    );
                    setManualContainerNo(
                      ""
                    );
                  }}
                  className="h-14 rounded-xl bg-black font-bold text-zinc-400"
                >
                  취소
                </button>

                <button
                  type="button"
                  onClick={saveManualTrip}
                  disabled={manualSaving}
                  className="h-14 rounded-xl bg-orange-600 font-black disabled:opacity-40"
                >
                  {manualSaving
                    ? "저장 중..."
                    : "추가 저장"}
                </button>
              </div>
            </div>
          )}
        </section>

{/* 월간 집계 */}
<section className="mt-8 rounded-2xl border border-white/10 bg-zinc-950 p-5">
  <div className="text-sm font-black text-orange-400">
    {workDate.slice(0, 7)}
  </div>

  <div className="flex items-center justify-between gap-3">
    <h2 className="mt-1 text-2xl font-black">
      월간 결산
    </h2>

    <button
      type="button"
      onClick={async () => {
        const sortedLogs = [...monthlyLogs].sort((a, b) =>
          String(a.work_date ?? "").localeCompare(
            String(b.work_date ?? "")
          )
        );

        const fullLogs = sortedLogs.filter(
          (log) => log.container_status === "FULL"
        );

        const emptyLogs = sortedLogs.filter(
          (log) => log.container_status === "EMPTY"
        );

        const fullYeosu = fullLogs.filter(
          (log) => log.region === "여수"
        ).length;

        const fullShuttle = fullLogs.filter(
          (log) => log.region === "셔틀"
        ).length;

        const otherRegionCounts = fullLogs
          .filter(
            (log) =>
              log.region &&
              log.region !== "여수" &&
              log.region !== "셔틀"
          )
          .reduce<Record<string, number>>(
            (acc, log) => {
              const region = log.region || "기타";
              acc[region] = (acc[region] || 0) + 1;
              return acc;
            },
            {}
          );

        const otherText =
          Object.entries(otherRegionCounts)
            .map(
              ([region, count]) =>
                `${region} ${count}`
            )
            .join(" / ") || "기타 0";

        const empty40 = emptyLogs.filter(
          (log) =>
            Number(log.container_size) === 40
        ).length;

        const empty20 = emptyLogs.filter(
          (log) =>
            Number(log.container_size) === 20
        ).length;

        const dateCounts: Record<string, number> = {};

        const detailLines = sortedLogs.map((log) => {
          const date = String(log.work_date ?? "");
          const shortDate = date
            ? date.slice(5, 10).replace("-", "/")
            : "";

          dateCounts[date] =
            (dateCounts[date] || 0) + 1;

          const status =
            log.container_status || "-";

          const size = log.container_size
            ? `${log.container_size}FT`
            : "-";

          const region = log.region || "-";

          const containerNo =
            log.container_no || "-";

          return `${shortDate} ${dateCounts[date]}. ${status} / ${size} / ${region} / ${containerNo}`;
        });

        const text = [
          `${workDate.slice(0, 7)} 월간 운행 결산`,
          "",
          `[FULL] 총 ${fullLogs.length}건 / 여수 ${fullYeosu} / 셔틀 ${fullShuttle} / ${otherText}`,
          `[EMPTY] 총 ${emptyLogs.length}건 / 40FT ${empty40} / 20FT ${empty20}`,
          "",
          ...detailLines,
        ].join("\n");

        await navigator.clipboard.writeText(
          text
        );

        alert("월간 결산을 복사했습니다.");
      }}
      className="rounded-xl bg-orange-600 px-4 py-3 text-sm font-black text-white"
    >
      전체 복사하기
    </button>
  </div>

  {/* FULL / EMPTY 요약 */}
  <div className="mt-5 space-y-3">
    <div className="rounded-xl bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <span className="text-lg font-black">
          FULL
        </span>

        <span className="text-2xl font-black text-orange-400">
          {monthlyFull}건
        </span>
      </div>

      <div className="mt-2 text-sm leading-6 text-zinc-400">
        여수{" "}
        {
          monthlyLogs.filter(
            (log) =>
              log.container_status === "FULL" &&
              log.region === "여수"
          ).length
        }
        건
        {" / "}
        셔틀{" "}
        {
          monthlyLogs.filter(
            (log) =>
              log.container_status === "FULL" &&
              log.region === "셔틀"
          ).length
        }
        건
        {" / "}
        {(() => {
          const counts = monthlyLogs
            .filter(
              (log) =>
                log.container_status === "FULL" &&
                log.region &&
                log.region !== "여수" &&
                log.region !== "셔틀"
            )
            .reduce<Record<string, number>>(
              (acc, log) => {
                const region =
                  log.region || "기타";

                acc[region] =
                  (acc[region] || 0) + 1;

                return acc;
              },
              {}
            );

          const entries =
            Object.entries(counts);

          if (entries.length === 0) {
            return "기타 0건";
          }

          return entries
            .map(
              ([region, count]) =>
                `${region} ${count}건`
            )
            .join(" / ");
        })()}
      </div>
    </div>

    <div className="rounded-xl bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <span className="text-lg font-black">
          EMPTY
        </span>

        <span className="text-2xl font-black text-blue-400">
          {monthlyEmpty}건
        </span>
      </div>

      <div className="mt-2 text-sm leading-6 text-zinc-400">
        40FT{" "}
        {
          monthlyLogs.filter(
            (log) =>
              log.container_status === "EMPTY" &&
              Number(log.container_size) === 40
          ).length
        }
        건
        {" / "}
        20FT{" "}
        {
          monthlyLogs.filter(
            (log) =>
              log.container_status === "EMPTY" &&
              Number(log.container_size) === 20
          ).length
        }
        건
      </div>
    </div>
  </div>

  {/* 날짜별 상세 */}
  <div className="mt-6">
    <div className="mb-3 text-sm font-black text-zinc-400">
      날짜별 운행 상세
    </div>

    <div className="overflow-hidden rounded-xl border border-white/10">
      {(() => {
        const sortedLogs = [...monthlyLogs].sort(
          (a, b) =>
            String(
              a.work_date ?? ""
            ).localeCompare(
              String(b.work_date ?? "")
            )
        );

        const dateCounts: Record<
          string,
          number
        > = {};

        if (sortedLogs.length === 0) {
          return (
            <div className="p-5 text-center text-sm text-zinc-500">
              이번 달 운행 기록이 없습니다.
            </div>
          );
        }

        return sortedLogs.map(
          (log, index) => {
            const date = String(
              log.work_date ?? ""
            );

            dateCounts[date] =
              (dateCounts[date] || 0) + 1;

            const shortDate = date
              ? date
                  .slice(5, 10)
                  .replace("-", "/")
              : "-";

            return (
              <div
                key={log.id ?? index}
                className="border-b border-white/10 px-3 py-3 text-sm last:border-b-0"
              >
                <div className="whitespace-nowrap font-bold">
                  <span className="text-zinc-400">
                    {shortDate}
                  </span>
                  {" "}
                  <span className="text-zinc-500">
                    {dateCounts[date]}.
                  </span>
                  {" "}
                  <span
                    className={
                      log.container_status ===
                      "FULL"
                        ? "text-orange-400"
                        : "text-blue-400"
                    }
                  >
                    {log.container_status ||
                      "-"}
                  </span>
                  {" / "}
                  {log.container_size
                    ? `${log.container_size}FT`
                    : "-"}
                  {" / "}
                  {log.region || "-"}
                  {" / "}
                  <span className="text-white">
                    {log.container_no ||
                      "-"}
                  </span>
                </div>
              </div>
            );
          }
        );
      })()}
    </div>
  </div>
</section>

        <div className="h-10" />
      </div>
    </main>
  );
}