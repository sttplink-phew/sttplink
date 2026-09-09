"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type TripLog = {
  id: string;
  user_id: string;
  work_date: string;
  trip_no: number | null;

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

  const [manualTripNo, setManualTripNo] =
    useState(1);

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
  // 당일 집계 / 회전 그룹
  // -----------------------------

  const daily20Full =
    dailyLogs.filter(
      (log) =>
        Number(log.container_size) === 20 &&
        log.container_status === "FULL"
    ).length;

  const daily20Empty =
    dailyLogs.filter(
      (log) =>
        Number(log.container_size) === 20 &&
        log.container_status === "EMPTY"
    ).length;

  const daily40Full =
    dailyLogs.filter(
      (log) =>
        Number(log.container_size) === 40 &&
        log.container_status === "FULL"
    ).length;

  const daily40Empty =
    dailyLogs.filter(
      (log) =>
        Number(log.container_size) === 40 &&
        log.container_status === "EMPTY"
    ).length;

  const maxSavedTripNo = dailyLogs.reduce(
    (max, log) =>
      log.trip_no && log.trip_no > max
        ? log.trip_no
        : max,
    0
  );

  const tripGroupMap = new Map<
    string,
    {
      tripNo: number | null;
      logs: TripLog[];
    }
  >();

  dailyLogs.forEach((log) => {
    const key =
      log.trip_no == null
        ? `legacy-${log.id}`
        : `trip-${log.trip_no}`;

    const current = tripGroupMap.get(key);

    if (current) {
      current.logs.push(log);
    } else {
      tripGroupMap.set(key, {
        tripNo: log.trip_no,
        logs: [log],
      });
    }
  });

  const numberedGroups = Array.from(
    tripGroupMap.values()
  )
    .filter((group) => group.tripNo != null)
    .sort(
      (a, b) =>
        Number(a.tripNo) - Number(b.tripNo)
    );

  const legacyGroups = Array.from(
    tripGroupMap.values()
  ).filter((group) => group.tripNo == null);

  const dailyTripGroups = [
    ...numberedGroups.map((group) => ({
      ...group,
      displayTripNo: Number(group.tripNo),
    })),
    ...legacyGroups.map((group, index) => ({
      ...group,
      displayTripNo:
        maxSavedTripNo + index + 1,
    })),
  ];

  const dailyTripCount =
    dailyTripGroups.length;

  function getNextTripNo() {
    return maxSavedTripNo + 1;
  }

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

  const monthly20Full =
    monthlyLogs.filter(
      (log) =>
        Number(log.container_size) === 20 &&
        log.container_status === "FULL"
    ).length;

  const monthly20Empty =
    monthlyLogs.filter(
      (log) =>
        Number(log.container_size) === 20 &&
        log.container_status === "EMPTY"
    ).length;

  const monthly40Full =
    monthlyLogs.filter(
      (log) =>
        Number(log.container_size) === 40 &&
        log.container_status === "FULL"
    ).length;

  const monthly40Empty =
    monthlyLogs.filter(
      (log) =>
        Number(log.container_size) === 40 &&
        log.container_status === "EMPTY"
    ).length;

  const monthlyFull =
    monthlyLogs.filter(
      (log) => log.container_status === "FULL"
    ).length;

  const monthlyEmpty =
    monthlyLogs.filter(
      (log) => log.container_status === "EMPTY"
    ).length;

  // 같은 날짜 + 같은 trip_no는 컨테이너가 여러 건이어도 1회전
  const monthlyTripKeys = new Set<string>();

  monthlyLogs.forEach((log) => {
    if (log.trip_no != null) {
      monthlyTripKeys.add(
        `${log.work_date}-${log.trip_no}`
      );
    } else {
      // trip_no가 없던 과거 기록은 기존 데이터 보존을 위해 1건=1회전 처리
      monthlyTripKeys.add(`legacy-${log.id}`);
    }
  });

  const monthlyTripCount =
    monthlyTripKeys.size;

  const monthlyRegionCounts =
    monthlyLogs.reduce<Record<string, number>>(
      (acc, log) => {
        const region =
          log.region_custom?.trim() ||
          log.region?.trim() ||
          "미지정";

        acc[region] = (acc[region] || 0) + 1;
        return acc;
      },
      {}
    );

  const monthlyRegionEntries =
    Object.entries(monthlyRegionCounts).sort(
      (a, b) => b[1] - a[1]
    );

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
        trip_no: manualTripNo,

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
    setManualTripNo((prev) => prev + 1);
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
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-black">
              오늘 운행
            </h2>

            <div className="text-right">
              <div className="text-xs font-bold text-zinc-500">
                회전수
              </div>
              <div className="text-4xl font-black text-orange-400">
                {dailyTripCount}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
              <div className="text-sm font-black text-zinc-400">
                20FT
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-500">
                  FULL
                </span>
                <span className="text-2xl font-black text-white">
                  {daily20Full}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-500">
                  EMPTY
                </span>
                <span className="text-2xl font-black text-white">
                  {daily20Empty}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
              <div className="text-sm font-black text-zinc-400">
                40FT
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-500">
                  FULL
                </span>
                <span className="text-2xl font-black text-white">
                  {daily40Full}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-500">
                  EMPTY
                </span>
                <span className="text-2xl font-black text-white">
                  {daily40Empty}
                </span>
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
              {dailyTripCount}회전 · {dailyLogs.length}건
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
                정상 작업을 저장하면 자동으로 등록됩니다.
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              {dailyTripGroups.map((group) => (
                <div
                  key={`trip-${group.displayTripNo}-${group.logs[0]?.id}`}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900"
                >
                  <div className="flex items-center gap-3 border-b border-white/10 bg-black/30 px-4 py-3">
                    <div className="text-3xl font-black text-orange-400">
                      {group.displayTripNo}
                    </div>
                    <div className="text-sm font-black text-zinc-400">
                      회전
                    </div>

                    {group.tripNo == null && (
                      <div className="ml-auto text-xs font-bold text-zinc-600">
                        기존 기록
                      </div>
                    )}
                  </div>

                  <div className="divide-y divide-white/10">
                    {group.logs.map((log) => (
                      <div
                        key={log.id}
                        className="px-4 py-4"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`min-w-[54px] rounded-lg px-2 py-2 text-center text-sm font-black ${
                              log.direction === "IN"
                                ? "bg-red-600/20 text-red-400"
                                : "bg-blue-600/20 text-blue-400"
                            }`}
                          >
                            {log.direction === "IN"
                              ? "반입"
                              : "반출"}
                          </div>

                          <div className="min-w-[44px] text-center text-base font-black text-white">
                            {log.container_size
                              ? `${log.container_size}`
                              : "-"}
                          </div>

                          <div className="min-w-[58px] text-center text-sm font-black text-zinc-300">
                            {log.container_status || "-"}
                          </div>

                          <div className="min-w-0 flex-1 truncate text-right text-base font-black tracking-wide text-white">
                            {log.container_no || "기타 운행"}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-[11px] font-bold text-zinc-600">
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
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 수기 추가 */}

        <section className="mt-7">
          {!showManual ? (
            <button
              type="button"
              onClick={() => {
                setManualTripNo(getNextTripNo());
                setShowManual(true);
              }}
              className="h-14 w-full rounded-2xl border border-dashed border-white/20 bg-zinc-950 text-sm font-black text-zinc-300"
            >
              + 기타 반입 · 반출 직접 추가
            </button>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
              <h2 className="text-xl font-black">
                기타 운행 추가
              </h2>

              <div className="mt-4 rounded-xl border border-orange-500/30 bg-black p-4">
                <div className="text-sm font-black text-zinc-400">
                  회전번호
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setManualTripNo((prev) =>
                        Math.max(1, prev - 1)
                      )
                    }
                    className="h-12 w-12 rounded-xl bg-zinc-900 text-2xl font-black"
                  >
                    −
                  </button>

                  <div className="flex-1 text-center">
                    <span className="text-3xl font-black text-orange-400">
                      {manualTripNo}
                    </span>
                    <span className="ml-2 text-sm font-black text-zinc-500">
                      회전
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setManualTripNo((prev) => prev + 1)
                    }
                    className="h-12 w-12 rounded-xl bg-zinc-900 text-2xl font-black"
                  >
                    +
                  </button>
                </div>
              </div>

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
                      ? "bg-red-600"
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
  <div className="flex items-end justify-between gap-3">
    <div>
      <div className="text-sm font-black text-orange-400">
        {workDate.slice(0, 7)}
      </div>

      <h2 className="mt-1 text-2xl font-black">
        월간 통계
      </h2>
    </div>

    <div className="text-right">
      <div className="text-xs font-bold text-zinc-500">
        총 회전
      </div>

      <div className="text-4xl font-black text-orange-400">
        {monthlyTripCount}
      </div>
    </div>
  </div>

  {/* 사이즈 + FULL/EMPTY */}
  <div className="mt-5 grid grid-cols-2 gap-3">
    <div className="rounded-xl bg-zinc-900 p-4">
      <div className="text-sm font-black text-zinc-400">
        20FT
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-bold text-zinc-500">
          FULL
        </span>
        <span className="text-2xl font-black text-white">
          {monthly20Full}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-bold text-zinc-500">
          EMPTY
        </span>
        <span className="text-2xl font-black text-white">
          {monthly20Empty}
        </span>
      </div>
    </div>

    <div className="rounded-xl bg-zinc-900 p-4">
      <div className="text-sm font-black text-zinc-400">
        40FT
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-bold text-zinc-500">
          FULL
        </span>
        <span className="text-2xl font-black text-white">
          {monthly40Full}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-bold text-zinc-500">
          EMPTY
        </span>
        <span className="text-2xl font-black text-white">
          {monthly40Empty}
        </span>
      </div>
    </div>
  </div>

  {/* 반입 / 반출 */}
  <div className="mt-3 grid grid-cols-2 gap-3">
    <div className="rounded-xl bg-zinc-900 p-4">
      <div className="text-xs font-bold text-zinc-500">
        반입
      </div>
      <div className="mt-1 text-2xl font-black text-red-400">
        {monthlyInbound}
      </div>
    </div>

    <div className="rounded-xl bg-zinc-900 p-4">
      <div className="text-xs font-bold text-zinc-500">
        반출
      </div>
      <div className="mt-1 text-2xl font-black text-blue-400">
        {monthlyOutbound}
      </div>
    </div>
  </div>

  {/* 전체 FULL / EMPTY */}
  <div className="mt-3 grid grid-cols-2 gap-3">
    <div className="rounded-xl bg-zinc-900 p-4">
      <div className="text-xs font-bold text-zinc-500">
        FULL 전체
      </div>
      <div className="mt-1 text-2xl font-black text-white">
        {monthlyFull}
      </div>
    </div>

    <div className="rounded-xl bg-zinc-900 p-4">
      <div className="text-xs font-bold text-zinc-500">
        EMPTY 전체
      </div>
      <div className="mt-1 text-2xl font-black text-white">
        {monthlyEmpty}
      </div>
    </div>
  </div>

  {/* 지역별 */}
  {monthlyRegionEntries.length > 0 && (
    <div className="mt-4 rounded-xl bg-zinc-900 p-4">
      <div className="text-sm font-black text-zinc-400">
        지역별 운송
      </div>

      <div className="mt-3 space-y-2">
        {monthlyRegionEntries.map(
          ([region, count]) => (
            <div
              key={region}
              className="flex items-center justify-between"
            >
              <span className="text-sm font-bold text-zinc-500">
                {region}
              </span>

              <span className="text-sm font-black text-white">
                {count}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  )}

  {/* 전체 복사 */}
  <button
    type="button"
    onClick={async () => {
      const sortedLogs = [...monthlyLogs].sort((a, b) => {
        const dateCompare = String(
          a.work_date ?? ""
        ).localeCompare(
          String(b.work_date ?? "")
        );

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return (
          Number(a.trip_no ?? 999999) -
          Number(b.trip_no ?? 999999)
        );
      });

      const legacyDateCounts: Record<
        string,
        number
      > = {};

      const detailLines = sortedLogs.map(
        (log) => {
          const date = String(
            log.work_date ?? ""
          );

          const shortDate = date
            ? date
                .slice(5, 10)
                .replace("-", "/")
            : "";

          let tripLabel = "";

          if (log.trip_no != null) {
            tripLabel = `${log.trip_no}회전`;
          } else {
            legacyDateCounts[date] =
              (legacyDateCounts[date] || 0) +
              1;

            tripLabel = `기존${legacyDateCounts[date]}`;
          }

          const direction =
            log.direction === "IN"
              ? "반입"
              : "반출";

          const size = log.container_size
            ? `${log.container_size}FT`
            : "-";

          const status =
            log.container_status || "-";

          const containerNo =
            log.container_no || "기타 운행";

          return `${shortDate} ${tripLabel} ${direction} / ${size} / ${status} / ${containerNo}`;
        }
      );

      const copyText = [
        `${workDate.slice(0, 7)} 월간 운행 통계`,
        `총 ${monthlyTripCount}회전`,
        "",
        `[20FT] FULL ${monthly20Full} / EMPTY ${monthly20Empty}`,
        `[40FT] FULL ${monthly40Full} / EMPTY ${monthly40Empty}`,
        `[반입] ${monthlyInbound}건`,
        `[반출] ${monthlyOutbound}건`,
        `[FULL 전체] ${monthlyFull}건`,
        `[EMPTY 전체] ${monthlyEmpty}건`,
        "",
        ...detailLines,
      ].join("\n");

      await navigator.clipboard.writeText(
        copyText
      );

      alert("월간 통계를 복사했습니다.");
    }}
    className="mt-4 h-12 w-full rounded-xl bg-orange-600 text-sm font-black text-white"
  >
    월간 통계 전체 복사
  </button>

  {/* 날짜별 상세 */}
  <div className="mt-6">
    <div className="mb-3 text-sm font-black text-zinc-400">
      날짜별 운행 상세
    </div>

    <div className="overflow-hidden rounded-xl border border-white/10">
      {(() => {
        const sortedLogs = [...monthlyLogs].sort(
          (a, b) => {
            const dateCompare = String(
              a.work_date ?? ""
            ).localeCompare(
              String(b.work_date ?? "")
            );

            if (dateCompare !== 0) {
              return dateCompare;
            }

            return (
              Number(
                a.trip_no ?? 999999
              ) -
              Number(
                b.trip_no ?? 999999
              )
            );
          }
        );

        const legacyDateCounts: Record<
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

            const shortDate = date
              ? date
                  .slice(5, 10)
                  .replace("-", "/")
              : "-";

            let tripLabel = "";

            if (log.trip_no != null) {
              tripLabel = `${log.trip_no}회전`;
            } else {
              legacyDateCounts[date] =
                (legacyDateCounts[date] || 0) +
                1;

              tripLabel = `기존기록 ${legacyDateCounts[date]}`;
            }

            return (
              <div
                key={log.id ?? index}
                className="border-b border-white/10 px-3 py-3 text-sm last:border-b-0"
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-bold">
                  <span className="text-zinc-400">
                    {shortDate}
                  </span>

                  <span className="font-black text-orange-400">
                    {tripLabel}
                  </span>

                  <span
                    className={
                      log.direction === "IN"
                        ? "text-red-400"
                        : "text-blue-400"
                    }
                  >
                    {log.direction === "IN"
                      ? "반입"
                      : "반출"}
                  </span>

                  <span className="text-zinc-300">
                    {log.container_size
                      ? `${log.container_size}FT`
                      : "-"}
                  </span>

                  <span className="text-zinc-300">
                    {log.container_status || "-"}
                  </span>

                  <span className="text-white">
                    {log.container_no ||
                      "기타 운행"}
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