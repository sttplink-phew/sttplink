"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/client";

const vehicleOptions = [
  "트랙터",
  "컨테이너 샤시",
  "카고",
  "윙바디",
  "평판 트레일러",
  "로우베드",
  "저상 트레일러",
  "모듈 트레일러",
  "카고크레인",
  "셀프로더",
  "기타",
];
const cargoOptions = [
    "컨테이너",
    "굴착기",
    "지게차",
    "휠로더",
    "불도저",
    "크레인 부품",
    "산업기계",
    "공작기계",
    "철구조물",
    "플랜트 장비",
    "발전기",
    "변압기",
    "탱크",
    "보일러",
    "중량물",
    "장척화물",
    "기타",
  ];
  const loadOptions = [
    "5톤 이하",
    "10톤 이하",
    "15톤 이하",
    "20톤 이하",
    "25톤 이하",
    "30톤 이하",
    "40톤 이상",
    "폭 초과 화물 가능",
    "높이 초과 화물 가능",
    "길이 초과 화물 가능",
    "중량 초과 화물 가능",
  ];
  const regionOptions = [
    "전국",
    "수도권",
    "강원",
    "충북",
    "충남",
    "전북",
    "전남",
    "경북",
    "경남",
    "제주",
  ];
  const businessOptions = [
    "화물보험 가입",
    "적재물배상책임보험 가입",
    "사업자등록 있음",
    "전자세금계산서 발행 가능",
    "현금영수증 가능",
    "카드결제 가능",
  ];
export default function DriverProfilePage() {
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedCargo, setSelectedCargo] = useState<string[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string[]>([]);
  const router = useRouter();
  const [next, setNext] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(params.get("next"));
  }, []);
  const supabase = createClient();
  const [vehicleNumber, setVehicleNumber] = useState("");
const [businessNumber, setBusinessNumber] = useState("");
const [memo, setMemo] = useState("");
const [isExisting, setIsExisting] = useState(false);
useEffect(() => {
  async function loadDriverProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("운송차주 정보 조회 오류:", error);
      return;
    }

    if (!data) return;

    setIsExisting(true);
    setSelectedVehicles(data.vehicle_types ?? []);
    setSelectedCargo(data.cargo_types ?? []);
    setSelectedLoad(data.load_conditions ?? []);
    setSelectedRegion(data.regions ?? []);
    setSelectedBusiness(data.business_info ?? []);
    setVehicleNumber(data.vehicle_number ?? "");
    setBusinessNumber(data.business_number ?? "");
    setMemo(data.memo ?? "");
  }

  loadDriverProfile();
}, []);
  function toggleVehicle(vehicle: string) {
    setSelectedVehicles((current) =>
      current.includes(vehicle)
        ? current.filter((item) => item !== vehicle)
        : [...current, vehicle]
    );
  }
