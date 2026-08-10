"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type MaintenanceLog = {
  id: number;
  user_id: string;
  maintenance_date: string;
  truck_brand: string | null;
  truck_model: string | null;
  truck_year: number | null;
  mileage: number | null;
  shop_name: string | null;
  category: string | null;
  details: string;
  cost: number | null;
  is_shared: boolean;
};

const categories = [
  "엔진",
  "미션",
  "브레이크",
  "타이어",
  "전기",
  "요소수·배기",
  "냉각계통",
  "에어·서스펜션",
  "오일·소모품",
  "기타",
];

function todayValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function money(value: number | null) {
  if (value === null) return "비용 미기입";
  return `${value.toLocaleString("ko-KR")}원`;
}

function mileageText(value: number | null) {
  if (value === null) return "주행거리 미기입";
  return `${value.toLocaleString("ko-KR")} km`;
}

export default function MaintenancePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [myLogs, setMyLogs] = useState<MaintenanceLog[]>([]);
  const [sharedLogs, setSharedLogs] = useState<MaintenanceLog[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"mine" | "shared">("mine");

  const [date, setDate] = useState(todayValue());
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [shopName, setShopName] = useState("");
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");
  const [cost, setCost] = useState("");
  const [isShared, setIsShared] = useState(true);

  const [searchBrand, setSearchBrand] = useState("");
  const [searchModel, setSearchModel] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    async function initialize() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?next=/maintenance");
        return;
      }

      setUserId(user.id);

      // 내 차량정보를 정비등록 기본값으로 사용
      const { data: driver } = await supabase
        .from("drivers")
        .select("truck_brand, truck_model, truck_year")
        .eq("user_id", user.id)
        .maybeSingle();

      if (driver) {
        const driverBrand = driver.truck_brand ?? "";
        const driverModel = driver.truck_model ?? "";

        setBrand(driverBrand);
        setModel(driverModel);

        if (driver.truck_year) {
          setYear(String(driver.truck_year));
        }

        // 공유사례도 처음에는 내 차종 기준
        setSearchBrand(driverBrand);
        setSearchModel(driverModel);
      }

      await loadMyLogs(user.id);
      await loadSharedLogs();

      setLoading(false);
    }

    initialize();
  }, [router, supabase]);

  async function loadMyLogs(id = userId) {
    if (!id) return;

    const { data, error } = await supabase
      .from("maintenance_logs")
      .select("*")
      .eq("user_id", id)
      .order("maintenance_date", { ascending: false });

    if (error) {
      alert(`정비기록 조회 오류\n${error.message}`);
      return;
    }

    setMyLogs((data ?? []) as MaintenanceLog[]);
  }
  async function deleteMaintenanceLog(id: number) {
    const ok = window.confirm("이 정비기록을 삭제하시겠습니까?");
    if (!ok) return;
  
    const { error } = await supabase
      .from("maintenance_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
  
    if (error) {
      alert(`삭제 오류\n${error.message}`);
      return;
    }
  
    await loadMyLogs(userId);
  }
  async function loadSharedLogs() {
    const { data, error } = await supabase
      .from("maintenance_logs")
      .select("*")
      .eq("is_shared", true)
      .order("maintenance_date", { ascending: false });

    if (error) {
      alert(`공유사례 조회 오류\n${error.message}`);
      return;
    }

    setSharedLogs((data ?? []) as MaintenanceLog[]);
  }

  async function saveMaintenance() {
    if (!userId) return;

    if (!date) {
      alert("정비 날짜를 선택해주세요.");
      return;
    }

    if (!details.trim()) {
      alert("정비 내용을 입력해주세요.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("maintenance_logs").insert({
      user_id: userId,
      maintenance_date: date,
      truck_brand: brand.trim() || null,
      truck_model: model.trim() || null,
      truck_year: year ? Number(year) : null,
      mileage: mileage ? Number(mileage.replace(/,/g, "")) : null,
      shop_name: shopName.trim() || null,
      category: category || null,
      details: details.trim(),
      cost: cost ? Number(cost.replace(/,/g, "")) : null,
      is_shared: isShared,
    });

    setSaving(false);

    if (error) {
      alert(`정비기록 저장 실패\n${error.message}`);
      return;
    }

    alert("정비기록이 저장되었습니다.");

    setDate(todayValue());
    setMileage("");
    setShopName("");
    setCategory("");
    setDetails("");
    setCost("");
    setIsShared(true);
    setShowForm(false);

    await loadMyLogs(userId);
    await loadSharedLogs();
  }

  const filteredSharedLogs = sharedLogs.filter((log) => {
    const brandMatch =
      !searchBrand ||
      (log.truck_brand ?? "")
        .toLowerCase()
        .includes(searchBrand.toLowerCase());

    const modelMatch =
      !searchModel ||
      (log.truck_model ?? "")
        .toLowerCase()
        .includes(searchModel.toLowerCase());

    const categoryMatch =
      !searchCategory || log.category === searchCategory;

    const keywordText = [
      log.details,
      log.shop_name,
      log.category,
      log.truck_brand,
      log.truck_model,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const keywordMatch =
      !keyword || keywordText.includes(keyword.toLowerCase());

    return brandMatch && modelMatch && categoryMatch && keywordMatch;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] px-5 pt-24 text-white">
        차량 정보를 불러오는 중...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-24 pt-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* 상단 */}
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-orange-500">MORE 광양</p>

            <h1 className="mt-2 text-3xl font-black">
              차량 관리
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              내 정비기록을 관리하고 다른 차주의 실제 정비사례를 확인하세요.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300"
          >
            홈
          </button>
        </div>

        {/* 정비 등록 버튼 */}
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mb-6 w-full rounded-2xl bg-orange-600 px-5 py-4 text-lg font-black transition hover:bg-orange-500"
        >
          + 정비 기록 등록
        </button>

        {/* 탭 */}
        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-zinc-900 p-1">
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={`rounded-xl px-3 py-3 text-sm font-bold ${
              tab === "mine"
                ? "bg-white text-black"
                : "text-zinc-400"
            }`}
          >
            내 정비기록 {myLogs.length}
          </button>

          <button
            type="button"
            onClick={() => setTab("shared")}
            className={`rounded-xl px-3 py-3 text-sm font-bold ${
              tab === "shared"
                ? "bg-white text-black"
                : "text-zinc-400"
            }`}
          >
            공유 정비사례
          </button>
        </div>

        {/* 내 기록 */}
        {tab === "mine" && (
          <section>
            {myLogs.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center">
                <p className="font-bold">아직 정비기록이 없습니다.</p>
                <p className="mt-2 text-sm text-zinc-500">
                  첫 정비기록을 등록해보세요.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myLogs.map((log) => (
                  <MaintenanceCard
                  key={log.id}
                  log={log}
                  onDelete={deleteMaintenanceLog}
                />
                ))}
              </div>
            )}
          </section>
        )}

        {/* 공유사례 */}
        {tab === "shared" && (
          <section>
            <div className="mb-5 rounded-2xl border border-white/10 bg-zinc-900 p-4">
              <p className="mb-4 font-black">
                정비사례 검색
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={searchBrand}
                  onChange={(e) => setSearchBrand(e.target.value)}
                  placeholder="제조사 예: 벤츠"
                  className="h-12 rounded-xl border border-white/10 bg-black px-4 text-sm outline-none focus:border-orange-500"
                />

                <input
                  value={searchModel}
                  onChange={(e) => setSearchModel(e.target.value)}
                  placeholder="모델 예: 2646"
                  className="h-12 rounded-xl border border-white/10 bg-black px-4 text-sm outline-none focus:border-orange-500"
                />

                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="h-12 rounded-xl border border-white/10 bg-black px-4 text-sm outline-none focus:border-orange-500"
                >
                  <option value="">전체 정비분류</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="터보, DPF, 미션 등 검색"
                  className="h-12 rounded-xl border border-white/10 bg-black px-4 text-sm outline-none focus:border-orange-500"
                />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-zinc-400">
                  검색 결과
                </span>

                <strong className="text-xl text-orange-500">
                  {filteredSharedLogs.length}건
                </strong>
              </div>
            </div>

            {filteredSharedLogs.length === 0 ? (
              <div className="rounded-2xl border border-white/10 p-8 text-center text-zinc-500">
                조건에 맞는 공유 정비사례가 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSharedLogs.map((log) => (
                  <MaintenanceCard
                    key={log.id}
                    log={log}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* 정비등록 팝업 */}
      {showForm && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto max-w-xl rounded-3xl bg-white p-5 text-zinc-900 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600">
                  차량 관리
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  정비 기록
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <Field label="정비 날짜">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="inputStyle"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="제조사">
                  <input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="벤츠"
                    className="inputStyle"
                  />
                </Field>

                <Field label="모델">
                  <input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="2646"
                    className="inputStyle"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="연식">
                  <input
                    inputMode="numeric"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2017"
                    className="inputStyle"
                  />
                </Field>

                <Field label="현재 주행거리">
                  <input
                    inputMode="numeric"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="823000"
                    className="inputStyle"
                  />
                </Field>
              </div>

              <Field label="정비업체">
                <input
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="정비업체명"
                  className="inputStyle"
                />
              </Field>

              <Field label="정비 분류">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="inputStyle"
                >
                  <option value="">선택</option>

                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="정비 내용">
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="예: 터보 액추에이터 교체"
                  rows={4}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm outline-none focus:border-orange-500"
                />
              </Field>

              <Field label="정비 비용">
                <input
                  inputMode="numeric"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="480000"
                  className="inputStyle"
                />
              </Field>

              <label className="flex cursor-pointer gap-3 rounded-2xl bg-orange-50 p-4">
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="mt-1 h-5 w-5"
                />

                <div>
                  <p className="font-black">
                    다른 운송차주에게 정비사례 공유
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    차량번호와 사용자 정보는 공개하지 않습니다.
                    차량·정비·비용 정보만 다른 차주의 참고자료로 공유됩니다.
                  </p>
                </div>
              </label>

              <button
                type="button"
                disabled={saving}
                onClick={saveMaintenance}
                className="h-14 w-full rounded-xl bg-orange-600 text-base font-black text-white disabled:opacity-50"
              >
                {saving ? "저장 중..." : "정비기록 저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .inputStyle {
          width: 100%;
          height: 48px;
          border: 1px solid #e4e4e7;
          border-radius: 12px;
          background: #fafafa;
          padding: 0 14px;
          font-size: 14px;
          outline: none;
        }

        .inputStyle:focus {
          border-color: #ea580c;
        function MaintenanceCard}
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-zinc-700">
        {label}
      </p>

      {children}
    </div>
  );
}

function MaintenanceCard({
    log,
    showShared = false,
    onDelete,
  }: {
    log: MaintenanceLog;
    showShared?: boolean;
    onDelete?: (id: number) => void;
  }) {

  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-orange-500">
            {log.category || "정비"}
          </p>

          <h3 className="mt-2 text-lg font-black">
            {log.details}
          </h3>
        </div>

        <span className="shrink-0 text-xs text-zinc-500">
  {log.maintenance_date}
</span>

{!showShared && onDelete && (
  <button
    type="button"
    onClick={() => onDelete(log.id)}
    className="shrink-0 text-xs font-bold text-red-400 hover:text-red-300"
  >
    삭제
  </button>
)}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {(log.truck_brand || log.truck_model) && (
          <span className="rounded-lg bg-black px-3 py-2">
            {[log.truck_brand, log.truck_model]
              .filter(Boolean)
              .join(" ")}
          </span>
        )}

        <span className="rounded-lg bg-black px-3 py-2">
          {mileageText(log.mileage)}
        </span>

        <span className="rounded-lg bg-black px-3 py-2 font-bold text-orange-400">
          {money(log.cost)}
        </span>
      </div>

      {log.shop_name && (
        <p className="mt-4 text-sm text-zinc-400">
          정비업체 · {log.shop_name}
        </p>
      )}

      {showShared && (
        <p className="mt-3 text-xs text-zinc-500">
          {log.is_shared
            ? "공유 중인 정비사례"
            : "나만 보는 정비기록"}
        </p>
      )}
    </article>
  );
}