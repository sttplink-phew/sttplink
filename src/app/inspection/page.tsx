"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/client";

type DayStatus = "normal" | "bad" | "off";
type ItemMark = "O" | "X" | "미";

type InspectionRecord = {
  id?: number;
  inspection_date: string;
  status: DayStatus;
  item_results: Record<string, ItemMark>;
  action_note: string | null;
};

type InspectionSettings = {
  transport_company_name: string;
  driver_name: string;
  recipient_email: string;
};

const inspectionItems = [
  {
    id: "exterior_1",
    group: "외관점검",
    label: "번호판, 전면유리, 후사경 등의 청결상태",
  },
  {
    id: "exterior_2",
    group: "외관점검",
    label: "후미등, 차폭등 등 등화장치 작동상태",
  },
  {
    id: "exterior_3",
    group: "외관점검",
    label: "창닦이기 작동상태",
  },
  {
    id: "exterior_4",
    group: "외관점검",
    label:
      "적재함(보조지지대 포함), 적재 보호대, 후부반사판, 트레일러 연결장치의 부착 상태 및 훼손 여부",
  },
  {
    id: "condition_1",
    group: "상태점검",
    label: "타이어 손상 및 마모(1.6mm 이상) 여부",
  },
  {
    id: "condition_2",
    group: "상태점검",
    label: "화물, 적재함 지지대 등 고정상태",
  },
  {
    id: "condition_3",
    group: "상태점검",
    label: "바퀴 너트 등 균열 여부",
  },
  {
    id: "other_1",
    group: "기타",
    label: "냉각수, 공기압, 엔진오일 등 차량 이상 여부(계기판 확인)",
  },
  {
    id: "other_2",
    group: "기타",
    label: "적색안전띠 상태",
  },
  {
    id: "other_3",
    group: "기타",
    label: "소화기 비치 여부",
  },
  {
    id: "other_4",
    group: "기타",
    label: "안전삼각대 등 비치 여부",
  },
] as const;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

function daysInMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function dateValue(monthKey: string, day: number) {
  return `${monthKey}-${pad2(day)}`;
}

function makeAllMarks(mark: ItemMark) {
  return Object.fromEntries(
    inspectionItems.map((item) => [item.id, mark])
  ) as Record<string, ItemMark>;
}

function statusLabel(status?: DayStatus) {
  if (status === "normal") return "정상";
  if (status === "bad") return "불량";
  if (status === "off") return "미운행";
  return "미기록";
}

function statusSymbol(status?: DayStatus) {
  if (status === "normal") return "○";
  if (status === "bad") return "×";
  if (status === "off") return "미";
  return "-";
}

