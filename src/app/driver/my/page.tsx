"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

type ScheduleRow = {
  id: number;
  user_id: string;
  schedule_date: string;
  title: string;
  created_at: string;
};

function formatDateLocal(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatShortDate(
  dateString: string
) {
  const [
    year,
    month,
    day,
  ] = dateString
    .split("-")
    .map(Number);

  return `${month}/${day}`;
}

export default function DriverMyPage() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [
    profile,
    setProfile,
  ] =
    useState<DriverProfile | null>(
      null
    );

  const [
    schedules,
    setSchedules,
  ] =
    useState<ScheduleRow[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    currentMonth,
    setCurrentMonth,
  ] =
    useState(() => {
      const now =
        new Date();

      return new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );
    });

  const [
    scheduleDate,
    setScheduleDate,
  ] =
    useState(
      formatDateLocal(
        new Date()
      )
    );

  const [
    scheduleTitle,
    setScheduleTitle,
  ] =
    useState("");

  const [
    adding,
    setAdding,
  ] =
    useState(false);

  const [
    showAddForm,
    setShowAddForm,
  ] =
    useState(false);

  // =====================================
  // 데이터 불러오기
  // =====================================

  async function loadSchedules(
    userId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("driver_schedules")
      .select(
        "id, user_id, schedule_date, title, created_at"
      )
      .eq(
        "user_id",
        userId
      )
      .order(
        "schedule_date",
        {
          ascending: true,
        }
      );

    if (error) {
      console.error(
        "일정 조회 실패:",
        error
      );

      setSchedules([]);

      return;
    }

    setSchedules(
      (data ??
        []) as ScheduleRow[]
    );
  }

  useEffect(() => {
    async function loadMyPage() {
      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        router.push(
          "/login"
        );

        return;
      }

      const {
        data: driverData,
        error: driverError,
      } = await supabase
        .from("drivers")
        .select(
          "id, user_id, vehicle_number, rank"
        )
        .eq(
          "user_id",
          user.id
        )
        .limit(1);

      if (driverError) {
        console.error(
          "내정보 차량 조회 실패:",
          driverError
        );

        setLoading(false);

        return;
      }

      if (
        !driverData ||
        driverData.length === 0
      ) {
        router.push(
          "/driver/profile"
        );

        return;
      }

      setProfile(
        driverData[0]
      );

      await loadSchedules(
        user.id
      );

      setLoading(false);
    }

    loadMyPage();
  }, [
    router,
    supabase,
  ]);

  // =====================================
  // 일정 추가
  // =====================================

  async function addSchedule() {
    const title =
      scheduleTitle.trim();

    if (!scheduleDate) {
      alert(
        "날짜를 선택해주세요."
      );

      return;
    }

    if (!title) {
      alert(
        "일정 내용을 입력해주세요."
      );

      return;
    }

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      alert(
        "로그인이 필요합니다."
      );

      return;
    }

    try {
      setAdding(true);

      const {
        error,
      } = await supabase
        .from(
          "driver_schedules"
        )
        .insert({
          user_id:
            user.id,

          schedule_date:
            scheduleDate,

          title,
        });

      if (error) {
        console.error(
          "일정 저장 실패:",
          error
        );

        alert(
          "일정 저장에 실패했습니다."
        );

        return;
      }

      setScheduleTitle(
        ""
      );

      setShowAddForm(
        false
      );

      const [
        year,
        month,
      ] = scheduleDate
        .split("-")
        .map(Number);

      setCurrentMonth(
        new Date(
          year,
          month - 1,
          1
        )
      );

      await loadSchedules(
        user.id
      );
    } finally {
      setAdding(false);
    }
  }

  // =====================================
  // 일정 삭제
  // =====================================

  async function deleteSchedule(
    id: number
  ) {
    const ok =
      window.confirm(
        "이 일정을 삭제할까요?"
      );

    if (!ok) {
      return;
    }

    const {
      error,
    } = await supabase
      .from(
        "driver_schedules"
      )
      .delete()
      .eq(
        "id",
        id
      );

    if (error) {
      console.error(
        "일정 삭제 실패:",
        error
      );

      alert(
        "일정을 삭제하지 못했습니다."
      );

      return;
    }

    setSchedules(
      (current) =>
        current.filter(
          (item) =>
            item.id !== id
        )
    );
  }

  // =====================================
  // 달력
  // =====================================

  const year =
    currentMonth.getFullYear();

  const month =
    currentMonth.getMonth();

  const firstDay =
    new Date(
      year,
      month,
      1
    ).getDay();

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  const calendarCells:
    (number | null)[] =
      [];

  for (
    let i = 0;
    i < firstDay;
    i += 1
  ) {
    calendarCells.push(
      null
    );
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day += 1
  ) {
    calendarCells.push(
      day
    );
  }

  while (
    calendarCells.length %
      7 !==
    0
  ) {
    calendarCells.push(
      null
    );
  }

  const scheduleDates =
    new Set(
      schedules.map(
        (item) =>
          item.schedule_date
      )
    );

  const today =
    formatDateLocal(
      new Date()
    );

  const selectedMonthSchedules =
    schedules.filter(
      (item) => {
        const [
          scheduleYear,
          scheduleMonth,
        ] =
          item.schedule_date
            .split("-")
            .map(Number);

        return (
          scheduleYear ===
            year &&
          scheduleMonth ===
            month + 1
        );
      }
    );

  function previousMonth() {
    setCurrentMonth(
      new Date(
        year,
        month - 1,
        1
      )
    );
  }

  function nextMonth() {
    setCurrentMonth(
      new Date(
        year,
        month + 1,
        1
      )
    );
  }

  function selectCalendarDay(
    day: number
  ) {
    const date =
      formatDateLocal(
        new Date(
          year,
          month,
          day
        )
      );

    setScheduleDate(
      date
    );

    setShowAddForm(
      true
    );
  }

  // =====================================
  // 로딩
  // =====================================

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

  // =====================================
  // 화면
  // =====================================

  return (
    <>
      <Header />

      <main className="min-h-screen overflow-x-hidden bg-[#080808] px-4 pb-16 pt-24 text-white">
        <div className="mx-auto w-full max-w-lg">

          {/* ================================= */}
          {/* 내 정보 */}
          {/* ================================= */}

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

                <div className="mt-2 flex items-center gap-2">
  <img
    src={
      (profile.rank ?? 1) === 4
        ? "/rank-gold.png"
        : (profile.rank ?? 1) === 3
        ? "/rank-silver.png"
        : (profile.rank ?? 1) === 2
        ? "/rank-bronze.png"
        : "/rank-gray.png"
    }
    alt="회원등급"
    className="h-7 w-7 object-contain"
  />

  <span className="text-xs font-bold text-zinc-400">
    {(profile.rank ?? 1) === 4
      ? "골드"
      : (profile.rank ?? 1) === 3
      ? "실버"
      : (profile.rank ?? 1) === 2
      ? "브론즈"
      : "아이언"}
  </span>
  <span className="text-[10px] text-zinc-600">
  (활동이 많으면 등급이 오릅니다)
</span>
</div>
              </div>

              <Link
                href="/"
                className="shrink-0 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-zinc-300 transition active:scale-95"
              >
                홈
              </Link>
            </div>
          </section>

          {/* ================================= */}
          {/* 주요 일정 */}
          {/* ================================= */}

          <section className="mt-3 rounded-2xl border border-orange-500/20 bg-zinc-900 p-4 shadow-lg">

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-orange-500">
                  개인 관리
                </p>

                <h2 className="mt-1 text-xl font-black">
                  주요 일정
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  필요한 일정을 추가하고 한눈에 관리해보세요.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setScheduleDate(
                    today
                  );

                  setShowAddForm(
                    !showAddForm
                  );
                }}
                className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-black text-white transition active:scale-95"
              >
                + 일정 추가
              </button>
            </div>

            {/* ================================= */}
            {/* 달력 헤더 */}
            {/* ================================= */}

            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={
                  previousMonth
                }
                className="h-10 w-10 rounded-xl bg-black text-xl font-black text-zinc-400"
              >
                ‹
              </button>

              <div className="text-lg font-black">
                {year}년{" "}
                {month + 1}월
              </div>

              <button
                type="button"
                onClick={
                  nextMonth
                }
                className="h-10 w-10 rounded-xl bg-black text-xl font-black text-zinc-400"
              >
                ›
              </button>
            </div>

            {/* 요일 */}

            <div className="mt-4 grid grid-cols-7 text-center text-xs font-bold text-zinc-600">
              <div>
                일
              </div>
              <div>
                월
              </div>
              <div>
                화
              </div>
              <div>
                수
              </div>
              <div>
                목
              </div>
              <div>
                금
              </div>
              <div>
                토
              </div>
            </div>

            {/* 날짜 */}

            <div className="mt-2 grid grid-cols-7 gap-1">
              {calendarCells.map(
                (
                  day,
                  index
                ) => {
                  if (
                    day === null
                  ) {
                    return (
                      <div
                        key={`blank-${index}`}
                        className="aspect-square"
                      />
                    );
                  }

                  const date =
                    formatDateLocal(
                      new Date(
                        year,
                        month,
                        day
                      )
                    );

                  const hasSchedule =
                    scheduleDates.has(
                      date
                    );

                  const isToday =
                    date === today;

                  return (
                    <button
                      key={
                        date
                      }
                      type="button"
                      onClick={() =>
                        selectCalendarDay(
                          day
                        )
                      }
                      className={`relative aspect-square rounded-xl text-sm font-black transition active:scale-95 ${
                        hasSchedule
                          ? "border border-orange-500 bg-orange-500/15 text-orange-400 shadow-[0_0_16px_rgba(249,115,22,0.35)]"
                          : isToday
                            ? "border border-white/20 bg-zinc-800 text-white"
                            : "bg-black text-zinc-300"
                      }`}
                    >
                      {
                        day
                      }

                      {hasSchedule && (
                        <span className="absolute bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-orange-500" />
                      )}
                    </button>
                  );
                }
              )}
            </div>

            {/* ================================= */}
            {/* 일정 입력 */}
            {/* ================================= */}

            {showAddForm && (
              <div className="mt-5 rounded-2xl border border-orange-500/20 bg-black p-4">

                <div className="text-sm font-black text-orange-400">
                  일정 추가
                </div>

                <input
                  type="date"
                  value={
                    scheduleDate
                  }
                  onChange={(
                    event
                  ) =>
                    setScheduleDate(
                      event.target
                        .value
                    )
                  }
                  className="mt-3 h-12 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 text-base font-bold text-white outline-none focus:border-orange-500"
                />

                <input
                  type="text"
                  value={
                    scheduleTitle
                  }
                  onChange={(
                    event
                  ) =>
                    setScheduleTitle(
                      event.target
                        .value
                    )
                  }
                  placeholder="일정 내용을 입력하세요"
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 text-base font-bold outline-none focus:border-orange-500"
                />

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setShowAddForm(
                        false
                      )
                    }
                    className="h-12 rounded-xl bg-zinc-800 text-sm font-black text-zinc-400"
                  >
                    취소
                  </button>

                  <button
                    type="button"
                    onClick={
                      addSchedule
                    }
                    disabled={
                      adding
                    }
                    className="h-12 rounded-xl bg-orange-600 text-sm font-black text-white disabled:opacity-50"
                  >
                    {adding
                      ? "저장 중..."
                      : "일정 저장"}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ================================= */}
          {/* 일정 목록 */}
          {/* ================================= */}

          <section className="mt-3 rounded-2xl border border-white/10 bg-zinc-900 p-4 shadow-lg">

            <div className="flex items-center justify-between">
              <h2 className="font-black">
                {month + 1}월 일정
              </h2>

              <div className="text-xs font-bold text-zinc-500">
                {
                  selectedMonthSchedules.length
                }
                건
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {selectedMonthSchedules.length ===
              0 ? (
                <div className="rounded-xl bg-black p-5 text-center">
                  <div className="text-sm font-bold text-zinc-500">
                    등록된 일정이 없습니다.
                  </div>

                  <div className="mt-1 text-xs text-zinc-700">
                    날짜를 누르거나 일정 추가를 이용하세요.
                  </div>
                </div>
              ) : (
                selectedMonthSchedules.map(
                  (
                    item
                  ) => (
                    <div
                      key={
                        item.id
                      }
                      className="flex items-center justify-between gap-3 rounded-xl bg-black p-4"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-black text-orange-500">
                          {formatShortDate(
                            item.schedule_date
                          )}
                        </div>

                        <div className="mt-1 break-words text-base font-bold">
                          {
                            item.title
                          }
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          deleteSchedule(
                            item.id
                          )
                        }
                        className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-zinc-600 transition active:bg-white/5"
                      >
                        삭제
                      </button>
                    </div>
                  )
                )
              )}
            </div>
          </section>

          <p className="mt-4 px-1 text-center text-[11px] leading-5 text-zinc-700">
            차량 관리 · 정비 · 개인 일정 등 필요한 날짜를 기록하세요.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}