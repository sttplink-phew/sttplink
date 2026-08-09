"use client";

import { useMemo, useRef, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/client";

type CargoType = "container" | "equipment" | "heavy" | "";
function ContainerIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8 text-orange-600" fill="none">
      <rect
        x="6"
        y="12"
        width="36"
        height="24"
        rx="2"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M13 14v20M20 14v20M28 14v20M35 14v20"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function EquipmentIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-8 w-8 text-orange-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="30" width="25" height="7" rx="2" />
      <path d="M16 30V20H27L32 30" />
      <path d="M27 20L34 12L41 15" />
      <path d="M41 15L38 25" />
      <path d="M38 25L44 28L39 32" />
      <circle cx="15" cy="38" r="3" />
      <circle cx="29" cy="38" r="3" />
    </svg>
  );
}

function HeavyIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none">
      <path
        d="M24 6v11"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M24 17c0 6 8 4 8 10 0 4-3 7-8 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect
        x="11"
        y="34"
        width="26"
        height="8"
        rx="2"
        stroke="currentColor"
        strokeWidth="3"
      />
    </svg>
  );
}
const cargoItems = [
  {
    id: "container",
    title: "컨테이너",
    description: "수출입 컨테이너 운송",
    icon: "▣",
  },
  {
    id: "equipment",
    title: "건설장비",
    description: "굴착기·지게차·장비 운송",
    icon: "▤",
  },
  {
    id: "heavy",
    title: "중량물",
    description: "대형·중량 화물 운송",
    icon: "◆",
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

    if ("showPicker" in input) {
      input.showPicker();
    } else {
      (input as HTMLInputElement).click();
    }
  }

  return (
    <div>
      <span className="mb-2 block text-xs font-bold text-zinc-500">
        {label}
      </span>
      <div className="relative">
      <input
        ref={inputRef}
        type="date"
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 w-full min-w-0 max-w-full box-border rounded-xl border border-zinc-200 bg-white px-4 font-bold text-zinc-900 ..."
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xl">
  📅
</span>
</div>
    </div>
  );
}

export default function HomePage() {
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cargoType, setCargoType] = useState<CargoType>("");

  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupTimeFlexible, setPickupTimeFlexible] = useState(false);


  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryTimeFlexible, setDeliveryTimeFlexible] = useState(false);
  const [freightPrice, setFreightPrice] = useState("");
  const [customerName, setCustomerName] = useState("");
const [customerPhone, setCustomerPhone] = useState("");
const [pickupLocation, setPickupLocation] = useState("");
const [deliveryLocation, setDeliveryLocation] = useState("");
const [specialNotes, setSpecialNotes] = useState("");
const [weightTons, setWeightTons] = useState("");
const [hazardous, setHazardous] = useState(false);
const [selfLoadingRequired, setSelfLoadingRequired] = useState(false);
const [paymentMethod, setPaymentMethod] = useState("");
const [paymentTiming, setPaymentTiming] = useState("");
  const selectedCargo = useMemo(
    () => cargoItems.find((item) => item.id === cargoType),
    [cargoType]
  );

  const today = getLocalDateValue();

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

  function resetOrder() {
    setCargoType("");
    setPickupDate("");
    setPickupTime("");
    setDeliveryDate("");
    setDeliveryTime("");
    setStep(1);
  }
