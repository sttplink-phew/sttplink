"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/client";

type CargoType =
  | "20full"
  | "40full"
  | "20danger"
  | "40danger"
  | "20empty"
  | "40empty"
  | "other"
  | "";

const cargoItems = [
  {
    id: "20full",
    title: "20 FULL",
    description: "20피트 풀 컨테이너",
  },
  {
    id: "40full",
    title: "40 FULL",
    description: "40피트 풀 컨테이너",
  },
  {
    id: "20danger",
    title: "20 위험물",
    description: "20피트 위험물 FULL",
  },
  {
    id: "40danger",
    title: "40 위험물",
    description: "40피트 위험물 FULL",
  },
  {
    id: "20empty",
    title: "20 EMPTY",
    description: "20피트 엠티",
  },
  {
    id: "40empty",
    title: "40 EMPTY",
    description: "40피트 엠티",
  },
  {
    id: "other",
    title: "기타",
    description: "특수 · 탱크 · 기타",
  },
] as const;

function getLocalDateValue() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatSimpleDate(value: string) {
  if (!value) return "날짜 선택";

  return new Date(`${value}T00:00:00`).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

interface DatePickerFieldProps {
  label: string;
  value: string;
  min: string;
  onChange: (value: string) => void;
}

function DatePickerField({
  label,
  value,
  min,
  onChange,
}: DatePickerFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openCalendar() {
    const input = inputRef.current;

    if (!input) return;

    input.showPicker();
  }

  return (
    <div>
      <span className="mb-2 block text-xs font-bold text-zinc-500">
        {label}
      </span>

      <div
        className="relative min-w-0 max-w-full cursor-pointer"
        onClick={openCalendar}
      >
        <input
          ref={inputRef}
          type="date"
          min={min}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-14 w-full min-w-0 max-w-full rounded-xl ...
        />

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xl">
          📅
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [cargoType, setCargoType] = useState<CargoType>("");

  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupTimeFlexible, setPickupTimeFlexible] =
    useState(false);

  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryTimeFlexible, setDeliveryTimeFlexible] =
    useState(false);

  const [weightTons, setWeightTons] = useState("");
  const [hazardous, setHazardous] = useState(false);

  const [pickupLocation, setPickupLocation] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentTiming, setPaymentTiming] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [freightPrice, setFreightPrice] = useState("");

  const [saving, setSaving] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [truckInfo, setTruckInfo] = useState("");
  type TerminalInfo = {

    hasInfo?: boolean;
    hasAnyInfo?: boolean;
    counts?: {
      inbound?: number;
      outbound?: number;
    };
  };
  
  const [gwctInfo, setGwctInfo] = useState<TerminalInfo | null>(null);
  const [kitlInfo, setKitlInfo] = useState<TerminalInfo | null>(null);
  const [terminalPolling, setTerminalPolling] = useState(false);
  const [todayFull, setTodayFull] = useState(0);
  const [todayEmpty, setTodayEmpty] = useState(0);
  
  const [monthFull, setMonthFull] = useState(0);
  const [monthEmpty, setMonthEmpty] = useState(0);
  
  const [openOrderCount, setOpenOrderCount] = useState(0);
  const [monthOrderCount, setMonthOrderCount] = useState(0);
  const selectedCargo = useMemo(
    () => cargoItems.find((item) => item.id === cargoType),
    [cargoType]
  );

  const today = getLocalDateValue();
  useEffect(() => {
    async function loadHomeStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
  
      if (!user) {
        setLoggedIn(false);
        return;
      }
  
      setLoggedIn(true);
  
      // 내 차량 정보
      const { data: driver } = await supabase
        .from("drivers")
        .select("vehicle_number, truck_brand, truck_model")
        .eq("user_id", user.id)
        .maybeSingle();
  
      if (driver) {
        setVehicleNumber(driver.vehicle_number ?? "");
  
        const info = [driver.truck_brand, driver.truck_model]
          .filter(Boolean)
          .join(" ");
  
        setTruckInfo(info);
      }
  
      {loggedIn ? "운행 현황" : "오늘 운행"}
      const { data: todayLog } = await supabase
        .from("daily_logs")
        .select("full20, full40, danger20, danger40, empty20, empty40")
        .eq("user_id", user.id)
        .eq("work_date", today)
        .maybeSingle();
  
      if (todayLog) {
        setTodayFull(
          (todayLog.full20 ?? 0) +
            (todayLog.full40 ?? 0) +
            (todayLog.danger20 ?? 0) +
            (todayLog.danger40 ?? 0)
        );
  
        setTodayEmpty(
          (todayLog.empty20 ?? 0) +
            (todayLog.empty40 ?? 0)
        );
      }
  
      // 이번 달 운행
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const monthStart = `${year}-${month}-01`;
      const { count: monthCount } = await supabase
  .from("orders")
  .select("id", { count: "exact", head: true })
  .gte("created_at", `${monthStart}T00:00:00`);

setMonthOrderCount(monthCount ?? 0);
  
      const { data: monthLogs } = await supabase
        .from("daily_logs")
        .select("full20, full40, danger20, danger40, empty20, empty40")
        .eq("user_id", user.id)
        .gte("work_date", monthStart);
  
      if (monthLogs) {
        let full = 0;
        let empty = 0;
  
        monthLogs.forEach((log) => {
          full +=
            (log.full20 ?? 0) +
            (log.full40 ?? 0) +
            (log.danger20 ?? 0) +
            (log.danger40 ?? 0);
  
          empty +=
            (log.empty20 ?? 0) +
            (log.empty40 ?? 0);
        });
  
        setMonthFull(full);
        setMonthEmpty(empty);
      }
  
      // 현재 알바
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "open");
  
      setOpenOrderCount(count ?? 0);
    }
  
    loadHomeStatus();
  }, [supabase, today]);
  async function checkGwct() {
    
    if (!vehicleNumber) return;
  
    const truckNo = vehicleNumber.slice(-4);
  
    if (!/^\d{4}$/.test(truckNo)) return;
  
    try {
      const res = await fetch("/api/terminal/gwct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ truckNo }),
      });
  
      const data = await res.json();
      setGwctInfo(data);
    } catch (error) {
      console.error("GWCT 조회 실패:", error);
    }
  }
  async function checkKitl() {
    if (!vehicleNumber) return;
  
    const truckNo = vehicleNumber.slice(-4);
  
    if (!/^\d{4}$/.test(truckNo)) return;
  
    try {
      const res = await fetch("/api/terminal/kitl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ truckNo }),
      });
  
      const data = await res.json();
      setKitlInfo(data);
    } catch (error) {
      console.error("KITL 조회 실패:", error);
    }
  }
  useEffect(() => {
    if (!terminalPolling) return;
  
    checkGwct();
    checkKitl();
    
    const timer = setInterval(() => {
      checkGwct();
      checkKitl();
    }, 60000);
  
    return () => clearInterval(timer);
  }, [terminalPolling, vehicleNumber]);
    const canGoNext = Boolean(
    cargoType &&
      pickupDate &&
      (pickupTime || pickupTimeFlexible) &&
      deliveryDate &&
      (deliveryTime || deliveryTimeFlexible)
  );

  function handlePickupDateChange(value: string) {
    setPickupDate(value);

    if (deliveryDate && deliveryDate < value) {
      setDeliveryDate("");
      setDeliveryTime("");
    }
  }

  function selectCargo(type: CargoType) {
    setCargoType(type);

    if (type === "20danger" || type === "40danger") {
      setHazardous(true);
    } else {
      setHazardous(false);
    }
  }

  function resetOrder() {
    setCargoType("");

    setPickupDate("");
    setPickupTime("");
    setPickupTimeFlexible(false);

    setDeliveryDate("");
    setDeliveryTime("");
    setDeliveryTimeFlexible(false);

    setWeightTons("");
    setHazardous(false);

    setPickupLocation("");
    setDeliveryLocation("");
    setSpecialNotes("");

    setPaymentMethod("");
    setPaymentTiming("");

    setCustomerName("");
    setCustomerPhone("");

    setFreightPrice("");

    setStep(1);
  }

  async function submitOrder() {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("이름/업체명과 연락처를 입력해주세요.");
      return;
    }

    if (!pickupLocation.trim()) {
      alert("상차 장소를 입력해주세요.");
      return;
    }

    if (!deliveryLocation.trim()) {
      alert("하차 장소를 입력해주세요.");
      return;
    }

    setSaving(true);

    const { data: newOrder, error } = await supabase
      .from("orders")
      .insert({
        cargo_type: cargoType,

        pickup_date: pickupDate,
        pickup_time: pickupTime || null,
        pickup_time_flexible: pickupTimeFlexible,

        delivery_date: deliveryDate,
        delivery_time: deliveryTime || null,
        delivery_time_flexible: deliveryTimeFlexible,

        freight_price: freightPrice || null,

        pickup_location: pickupLocation.trim(),
        delivery_location: deliveryLocation.trim(),

        special_notes: specialNotes.trim() || null,

        weight_tons: weightTons
          ? Number(weightTons)
          : null,

        hazardous:
          cargoType === "20danger" ||
          cargoType === "40danger" ||
          hazardous,

        self_loading_required: false,

        payment_method: paymentMethod || null,
        payment_timing: paymentTiming || null,

        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),

        edit_code: crypto.randomUUID()
          .slice(0, 8)
          .toUpperCase(),

        status: "open",
        driver_id: null,
      })
      .select("id")
      .single();

    setSaving(false);

    if (error) {
      alert(
        "알바 등록 중 오류가 발생했습니다.\n" +
          error.message
      );
      return;
    }

    if (!newOrder) {
      alert("알바 등록에 실패했습니다.");
      return;
    }

    setStep(3);
  }

  return (
    <>
      <Header />

      <main
        className="min-h-screen bg-cover bg-center bg-no-repeat text-white"
        style={{
          backgroundImage: "url('/hero-truck.png')",
        }}
      >
        <section className="relative overflow-hidden px-4 pb-24 pt-28 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-black/70" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,0.20),transparent_38%)]" />

          <div className="relative mx-auto max-w-7xl">

            {/* 메인 소개 */}

            <div className="max-w-4xl">
              <p className="mb-4 text-sm font-bold text-orange-500">
                광양항 컨테이너 운송차주 커뮤니티
              </p>

              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                광양항 컨테이너 운송차주의
                <br />

                <span className="text-orange-500">
                  하루를 연결합니다
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
                회전수 기록부터 터미널 정보, 차량 정비 정보,
                <br />
                남는 시간의 일거리까지 한곳에서 확인하세요.
              </p>
            </div>

            {/* 주요 서비스 */}

            <section className="mt-10 rounded-3xl border border-white/10 bg-black/55 p-5 shadow-2xl backdrop-blur-md sm:p-7">
              <p className="text-xs font-bold text-orange-500">
                STTP LINK
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                오늘 필요한 서비스를 선택하세요
              </h2>

              <div className="mt-6 grid grid-cols-2 gap-3">

                <Link
                  href="/daily"
                  className="rounded-2xl border border-white/10 bg-zinc-900 p-5 text-left transition hover:border-orange-500"
                >
                  <div className="text-3xl">📊</div>

                  <div className="mt-3 text-lg font-bold">
                  {loggedIn ? "운행 현황" : "오늘 운행"}
                  </div>

                  <div className="mt-1 text-sm text-zinc-400">
                  {loggedIn
  ? `이번 달 FULL ${monthFull} · EMPTY ${monthEmpty}`
  : "오늘 회전수 기록"}
                  </div>
                </Link>

                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-zinc-900 p-5 text-left transition hover:border-orange-500"
                >
                  <div className="text-3xl">⚓</div>

                  <div className="mt-3 text-lg font-bold">
                    터미널 정보
                  </div>

                  <div className="mt-1 text-sm text-zinc-400">
  {loggedIn
    ? vehicleNumber
      ? (
          <>
            <div>{`내 차량 ${vehicleNumber}`}</div>
            {gwctInfo?.hasInfo ? (
              <div className="mt-2 text-orange-400">
                대통(GWCT) · 반입 {gwctInfo.counts?.inbound ?? 0}건 · 반출{" "}
                {gwctInfo.counts?.outbound ?? 0}건
              </div>
            ) : gwctInfo ? (
              <div className="mt-2">대통(GWCT) · 정보 없음</div>
            ) : terminalPolling ? (
              <div className="mt-2">대통(GWCT) · 조회중...</div>
            ) : (
              <div className="mt-2">대통(GWCT) · 조회 대기</div>
            )}
            {kitlInfo?.hasInfo ? (
  <div className="mt-2 text-blue-400">
    국제(KITL) · 반입 {kitlInfo.counts?.inbound ?? 0}건 · 반출{" "}
    {kitlInfo.counts?.outbound ?? 0}건
  </div>
) : kitlInfo?.hasAnyInfo ? (
  <div className="mt-2 text-zinc-400">
    국제(KITL) · 완료된 정보만 있음
  </div>
) : kitlInfo ? (
  <div className="mt-2 text-zinc-400">
    국제(KITL) · 정보 없음
  </div>
) : terminalPolling ? (
  <div className="mt-2 text-zinc-400">
    국제(KITL) · 조회중...
  </div>
) : null}
          </>
        )
      : "차량정보 등록 필요"
    : "로그인 후 터미널 정보를 확인할 수 있습니다."}