function toggleCargo(cargo: string) {
  setSelectedCargo((current) =>
    current.includes(cargo)
      ? current.filter((item) => item !== cargo)
      : [...current, cargo]
  );
}
function toggleLoad(load: string) {
    setSelectedLoad((current) =>
      current.includes(load)
        ? current.filter((item) => item !== load)
        : [...current, load]
    );
  }
  function toggleRegion(region: string) {
    setSelectedRegion((current) =>
      current.includes(region)
        ? current.filter((item) => item !== region)
        : [...current, region]
    );
  }
  function toggleBusiness(item: string) {
    setSelectedBusiness((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item]
    );
  }

  async function handleSaveDriver() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
  
    if (userError || !user) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }
  
    const { error } = await supabase.from("drivers").upsert({
      user_id: user.id,
      vehicle_types: selectedVehicles,
      cargo_types: selectedCargo,
      load_conditions: selectedLoad,
      regions: selectedRegion,
      business_info: selectedBusiness,
      vehicle_number: vehicleNumber,
      business_number: businessNumber,
      memo,
    }, { onConflict: "user_id" });
  
    if (error) {
      alert(`저장 오류: ${error.message}`);
      return;
    }
  
    alert("운송차주 정보가 저장되었습니다.");
    router.push(next || "/");
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-28 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <p className="text-sm font-bold text-orange-500">
              운송차주 세부정보
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              운송 가능한 차량을 선택하세요
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              보유하거나 운행 가능한 차량을 모두 선택할 수 있습니다.
            </p>
          </div>

          <section className="rounded-3xl border border-white/10 bg-white p-5 text-zinc-900 shadow-2xl sm:p-7">
            <div className="mb-5">
              <p className="text-xs font-bold text-orange-600">
                STEP 1
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                차량 종류
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                중복 선택 가능합니다.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vehicleOptions.map((vehicle) => {
                const selected = selectedVehicles.includes(vehicle);

                return (
                  <button
                    key={vehicle}
                    type="button"
                    onClick={() => toggleVehicle(vehicle)}
                    className={`flex min-h-[72px] items-center gap-3 rounded-2xl border px-4 text-left transition ${
                      selected
                        ? "border-orange-600 bg-orange-50 ring-2 ring-orange-100"
                        : "border-zinc-200 bg-white hover:border-orange-300 hover:bg-orange-50/40"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-sm font-bold ${
                        selected
                          ? "border-orange-600 bg-orange-600 text-white"
                          : "border-zinc-300 bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </span>

                    <span
                      className={`font-semibold ${
                        selected ? "text-orange-700" : "text-zinc-800"
                      }`}
                    >
                      {vehicle}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-10 border-t border-zinc-200 pt-8">
  <div className="mb-5">
    <p className="text-xs font-bold text-orange-600">
      STEP 2
    </p>

    <h2 className="mt-1 text-2xl font-bold">
      적재 가능 화물
    </h2>

    <p className="mt-2 text-sm text-zinc-500">
      운송 가능한 화물을 모두 선택하세요.
    </p>
  </div>

  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {cargoOptions.map((cargo) => {
      const selected = selectedCargo.includes(cargo);

      return (
        <button
          key={cargo}
          type="button"
          onClick={() => toggleCargo(cargo)}
          className={`flex min-h-[68px] items-center gap-3 rounded-2xl border px-4 text-left transition ${
            selected
              ? "border-orange-600 bg-orange-50 ring-2 ring-orange-100"
              : "border-zinc-200 bg-white hover:border-orange-300 hover:bg-orange-50/40"
          }`}
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-sm font-bold ${
              selected
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-zinc-300 bg-white text-transparent"
            }`}
          >
            ✓
          </span>

          <span
            className={`font-semibold ${
              selected ? "text-orange-700" : "text-zinc-800"
            }`}
          >
            {cargo}
          </span>
        </button>
      );
    })}
  </div>
</div>
<div className="mt-10 border-t border-zinc-200 pt-8">
  <div className="mb-5">
    <p className="text-xs font-bold text-orange-600">
      STEP 3
    </p>

    <h2 className="mt-1 text-2xl font-bold">
      적재 조건
    </h2>

    <p className="mt-2 text-sm text-zinc-500">
      가능한 적재 중량과 특수 화물 조건을 모두 선택하세요.
    </p>
  </div>

  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {loadOptions.map((load) => {
      const selected = selectedLoad.includes(load);

      return (
        <button
          key={load}
          type="button"
          onClick={() => toggleLoad(load)}
          className={`flex min-h-[68px] items-center gap-3 rounded-2xl border px-4 text-left transition ${
            selected
              ? "border-orange-600 bg-orange-50 ring-2 ring-orange-100"
              : "border-zinc-200 bg-white hover:border-orange-300 hover:bg-orange-50/40"
          }`}
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-sm font-bold ${
              selected
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-zinc-300 bg-white text-transparent"
            }`}
          >
            ✓
          </span>

          <span
            className={`font-semibold ${
              selected ? "text-orange-700" : "text-zinc-800"
            }`}
          >
            {load}
          </span>
        </button>
      );
    })}
  </div>
</div>
<div className="mt-10 border-t border-zinc-200 pt-8">
  <div className="mb-5">
    <p className="text-xs font-bold text-orange-600">
      STEP 4
    </p>

    <h2 className="mt-1 text-2xl font-bold">
      운송 가능 지역
    </h2>

    <p className="mt-2 text-sm text-zinc-500">
      운송 가능한 지역을 모두 선택하세요.
    </p>
  </div>

  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {regionOptions.map((region) => {
      const selected = selectedRegion.includes(region);

      return (
        <button
          key={region}
          type="button"
          onClick={() => toggleRegion(region)}
          className={`flex min-h-[68px] items-center gap-3 rounded-2xl border px-4 text-left transition ${
            selected
              ? "border-orange-600 bg-orange-50 ring-2 ring-orange-100"
              : "border-zinc-200 bg-white hover:border-orange-300 hover:bg-orange-50/40"
          }`}
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-sm font-bold ${
              selected
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-zinc-300 bg-white text-transparent"
            }`}
          >
            ✓
          </span>

          <span
            className={`font-semibold ${
              selected ? "text-orange-700" : "text-zinc-800"
            }`}
          >
            {region}
          </span>
        </button>
      );
    })}
  </div>
