"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  | "부산"
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
  // 선택 터미널
  // =====================================

  const [
    selectedTerminal,
    setSelectedTerminal,
  ] = useState<TerminalCode>(null);

  // =====================================
  // 2차 작업정보
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
  // 정상 작업 / 지역 / 저장
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

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    saved,
    setSaved,
  ] = useState(false);

  const [
    saveStatus,
    setSaveStatus,
  ] = useState("");

  // =====================================
  // 컨테이너 번호 복사
  // =====================================

  const [
    copyStatus,
    setCopyStatus,
  ] = useState("");

  // =====================================
  // 타 차량 장치장 조회
  // =====================================

  const [
    otherTruckNo,
    setOtherTruckNo,
  ] = useState("");

  const [
    otherLoading,
    setOtherLoading,
  ] = useState(false);

  const [
    otherMessage,
    setOtherMessage,
  ] = useState("");

  const [
    otherItem,
    setOtherItem,
  ] = useState<TerminalItem | null>(
    null
  );

  // =====================================
  // 메인에서 넘어온 터미널 자동조회 방지
  // =====================================

  const autoStartedRef =
    useRef(false);

  // =====================================
  // 차량번호 불러오기
  // =====================================

  useEffect(() => {
    async function loadVehicle() {
      try {
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

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
  // 공통 터미널 조회
  // =====================================

  async function fetchTerminal(
    terminal: "GWCT" | "KITL",
    phase: "pre" | "post",
    truckNoOverride?: string
  ): Promise<TerminalInfo | null> {
    const truckNo =
      truckNoOverride ||
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
  // 조회 결과에서 실제 작업항목 뽑기
  // =====================================

  function pickWorkItem(
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

  // =====================================
  // 2차 조회
  // 선택한 터미널 한 곳만 조회
  // =====================================

  async function checkWorkInfo(
    terminal: "GWCT" | "KITL"
  ) {
    const truckNo =
      getTruckNo();

    if (!truckNo) {
      alert(
        "차량번호 뒤 4자리를 확인해주세요."
      );

      return;
    }

    setSelectedTerminal(terminal);

    setWorkLoading(true);

    setWorkMessage(
      "게이트 통과 후 정보를 조회 중입니다..."
    );

    // 새 조회 시 기존 정보 제거
    setWorkInfo(null);
    setWorkTerminal(null);

    // 컨테이너 교체 가능성이 있으므로
    // 정상확인 / 저장상태 초기화
    setNormalConfirmed(false);
    setSaved(false);
    setSaveStatus("");
    setCopyStatus("");

    // 타 차량 조회 결과도 초기화
    setOtherItem(null);
    setOtherMessage("");

    try {
      const result =
        await fetchTerminal(
          terminal,
          "post"
        );

      if (
        result?.hasInfo ||
        result?.hasAnyInfo
      ) {
        setWorkInfo(result);
        setWorkTerminal(terminal);
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
  // 메인에서 터미널 지정 후 들어온 경우
  //
  // /terminal?terminal=GWCT
  // /terminal?terminal=KITL
  // =====================================

  useEffect(() => {
    if (
      loadingVehicle ||
      !vehicleNumber ||
      autoStartedRef.current
    ) {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    const terminal =
      params.get("terminal");

    if (
      terminal !== "GWCT" &&
      terminal !== "KITL"
    ) {
      return;
    }

    autoStartedRef.current = true;

    setSelectedTerminal(terminal);

    checkWorkInfo(terminal);
  }, [
    loadingVehicle,
    vehicleNumber,
  ]);

  // =====================================
  // 작업 표시용
  // =====================================

  const workItem =
    pickWorkItem(workInfo);

  const workTerminalName =
    workTerminal === "GWCT"
      ? "대통"
      : workTerminal === "KITL"
        ? "국제"
        : "";

  const selectedTerminalName =
    selectedTerminal === "GWCT"
      ? "대통"
      : selectedTerminal === "KITL"
        ? "국제"
        : "";

  // =====================================
  // 컨테이너 번호 복사
  // 반출에만 표시
  // =====================================

  async function copyContainerNumber() {
    const containerNo =
      workItem?.containerNo;

    if (!containerNo) {
      setCopyStatus("복사 실패");
      return;
    }

    try {
      await navigator.clipboard.writeText(
        containerNo
      );

      setCopyStatus("복사 완료 ✓");

      window.setTimeout(() => {
        setCopyStatus("");
      }, 2000);
    } catch (error) {
      console.error(
        "컨테이너 번호 복사 실패:",
        error
      );

      setCopyStatus("복사 실패");
    }
  }

  // =====================================
  // 타 차량 장치장 조회
  //
  // 현재 선택된 터미널 한 곳만 조회
  // DB 저장 없음
  // =====================================

  async function checkOtherTruck() {
    const truckNo =
      otherTruckNo.trim();

    if (!selectedTerminal) {
      setOtherMessage(
        "먼저 대통 또는 국제를 선택해주세요."
      );

      return;
    }

    if (!/^\d{4}$/.test(truckNo)) {
      setOtherMessage(
        "차량번호 뒤 4자리를 입력해주세요."
      );

      return;
    }

    setOtherLoading(true);
    setOtherMessage(
      "장치장 조회 중..."
    );
    setOtherItem(null);

    try {
      const result =
        await fetchTerminal(
          selectedTerminal,
          "post",
          truckNo
        );

      const item =
        pickWorkItem(result);

      if (!item) {
        setOtherMessage(
          "현재 조회되는 장치장 정보가 없습니다."
        );

        return;
      }

      setOtherItem(item);
      setOtherMessage("");
    } catch (error) {
      console.error(
        "타 차량 조회 실패:",
        error
      );

      setOtherMessage(
        "장치장 조회 중 오류가 발생했습니다."
      );
    } finally {
      setOtherLoading(false);
    }
  }

  // =====================================
  // 운행일지 저장
  //
  // 장치장은 저장하지 않음
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
      } =
        await supabase.auth.getUser();

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
        "운행일지 저장 중..."
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
              workItem.fe ||
              null,

            region,

            region_custom:
              region ===
              "기타지역"
                ? regionCustom.trim()
                : null,

            // 장치장 위치는
            // 현장 조회용 정보이므로
            // trip_logs에 저장하지 않음

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
        "✅ 작업 완료 · 운행일지 저장 완료"
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
        {/* ================================= */}
        {/* 헤더 */}
        {/* ================================= */}

        <header className="flex items-center justify-between">
          <div>
            <div className="text-xs font-black text-orange-500">
              STTP LINK
            </div>

            <h1 className="mt-1 text-2xl font-black">
              터미널 작업정보
            </h1>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-zinc-300"
          >
            홈
          </Link>
        </header>

        {/* ================================= */}
        {/* 차량정보 */}
        {/* ================================= */}

        <div className="mt-3 text-sm text-zinc-400">
          {loadingVehicle
            ? "차량정보 확인 중..."
            : vehicleNumber
              ? `내 차량 ${vehicleNumber}`
              : "차량번호 등록 필요"}
        </div>

        {/* ================================= */}
        {/* 터미널 선택 / 2차 조회 */}
        {/* ================================= */}

        <section className="mt-6 rounded-2xl border border-orange-500/30 bg-zinc-950 p-5">
          <div className="text-sm font-black text-orange-400">
            게이트 통과 후
          </div>

          <h2 className="mt-1 text-xl font-black">
            작업정보 조회
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            게이트를 통과한 터미널을 선택하면
            해당 터미널 한 곳만 조회합니다.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={
                loadingVehicle ||
                !vehicleNumber ||
                workLoading
              }
              onClick={() =>
                checkWorkInfo("GWCT")
              }
              className={`h-20 rounded-2xl border text-lg font-black transition active:scale-[0.98] disabled:opacity-40 ${
                selectedTerminal === "GWCT"
                  ? "border-orange-400 bg-orange-600 text-white shadow-[0_0_28px_rgba(249,115,22,0.55)]"
                  : "border-white/10 bg-zinc-900 text-zinc-400"
              }`}
            >
              <div>대통</div>
              <div className="mt-1 text-xs opacity-70">
                GWCT
              </div>
            </button>

            <button
              type="button"
              disabled={
                loadingVehicle ||
                !vehicleNumber ||
                workLoading
              }
              onClick={() =>
                checkWorkInfo("KITL")
              }
              className={`h-20 rounded-2xl border text-lg font-black transition active:scale-[0.98] disabled:opacity-40 ${
                selectedTerminal === "KITL"
                  ? "border-orange-400 bg-orange-600 text-white shadow-[0_0_28px_rgba(249,115,22,0.55)]"
                  : "border-white/10 bg-zinc-900 text-zinc-400"
              }`}
            >
              <div>국제</div>
              <div className="mt-1 text-xs opacity-70">
                KITL
              </div>
            </button>
          </div>

          <div className="mt-3 text-center text-sm font-bold text-zinc-500">
            {workLoading
              ? `${
                  selectedTerminalName ||
                  "터미널"
                } 작업정보 조회 중...`
              : selectedTerminal
                ? `${selectedTerminalName} 선택됨 · 다시 누르면 최신정보 재조회`
                : "대통 또는 국제를 선택하세요."}
          </div>

          {workMessage && (
            <div className="mt-4 rounded-xl bg-zinc-900 p-4 text-center text-sm font-bold text-zinc-400">
              {workMessage}
            </div>
          )}
        </section>

        {/* ================================= */}
        {/* 내 작업정보 */}
        {/* ================================= */}

        {workInfo &&
          workItem && (
            <section className="mt-5 space-y-5">
              <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-zinc-500">
                      {workTerminalName}{" "}
                      ({workTerminal})
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

                {/* 컨테이너 번호 */}

                <div className="mt-5">
                  <div className="text-xs font-bold text-zinc-600">
                    컨테이너 번호
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div className="text-2xl font-black tracking-wide">
                      {workItem.containerNo ||
                        "-"}
                    </div>

                    {workItem.type ===
                      "반출" &&
                      workItem.containerNo && (
                        <button
                          type="button"
                          onClick={
                            copyContainerNumber
                          }
                          className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-400 transition active:scale-[0.98]"
                        >
                          {copyStatus ||
                            "번호 복사하기"}
                        </button>
                      )}
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

                {/* 자동정보 */}

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
              {/* 타 차량 장치장 조회 */}
              {/* ================================= */}

              <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
                <div className="text-sm font-black text-orange-400">
                  타 차량 장치장 조회
                </div>

                <div className="mt-1 text-xs leading-5 text-zinc-600">
                  {selectedTerminalName} 터미널의
                  차량번호 뒤 4자리로 조회합니다.
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={4}
                    value={otherTruckNo}
                    onChange={(event) => {
                      const value =
                        event.target.value.replace(
                          /\D/g,
                          ""
                        );

                      setOtherTruckNo(
                        value.slice(0, 4)
                      );
                    }}
                    placeholder="차량번호 뒤 4자리"
                    className="h-14 min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-900 px-4 text-lg font-black outline-none focus:border-orange-500"
                  />

                  <button
                    type="button"
                    disabled={
                      otherLoading ||
                      !selectedTerminal
                    }
                    onClick={
                      checkOtherTruck
                    }
                    className="h-14 shrink-0 rounded-xl bg-orange-600 px-5 text-sm font-black disabled:opacity-40"
                  >
                    {otherLoading
                      ? "조회 중"
                      : "조회"}
                  </button>
                </div>

                {otherMessage && (
                  <div className="mt-3 text-center text-sm font-bold text-zinc-500">
                    {otherMessage}
                  </div>
                )}

                {otherItem && (
                  <div className="mt-4 rounded-2xl bg-zinc-900 p-5 text-center">
                    <div className="text-xs font-bold text-zinc-600">
                      장치장 위치
                    </div>

                    <div className="mt-1 text-3xl font-black text-orange-400">
                      {otherItem.yardLocation ||
                        "-"}
                    </div>

                    {otherItem.containerNo && (
                      <div className="mt-2 text-sm font-bold text-zinc-500">
                        {
                          otherItem.containerNo
                        }
                      </div>
                    )}
                  </div>
                )}
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
                    컨테이너만 운행일지에
                    저장합니다.
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

                <div className="mt-2 text-sm text-zinc-500">
                  실제 운행 지역만 선택하세요.
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    "여수",
                    "셔틀",
                    "부산",
                    "기타지역",
                  ].map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setRegion(
                            value as RegionType
                          )
                        }
                        className={`h-14 rounded-xl text-sm font-black ${
                          region === value
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
              {/* 저장상태 */}
              {/* ================================= */}

              {saveStatus && (
                <div className="rounded-xl border border-white/10 bg-black p-4 text-center text-sm font-bold">
                  {saveStatus}
                </div>
              )}

              {/* ================================= */}
              {/* 작업 완료 */}
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
                    ? "작업 완료 ✓"
                    : "작업 완료"}
              </button>
            </section>
          )}

        {/* ================================= */}
        {/* 작업정보 없더라도 타차량 조회 가능 */}
        {/* ================================= */}

        {selectedTerminal &&
          !workItem && (
            <section className="mt-5 rounded-2xl border border-white/10 bg-zinc-950 p-5">
              <div className="text-sm font-black text-orange-400">
                타 차량 장치장 조회
              </div>

              <div className="mt-1 text-xs text-zinc-600">
                {selectedTerminalName} 터미널
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={4}
                  value={otherTruckNo}
                  onChange={(event) => {
                    const value =
                      event.target.value.replace(
                        /\D/g,
                        ""
                      );

                    setOtherTruckNo(
                      value.slice(0, 4)
                    );
                  }}
                  placeholder="차량번호 뒤 4자리"
                  className="h-14 min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-900 px-4 text-lg font-black outline-none focus:border-orange-500"
                />

                <button
                  type="button"
                  disabled={
                    otherLoading
                  }
                  onClick={
                    checkOtherTruck
                  }
                  className="h-14 shrink-0 rounded-xl bg-orange-600 px-5 text-sm font-black disabled:opacity-40"
                >
                  {otherLoading
                    ? "조회 중"
                    : "조회"}
                </button>
              </div>

              {otherMessage && (
                <div className="mt-3 text-center text-sm font-bold text-zinc-500">
                  {otherMessage}
                </div>
              )}

              {otherItem && (
                <div className="mt-4 rounded-2xl bg-zinc-900 p-5 text-center">
                  <div className="text-xs font-bold text-zinc-600">
                    장치장 위치
                  </div>

                  <div className="mt-1 text-3xl font-black text-orange-400">
                    {otherItem.yardLocation ||
                      "-"}
                  </div>

                  {otherItem.containerNo && (
                    <div className="mt-2 text-sm font-bold text-zinc-500">
                      {
                        otherItem.containerNo
                      }
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

        <div className="h-10" />
      </div>
    </main>
  );
}