</div>
                </button>

                <Link
  href="/maintenance"
  className="rounded-2xl border border-white/10 bg-zinc-900 p-5 text-left transition hover:border-orange-500"
>
                  <div className="text-3xl">🔧</div>

                  <div className="mt-3 text-lg font-bold">
                    차량 관리
                  </div>

                  <div className="mt-1 text-sm text-zinc-400">
                  {loggedIn
  ? truckInfo || "차량정보 확인"
  : "고장 · 수리 · 정비업체"}
                  </div>
                  </Link>

                <Link
                  href="/orders"
                  className="rounded-2xl border border-white/10 bg-zinc-900 p-5 text-left transition hover:border-orange-500"
                >
                  <div className="text-3xl">🚛</div>

                  <div className="mt-3 text-lg font-bold">
                    알바 찾기
                  </div>

                  <div className="mt-1 text-sm text-zinc-400">
                  {loggedIn
  ? `현재 알바 ${openOrderCount}건`
  : "남는 시간 일거리 찾기"}
                  </div>
                </Link>
                <button
  type="button"
  onClick={() => {
    setStep(1);
    setShowOrderModal(true);
  }}
  className="rounded-2xl border border-white/10 bg-zinc-900 p-5 text-left transition hover:border-orange-500"
>
<div className="text-3xl">📦</div>

  <div className="mt-3 text-lg font-bold">
    알바 등록
  </div>

  <div className="mt-1 text-sm text-zinc-400">
  {loggedIn
  ? `이번 달 총 등록 ${monthOrderCount}건`
  : "컨테이너 일거리 등록"}
  </div>
