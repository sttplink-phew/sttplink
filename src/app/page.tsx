"use client";

import { useMemo, useRef, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

type CargoType = "container" | "equipment" | "heavy" | "";

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
      input.click();
    }
  }

  return (
    <div>
      <span className="mb-2 block text-xs font-bold text-zinc-500">
        {label}
      </span>

      <button
        type="button"
        onClick={openCalendar}
        className={`flex h-14 w-full items-center justify-between rounded-xl border px-4 text-left font-bold transition ${
          value
            ? "border-orange-500 bg-orange-50 text-orange-700"
            : "border-zinc-200 bg-white text-zinc-700 hover:border-orange-400"
        }`}
      >
        <span>{formatSimpleDate(value)}</span>
        <span className="text-xl" aria-hidden="true">
          📅
        </span>
      </button>

      <input
        ref={inputRef}
        type="date"
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="sr-only"
      />
    </div>
  );
}

export default function HomePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cargoType, setCargoType] = useState<CargoType>("");

  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");

  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");

  const selectedCargo = useMemo(
    () => cargoItems.find((item) => item.id === cargoType),
    [cargoType]
  );

  const today = getLocalDateValue();

  const canGoNext = Boolean(
    cargoType &&
      pickupDate &&
      pickupTime &&
      deliveryDate &&
      deliveryTime
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

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#080808] text-white">
        <section className="relative overflow-hidden px-4 pb-24 pt-28 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,0.20),transparent_38%)]" />

          <div className="relative mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <p className="mb-4 text-sm font-bold text-orange-500">
                AI 기반 대형 화물 운송 플랫폼
              </p>

              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                필요한 화물 운송을
                <br />
                쉽고 빠르게 등록하세요
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
                화물 종류와 상·하차 일정을 선택한 뒤 출발지와 도착지,
                상세 조건을 입력합니다.
              </p>
            </div>

            {step === 1 && (
              <section className="mt-10 rounded-3xl border border-white/10 bg-white p-5 text-zinc-900 shadow-2xl sm:p-7">
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
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl font-bold ${
                              selected
                                ? "bg-orange-600 text-white"
                                : "bg-zinc-100 text-zinc-700"
                            }`}
                          >
                            {item.icon}
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
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
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
                      <label className="mt-4 block">
                        <span className="mb-2 block text-xs font-bold text-zinc-500">
                          상차 시간
                        </span>

                        <input
                          type="time"
                          value={pickupTime}
                          onChange={(event) =>
                            setPickupTime(event.target.value)
                          }
                          className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 font-semibold outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                      </label>
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
                      <label className="mt-4 block">
                        <span className="mb-2 block text-xs font-bold text-zinc-500">
                          원하는 하차 시간
                        </span>

                        <input
                          type="time"
                          value={deliveryTime}
                          onChange={(event) =>
                            setDeliveryTime(event.target.value)
                          }
                          className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 font-semibold outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                      </label>
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
                    placeholder="화물 크기, 무게, 장비 조건, 현장 상황 등 기사에게 전달할 내용을 자유롭게 입력하세요."
                    className="w-full resize-none rounded-xl border border-zinc-200 p-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </label>

                <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-800">
                  추가 장비, 대기시간, 작업 조건 및 현장 상황에 따라
                  실제 운임이 달라질 수 있습니다.
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
                    onClick={() => setStep(3)}
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