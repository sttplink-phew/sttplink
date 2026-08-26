"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

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

type RegionType =
  | ""
  | "여수"
  | "셔틀"
  | "기타지역";

type TerminalCode =
  | "GWCT"
  | "KITL"
  | null;

export default function TerminalPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  // =====================================
  // 차량번호
  // =====================================

  const [
    vehicleNumber,
    setVehicleNumber,
  ] = useState("");

  const [
    loadingVehicle,
    setLoadingVehicle,
  ] = useState(true);

  // =====================================
  // 1차 조회
  // =====================================

  const [gwctInfo, setGwctInfo] =
    useState<TerminalInfo | null>(null);

  const [kitlInfo, setKitlInfo] =
    useState<TerminalInfo | null>(null);

  const [
    terminalPolling,
    setTerminalPolling,
  ] = useState(false);

  // =====================================
  // 2차 조회
  // =====================================

  const [
    workInfo,
    setWorkInfo,
  ] = useState<TerminalInfo | null>(
    null
  );

  const [
    workTerminal,
    setWorkTerminal,
  ] = useState<TerminalCode>(null);

  const [
    workLoading,
    setWorkLoading,
  ] = useState(false);

  const [
    workMessage,
    setWorkMessage,
  ] = useState("");

  // =====================================
  // 저장
  // =====================================

  const [
    normalConfirmed,
    setNormalConfirmed,
  ] = useState(false);

  const [
    region,
    setRegion,
  ] = useState<RegionType>("");

  const [
    regionCustom,
    setRegionCustom,
  ] = useState("");

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [
    saveStatus,
    setSaveStatus,
  ] = useState("");

  // =====================================
  // 차량번호 불러오기
  // =====================================

  useEffect(() => {
    async function loadVehicle() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setVehicleNumber("");
          return;
        }

        const {
          data,
          error,
        } = await supabase
          .from("drivers")
          .select("vehicle_number")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error(
            "차량번호 조회 실패:",
            error
          );

          setVehicleNumber("");
          return;
        }

        setVehicleNumber(
          data?.vehicle_number ?? ""
        );
      } finally {
        setLoadingVehicle(false);
      }
    }

    loadVehicle();
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
  // 공통 터미널 조회 함수
  // =====================================

  async function fetchTerminal(
    terminal: "GWCT" | "KITL",
    phase: "pre" | "post"
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
            phase,
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
  //
  // GWCT + KITL 동시 조회
  // =====================================

  async function checkFirstInfo() {
    const truckNo =
      getTruckNo();

    if (!truckNo) {
      return false;
    }

    const [gwct, kitl] =
      await Promise.all([
        fetchTerminal(
          "GWCT",
          "pre"
        ),

        fetchTerminal(
          "KITL",
          "pre"
        ),
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

    // ---------------------------------
    // 중요
    //
    // 어느 쪽이든 정보가 생기면
    // 자동조회 종료
    // ---------------------------------

    const foundInfo =
      Boolean(gwct?.hasInfo) ||
      Boolean(kitl?.hasInfo);

    if (foundInfo) {
      setTerminalPolling(false);
    }

    return foundInfo;
  }

  // =====================================
  // 1차 30초 자동 재조회
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
  // 1차 조회 시작 / 중지
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

    // 새 1차 조회
    setGwctInfo(null);
    setKitlInfo(null);

    setTerminalPolling(true);
  }

  // =====================================
  // 1차에서 확인된 터미널
  // =====================================

  const firstTerminal:
    TerminalCode =
      gwctInfo?.hasInfo
        ? "GWCT"
        : kitlInfo?.hasInfo
          ? "KITL"
          : null;

  // =====================================
  // 2차 조회
  //
  // 자동재조회 없음
  // 사용자가 원하는 만큼 재조회 가능
  // =====================================

  async function checkWorkInfo() {
    const truckNo =
      getTruckNo();

    if (!truckNo) {
      alert(
        "차량번호 뒤 4자리를 확인해주세요."
      );

      return;
    }

    // 2차를 누르면
    // 1차 자동조회는 무조건 중지
    setTerminalPolling(false);

    setWorkLoading(true);

    setWorkMessage(
      "게이트 통과 후 정보를 조회 중입니다..."
    );

    // ---------------------------------
    // 재조회 시 기존 작업정보 제거
    // ---------------------------------

    setWorkInfo(null);
    setWorkTerminal(null);

    // ---------------------------------
    // 재조회 시 반드시 정상확인 해제
    //
    // 컨테이너/장치장 변경 가능성 때문
    // ---------------------------------

    setNormalConfirmed(false);

    // ---------------------------------
    // 지역은 유지
    // ---------------------------------

    setSaved(false);
    setSaveStatus("");

    try {
      // =================================
      // 1차에서 터미널이 확인된 경우
      // 해당 터미널만 1회 조회
      // =================================

      if (firstTerminal) {
        const result =
          await fetchTerminal(
            firstTerminal,
            "post"
          );

        if (
          result?.hasInfo ||
          result?.hasAnyInfo
        ) {
          setWorkInfo(result);

          setWorkTerminal(
            firstTerminal
          );

          setWorkMessage("");

          return;
        }

        setWorkMessage(
          "현재 작업정보가 없습니다."
        );

        return;
      }

      // =================================
      // 1차를 하지 않은 경우
      //
      // GWCT + KITL 동시에 1회 조회
      // =================================

      const [gwct, kitl] =
        await Promise.all([
          fetchTerminal(
            "GWCT",
            "post"
          ),

          fetchTerminal(
            "KITL",
            "post"
          ),
        ]);

      // GWCT 우선
      if (gwct?.hasInfo) {
        setWorkInfo(gwct);

        setWorkTerminal(
          "GWCT"
        );

        setGwctInfo(gwct);

        setWorkMessage("");

        return;
      }

      // KITL
      if (kitl?.hasInfo) {
        setWorkInfo(kitl);

        setWorkTerminal(
          "KITL"
        );

        setKitlInfo(kitl);

        setWorkMessage("");

        return;
      }

      // active가 아니더라도
      // 데이터가 있는 경우
      if (gwct?.hasAnyInfo) {
        setWorkInfo(gwct);

        setWorkTerminal(
          "GWCT"
        );

        setWorkMessage("");

        return;
      }

      if (kitl?.hasAnyInfo) {
        setWorkInfo(kitl);

        setWorkTerminal(
          "KITL"
        );

        setWorkMessage("");

        return;
      }

      setWorkMessage(
        "현재 작업정보가 없습니다."
      );
    } catch (error) {
      console.error(
        "2차 작업정보 조회 실패:",
        error
      );

      setWorkMessage(
        "작업정보 조회 중 오류가 발생했습니다."
      );
    } finally {
      setWorkLoading(false);
    }
  }

  // =====================================
  // 표시용
  // =====================================

  const gwctItems = [
    ...(gwctInfo?.inbound ?? []),
    ...(gwctInfo?.outbound ?? []),
  ];

  const kitlItems = [
    ...(kitlInfo?.inbound ?? []),
    ...(kitlInfo?.outbound ?? []),
  ].filter(
    (item) => !item.completed
  );

  const workItems = [
    ...(workInfo?.inbound ?? []),
    ...(workInfo?.outbound ?? []),
  ];

  const workItem =
    workItems.length > 0
      ? workItems[0]
      : null;

  const workTerminalName =
    workTerminal === "GWCT"
      ? "대통"
      : workTerminal === "KITL"
        ? "국제"
        : "";

  // =====================================
  // 운행일지 저장
  // =====================================

  async function saveTripLog() {
    setSaveStatus(
      "저장 준비 중..."
    );

    if (!workItem) {
      setSaveStatus(
        "❌ 저장할 작업정보가 없습니다."
      );

      return;
    }

    if (!normalConfirmed) {
      setSaveStatus(
        "❌ 정상 반입/반출 확인이 필요합니다."
      );

      return;
    }

    if (!region) {
      setSaveStatus(
        "❌ 지역을 선택해주세요."
      );

      return;
    }

    if (
      region === "기타지역" &&
      !regionCustom.trim()
    ) {
      setSaveStatus(
        "❌ 기타지역을 입력해주세요."
      );

      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        setSaveStatus(
          "❌ 로그인 사용자 확인 실패"
        );

        return;
      }

      const direction =
        workItem.type === "반출"
          ? "OUT"
          : "IN";

      const sizeText =
        workItem.size ||
        workItem.sizeType ||
        workItem.rawSize ||
        "";

      const sizeMatch =
        sizeText.match(/20|40/);

      const containerSize =
        sizeMatch
          ? Number(
              sizeMatch[0]
            )
          : null;

      setSaveStatus(
        "Supabase에 저장 중..."
      );

      const { error } =
        await supabase
          .from("trip_logs")
          .insert({
            user_id:
              user.id,

            terminal:
              workTerminal ||
              workInfo?.terminal ||
              null,

            direction,

            container_no:
              workItem.containerNo ||
              null,

              container_size:
              containerSize,
            
            container_status:
              workItem.fe || null,
            
            region,

            region_custom:
              region ===
              "기타지역"
                ? regionCustom.trim()
                : null,

            yard_location:
              workItem.yardLocation ||
              null,

            is_dangerous:
              false,

            entry_source:
              "TERMINAL",
          });

      if (error) {
        if (
          error.code === "23505"
        ) {
          setSaveStatus(
            "⚠️ 이미 저장된 운행입니다."
          );

          return;
        }

        setSaveStatus(
          `❌ 저장 실패: ${error.code} / ${error.message}`
        );

        return;
      }

      setSaved(true);

      setSaveStatus(
        "✅ 운행일지 저장 완료"
      );
    } catch (error) {
      setSaveStatus(
        `❌ 예외 발생: ${
          error instanceof Error
            ? error.message
            : "알 수 없는 오류"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // 화면
  // =====================================

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-xl">
        {/* 헤더 */}

        <header className="flex items-center justify-between">
          <div>
            <div className="text-xs font-black text-orange-500">
              STTP LINK
            </div>

            <h1 className="mt-1 text-2xl font-black">
              터미널 정보
            </h1>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-zinc-300"
          >
            홈
          </Link>
        </header>

        {/* 차량정보 */}

        <div className="mt-3 text-sm text-zinc-400">
          {loadingVehicle
            ? "차량정보 확인 중..."
            : vehicleNumber
              ? `내 차량 ${vehicleNumber}`
              : "차량번호 등록 필요"}
        </div>

        {/* ================================= */}
        {/* 1차 */}
        {/* ================================= */}

        <section className="mt-6 rounded-2xl border border-white/10 bg-zinc-950 p-5">
          <div className="text-sm font-black text-orange-400">
            게이트 진입 전
          </div>

          <h2 className="mt-1 text-xl font-black">
            배차정보 조회
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            대통과 국제를 동시에
            조회합니다. 둘 다 정보가
            없을 때만 30초마다 자동으로
            다시 조회합니다.
          </p>

          <button
            type="button"
            onClick={togglePolling}
            disabled={
              loadingVehicle ||
              !vehicleNumber
            }
            className={`mt-4 h-16 w-full rounded-2xl text-lg font-black transition active:scale-[0.99] disabled:opacity-40 ${
              terminalPolling
                ? "bg-zinc-700"
                : "bg-orange-600"
            }`}
          >
            {terminalPolling
              ? "조회 중지"
              : "정보 조회 시작"}
          </button>

          {terminalPolling && (
            <div className="mt-3 text-center text-sm font-bold text-orange-400">
              정보 없음 · 30초 자동 재조회 중
            </div>
          )}
        </section>

        {/* ================================= */}
        {/* GWCT */}
        {/* ================================= */}

        <section className="mt-4 rounded-2xl border border-white/10 bg-zinc-900 p-5">
          <div className="text-lg font-black">
            대통(GWCT)
          </div>

          {gwctInfo?.hasInfo ? (
            <div className="mt-4 space-y-3">
              <div className="font-bold text-orange-400">
                반입{" "}
                {gwctInfo.counts
                  ?.inbound ?? 0}
                건 · 반출{" "}
                {gwctInfo.counts
                  ?.outbound ?? 0}
                건
              </div>

              {gwctItems.map(
                (item, index) => (
                  <div
                    key={`${item.containerNo}-${index}`}
                    className="rounded-xl bg-black p-4"
                  >
                    <div className="text-lg font-black text-orange-400">
                      {item.type ||
                        "-"}
                    </div>

                    <div className="mt-1 text-xl font-black">
                      {item.containerNo ||
                        "-"}
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-zinc-400">
                      <div>
                        선사:{" "}
                        {item.shippingLine ||
                          "-"}
                      </div>

                      <div>
                        규격:{" "}
                        {item.size
                          ? `${item.size}FT`
                          : item.rawSize ||
                            "-"}
                      </div>

                      <div>
                        F/E:{" "}
                        {item.fe ||
                          "-"}
                      </div>

                      <div>
                        상태:{" "}
                        {item.status ||
                          "-"}
                      </div>

                      {item.waitingCount && (
                        <div>
                          대기수량:{" "}
                          {
                            item.waitingCount
                          }
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : gwctInfo ? (
            <div className="mt-3 text-zinc-500">
              정보 없음
            </div>
          ) : (
            <div className="mt-3 text-zinc-600">
              조회 대기
            </div>
          )}
        </section>

        {/* ================================= */}
        {/* KITL */}
        {/* ================================= */}

        <section className="mt-4 rounded-2xl border border-white/10 bg-zinc-900 p-5">
          <div className="text-lg font-black">
            국제(KITL)
          </div>

          {kitlInfo?.hasInfo ? (
            <div className="mt-4 space-y-3">
              <div className="font-bold text-blue-400">
                반입{" "}
                {kitlInfo.counts
                  ?.inbound ?? 0}
                건 · 반출{" "}
                {kitlInfo.counts
                  ?.outbound ?? 0}
                건
              </div>

              {kitlItems.map(
                (item, index) => (
                  <div
                    key={`${item.containerNo}-${index}`}
                    className="rounded-xl bg-black p-4"
                  >
                    <div className="text-lg font-black text-blue-400">
                      {item.type ||
                        "-"}
                    </div>

                    <div className="mt-1 text-xl font-black">
                      {item.containerNo ||
                        "-"}
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-zinc-400">
                      <div>
                        규격/구분:{" "}
                        {item.sizeType ||
                          item.size ||
                          "-"}
                      </div>

                      <div>
                        상태:{" "}
                        {item.shippingStatus ||
                          item.status ||
                          "-"}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : kitlInfo?.hasAnyInfo ? (
            <div className="mt-3 text-zinc-500">
              완료된 정보만 있음
            </div>
          ) : kitlInfo ? (
            <div className="mt-3 text-zinc-500">
              정보 없음
            </div>
          ) : (
            <div className="mt-3 text-zinc-600">
              조회 대기
            </div>
          )}
        </section>

        {/* ================================= */}
        {/* 2차 */}
        {/* ================================= */}

        <section className="mt-7 rounded-2xl border border-orange-500/30 bg-zinc-950 p-5">
          <div className="text-sm font-black text-orange-400">
            게이트 통과 후
          </div>

          <h2 className="mt-1 text-xl font-black">
            작업정보 조회
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            1차 조회를 하지 않았어도
            바로 조회할 수 있습니다.
            자동 재조회는 하지 않으며,
            컨테이너 또는 장치장이 변경된
            경우 직접 재조회하면 됩니다.
          </p>

          <button
            type="button"
            onClick={checkWorkInfo}
            disabled={
              workLoading ||
              loadingVehicle ||
              !vehicleNumber
            }
            className="mt-4 h-16 w-full rounded-2xl border border-orange-500 bg-orange-500/10 text-lg font-black text-orange-400 transition active:scale-[0.99] disabled:opacity-40"
          >
            {workLoading
              ? "작업정보 조회 중..."
              : workInfo
                ? "작업정보 재조회"
                : "게이트 통과 후 조회"}
          </button>

          <div className="mt-2 text-center text-xs text-zinc-600">
            재조회 시 최신 컨테이너와
            장치장 정보로 교체됩니다.
          </div>

          {workMessage && (
            <div className="mt-4 rounded-xl bg-zinc-900 p-4 text-center text-sm font-bold text-zinc-400">
              {workMessage}
            </div>
          )}

          {/* ================================= */}
          {/* 작업정보 */}
          {/* ================================= */}

          {workInfo &&
            workItem && (
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl border border-white/10 bg-black p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-zinc-500">
                        {
                          workTerminalName
                        }{" "}
                        (
                        {workTerminal}
                        )
                      </div>

                      <div
                        className={`mt-1 text-2xl font-black ${
                          workItem.type ===
                          "반출"
                            ? "text-blue-400"
                            : "text-orange-400"
                        }`}
                      >
                        {workItem.type ||
                          "-"}
                      </div>
                    </div>

                    <div className="rounded-xl bg-zinc-900 px-4 py-2 font-black">
                      {workItem.size
                        ? `${workItem.size}FT`
                        : workItem.sizeType ||
                          workItem.rawSize ||
                          "-"}
                    </div>
                  </div>

                  {/* 컨테이너 */}

                  <div className="mt-5">
                    <div className="text-xs font-bold text-zinc-600">
                      컨테이너 번호
                    </div>

                    <div className="mt-1 text-2xl font-black tracking-wide">
                      {workItem.containerNo ||
                        "-"}
                    </div>
                  </div>

                  {/* 장치장 */}

                  <div className="mt-4 rounded-xl bg-zinc-900 p-4">
                    <div className="text-xs font-bold text-zinc-600">
                      장치장 위치
                    </div>

                    <div className="mt-1 text-3xl font-black text-orange-400">
                      {workItem.yardLocation ||
                        "-"}
                    </div>
                  </div>

                  {/* 정보 */}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-zinc-900 p-3">
                      <div className="text-xs text-zinc-600">
                        FULL / EMPTY
                      </div>

                      <div className="mt-1 font-black">
                        {workItem.fe ||
                          workItem.sizeType ||
                          "-"}
                      </div>
                    </div>

                    <div className="rounded-xl bg-zinc-900 p-3">
                      <div className="text-xs text-zinc-600">
                        상태
                      </div>

                      <div className="mt-1 font-black">
                        {workItem.status ||
                          workItem.shippingStatus ||
                          "-"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================================= */}
                {/* 정상 확인 */}
                {/* ================================= */}

                <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-5">
                  <input
                    type="checkbox"
                    checked={
                      normalConfirmed
                    }
                    onChange={(event) =>
                      setNormalConfirmed(
                        event.target.checked
                      )
                    }
                    className="h-7 w-7 shrink-0 accent-orange-600"
                  />

                  <div>
                    <div className="text-lg font-black">
                      정상{" "}
                      {workItem.type ||
                        "작업"}{" "}
                      확인
                    </div>

                    <div className="mt-1 text-sm text-zinc-500">
                      최종 정상 처리된
                      컨테이너만 저장합니다.
                    </div>
                  </div>
                </label>

                {/* ================================= */}
                {/* 지역 */}
                {/* ================================= */}

                <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
                  <div className="text-lg font-black">
                    지역
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      "여수",
                      "셔틀",
                      "기타지역",
                    ].map(
                      (value) => (
                        <button
                          key={
                            value
                          }
                          type="button"
                          onClick={() =>
                            setRegion(
                              value as RegionType
                            )
                          }
                          className={`h-14 rounded-xl text-sm font-black ${
                            region ===
                            value
                              ? "bg-orange-600 text-white"
                              : "bg-black text-zinc-500"
                          }`}
                        >
                          {value}
                        </button>
                      )
                    )}
                  </div>

                  {region ===
                    "기타지역" && (
                    <input
                      type="text"
                      value={
                        regionCustom
                      }
                      onChange={(
                        event
                      ) =>
                        setRegionCustom(
                          event.target
                            .value
                        )
                      }
                      placeholder="지역 직접 입력"
                      className="mt-3 h-14 w-full rounded-xl border border-white/10 bg-black px-4 text-lg font-bold outline-none focus:border-orange-500"
                    />
                  )}
                </div>

                {/* ================================= */}
                {/* 저장 상태 */}
                {/* ================================= */}

                {saveStatus && (
                  <div className="rounded-xl border border-white/10 bg-black p-4 text-center text-sm font-bold">
                    {saveStatus}
                  </div>
                )}

                {/* ================================= */}
                {/* 저장 */}
                {/* ================================= */}

                <button
                  type="button"
                  onClick={
                    saveTripLog
                  }
                  disabled={
                    saving ||
                    saved
                  }
                  className={`h-16 w-full rounded-2xl text-lg font-black transition active:scale-[0.99] disabled:opacity-70 ${
                    saved
                      ? "bg-green-700"
                      : workItem.type ===
                          "반출"
                        ? "bg-blue-600"
                        : "bg-orange-600"
                  }`}
                >
                  {saving
                    ? "저장 중..."
                    : saved
                      ? "저장 완료"
                      : `정상 ${
                          workItem.type ||
                          "작업"
                        } 저장`}
                </button>
              </div>
            )}
        </section>

        <div className="h-10" />
      </div>
    </main>
  );
}