</button>
              </div>
            </section>
            {showOrderModal && (
  <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
    <div className="mx-auto my-8 max-w-4xl">
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setShowOrderModal(false)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl font-black text-zinc-900"
        >
          ×
        </button>
      </div>
            {/* STEP 1 */}

            {step === 1 && (
              <section className="mt-10 rounded-3xl border border-white/10 bg-white p-5 text-zinc-900 shadow-2xl sm:p-7">

                <p className="text-xs font-bold text-orange-600">
                {loggedIn
  ? `이번 달 총 등록 ${monthOrderCount}건`
  : "컨테이너 일거리 등록"}
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  컨테이너 운송 알바 등록
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  컨테이너 종류와 운송 일정을 선택하세요.
                </p>

                {/* 컨테이너 종류 */}

                <div className="mt-7">
                  <p className="mb-3 text-sm font-bold text-zinc-700">
                    컨테이너 종류
                  </p>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {cargoItems.map((item) => {
                      const selected =
                        cargoType === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            selectCargo(
                              item.id as CargoType
                            )
                          }
                          className={`rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-orange-600 bg-orange-50 ring-2 ring-orange-100"
                              : "border-zinc-200 bg-white hover:border-orange-300"
                          }`}
                        >
                          <div
                            className={`text-lg font-black ${
                              selected
                                ? "text-orange-600"
                                : "text-zinc-900"
                            }`}
                          >
                            {item.title}
                          </div>

                          <div className="mt-1 text-xs leading-5 text-zinc-500">
                            {item.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 상차 */}

                <div className="mt-7 rounded-2xl bg-zinc-50 p-4 sm:p-5">
                  <h3 className="font-black">
                    상차 일정
                  </h3>

                  <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                    <DatePickerField
                      label="상차 날짜"
                      value={pickupDate}
                      min={today}
                      onChange={
                        handlePickupDateChange
                      }
                    />

<div className="min-w-0">
                      <span className="mb-2 block text-xs font-bold text-zinc-500">
                        상차 시간
                      </span>

                      <input
                        type="time"
                        value={pickupTime}
                        disabled={
                          pickupTimeFlexible
                        }
                        onChange={(e) =>
                          setPickupTime(
                            e.target.value
                          )
                        }
                        className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 font-bold outline-none transition focus:border-orange-500 disabled:bg-zinc-100"
                      />
                    </div>
                  </div>

                  <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
                    <input
                      type="checkbox"
                      checked={
                        pickupTimeFlexible
                      }
                      onChange={(e) => {
                        setPickupTimeFlexible(
                          e.target.checked
                        );

                        if (
                          e.target.checked
                        ) {
                          setPickupTime("");
                        }
                      }}
                    />

                    <div>
                      <div className="font-bold">
                        시간 상관없음
                      </div>

                      <div className="text-xs text-zinc-500">
                        운송차주가 가능한 시간을 알려드립니다.
                      </div>
                    </div>
                  </label>
                </div>

                {/* 하차 */}

                <div className="mt-4 rounded-2xl bg-zinc-50 p-4 sm:p-5">
                  <h3 className="font-black">
                    하차 일정
                  </h3>

                  <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                    <DatePickerField
                      label="하차 날짜"
                      value={deliveryDate}
                      min={
                        pickupDate || today
                      }
                      onChange={
                        setDeliveryDate
                      }
                    />

<div className="min-w-0">
                      <span className="mb-2 block text-xs font-bold text-zinc-500">
                        하차 시간
                      </span>

                      <input
                        type="time"
                        value={deliveryTime}
                        disabled={
                          deliveryTimeFlexible
                        }
                        onChange={(e) =>
                          setDeliveryTime(
                            e.target.value
                          )
                        }
                        className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 font-bold outline-none transition focus:border-orange-500 disabled:bg-zinc-100"
                      />
                    </div>
                  </div>

                  <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
                    <input
                      type="checkbox"
                      checked={
                        deliveryTimeFlexible
                      }
                      onChange={(e) => {
                        setDeliveryTimeFlexible(
                          e.target.checked
                        );

                        if (
                          e.target.checked
                        ) {
                          setDeliveryTime("");
                        }
                      }}
                    />

                    <div>
                      <div className="font-bold">
                        시간 상관없음
                      </div>

                      <div className="text-xs text-zinc-500">
                        배차 후 운송차주가 예상 시간을 알려드립니다.
                      </div>
                    </div>
                  </label>
                </div>

                <button
                  type="button"
                  disabled={!canGoNext}
                  onClick={() => setStep(2)}
                  className="mt-6 h-16 w-full rounded-2xl bg-orange-600 text-lg font-black text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  상세정보 입력
                </button>

              </section>
            )}

            {/* STEP 2 */}

            {step === 2 && (
              <section className="mt-10 rounded-3xl border border-white/10 bg-white p-5 text-zinc-900 shadow-2xl sm:p-7">

                <p className="text-xs font-bold text-orange-600">
                  알바 등록
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  운송 상세정보
                </h2>

                {/* 선택 내용 요약 */}

                <div className="mt-5 flex flex-wrap gap-2 text-sm">

                  <span className="rounded-full bg-orange-100 px-4 py-2 font-bold text-orange-700">
                    {selectedCargo?.title}
                  </span>

                  <span className="rounded-full bg-zinc-100 px-4 py-2 font-bold">
                    상차{" "}
                    {formatSimpleDate(
                      pickupDate
                    )}{" "}
                    {pickupTimeFlexible
                      ? "시간 상관없음"
                      : pickupTime}
                  </span>

                  <span className="rounded-full bg-zinc-100 px-4 py-2 font-bold">
                    하차{" "}
                    {formatSimpleDate(
                      deliveryDate
                    )}{" "}
                    {deliveryTimeFlexible
                      ? "시간 상관없음"
                      : deliveryTime}
                  </span>

                </div>

                {/* 장소 */}

                <div className="mt-6 grid gap-4 md:grid-cols-2">

                  <label>
                    <span className="mb-2 block text-xs font-bold text-zinc-500">
                      상차 주소
                    </span>

                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={(e) =>
                        setPickupLocation(
                          e.target.value
                        )
                      }
                      placeholder="상차 주소를 입력하세요"
                      className="h-14 w-full rounded-xl border border-zinc-200 px-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-bold text-zinc-500">
                      하차 주소
                    </span>

                    <input
                      type="text"
                      value={deliveryLocation}
                      onChange={(e) =>
                        setDeliveryLocation(
                          e.target.value
                        )
                      }
                      placeholder="하차 주소를 입력하세요"
                      className="h-14 w-full rounded-xl border border-zinc-200 px-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </label>

                </div>

                {/* 중량 */}

                <div className="mt-5">

                  <label>
                    <span className="mb-2 block text-xs font-bold text-zinc-500">
                      컨테이너 중량 / 톤
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={weightTons}
                      onChange={(e) =>
                        setWeightTons(
                          e.target.value
                        )
                      }
                      placeholder="예: 28.5"
                      className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />

                    <p className="mt-2 text-xs text-zinc-500">
                      중량 또는 초과중량 여부를 판단하는 데 사용됩니다.
                    </p>
                  </label>

                </div>

                {/* 위험물 */}

                <label className="mt-4 flex min-h-14 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                  <input
                    type="checkbox"
                    checked={hazardous}
                    disabled={
                      cargoType ===
                        "20danger" ||
                      cargoType ===
                        "40danger"
                    }
                    onChange={(e) =>
                      setHazardous(
                        e.target.checked
                      )
                    }
                  />

                  <div>
                    <span className="font-bold">
                      위험물 운송
                    </span>

                    {(cargoType ===
                      "20danger" ||
                      cargoType ===
                        "40danger") && (
                      <p className="text-xs text-zinc-500">
                        위험물 컨테이너를 선택해 자동 적용되었습니다.
                      </p>
                    )}
                  </div>
                </label>

                {/* 상세사항 */}

                <label className="mt-5 block">
                  <span className="mb-2 block text-xs font-bold text-zinc-500">
                    세부사항 및 요청사항
                  </span>

                  <textarea
                    rows={6}
                    value={specialNotes}
                    onChange={(e) =>
                      setSpecialNotes(
                        e.target.value
                      )
                    }
                    placeholder="특수 컨테이너, 초과중량, 상하차 조건 등 운송차주에게 전달할 내용을 자유롭게 입력하세요."
                    className="w-full resize-none rounded-xl border border-zinc-200 p-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </label>

                {/* 지급 */}

                <div className="mt-5 grid gap-4 sm:grid-cols-2">

                  <label>
                    <span className="mb-2 block text-xs font-bold text-zinc-500">
                      지급방법
                    </span>

                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(
                          e.target.value
                        )
                      }
                      className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 outline-none"
                    >
                      <option value="">
                        선택하세요
                      </option>

                      <option value="현금">
                        현금
                      </option>

                      <option value="계좌이체">
                        계좌이체
                      </option>

                      <option value="카드">
                        카드
                      </option>
                    </select>
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-bold text-zinc-500">
                      지급시점
                    </span>

                    <select
                      value={paymentTiming}
                      onChange={(e) =>
                        setPaymentTiming(
                          e.target.value
                        )
                      }
                      className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 outline-none"
                    >
                      <option value="">
                        선택하세요
                      </option>

                      <option value="즉시">
                        즉시
                      </option>

                      <option value="당일">
                        당일
                      </option>

                      <option value="기타">
                        기타
                      </option>
                    </select>
                  </label>

                </div>

                {/* 등록자 */}

                <div className="mt-5 grid gap-4 sm:grid-cols-2">

                  <label>
                    <span className="mb-2 block text-sm font-bold text-zinc-700">
                      이름 / 업체명
                    </span>

                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) =>
                        setCustomerName(
                          e.target.value
                        )
                      }
                      placeholder="예: STTP물류"
                      className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 outline-none transition focus:border-orange-500"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-bold text-zinc-700">
                      연락처
                    </span>

                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) =>
                        setCustomerPhone(
                          e.target.value
                        )
                      }
                      placeholder="예: 010-1234-5678"
                      className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 outline-none transition focus:border-orange-500"
                    />
                  </label>

                </div>

                {/* 운임 */}

                <div className="mt-5">

                  <label className="mb-2 block text-sm font-bold text-zinc-700">
                    제시 운임
                  </label>

                  <input
                    type="text"
                    value={freightPrice}
                    onChange={(e) => {
                      const numbers =
                        e.target.value.replace(
                          /[^0-9]/g,
                          ""
                        );

                      setFreightPrice(
                        numbers
                          ? Number(
                              numbers
                            ).toLocaleString(
                              "ko-KR"
                            )
                          : ""
                      );
                    }}
                    placeholder="예: 450,000"
                    className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 outline-none transition focus:border-orange-500"
                  />

                  <div className="mt-4 flex flex-col gap-2 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-800 sm:flex-row sm:items-center sm:justify-between">

                    <span>
                      제시 운임은 대기시간,
                      작업조건 및 현장 상황에
                      따라 실제 운임과 달라질
                      수 있습니다.
                    </span>

                    <span className="shrink-0 text-base font-black">
                      금{" "}
                      {freightPrice || "0"} 원
                    </span>

                  </div>
                </div>

                {/* 버튼 */}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-zinc-300 px-8 py-4 text-sm font-bold"
                  >
                    이전
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={submitOrder}
                    className="rounded-xl bg-orange-600 px-8 py-4 text-sm font-bold text-white transition hover:bg-orange-500 disabled:opacity-50"
                  >
                    {saving
                      ? "등록 중..."
                      : "알바 등록"}
                  </button>

                </div>

              </section>
            )}

            {/* STEP 3 */}

            {step === 3 && (
              <section className="mt-10 rounded-3xl border border-white/10 bg-white p-8 text-center text-zinc-900 shadow-2xl sm:p-12">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl font-bold text-orange-600">
                  ✓
                </div>

                <h2 className="mt-6 text-3xl font-black">
                  알바가 등록되었습니다
                </h2>

                <p className="mt-4 text-lg leading-8 text-zinc-600">
                  등록된 알바는 운송차주가
                  <br />
                  알바 찾기에서 확인할 수 있습니다.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">

                  <Link
                    href="/orders"
                    className="rounded-xl border border-zinc-300 px-8 py-4 text-sm font-bold"
                  >
                    등록된 알바 보기
                  </Link>

                  <button
                    type="button"
                    onClick={resetOrder}
                    className="rounded-xl bg-orange-600 px-8 py-4 text-sm font-bold text-white"
                  >
                    새 알바 등록
                  </button>

                </div>

              </section>
            )}
    </div>
  </div>
)}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}