export default function InspectionPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [monthKey, setMonthKey] = useState(getMonthKey());
  const [records, setRecords] = useState<Record<string, InspectionRecord>>({});
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editingMarks, setEditingMarks] = useState<Record<string, ItemMark>>(
    makeAllMarks("O")
  );
  const [editingNote, setEditingNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [sending, setSending] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<InspectionSettings>({
    transport_company_name: "",
    driver_name: "",
    recipient_email: "",
  });

  const totalDays = daysInMonth(monthKey);
  const monthDates = Array.from({ length: totalDays }, (_, index) =>
    dateValue(monthKey, index + 1)
  );

  const completedCount = monthDates.filter((date) => records[date]).length;
  const missingCount = totalDays - completedCount;

  useEffect(() => {
    async function loadBase() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const [{ data: driver }, { data: setting }] = await Promise.all([
        supabase
  .from("inspection_settings")
  .select("vehicle_number, transport_company_name, driver_name, recipient_email")
  .eq("user_id", user.id)
  .maybeSingle(),

  supabase
  .from("inspection_settings")
  .select("vehicle_number, transport_company_name, driver_name, recipient_email")
  .eq("user_id", user.id)
  .maybeSingle(),
]);

setVehicleNumber(
  setting?.vehicle_number ?? driver?.vehicle_number ?? ""
);

if (setting) {
  setSettings({
    transport_company_name: setting.transport_company_name ?? "",
    driver_name: setting.driver_name ?? "",
    recipient_email: setting.recipient_email ?? "",
  });
}

setLoading(false);

      setLoading(false);
    }

    loadBase();
  }, [router, supabase]);

  useEffect(() => {
    if (!userId) return;

    async function loadMonth() {
      const startDate = `${monthKey}-01`;
      const endDate = `${monthKey}-${pad2(daysInMonth(monthKey))}`;

      const { data, error } = await supabase
        .from("daily_inspections")
        .select("id, inspection_date, status, item_results, action_note")
        .eq("user_id", userId)
        .gte("inspection_date", startDate)
        .lte("inspection_date", endDate)
        .order("inspection_date", { ascending: true });

      if (error) {
        console.error("점검표 불러오기 실패:", error);
        return;
      }

      const next: Record<string, InspectionRecord> = {};

      (data ?? []).forEach((row) => {
        next[row.inspection_date] = {
          id: row.id,
          inspection_date: row.inspection_date,
          status: row.status as DayStatus,
          item_results: (row.item_results ?? {}) as Record<string, ItemMark>,
          action_note: row.action_note ?? null,
        };
      });

      setRecords(next);
      setSelectedDates([]);
    }

    loadMonth();
  }, [monthKey, supabase, userId]);

  function moveMonth(offset: number) {
    const [year, month] = monthKey.split("-").map(Number);
    const next = new Date(year, month - 1 + offset, 1);
    setMonthKey(getMonthKey(next));
    setShowReport(false);
  }

  function toggleDate(date: string) {
    setSelectedDates((current) =>
      current.includes(date)
        ? current.filter((item) => item !== date)
        : [...current, date]
    );
  }

  async function saveBulk(status: "normal" | "off") {
    if (!userId || selectedDates.length === 0) return;

    setSaving(true);

    const mark: ItemMark = status === "normal" ? "O" : "미";

    const rows = selectedDates.map((date) => ({
      user_id: userId,
      inspection_date: date,
      status,
      item_results: makeAllMarks(mark),
      action_note: null,
    }));

    const { error } = await supabase
      .from("daily_inspections")
      .upsert(rows, { onConflict: "user_id,inspection_date" });

    setSaving(false);

    if (error) {
      alert(`저장 실패\n${error.message}`);
      return;
    }

    setRecords((current) => {
      const next = { ...current };

      selectedDates.forEach((date) => {
        next[date] = {
          inspection_date: date,
          status,
          item_results: makeAllMarks(mark),
          action_note: null,
        };
      });

      return next;
    });

    setSelectedDates([]);
  }

  function openDetail(date: string) {
    const existing = records[date];

    setEditingDate(date);
    setEditingMarks(
      existing?.item_results && Object.keys(existing.item_results).length > 0
        ? existing.item_results
        : makeAllMarks("O")
    );
    setEditingNote(existing?.action_note ?? "");
  }

  function toggleItem(itemId: string) {
    setEditingMarks((current) => ({
      ...current,
      [itemId]: current[itemId] === "X" ? "O" : "X",
    }));
  }

  async function saveDetail() {
    if (!userId || !editingDate) return;

    const hasBad = Object.values(editingMarks).some((value) => value === "X");
    const status: DayStatus = hasBad ? "bad" : "normal";

    setSaving(true);

    const { error } = await supabase
      .from("daily_inspections")
      .upsert(
        {
          user_id: userId,
          inspection_date: editingDate,
          status,
          item_results: editingMarks,
          action_note: editingNote.trim() || null,
        },
        { onConflict: "user_id,inspection_date" }
      );

    setSaving(false);

    if (error) {
      alert(`저장 실패\n${error.message}`);
      return;
    }

    setRecords((current) => ({
      ...current,
      [editingDate]: {
        inspection_date: editingDate,
        status,
        item_results: editingMarks,
        action_note: editingNote.trim() || null,
      },
    }));

    setEditingDate(null);
  }

  async function deleteRecord(date: string) {
    if (!userId) return;
    if (!confirm(`${date} 기록을 미기록 상태로 되돌릴까요?`)) return;

    const { error } = await supabase
      .from("daily_inspections")
      .delete()
      .eq("user_id", userId)
      .eq("inspection_date", date);

    if (error) {
      alert(error.message);
      return;
    }

    setRecords((current) => {
      const next = { ...current };
      delete next[date];
      return next;
    });
  }

  async function saveSettings() {
    if (!userId) return;

    setSaving(true);

    const { error } = await supabase
      .from("inspection_settings")
      .upsert(
        {
          user_id: userId,
          vehicle_number: vehicleNumber.trim() || null,
          transport_company_name: settings.transport_company_name.trim() || null,
          driver_name: settings.driver_name.trim() || null,
          recipient_email: settings.recipient_email.trim() || null,
        },
        { onConflict: "user_id" }
      );

    setSaving(false);

    if (error) {
      alert(`설정 저장 실패\n${error.message}`);
      return;
    }

    alert("점검표 기본정보를 저장했습니다.");
  }

  function printReport() {
    setShowReport(true);

    window.setTimeout(() => {
      window.print();
    }, 150);
  }

  async function makePdfBase64() {
    if (!reportRef.current) {
      throw new Error("점검표 PDF 영역을 찾을 수 없습니다.");
    }

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });

    const imageData = canvas.toDataURL("image/jpeg", 0.96);

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 5;

    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;

    const imageRatio = canvas.width / canvas.height;
    const pageRatio = usableWidth / usableHeight;

    let width = usableWidth;
    let height = usableHeight;

    if (imageRatio > pageRatio) {
      height = usableWidth / imageRatio;
    } else {
      width = usableHeight * imageRatio;
    }

    const x = (pageWidth - width) / 2;
    const y = (pageHeight - height) / 2;

    pdf.addImage(imageData, "JPEG", x, y, width, height, undefined, "FAST");

    const dataUri = pdf.output("datauristring");
    const base64 = dataUri.split(",")[1];

    if (!base64) {
      throw new Error("PDF 생성에 실패했습니다.");
    }

    return base64;
  }

  async function sendEmail() {
    const recipient = settings.recipient_email.trim();

    if (!recipient) {
      alert("운송사 담당자 이메일을 먼저 입력하고 저장해주세요.");
      return;
    }

    if (missingCount > 0) {
      const proceed = confirm(
        `현재 ${missingCount}일이 미기록 상태입니다. 그래도 전송할까요?`
      );

      if (!proceed) return;
    }

    setSending(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("로그인 정보를 확인할 수 없습니다.");
      }

      const pdfBase64 = await makePdfBase64();

      const response = await fetch("/api/inspection/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          recipient,
          monthKey,
          vehicleNumber,
          driverName: settings.driver_name,
          transportCompanyName: settings.transport_company_name,
          pdfBase64,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "이메일 전송에 실패했습니다.");
      }

      alert(`${recipient}\n점검표를 전송했습니다.`);
    } catch (error) {
      console.error("점검표 이메일 전송 실패:", error);

      alert(
        error instanceof Error
          ? error.message
          : "점검표 이메일 전송에 실패했습니다."
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
          불러오는 중...
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen overflow-x-hidden bg-[#080808] px-4 pb-20 pt-24 text-white print:bg-white print:p-0">
        <div className="mx-auto w-full max-w-3xl print:hidden">
          <section className="rounded-3xl border border-white/10 bg-zinc-900 p-4 shadow-xl sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black tracking-[0.14em] text-orange-500">
                  STTP LINK
                </p>
                <h1 className="mt-1 text-2xl font-black">
                  차량 일일점검표
                </h1>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  평소 점검한 내용을 월말에 빠르게 정리하고 제출할 수 있습니다.
                </p>
              </div>

              <Link
                href="/"
                className="shrink-0 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-zinc-300"
              >
                홈
              </Link>
            </div>
          </section>

          <section className="mt-3 rounded-3xl border border-white/10 bg-zinc-900 p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-xl font-black"
              >
                ‹
              </button>

              <div className="text-center">
                <div className="text-xl font-black">{monthKey}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  기록 {completedCount}일 · 미기록 {missingCount}일
                </div>
              </div>

              <button
                type="button"
                onClick={() => moveMonth(1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-xl font-black"
              >
                ›
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2">
              {monthDates.map((date) => {
                const day = Number(date.slice(-2));
                const record = records[date];
                const selected = selectedDates.includes(date);

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => toggleDate(date)}
                    onDoubleClick={() => openDetail(date)}
                    className={`relative min-h-[74px] rounded-xl border p-2 text-left transition ${
                      selected
                        ? "border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20"
                        : record?.status === "bad"
                        ? "border-red-500/40 bg-red-500/10"
                        : record?.status === "normal"
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : record?.status === "off"
                        ? "border-blue-500/30 bg-blue-500/10"
                        : "border-white/10 bg-zinc-800"
                    }`}
                  >
                    <div className="text-sm font-black">{day}</div>
                    <div className="mt-2 text-xs font-bold text-zinc-400">
                      {statusLabel(record?.status)}
                    </div>
                    <div className="absolute right-2 top-2 text-sm font-black">
                      {statusSymbol(record?.status)}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-xs leading-5 text-zinc-500">
              날짜를 여러 개 선택한 뒤 한 번에 정상 또는 미운행으로 기록하세요.
              세부 불량 기록은 아래 ‘선택 날짜 상세’에서 처리할 수 있습니다.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={selectedDates.length === 0 || saving}
                onClick={() => saveBulk("normal")}
                className="h-12 rounded-xl bg-orange-600 text-sm font-black text-white disabled:bg-zinc-700 disabled:text-zinc-500"
              >
                선택 날짜 정상 ○
              </button>

              <button
                type="button"
                disabled={selectedDates.length === 0 || saving}
                onClick={() => saveBulk("off")}
                className="h-12 rounded-xl bg-zinc-700 text-sm font-black text-white disabled:text-zinc-500"
              >
                선택 날짜 미운행 ‘미’
              </button>
            </div>

            {selectedDates.length === 1 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openDetail(selectedDates[0])}
                  className="h-11 rounded-xl border border-white/10 bg-zinc-800 text-sm font-bold"
                >
                  선택 날짜 상세
                </button>

                {records[selectedDates[0]] && (
                  <button
                    type="button"
                    onClick={() => deleteRecord(selectedDates[0])}
                    className="h-11 rounded-xl border border-red-500/20 bg-red-500/10 text-sm font-bold text-red-300"
                  >
                    기록 지우기
                  </button>
                )}
              </div>
            )}
          </section>

          <section className="mt-3 rounded-3xl border border-white/10 bg-zinc-900 p-4 shadow-xl">
            <h2 className="font-black">점검표 기본정보</h2>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-zinc-500">
                  운송사업자명
                </span>
                <input
                  value={settings.transport_company_name}
                  onChange={(e) =>
                    setSettings((current) => ({
                      ...current,
                      transport_company_name: e.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-xl border border-white/10 bg-zinc-800 px-4 text-sm outline-none focus:border-orange-500"
                  placeholder="예: ○○운수"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-xs font-bold text-zinc-500">
                    차량번호
                  </span>
                  <input
  value={vehicleNumber}
  onChange={(e) => setVehicleNumber(e.target.value)}
  className="h-12 w-full min-w-0 rounded-xl border border-white/10 bg-zinc-800 px-4 text-sm text-white outline-none focus:border-orange-500"
/>
                </label>

                <label className="block min-w-0">
                  <span className="mb-1.5 block text-xs font-bold text-zinc-500">
                    운수종사자명
                  </span>
                  <input
                    value={settings.driver_name}
                    onChange={(e) =>
                      setSettings((current) => ({
                        ...current,
                        driver_name: e.target.value,
                      }))
                    }
                    className="h-12 w-full min-w-0 rounded-xl border border-white/10 bg-zinc-800 px-4 text-sm outline-none focus:border-orange-500"
                    placeholder="성명"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-zinc-500">
                  운송사 담당자 이메일
                </span>
                <input
                  type="email"
                  value={settings.recipient_email}
                  onChange={(e) =>
                    setSettings((current) => ({
                      ...current,
                      recipient_email: e.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-xl border border-white/10 bg-zinc-800 px-4 text-sm outline-none focus:border-orange-500"
                  placeholder="담당자 이메일"
                />
              </label>

              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="h-12 w-full rounded-xl border border-orange-500/30 bg-orange-500/10 text-sm font-black text-orange-400"
              >
                기본정보 저장
              </button>
            </div>
          </section>

          <section className="mt-3 rounded-3xl border border-white/10 bg-zinc-900 p-4 shadow-xl">
            <h2 className="font-black">월말 제출</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              현재 기록을 종이 양식 형태로 확인한 뒤 브라우저 인쇄에서 PDF로
              저장할 수 있습니다.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowReport((value) => !value)}
                className="h-12 rounded-xl border border-white/10 bg-zinc-800 text-sm font-black"
              >
                {showReport ? "미리보기 닫기" : "점검표 미리보기"}
              </button>

              <button
                type="button"
                onClick={printReport}
                className="h-12 rounded-xl bg-orange-600 text-sm font-black"
              >
                PDF / 인쇄
              </button>
            </div>

            <button
              type="button"
              onClick={sendEmail}
              disabled={sending}
              className="mt-2 h-12 w-full rounded-xl bg-orange-600 text-sm font-black text-white transition disabled:bg-zinc-700 disabled:text-zinc-400"
            >
              {sending ? "PDF 생성 · 전송 중..." : "담당자 이메일 전송"}
            </button>
          </section>

          {showReport && (
            <section className="mt-3 overflow-x-auto rounded-3xl border border-white/10 bg-white p-4 text-zinc-900">
              <MonthlyReport
                monthKey={monthKey}
                vehicleNumber={vehicleNumber}
                settings={settings}
                records={records}
              />
            </section>
          )}
        </div>

        <div
          ref={reportRef}
          aria-hidden="true"
          className="fixed left-[-10000px] top-0 z-[-1] bg-white"
        >
          <MonthlyReport
            monthKey={monthKey}
            vehicleNumber={vehicleNumber}
            settings={settings}
            records={records}
          />
        </div>

        <div className="hidden print:block print-only-report">
          <MonthlyReport
            monthKey={monthKey}
            vehicleNumber={vehicleNumber}
            settings={settings}
            records={records}
          />
        </div>
      </main>

      {editingDate && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/85 p-3 backdrop-blur-sm print:hidden">
          <div className="mx-auto my-4 w-full max-w-xl rounded-3xl bg-white p-4 text-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-orange-600">세부 점검</p>
                <h2 className="mt-1 text-xl font-black">{editingDate}</h2>
              </div>

              <button
                type="button"
                onClick={() => setEditingDate(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xl font-black"
              >
                ×
              </button>
            </div>

            <p className="mt-3 text-xs leading-5 text-zinc-500">
              이상이 있는 항목만 눌러 ×로 바꾸세요. 나머지는 ○로 저장됩니다.
            </p>

            <div className="mt-4 space-y-2">
              {inspectionItems.map((item) => {
                const bad = editingMarks[item.id] === "X";

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left ${
                      bad
                        ? "border-red-300 bg-red-50"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-black ${
                        bad
                          ? "bg-red-600 text-white"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {bad ? "×" : "○"}
                    </span>

                    <div>
                      <div className="text-xs font-bold text-zinc-400">
                        {item.group}
                      </div>
                      <div className="mt-0.5 text-sm font-bold leading-5">
                        {item.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-black">
                불량상태 조치 기록
              </span>
              <textarea
                rows={4}
                value={editingNote}
                onChange={(e) => setEditingNote(e.target.value)}
                placeholder="불량 내용과 조치사항이 있는 경우 입력하세요."
                className="w-full resize-none rounded-xl border border-zinc-200 p-3 text-sm outline-none focus:border-orange-500"
              />
            </label>

            <button
              type="button"
              onClick={saveDetail}
              disabled={saving}
              className="mt-4 h-12 w-full rounded-xl bg-orange-600 text-sm font-black text-white disabled:bg-zinc-300"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

function MonthlyReport({
  monthKey,
  vehicleNumber,
  settings,
  records,
}: {
  monthKey: string;
  vehicleNumber: string;
  settings: InspectionSettings;
  records: Record<string, InspectionRecord>;
}) {
  const totalDays = daysInMonth(monthKey);
  const days = Array.from({ length: 31 }, (_, index) => index + 1);

  function markFor(itemId: string, day: number): string {
    if (day > totalDays) return "";

    const record = records[dateValue(monthKey, day)];

    if (!record) return "";
    if (record.status === "off") return "미";
    if (record.status === "normal") return "○";

    return record.item_results?.[itemId] ?? "○";
  }

  const actionNotes = Object.values(records)
    .filter((record) => record.action_note?.trim())
    .sort((a, b) => a.inspection_date.localeCompare(b.inspection_date))
    .map(
      (record) =>
        `${Number(record.inspection_date.slice(-2))}일: ${record.action_note}`
    )
    .join(" / ");

  return (
    <div className="min-w-[1150px] bg-white p-3 text-black print:min-w-0 print:p-2">
      
      <style jsx global>{`
  @page {
    size: A4 landscape;
    margin: 8mm;
  }

  @media print {
    body {
      background: white !important;
    }

    header,
    nav {
      display: none !important;
    }

    main > * {
      display: none !important;
    }

    main > .print-only-report {
      display: block !important;
    }

    .print-only-report {
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .inspection-print-table {
      font-size: 7px !important;
    }
  }
`}</style>

      <h2 className="mb-2 text-center text-base font-bold">
        운수종사자 일상점검표
      </h2>

      <table className="inspection-print-table w-full table-fixed border-collapse text-[8px]">
        <tbody>
          <tr>
            <th className="w-[70px] border border-black p-1">점검연월</th>
            <td className="w-[90px] border border-black p-1 text-center">
              {monthKey}
            </td>
            <th className="w-[90px] border border-black p-1">운송사업자명</th>
            <td className="border border-black p-1">
              {settings.transport_company_name}
            </td>
            <th className="w-[70px] border border-black p-1">차량번호</th>
            <td className="w-[120px] border border-black p-1 text-center">
              {vehicleNumber}
            </td>
            <th className="w-[85px] border border-black p-1">운수종사자명</th>
            <td className="w-[120px] border border-black p-1 text-center">
              {settings.driver_name}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="inspection-print-table mt-2 w-full table-fixed border-collapse text-[7px]">
        <thead>
          <tr>
            <th
              colSpan={2}
              className="w-[300px] border border-black p-1 text-center"
            >
              점검항목
            </th>
            <th colSpan={31} className="border border-black p-1 text-center">
              점검결과(양호 ○, 불량 ×, 미운행시 “미” 기입)
            </th>
          </tr>
          <tr>
            <th className="w-[48px] border border-black p-1">구분</th>
            <th className="w-[252px] border border-black p-1">세부항목</th>
            {days.map((day) => (
              <th key={day} className="border border-black p-0.5 text-center">
                {day}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {inspectionItems.map((item, index) => {
            const isFirstOfGroup =
              index === 0 ||
              inspectionItems[index - 1].group !== item.group;

            const groupSpan = inspectionItems.filter(
              (target) => target.group === item.group
            ).length;

            return (
              <tr key={item.id}>
                {isFirstOfGroup && (
                  <th
                    rowSpan={groupSpan}
                    className="border border-black p-1 text-center align-middle"
                  >
                    {item.group}
                  </th>
                )}

                <td className="border border-black p-1 leading-tight">
                  {item.label}
                </td>

                {days.map((day) => (
                  <td
                    key={day}
                    className="border border-black p-0.5 text-center font-bold"
                  >
                    {markFor(item.id, day)}
                  </td>
                ))}
              </tr>
            );
          })}

          <tr>
            <th colSpan={2} className="border border-black p-1 text-left">
              점검자 확인(서명)
            </th>
            <td colSpan={31} className="border border-black p-1">
              {settings.driver_name}
            </td>
          </tr>

          <tr>
            <th colSpan={2} className="h-14 border border-black p-1 text-left">
              불량상태 조치 기록
            </th>
            <td colSpan={31} className="border border-black p-1 align-top">
              {actionNotes}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}