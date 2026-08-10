"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/client";

const truckBrands = [
  "벤츠",
  "스카니아",
  "볼보",
  "현대",
  "타타대우",
  "만",
  "기타",
];

const chassisTypes = [
  "콤바인",
  "콤비라인",
  "라인",
  "기타",
];

const routeOptions = [
  "광양 구내",
  "광양 - 여수",
  "광양 - 전주",
  "광양 - 부산",
  "광양 - 광주",
  "여수 - 광양",
  "여수 - 부산",
  "기타",
];

const modelOptions: Record<string, string[]> = {
  벤츠: ["Actros 2646", "Actros 2651", "Actros 2653", "기타"],
  스카니아: ["R450", "R500", "R540", "S500", "S540", "기타"],
  볼보: ["FH 460", "FH 500", "FH 540", "기타"],
  현대: ["엑시언트", "엑시언트 프로", "기타"],
  타타대우: ["프리마", "맥쎈", "기타"],
  만: ["TGX", "기타"],
  기타: ["기타"],
};

const currentYear = new Date().getFullYear();

const yearOptions = Array.from(
  { length: 31 },
  (_, index) => currentYear - index
);

export default function DriverProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExisting, setIsExisting] = useState(false);

  const [companies, setCompanies] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [showNewCompany, setShowNewCompany] = useState(false);

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [truckBrand, setTruckBrand] = useState("");
  const [truckYear, setTruckYear] = useState("");
  const [truckModel, setTruckModel] = useState("");
  const [chassisType, setChassisType] = useState("");
  const [mainRoute, setMainRoute] = useState("");

  useEffect(() => {
    async function loadPage() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("name")
        .order("name", { ascending: true });

      if (!companyError && companyData) {
        setCompanies(companyData.map((item) => item.name));
      }

      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select(
          "company_name, vehicle_number, truck_brand, truck_year, truck_model, chassis_type, main_route"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (driverError) {
        console.error("운송차주 정보 조회 오류:", driverError);
      }

      if (driverData) {
        setIsExisting(true);
        setCompanyName(driverData.company_name ?? "");
        setVehicleNumber(driverData.vehicle_number ?? "");
        setTruckBrand(driverData.truck_brand ?? "");
        setTruckYear(
          driverData.truck_year ? String(driverData.truck_year) : ""
        );
        setTruckModel(driverData.truck_model ?? "");
        setChassisType(driverData.chassis_type ?? "");
        setMainRoute(driverData.main_route ?? "");
      }

      setLoading(false);
    }

    loadPage();
  }, []);

  async function addCompany() {
    const name = newCompanyName.trim();

    if (!name) {
      alert("운송사 이름을 입력해주세요.");
      return;
    }

    const { error } = await supabase
      .from("companies")
      .insert({ name });

    if (error) {
      if (error.code === "23505") {
        alert("이미 등록된 운송사입니다.");
        return;
      }

      alert(`운송사 등록 오류: ${error.message}`);
      return;
    }

    setCompanies((current) =>
      [...current, name].sort((a, b) => a.localeCompare(b, "ko"))
    );

    setCompanyName(name);
    setNewCompanyName("");
    setShowNewCompany(false);

    alert("운송사가 등록되었습니다.");
  }

  async function saveProfile() {
    if (!companyName) {
      alert("소속 운송사를 선택해주세요.");
      return;
    }

    if (!vehicleNumber.trim()) {
      alert("차량번호를 입력해주세요.");
      return;
    }

    if (!truckBrand) {
      alert("차량 제조사를 선택해주세요.");
      return;
    }

    if (!truckYear) {
      alert("차량 연식을 선택해주세요.");
      return;
    }

    if (!truckModel) {
      alert("차량 모델을 선택해주세요.");
      return;
    }

    if (!chassisType) {
      alert("샤시 종류를 선택해주세요.");
      return;
    }

    if (!mainRoute) {
      alert("주요 노선을 선택해주세요.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setSaving(false);
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("drivers")
      .upsert(
        {
          user_id: user.id,
          company_name: companyName,
          vehicle_number: vehicleNumber.trim(),
          truck_brand: truckBrand,
          truck_year: Number(truckYear),
          truck_model: truckModel,
          chassis_type: chassisType,
          main_route: mainRoute,
          phone: user.user_metadata?.phone || null,
        },
        {
          onConflict: "user_id",
        }
      );

    setSaving(false);

    if (error) {
      alert(`저장 오류: ${error.message}`);
      return;
    }

    alert(
      isExisting
        ? "운송차주 정보가 수정되었습니다."
        : "운송차주 정보가 등록되었습니다."
    );

    router.push("/driver/my");
  }

  if (loading) {
    return (
      <>
        <Header />

        <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
          <p className="text-zinc-400">불러오는 중...</p>
        </main>

        <Footer />
      </>
    );
  }

  const availableModels = truckBrand
    ? modelOptions[truckBrand] ?? ["기타"]
    : [];

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-28 text-white sm:px-6">
        <div className="mx-auto max-w-3xl">

          <div className="mb-7">
            <p className="text-xs font-bold text-orange-500">
              STTP LINK
            </p>

            <h1 className="mt-2 text-3xl font-black">
              운송차주 정보
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              운행에 필요한 기본 정보만 등록합니다.
            </p>
          </div>

          <section className="space-y-6 rounded-3xl bg-white p-5 text-zinc-900 shadow-2xl sm:p-7">

            {/* 소속 운송사 */}
            <Field title="소속 운송사">
              <select
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input-style"
              >
                <option value="">운송사를 선택하세요</option>

                {companies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowNewCompany(!showNewCompany)}
                className="mt-3 text-sm font-bold text-orange-600"
              >
                + 새 운송사 등록
              </button>

              {showNewCompany && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="운송사 이름"
                    className="input-style"
                  />

                  <button
                    type="button"
                    onClick={addCompany}
                    className="shrink-0 rounded-xl bg-zinc-900 px-5 font-bold text-white"
                  >
                    등록
                  </button>
                </div>
              )}
            </Field>

            {/* 차량번호 */}
            <Field title="차량번호">
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="예: 전남99바1234"
                className="input-style"
              />
            </Field>

            {/* 제조사 */}
            <Field title="차량 제조사">
              <select
                value={truckBrand}
                onChange={(e) => {
                  setTruckBrand(e.target.value);
                  setTruckModel("");
                }}
                className="input-style"
              >
                <option value="">제조사를 선택하세요</option>

                {truckBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </Field>

            {/* 연식 */}
            <Field title="연식">
              <select
                value={truckYear}
                onChange={(e) => setTruckYear(e.target.value)}
                className="input-style"
              >
                <option value="">연식을 선택하세요</option>

                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                ))}
              </select>
            </Field>

            {/* 모델 */}
            <Field title="차량 모델">
              <select
                value={truckModel}
                onChange={(e) => setTruckModel(e.target.value)}
                disabled={!truckBrand}
                className="input-style disabled:bg-zinc-100"
              >
                <option value="">
                  {truckBrand
                    ? "모델을 선택하세요"
                    : "제조사를 먼저 선택하세요"}
                </option>

                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </Field>

            {/* 샤시 */}
            <Field title="트레일러 샤시">
              <div className="grid grid-cols-2 gap-2">
                {chassisTypes.map((item) => (
                  <SelectButton
                    key={item}
                    selected={chassisType === item}
                    onClick={() => setChassisType(item)}
                  >
                    {item}
                  </SelectButton>
                ))}
              </div>
            </Field>

            {/* 주요노선 */}
            <Field title="주요 정기노선">
              <select
                value={mainRoute}
                onChange={(e) => setMainRoute(e.target.value)}
                className="input-style"
              >
                <option value="">주요 노선을 선택하세요</option>

                {routeOptions.map((route) => (
                  <option key={route} value={route}>
                    {route}
                  </option>
                ))}
              </select>
            </Field>

            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="h-16 w-full rounded-2xl bg-orange-600 text-lg font-black text-white transition hover:bg-orange-500 disabled:opacity-50"
            >
              {saving
                ? "저장 중..."
                : isExisting
                ? "정보 수정"
                : "등록 완료"}
            </button>

          </section>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .input-style {
          width: 100%;
          height: 56px;
          border: 1px solid #e4e4e7;
          border-radius: 12px;
          background: white;
          padding: 0 16px;
          outline: none;
          font-size: 15px;
        }

        .input-style:focus {
          border-color: #ea580c;
          box-shadow: 0 0 0 2px #ffedd5;
        }
      `}</style>
    </>
  );
}

function Field({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-zinc-700">
        {title}
      </p>

      {children}
    </div>
  );
}

function SelectButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-14 rounded-xl border font-bold transition ${
        selected
          ? "border-orange-600 bg-orange-600 text-white"
          : "border-zinc-200 bg-zinc-50 text-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}