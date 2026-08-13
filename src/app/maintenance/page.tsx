"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
  title: string | null;
  fault_code: string | null;
  symptoms: string | null;
  repair_result: string | null;
  repair_region: string | null;
  created_at?: string | null;
};

type MaintenanceComment = {
  id: number;
  log_id: number;
  user_id: string;
  body: string;
  created_at: string;
};

const categories = [
  "엔진",
  "미션",
  "DPF·요소수",
  "전기·센서",
  "하체·브레이크",
  "냉각계통",
  "에어·서스펜션",
  "에어컨",
  "타이어",
  "오일·소모품",
  "기타",
];

function todayValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function money(value: number | null) {
  if (value === null || value === undefined) return "비용 미기입";
  return `${Number(value).toLocaleString("ko-KR")}원`;
}

function mileageText(value: number | null) {
  if (value === null || value === undefined) return "주행거리 미기입";
  return `${Number(value).toLocaleString("ko-KR")} km`;
}

function normalize(text: string | null | undefined) {
  return (text ?? "").toLowerCase().replace(/\s+/g, "");
}

function displayTitle(log: MaintenanceLog) {
  return log.title?.trim() || log.details.trim().split("\n")[0] || "정비 사례";
}

export default function MaintenancePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [comments, setComments] = useState<MaintenanceComment[]>([]);

  const [scope, setScope] = useState<"all" | "mine">("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(todayValue());
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [shopName, setShopName] = useState("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [faultCode, setFaultCode] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [details, setDetails] = useState("");
  const [repairResult, setRepairResult] = useState("");
  const [repairRegion, setRepairRegion] = useState("");
  const [cost, setCost] = useState("");

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

      const { data: driver } = await supabase
        .from("drivers")
        .select("vehicle_number, truck_brand, truck_model, truck_year")
        .eq("user_id", user.id)
        .maybeSingle();

      if (driver) {
        setVehicleNumber(driver.vehicle_number ?? "");
        setBrand(driver.truck_brand ?? "");
        setModel(driver.truck_model ?? "");
        if (driver.truck_year) setYear(String(driver.truck_year));
      }

      await Promise.all([loadLogs(user.id), loadComments()]);
      setLoading(false);
    }

    initialize();
  }, [router, supabase]);

  async function loadLogs(currentUserId = userId) {
    const { data, error } = await supabase
      .from("maintenance_logs")
      .select(
        "id, user_id, maintenance_date, truck_brand, truck_model, truck_year, mileage, shop_name, category, details, cost, is_shared, title, fault_code, symptoms, repair_result, repair_region, created_at"
      )
      .or(`is_shared.eq.true,user_id.eq.${currentUserId}`)
      .order("maintenance_date", { ascending: false })
      .order("id", { ascending: false });

    if (error) {
      alert(`차량정비 게시판 조회 오류\n${error.message}`);
      return;
    }

    setLogs((data ?? []) as MaintenanceLog[]);
  }

  async function loadComments() {
    const { data, error } = await supabase
      .from("maintenance_comments")
      .select("id, log_id, user_id, body, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("댓글 조회 오류:", error);
      return;
    }

    setComments((data ?? []) as MaintenanceComment[]);
  }

  const filteredLogs = logs.filter((log) => {
    if (scope === "mine" && log.user_id !== userId) return false;
    if (scope === "all" && !log.is_shared && log.user_id !== userId) return false;

    if (selectedCategory && log.category !== selectedCategory) return false;

    const haystack = normalize(
      [
        log.title,
        log.fault_code,
        log.symptoms,
        log.details,
        log.repair_result,
        log.repair_region,
        log.shop_name,
        log.category,
        log.truck_brand,
        log.truck_model,
        log.truck_year ? String(log.truck_year) : "",
      ]
        .filter(Boolean)
        .join(" ")
    );

    return !keyword || haystack.includes(normalize(keyword));
  });

  function resetForm() {
    setDate(todayValue());
    setMileage("");
    setShopName("");
    setCategory("");
    setTitle("");
    setFaultCode("");
    setSymptoms("");
    setDetails("");
    setRepairResult("");
    setRepairRegion("");
    setCost("");
  }

  async function savePost() {
    if (!userId) return;

    if (!title.trim()) {
      alert("게시글 제목을 입력해주세요.");
      return;
    }

    if (!details.trim()) {
      alert("정비 내용을 입력해주세요.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("maintenance_logs").insert({
      user_id: userId,
      maintenance_date: date || todayValue(),
      truck_brand: brand.trim() || null,
      truck_model: model.trim() || null,
      truck_year: year ? Number(year) : null,
      mileage: mileage ? Number(mileage.replace(/,/g, "")) : null,
      shop_name: shopName.trim() || null,
      category: category || "기타",
      details: details.trim(),
      cost: cost ? Number(cost.replace(/,/g, "")) : null,
      is_shared: true,
      title: title.trim(),
      fault_code: faultCode.trim() || null,
      symptoms: symptoms.trim() || null,
      repair_result: repairResult.trim() || null,
      repair_region: repairRegion.trim() || null,
    });

    setSaving(false);

    if (error) {
      alert(`정비사례 등록 실패\n${error.message}`);
      return;
    }

    resetForm();
    setShowForm(false);
    await loadLogs(userId);
  }

  async function deletePost(log: MaintenanceLog) {
    if (log.user_id !== userId) return;

    const ok = window.confirm("이 정비사례를 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase
      .from("maintenance_logs")
      .delete()
      .eq("id", log.id)
      .eq("user_id", userId);

    if (error) {
      alert(`삭제 오류\n${error.message}`);
      return;
    }

    if (selectedLog?.id === log.id) setSelectedLog(null);
    await Promise.all([loadLogs(userId), loadComments()]);
  }

  async function saveComment() {
    if (!userId || !selectedLog || !commentBody.trim()) return;

    setCommentSaving(true);

    const { error } = await supabase.from("maintenance_comments").insert({
      log_id: selectedLog.id,
      user_id: userId,
      body: commentBody.trim(),
    });

    setCommentSaving(false);

    if (error) {
      alert(`댓글 등록 실패\n${error.message}`);
      return;
    }

    setCommentBody("");
    await loadComments();
  }

  async function deleteComment(comment: MaintenanceComment) {
    if (comment.user_id !== userId) return;

    const ok = window.confirm("댓글을 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase
      .from("maintenance_comments")
      .delete()
      .eq("id", comment.id)
      .eq("user_id", userId);

    if (error) {
      alert(`댓글 삭제 실패\n${error.message}`);
      return;
    }

    await loadComments();
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
          차량정비 게시판을 불러오는 중...
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen overflow-x-hidden bg-[#080808] px-4 pb-24 pt-24 text-white sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <section className="rounded-3xl border border-white/10 bg-zinc-900 p-4 shadow-xl sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black tracking-[0.14em] text-orange-500">
                  STTP LINK
                </p>
                <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                  차량정비
                </h1>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  차주들이 직접 겪은 고장 · 수리 · 부품교체 사례를 공유합니다.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="shrink-0 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-zinc-300"
              >
                홈
              </button>
            </div>

            {vehicleNumber && (
              <div className="mt-4 inline-flex rounded-lg bg-black px-3 py-2 text-xs font-bold text-zinc-400">
                내 차량 · {vehicleNumber}
              </div>
            )}
          </section>

          <section className="mt-3 rounded-3xl border border-white/10 bg-zinc-900 p-4 shadow-xl">
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="고장코드 · 증상 · 부품 · 차종 검색"
                  className="h-12 w-full min-w-0 rounded-xl border border-white/10 bg-black px-4 pr-10 text-sm outline-none focus:border-orange-500"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  ⌕
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="shrink-0 rounded-xl bg-orange-600 px-4 text-sm font-black text-white"
              >
                글쓰기
              </button>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${
                  selectedCategory === ""
                    ? "bg-white text-black"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                전체
              </button>

              {categories.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setSelectedCategory(item)}
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${
                    selectedCategory === item
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 rounded-xl bg-black p-1">
              <button
                type="button"
                onClick={() => setScope("all")}
                className={`rounded-lg py-2.5 text-sm font-bold ${
                  scope === "all"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500"
                }`}
              >
                전체 사례
              </button>

              <button
                type="button"
                onClick={() => setScope("mine")}
                className={`rounded-lg py-2.5 text-sm font-bold ${
                  scope === "mine"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500"
                }`}
              >
                내 정비기록
              </button>
            </div>
          </section>

          <div className="mt-3 flex items-center justify-between px-1">
            <p className="text-sm font-bold text-zinc-400">
              {scope === "mine" ? "내가 등록한 사례" : "차주 정비사례"}
            </p>
            <strong className="text-sm text-orange-500">
              {filteredLogs.length}건
            </strong>
          </div>

          <section className="mt-2 space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-zinc-900 p-8 text-center">
                <p className="font-bold text-zinc-300">
                  조건에 맞는 정비사례가 없습니다.
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  직접 겪은 사례를 첫 글로 등록해보세요.
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const commentCount = comments.filter(
                  (comment) => comment.log_id === log.id
                ).length;

                return (
                  <button
                    type="button"
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="w-full rounded-2xl border border-white/10 bg-zinc-900 p-4 text-left transition active:bg-zinc-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-orange-500/10 px-2 py-1 text-[11px] font-black text-orange-400">
                            {log.category || "정비"}
                          </span>

                          {log.fault_code && (
                            <span className="rounded-md bg-red-500/10 px-2 py-1 text-[11px] font-black text-red-300">
                              {log.fault_code}
                            </span>
                          )}
                        </div>

                        <h2 className="mt-2 line-clamp-2 text-base font-black leading-6">
                          {displayTitle(log)}
                        </h2>
                      </div>

                      <span className="shrink-0 text-[11px] text-zinc-600">
                        {log.maintenance_date}
                      </span>
                    </div>

                    {(log.symptoms || log.details) && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
                        {log.symptoms || log.details}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
                      {(log.truck_brand || log.truck_model) && (
                        <span>
                          {[log.truck_brand, log.truck_model]
                            .filter(Boolean)
                            .join(" ")}
                          {log.truck_year ? ` · ${log.truck_year}` : ""}
                        </span>
                      )}

                      {log.repair_region && <span>{log.repair_region}</span>}
                      <span>{money(log.cost)}</span>
                      <span>댓글 {commentCount}</span>
                    </div>

                    {log.user_id === userId && (
                      <div className="mt-3 text-[11px] font-bold text-orange-400">
                        내가 등록한 글
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </section>
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/85 p-3 backdrop-blur-sm">
          <div className="mx-auto my-4 w-full max-w-lg rounded-3xl bg-white p-4 text-zinc-900 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-orange-600">
                  차량정비 게시판
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  정비사례 등록
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xl font-black"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <Field label="제목 *">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: MCM 670610 냉각팬 관련 수리"
                  className="inputStyle"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="분류">
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

                <Field label="고장코드">
                  <input
                    value={faultCode}
                    onChange={(e) => setFaultCode(e.target.value)}
                    placeholder="예: 670610"
                    className="inputStyle"
                  />
                </Field>
              </div>

              <Field label="증상">
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="어떤 증상이 있었는지 간단히 적어주세요."
                  rows={3}
                  className="textareaStyle"
                />
              </Field>

              <Field label="정비 내용 *">
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="점검한 내용, 교체한 부품, 정비 과정 등을 적어주세요."
                  rows={5}
                  className="textareaStyle"
                />
              </Field>

              <Field label="정비 후 결과">
                <textarea
                  value={repairResult}
                  onChange={(e) => setRepairResult(e.target.value)}
                  placeholder="수리 후 증상이 해결됐는지 적어주세요."
                  rows={3}
                  className="textareaStyle"
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

                <Field label="주행거리">
                  <input
                    inputMode="numeric"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="823000"
                    className="inputStyle"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="정비지역">
                  <input
                    value={repairRegion}
                    onChange={(e) => setRepairRegion(e.target.value)}
                    placeholder="예: 전주"
                    className="inputStyle"
                  />
                </Field>

                <Field label="정비업체">
                  <input
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="업체명"
                    className="inputStyle"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="정비 날짜">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="inputStyle"
                  />
                </Field>

                <Field label="비용">
                  <input
                    inputMode="numeric"
                    value={cost}
                    onChange={(e) =>
                      setCost(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="480000"
                    className="inputStyle"
                  />
                </Field>
              </div>

              <div className="rounded-2xl bg-orange-50 p-4 text-xs leading-5 text-orange-800">
                게시한 정비사례는 다른 운송차주가 검색하고 참고할 수 있습니다.
                차량번호와 전화번호는 게시글에 표시하지 않습니다.
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={savePost}
                className="h-14 w-full rounded-xl bg-orange-600 text-base font-black text-white disabled:bg-zinc-300"
              >
                {saving ? "등록 중..." : "정비사례 등록"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/90 p-3 backdrop-blur-sm">
          <div className="mx-auto my-4 w-full max-w-lg rounded-3xl bg-zinc-950 p-4 text-white shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-md bg-orange-500/10 px-2 py-1 text-xs font-black text-orange-400">
                    {selectedLog.category || "정비"}
                  </span>
                  {selectedLog.fault_code && (
                    <span className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-black text-red-300">
                      {selectedLog.fault_code}
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-xl font-black leading-7">
                  {displayTitle(selectedLog)}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xl font-black"
              >
                ×
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
              {(selectedLog.truck_brand || selectedLog.truck_model) && (
                <span className="rounded-lg bg-zinc-900 px-3 py-2">
                  {[selectedLog.truck_brand, selectedLog.truck_model]
                    .filter(Boolean)
                    .join(" ")}
                  {selectedLog.truck_year ? ` · ${selectedLog.truck_year}` : ""}
                </span>
              )}
              <span className="rounded-lg bg-zinc-900 px-3 py-2">
                {mileageText(selectedLog.mileage)}
              </span>
              <span className="rounded-lg bg-zinc-900 px-3 py-2">
                {selectedLog.maintenance_date}
              </span>
            </div>

            {selectedLog.symptoms && (
              <DetailBlock label="증상" value={selectedLog.symptoms} />
            )}

            <DetailBlock label="정비 내용" value={selectedLog.details} />

            {selectedLog.repair_result && (
              <DetailBlock
                label="정비 후 결과"
                value={selectedLog.repair_result}
              />
            )}

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <InfoBox label="정비지역" value={selectedLog.repair_region || "-"} />
              <InfoBox label="정비업체" value={selectedLog.shop_name || "-"} />
              <InfoBox label="정비비용" value={money(selectedLog.cost)} />
              <InfoBox label="고장코드" value={selectedLog.fault_code || "-"} />
            </div>

            {selectedLog.user_id === userId && (
              <button
                type="button"
                onClick={() => deletePost(selectedLog)}
                className="mt-4 text-xs font-bold text-red-400"
              >
                이 글 삭제
              </button>
            )}

            <section className="mt-6 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between">
                <h3 className="font-black">댓글</h3>
                <span className="text-sm text-zinc-500">
                  {
                    comments.filter(
                      (comment) => comment.log_id === selectedLog.id
                    ).length
                  }
                  개
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {comments
                  .filter((comment) => comment.log_id === selectedLog.id)
                  .map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl bg-zinc-900 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                          {comment.body}
                        </p>

                        {comment.user_id === userId && (
                          <button
                            type="button"
                            onClick={() => deleteComment(comment)}
                            className="shrink-0 text-[11px] font-bold text-red-400"
                          >
                            삭제
                          </button>
                        )}
                      </div>

                      <p className="mt-2 text-[10px] text-zinc-600">
                        {new Date(comment.created_at).toLocaleString("ko-KR")}
                      </p>
                    </div>
                  ))}
              </div>

              <div className="mt-3 flex gap-2">
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  rows={2}
                  placeholder="정비 경험이나 도움이 되는 정보를 남겨주세요."
                  className="min-w-0 flex-1 resize-none rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm outline-none focus:border-orange-500"
                />

                <button
                  type="button"
                  disabled={commentSaving || !commentBody.trim()}
                  onClick={saveComment}
                  className="w-16 shrink-0 rounded-xl bg-orange-600 text-sm font-black disabled:bg-zinc-800 disabled:text-zinc-600"
                >
                  등록
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      <Footer />

      <style jsx>{`
        .inputStyle {
          width: 100%;
          min-width: 0;
          height: 48px;
          border: 1px solid #e4e4e7;
          border-radius: 12px;
          background: #fafafa;
          padding: 0 14px;
          font-size: 14px;
          outline: none;
        }

        .inputStyle:focus,
        .textareaStyle:focus {
          border-color: #ea580c;
        }

        .textareaStyle {
          width: 100%;
          min-width: 0;
          resize: none;
          border: 1px solid #e4e4e7;
          border-radius: 12px;
          background: #fafafa;
          padding: 14px;
          font-size: 14px;
          line-height: 1.6;
          outline: none;
        }
      `}</style>
    </>
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
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-bold text-zinc-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mt-4 rounded-2xl bg-zinc-900 p-4">
      <p className="text-xs font-black text-orange-400">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-900 p-3">
      <p className="text-[11px] text-zinc-600">{label}</p>
      <p className="mt-1 break-words font-bold text-zinc-300">{value}</p>
    </div>
  );
}