</div>
<div className="mt-10 border-t border-zinc-200 pt-8">
  <div className="mb-5">
    <p className="text-xs font-bold text-orange-600">
      STEP 5
    </p>

    <h2 className="mt-1 text-2xl font-bold">
      보험 및 사업자 정보
    </h2>

    <p className="mt-2 text-sm text-zinc-500">
      해당되는 항목을 모두 선택하세요.
    </p>
  </div>

  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {businessOptions.map((item) => {
      const selected = selectedBusiness.includes(item);

      return (
        <button
          key={item}
          type="button"
          onClick={() => toggleBusiness(item)}
          className={`flex min-h-[68px] items-center gap-3 rounded-2xl border px-4 text-left transition ${
            selected
              ? "border-orange-600 bg-orange-50 ring-2 ring-orange-100"
              : "border-zinc-200 bg-white hover:border-orange-300 hover:bg-orange-50/40"
          }`}
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-sm font-bold ${
              selected
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-zinc-300 bg-white text-transparent"
            }`}
          >
            ✓
          </span>

          <span
            className={`font-semibold ${
              selected ? "text-orange-700" : "text-zinc-800"
            }`}
          >
            {item}
          </span>
        </button>
      );
    })}
  </div>
</div>
<div className="mt-10 border-t border-zinc-200 pt-8">
  <div className="mb-5">
    <p className="text-xs font-bold text-orange-600">
      STEP 6
    </p>

    <h2 className="mt-1 text-2xl font-bold">
      운송차주 기본 정보
    </h2>

    <p className="mt-2 text-sm text-zinc-500">
      배차 및 운송 연락에 필요한 정보를 입력하세요.
    </p>
  </div>

  <div className="grid gap-4 sm:grid-cols-2">
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-700">
        차량번호
      </span>
      <input
        type="text"
        value={vehicleNumber}
onChange={(event) => setVehicleNumber(event.target.value)}
        placeholder="예: 서울12아3456"
        className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
      />
    </label>

    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-700">
        사업자번호
      </span>
      <input
        type="text"
        value={businessNumber}
onChange={(event) => setBusinessNumber(event.target.value)}
        placeholder="예: 123-45-67890"
        className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
      />
    </label>

    <label className="block sm:col-span-2">
      <span className="mb-2 block text-sm font-bold text-zinc-700">
        특이사항 / 메모
      </span>
      <textarea
        rows={4}
        value={memo}
onChange={(event) => setMemo(event.target.value)}
        placeholder="차량 특성, 운송 가능 조건 등 추가 정보를 입력하세요."
        className="w-full rounded-xl border border-zinc-200 bg-white p-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
      />
    </label>
  </div>
</div>
<div className="mt-7 rounded-2xl bg-zinc-50 p-5">
  <p className="text-xs font-bold text-orange-600">
    등록 정보 확인
  </p>

  <div className="mt-4 space-y-4 text-sm">
    <div>
      <p className="font-bold text-zinc-700">차량 종류</p>
      <p className="mt-1 text-zinc-600">
        {selectedVehicles.length > 0
          ? selectedVehicles.join(" · ")
          : "선택 없음"}
      </p>
    </div>

    <div>
      <p className="font-bold text-zinc-700">적재 가능 화물</p>
      <p className="mt-1 text-zinc-600">
        {selectedCargo.length > 0
          ? selectedCargo.join(" · ")
          : "선택 없음"}
      </p>
    </div>

    <div>
      <p className="font-bold text-zinc-700">적재 조건</p>
      <p className="mt-1 text-zinc-600">
        {selectedLoad.length > 0
          ? selectedLoad.join(" · ")
          : "선택 없음"}
      </p>
    </div>

    <div>
      <p className="font-bold text-zinc-700">운송 가능 지역</p>
      <p className="mt-1 text-zinc-600">
        {selectedRegion.length > 0
          ? selectedRegion.join(" · ")
          : "선택 없음"}
      </p>
    </div>

    <div>
      <p className="font-bold text-zinc-700">보험 / 사업자 정보</p>
      <p className="mt-1 text-zinc-600">
        {selectedBusiness.length > 0
          ? selectedBusiness.join(" · ")
          : "선택 없음"}
      </p>
    </div>
  </div>
</div>
<button
  type="button"
  onClick={handleSaveDriver}
  className="mt-7 h-14 w-full rounded-xl bg-orange-600 text-sm font-bold text-white transition hover:bg-orange-500"
>
{isExisting ? "정보 수정" : "운송차주 등록"}
            </button>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}