async function submitOrder() {
  if (!customerName || !customerPhone) {
    alert("이름/업체명과 연락처를 입력해주세요.");
    return;
  }
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
    freight_price: freightPrice,
    pickup_location: pickupLocation,
    delivery_location: deliveryLocation,
    special_notes: specialNotes || null,
    weight_tons: weightTons ? Number(weightTons) : null,
hazardous: hazardous,
self_loading_required: cargoType === "equipment" ? selfLoadingRequired : false,
    payment_method: paymentMethod || null,
    payment_timing: paymentTiming || null,
    customer_name: customerName,
customer_phone: customerPhone,
edit_code: crypto.randomUUID().slice(0, 8).toUpperCase(),
status: "open",
driver_id: null,
})
.select("id")
.single();

  if (error) {
    alert("오더 등록 중 오류가 발생했습니다.\n" + error.message);
    return;
  }

  alert("새 오더 ID: " + newOrder?.id);
  
  if (newOrder?.id) {
    try {
      await fetch("/api/notifications/queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: newOrder.id,
        }),
      });
    } catch (queueError) {
      console.error("알림 대기열 생성 오류:", queueError);
    }
  }

  setStep(3);
}

  return (
    <>
      <Header />

      <main
  className="min-h-screen bg-cover bg-center bg-no-repeat text-white"
  style={{ backgroundImage: "url('/hero-truck.png')" }}
>
        <section className="relative overflow-hidden px-4 pb-24 pt-28 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,0.20),transparent_38%)]" />

          <div className="relative mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <p className="mb-4 text-sm font-bold text-orange-500">
                AI 기반 대형 화물 운송 플랫폼
              </p>

              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
  일회성 중량물 운송,
  <br />
  <span className="text-orange-500">
    빠르고 정확하게 연결합니다
  </span>
</h1>

<p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
  필요한 일정과 운송 조건을 등록하면
  <br />
  조건에 맞는 운송차주와 빠르게 연결합니다.
  
</p>
            </div>

            {step === 1 && (
              <section className="mt-10 rounded-3xl border border-white/20 bg-black/55 p-5 text-white shadow-2xl backdrop-blur-md sm:p-7">
                <p className="text-xs font-bold text-orange-600">
                  STEP 1
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  화물 종류와 일정을 선택하세요
                </h2>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {cargoItems.map((item) => {
                    const selected = cargoType === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCargoType(item.id)}
                        className={`rounded-2xl border p-5 text-left transition ${
                          selected
                            ? "border-orange-600 bg-orange-50 ring-2 ring-orange-100"
                            : "border-zinc-200 bg-white hover:border-orange-300 hover:bg-orange-50/40"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                        <span
  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${
    selected ? "bg-orange-100" : "bg-zinc-100"
  }`}
>
  <img
    src={
      item.title === "컨테이너"
        ? "/container.png"
        : item.title === "건설장비"
        ? "/construction.png"
        : "/heavy-cargo.png"
    }
    alt={item.title}
    className={`h-14 w-14 object-contain transition ${
      selected ? "scale-110" : "scale-100"
    }`}
  />
</span>

                          <div>
                            <h3 className="text-lg font-bold">
                              {item.title}
                            </h3>

                            <p className="mt-1 text-sm text-zinc-500">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/20 bg-white/95 p-5 text-zinc-900 shadow-xl">
                    <h3 className="text-lg font-bold text-zinc-900">
                      상차 일정
                    </h3>

                    <div className="mt-4">
                      <DatePickerField
                        label="상차 날짜"
                        value={pickupDate}
                        min={today}
                        onChange={handlePickupDateChange}
                      />
                    </div>

                    {pickupDate && (
  <div className="mt-4">
    <span className="mb-2 block text-xs font-bold text-zinc-500">
      상차 시간
    </span>

    <input
      type="time"
      value={pickupTime}
      disabled={pickupTimeFlexible}
      onChange={(event) => setPickupTime(event.target.value)}
      className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 disabled:bg-zinc-100 disabled:text-zinc-400"
    />

    <label className="mt-3 flex items-center gap-2 text-sm text-zinc-700">
      <input
        type="checkbox"
        checked={pickupTimeFlexible}
        onChange={(event) => {
          setPickupTimeFlexible(event.target.checked);
          if (event.target.checked) setPickupTime("");
        }}
      />
      시간 상관없음
    </label>

    {pickupTimeFlexible && (
      <p className="mt-2 text-xs text-zinc-500">
        배차 후 운송차주가 가능한 시간을 알려드립니다.
      </p>
    )}
  </div>
)}
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                    <h3 className="text-lg font-bold text-zinc-900">
                      하차 일정
                    </h3>

                    <div className="mt-4">
                      <DatePickerField
                        label="원하는 하차 날짜"
                        value={deliveryDate}
                        min={pickupDate || today}
                        onChange={setDeliveryDate}
                      />
                    </div>

                    {deliveryDate && (
  <div className="mt-4">
    <span className="mb-2 block text-xs font-bold text-zinc-500">
      원하는 하차 시간
    </span>

    <input
      type="time"
      value={deliveryTime}
      disabled={deliveryTimeFlexible}
      onChange={(event) => setDeliveryTime(event.target.value)}
      className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 font-semibold outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-zinc-100 disabled:text-zinc-400"
    />

    <label className="mt-3 flex items-center gap-2 text-sm text-zinc-700">
      <input
        type="checkbox"
        checked={deliveryTimeFlexible}
        onChange={(event) => {
          setDeliveryTimeFlexible(event.target.checked);
          if (event.target.checked) setDeliveryTime("");
        }}
      />
      시간 상관없음
    </label>

    {deliveryTimeFlexible && (
      <p className="mt-2 text-xs text-zinc-500">
        배차 후 운송차주가 예상 시간을 알려드립니다.
      </p>
    )}
  </div>
)}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    disabled={!canGoNext}
                    onClick={() => setStep(2)}
                    className="h-14 rounded-xl bg-orange-600 px-12 text-sm font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
                  >
                    다음
                  </button>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="mt-10 rounded-3xl border border-white/10 bg-white p-5 text-zinc-900 shadow-2xl sm:p-7">
                <p className="text-xs font-bold text-orange-600">
                  STEP 2
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  운송 상세정보를 입력하세요
                </h2>

                <div className="mt-5 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-zinc-100 px-4 py-2 font-bold">
                    {selectedCargo?.title}
                  </span>

                  <span className="rounded-full bg-zinc-100 px-4 py-2 font-bold">
                    상차 {formatSimpleDate(pickupDate)} {pickupTime}
                  </span>

                  <span className="rounded-full bg-zinc-100 px-4 py-2 font-bold">
                    하차 {formatSimpleDate(deliveryDate)} {deliveryTime}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-xs font-bold text-zinc-500">
                      출발지
                    </span>

                    <input
                      type="text"
                      value={pickupLocation}
onChange={(e) => setPickupLocation(e.target.value)}
                      placeholder="상차 장소를 입력하세요"
                      className="h-14 w-full rounded-xl border border-zinc-200 px-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-bold text-zinc-500">
                      도착지
                    </span>

                    <input
                      type="text"
                      value={deliveryLocation}
onChange={(e) => setDeliveryLocation(e.target.value)}
                      placeholder="하차 장소를 입력하세요"
                      className="h-14 w-full rounded-xl border border-zinc-200 px-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </label>
                </div>

                <label className="mt-5 block">
                  <span className="mb-2 block text-xs font-bold text-zinc-500">
                    화물 세부사항 및 요청사항
                  </span>

                  <textarea
                    rows={7}
                    value={specialNotes}
onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="화물 크기, 무게, 장비 조건, 현장 상황 등 기사에게 전달할 내용을 자유롭게 입력하세요."
                    className="w-full resize-none rounded-xl border border-zinc-200 p-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </label>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
  <label>
    <span className="mb-2 block text-xs font-bold text-zinc-500">
      화물 중량 / 톤
    </span>
    <input
      type="number"
      min="0"
      step="0.1"
      value={weightTons}
      onChange={(e) => setWeightTons(e.target.value)}
      placeholder="예: 12.5"
      className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
    />
  </label>

  <div className="flex flex-col justify-end gap-3">
    <label className="flex h-14 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 text-zinc-900">
      <input
        type="checkbox"
        checked={hazardous}
        onChange={(e) => setHazardous(e.target.checked)}
      />
      <span className="font-bold">위험물 운송</span>
    </label>

    {cargoType === "equipment" && (
      <label className="flex h-14 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 text-zinc-900">
        <input
          type="checkbox"
          checked={selfLoadingRequired}
          onChange={(e) => setSelfLoadingRequired(e.target.checked)}
        />
        <span className="font-bold">직접 상차 필요</span>
      </label>
    )}
  </div>
</div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label>
  <span className="mb-2 block text-xs font-bold text-zinc-500">
    지급방법
  </span>
  <select
    value={paymentMethod}
    onChange={(e) => setPaymentMethod(e.target.value)}
    className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
  >
    <option value="">선택하세요</option>
    <option value="현금">현금</option>
    <option value="계좌이체">계좌이체</option>
    <option value="카드">카드</option>
  </select>
</label>

<label>
  <span className="mb-2 block text-xs font-bold text-zinc-500">
    지급시점
  </span>
  <select
    value={paymentTiming}
    onChange={(e) => setPaymentTiming(e.target.value)}
    className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
  >
    <option value="">선택하세요</option>
    <option value="즉시">즉시</option>
    <option value="당일">당일</option>
    <option value="기타">기타</option>
  </select>
</label>
  <div>
    <label className="mb-2 block text-sm font-bold text-zinc-700">
      이름 / 업체명
    </label>
    <input
      type="text"
      value={customerName}
      onChange={(e) => setCustomerName(e.target.value)}
      placeholder="예: 홍길동 / STTP물류"
      className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
    />
  </div>

  <div>
    <label className="mb-2 block text-sm font-bold text-zinc-700">
      연락처
    </label>
    <input
      type="tel"
      value={customerPhone}
      onChange={(e) => setCustomerPhone(e.target.value)}
      placeholder="예: 010-1234-5678"
      className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
    />
  </div>
</div>

                <div className="mt-5">
  <label className="mb-2 block text-sm font-bold text-zinc-700">
    제시 운임
  </label>

  <input
  type="text"
  value={freightPrice}
  onChange={(e) => {
    const numbers = e.target.value.replace(/[^0-9]/g, "");
    setFreightPrice(
      numbers ? Number(numbers).toLocaleString("ko-KR") : ""
    );
  }}
  placeholder="예: 450,000"
  className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2"
/>

<div className="mt-4 flex flex-col gap-2 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-800 sm:flex-row sm:items-center sm:justify-between">
  <span>
    제시 운임은 추가 장비, 대기시간, 작업 조건 및 현장 상황에 따라 실제 운임과 달라질 수 있습니다.
  </span>

  <span className="shrink-0 text-base font-bold">
    금 {freightPrice || "0"} 원
  </span>
</div>
</div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-zinc-300 px-8 py-3 text-sm font-bold transition hover:bg-zinc-50"
                  >
                    이전
                  </button>

                  <button
                    type="button"
                    onClick={submitOrder}
                    className="rounded-xl bg-orange-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-orange-500"
                  >
                    오더 등록
                  </button>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="mt-10 rounded-3xl border border-white/10 bg-white p-8 text-center text-zinc-900 shadow-2xl sm:p-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl font-bold text-orange-600">
                  ✓
                </div>

                <h2 className="mt-6 text-3xl font-bold">
                  오더가 등록되었습니다
                </h2>

                <p className="mt-4 text-lg leading-8 text-zinc-600">
                  배차가 완료되면 배송기사가 연락드립니다.
                </p>

                <button
                  type="button"
                  onClick={resetOrder}
                  className="mt-8 rounded-xl bg-orange-600 px-8 py-4 text-sm font-bold text-white transition hover:bg-orange-500"
                >
                  새 오더 등록
                </button>
              </section>
            )}
          </div>
        </section>

        <section className="border-y border-white/10 bg-zinc-950 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className="text-sm font-bold text-orange-500">
                01
              </span>
              <h2 className="mt-4 text-xl font-bold">
                화물과 일정 선택
              </h2>
              <p className="mt-3 leading-7 text-zinc-400">
                화물 종류와 상차·하차 날짜 및 시간을 선택합니다.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className="text-sm font-bold text-orange-500">
                02
              </span>
              <h2 className="mt-4 text-xl font-bold">
                상세조건 입력
              </h2>
              <p className="mt-3 leading-7 text-zinc-400">
                출발지와 도착지, 기사에게 전달할 조건을 입력합니다.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className="text-sm font-bold text-orange-500">
                03
              </span>
              <h2 className="mt-4 text-xl font-bold">
                배차 연락
              </h2>
              <p className="mt-3 leading-7 text-zinc-400">
                배차가 완료되면 담당 배송기사가 직접 연락합니다.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}