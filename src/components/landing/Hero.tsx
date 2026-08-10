"use client";

import Link from "next/link";
import { useState } from "react";

export function Hero() {
  const [pickupAnytime, setPickupAnytime] = useState(false);
  const [dropoffAnytime, setDropoffAnytime] = useState(false);

  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-black">
      {/* 트럭 배경사진 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-truck.png')" }}
      />

      {/* 어두운 오버레이 */}
      <div className="absolute inset-0 bg-black/60" />

      {/* 아래쪽 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/80" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center px-3 py-20 sm:px-6 lg:px-8">
        {/* 메인 문구 */}
        <div className="max-w-4xl">
          <p className="mb-4 text-sm font-semibold tracking-[0.25em] text-orange-500 sm:text-base">
            STTPLINK
          </p>

          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            필요한 운송을
            <br />
            <span className="text-orange-500">빠르게 연결합니다</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-gray-200 sm:text-lg">
            컨테이너 · 건설장비 · 중량물
            <br className="sm:hidden" />
            일회성 화물 운송을 간편하게 등록하세요.
          </p>
        </div>

        {/* 오더 박스 */}
        <div className="mt-10 rounded-2xl border border-white/20 bg-black/70 p-3 shadow-2xl backdrop-blur-md">
          <div className="grid gap-2 lg:grid-cols-[1.2fr_1fr_1.15fr_1.15fr_auto]">
            {/* 화물 종류 */}
            <button
              type="button"
              className="flex min-h-[96px] flex-col items-start justify-center rounded-xl bg-white px-5 text-left transition hover:bg-gray-100"
            >
              <span className="text-xs font-medium text-gray-500">
                화물 종류
              </span>
              <span className="mt-1 text-base font-semibold text-gray-900">
                운송 종류 선택
              </span>
            </button>

            {/* 상차 날짜 */}
            <button
              type="button"
              className="flex min-h-[96px] flex-col items-start justify-center rounded-xl bg-white px-5 text-left transition hover:bg-gray-100"
            >
              <span className="text-xs font-medium text-gray-500">
                상차 날짜
              </span>
              <span className="mt-1 text-base font-semibold text-gray-900">
                날짜 선택
              </span>
            </button>

            {/* 상차 시간 */}
            <div className="flex min-h-[80px] flex-col justify-center rounded-xl bg-white px-4 sm:min-h-[96px] sm:px-5">
              <span className="text-xs font-medium text-gray-500">
                상차 시간
              </span>

              <button
                type="button"
                disabled={pickupAnytime}
                className={`mt-1 text-left text-base font-semibold ${
                  pickupAnytime ? "text-gray-400" : "text-gray-900"
                }`}
              >
                {pickupAnytime ? "시간 상관없음" : "시간 선택"}
              </button>

              <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={pickupAnytime}
                  onChange={(e) => setPickupAnytime(e.target.checked)}
                  className="h-4 w-4 accent-orange-600"
                />
                시간 상관없음
              </label>
            </div>

            {/* 하차 시간 */}
            <div className="flex min-h-[80px] flex-col justify-center rounded-xl bg-white px-4 sm:min-h-[96px] sm:px-5">
              <span className="text-xs font-medium text-gray-500">
                희망 하차 시간
              </span>

              <button
                type="button"
                disabled={dropoffAnytime}
                className={`mt-1 text-left text-base font-semibold ${
                  dropoffAnytime ? "text-gray-400" : "text-gray-900"
                }`}
              >
                {dropoffAnytime ? "시간 상관없음" : "시간 선택"}
              </button>

              <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={dropoffAnytime}
                  onChange={(e) => setDropoffAnytime(e.target.checked)}
                  className="h-4 w-4 accent-orange-600"
                />
                시간 상관없음
              </label>
            </div>

            {/* 다음 버튼 */}
            <Link
              href="/order"
              className="flex min-h-[72px] items-center justify-center rounded-xl bg-orange-600 px-6 text-base font-bold text-white transition hover:bg-orange-500 sm:min-h-[96px] sm:px-8 sm:text-lg"
            >
              다음
              <svg
                className="ml-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>

          {/* 시간 상관없음 안내 */}
          {(pickupAnytime || dropoffAnytime) && (
            <div className="mt-3 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">
              배차 후 운송차주가 예상 시간을 알려드립니다.
            </div>
          )}
        </div>

        {/* 운송 종류 */}
<div className="mt-5 flex flex-wrap gap-3">
  {[
    { name: "컨테이너", icon: "/container.png" },
    { name: "건설장비", icon: "/construction.png" },
    { name: "중량물", icon: "/heavy-cargo.png" },
  ].map((item) => (
    <div
      key={item.name}
      className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/50 px-4 py-3 text-sm text-white backdrop-blur"
    >
      <img
        src={item.icon}
        alt={item.name}
        className="h-10 w-10 object-contain"
      />
      <span className="font-medium">{item.name}</span>
    </div>
  ))}
</div>

        {/* 운송차주 등록 */}
        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-gray-300">
          <span>운송차주이신가요?</span>

          <Link
            href="/driver/register"
            className="font-semibold text-orange-400 transition hover:text-orange-300"
          >
            운송차주 등록 →
          </Link>
        </div>
      </div>
    </section>
  );
}