"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

type TerminalInfo = {
  hasInfo?: boolean;
  hasAnyInfo?: boolean;
  counts?: {
    inbound?: number;
    outbound?: number;
  };
};

export default function TerminalPage() {
  const supabase = useMemo(() => createClient(), []);

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [loadingVehicle, setLoadingVehicle] = useState(true);

  const [gwctInfo, setGwctInfo] = useState<TerminalInfo | null>(null);
  const [kitlInfo, setKitlInfo] = useState<TerminalInfo | null>(null);

  const [terminalPolling, setTerminalPolling] = useState(false);

  useEffect(() => {
    async function loadVehicleNumber() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setVehicleNumber("");
          return;
        }

        const { data: driver, error } = await supabase
          .from("drivers")
          .select("vehicle_number")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("차량번호 조회 실패:", error);
          setVehicleNumber("");
          return;
        }

        setVehicleNumber(driver?.vehicle_number ?? "");
      } finally {
        setLoadingVehicle(false);
      }
    }

    loadVehicleNumber();
  }, [supabase]);

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

if (data?.hasInfo) {
  setTerminalPolling(false);
}
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

if (data?.hasInfo) {
  setTerminalPolling(false);
}
    } catch (error) {
      console.error("KITL 조회 실패:", error);
    }
  }

  useEffect(() => {
    if (!terminalPolling || !vehicleNumber) return;

    checkGwct();
    checkKitl();

    const timer = setInterval(() => {
      checkGwct();
      checkKitl();
    }, 30000);

    return () => clearInterval(timer);
  }, [terminalPolling, vehicleNumber]);

  function togglePolling() {
    setTerminalPolling((prev) => !prev);
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-xl">
      <div className="flex items-center justify-between">
  <h1 className="text-2xl font-black">터미널 정보</h1>

  <Link
  href="/"
  className="rounded-xl border ..."
>
  홈
</Link>
</div>

        <div className="mt-2 text-sm text-zinc-400">
          {loadingVehicle
            ? "차량정보 확인 중..."
            : vehicleNumber
            ? `내 차량 ${vehicleNumber}`
            : "차량정보 등록 필요"}
        </div>

        <button
          type="button"
          onClick={togglePolling}
          disabled={!vehicleNumber || loadingVehicle}
          className="mt-6 w-full rounded-xl bg-orange-600 px-4 py-3 font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {terminalPolling ? "조회 중지" : "정보 조회 시작"}
        </button>

        {terminalPolling && (
          <div className="mt-2 text-center text-xs text-zinc-500">
            대통 · 국제 1분 간격 자동조회 중
          </div>
        )}

        <section className="mt-6 rounded-2xl border border-white/10 bg-zinc-900 p-5">
          <div className="text-lg font-black">대통(GWCT)</div>

          {gwctInfo?.hasInfo ? (
            <div className="mt-2 text-orange-400">
              반입 {gwctInfo.counts?.inbound ?? 0}건 · 반출{" "}
              {gwctInfo.counts?.outbound ?? 0}건
            </div>
          ) : gwctInfo ? (
            <div className="mt-2 text-zinc-400">정보 없음</div>
          ) : terminalPolling ? (
            <div className="mt-2 text-zinc-400">조회중...</div>
          ) : (
            <div className="mt-2 text-zinc-400">조회 대기</div>
          )}
        </section>

        <section className="mt-4 rounded-2xl border border-white/10 bg-zinc-900 p-5">
          <div className="text-lg font-black">국제(KITL)</div>

          {kitlInfo?.hasInfo ? (
            <div className="mt-2 text-blue-400">
              반입 {kitlInfo.counts?.inbound ?? 0}건 · 반출{" "}
              {kitlInfo.counts?.outbound ?? 0}건
            </div>
          ) : kitlInfo?.hasAnyInfo ? (
            <div className="mt-2 text-zinc-400">
              완료된 정보만 있음
            </div>
          ) : kitlInfo ? (
            <div className="mt-2 text-zinc-400">정보 없음</div>
          ) : terminalPolling ? (
            <div className="mt-2 text-zinc-400">조회중...</div>
          ) : (
            <div className="mt-2 text-zinc-400">조회 대기</div>
          )}
        </section>
      </div>
    </main>
  );
}