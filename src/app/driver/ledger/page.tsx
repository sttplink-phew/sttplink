"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/client";

type FixedCost = {
  id: number;
  title: string;
  monthly_amount: number;
  payment_day: number | null;
  interest_rate: number | null;
  remaining_months: number | null;
  sort_order: number;
};

type FormState = {
  id?: number;
  title: string;
  monthlyAmount: string;
  paymentDay: string;
  interestRate: string;
  remainingMonths: string;
};

const emptyForm: FormState = {
  title: "",
  monthlyAmount: "",
  paymentDay: "",
  interestRate: "",
  remainingMonths: "",
};

function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export default function DriverLedgerPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState("");
  const [items, setItems] = useState<FixedCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const monthlyTotal = items.reduce(
    (sum, item) => sum + Number(item.monthly_amount ?? 0),
    0
  );

  const remainingTotal = items.reduce((sum, item) => {
    if (item.remaining_months === null || item.remaining_months === undefined) {
      return sum;
    }

    return sum + Number(item.monthly_amount ?? 0) * item.remaining_months;
  }, 0);

  useEffect(() => {
    async function loadLedger() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("driver_fixed_costs")
        .select(
          "id, title, monthly_amount, payment_day, interest_rate, remaining_months, sort_order"
        )
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        alert(`내 차계부 조회 실패\n${error.message}\n${error.code ?? ""}`);
        setLoading(false);
        return;
      }

      setItems((data ?? []) as FixedCost[]);
      setLoading(false);
    }

    loadLedger();
  }, [router, supabase]);

  function openNewForm() {
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(item: FixedCost) {
    setForm({
      id: item.id,
      title: item.title,
      monthlyAmount: String(item.monthly_amount ?? ""),
      paymentDay: item.payment_day ? String(item.payment_day) : "",
      interestRate:
        item.interest_rate !== null && item.interest_rate !== undefined
          ? String(item.interest_rate)
          : "",
      remainingMonths:
        item.remaining_months !== null && item.remaining_months !== undefined
          ? String(item.remaining_months)
          : "",
    });
    setShowForm(true);
  }

  async function saveItem() {
    if (!userId) return;

    const title = form.title.trim();
    const monthlyAmount = Number(form.monthlyAmount.replace(/,/g, ""));

    if (!title) {
      alert("항목명을 입력해주세요.");
      return;
    }

    if (!monthlyAmount || monthlyAmount < 0) {
      alert("월 납입금을 입력해주세요.");
      return;
    }

    const paymentDay = form.paymentDay ? Number(form.paymentDay) : null;
    const interestRate = form.interestRate ? Number(form.interestRate) : null;
    const remainingMonths = form.remainingMonths
      ? Number(form.remainingMonths)
      : null;

    if (paymentDay !== null && (paymentDay < 1 || paymentDay > 31)) {
      alert("출금일은 1일부터 31일 사이로 입력해주세요.");
      return;
    }

    setSaving(true);

    if (form.id) {
      const { data, error } = await supabase
        .from("driver_fixed_costs")
        .update({
          title,
          monthly_amount: monthlyAmount,
          payment_day: paymentDay,
          interest_rate: interestRate,
          remaining_months: remainingMonths,
          updated_at: new Date().toISOString(),
        })
        .eq("id", form.id)
        .eq("user_id", userId)
        .select(
          "id, title, monthly_amount, payment_day, interest_rate, remaining_months, sort_order"
        )
        .single();

      setSaving(false);

      if (error) {
        alert(`수정 실패\n${error.message}`);
        return;
      }

      setItems((current) =>
        current.map((item) => (item.id === data.id ? (data as FixedCost) : item))
      );
    } else {
      const nextSort =
        items.length > 0
          ? Math.max(...items.map((item) => item.sort_order ?? 0)) + 1
          : 1;

      const { data, error } = await supabase
        .from("driver_fixed_costs")
        .insert({
          user_id: userId,
          title,
          monthly_amount: monthlyAmount,
          payment_day: paymentDay,
          interest_rate: interestRate,
          remaining_months: remainingMonths,
          sort_order: nextSort,
        })
        .select(
          "id, title, monthly_amount, payment_day, interest_rate, remaining_months, sort_order"
        )
        .single();

      setSaving(false);

      if (error) {
        alert(`추가 실패\n${error.message}`);
        return;
      }

      setItems((current) => [...current, data as FixedCost]);
    }

    setShowForm(false);
    setForm(emptyForm);
  }

  async function deleteItem(item: FixedCost) {
    if (!userId) return;
    if (!confirm(`"${item.title}" 항목을 삭제할까요?`)) return;

    const { error } = await supabase
      .from("driver_fixed_costs")
      .delete()
      .eq("id", item.id)
      .eq("user_id", userId);

    if (error) {
      alert(`삭제 실패\n${error.message}`);
      return;
    }

    setItems((current) => current.filter((target) => target.id !== item.id));
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

      <main className="min-h-screen overflow-x-hidden bg-[#080808] px-4 pb-20 pt-24 text-white">
        <div className="mx-auto w-full max-w-lg">
          <section className="rounded-3xl border border-white/10 bg-zinc-900 p-4 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-[0.14em] text-orange-500">
                  STTP LINK
                </p>
                <h1 className="mt-1 text-2xl font-black">내 차계부</h1>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  매월 빠져나가는 고정지출과 남은 부담액을 관리합니다.
                </p>
              </div>

              <Link
                href="/driver/my"
                className="shrink-0 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-zinc-300"
              >
                내정보
              </Link>
            </div>
          </section>

          <section className="mt-3 rounded-3xl border border-orange-500/20 bg-zinc-900 p-4 shadow-xl">
            <p className="text-xs font-bold text-zinc-500">이번 달 고정지출</p>
            <div className="mt-2 text-3xl font-black text-orange-500">
              {formatWon(monthlyTotal)}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-zinc-800 p-3">
                <div className="text-xs text-zinc-500">등록 항목</div>
                <div className="mt-1 text-xl font-black">
                  {items.length}
                  <span className="ml-1 text-xs text-zinc-500">개</span>
                </div>
              </div>

              <div className="rounded-2xl bg-zinc-800 p-3">
                <div className="text-xs text-zinc-500">남은 납입예정액</div>
                <div className="mt-1 text-lg font-black">
                  {formatWon(remainingTotal)}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-3 rounded-3xl border border-white/10 bg-zinc-900 p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-black">고정지출 항목</h2>

              <button
                type="button"
                onClick={openNewForm}
                className="rounded-xl bg-orange-600 px-3 py-2 text-xs font-black"
              >
                + 추가
              </button>
            </div>

            {items.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-5 text-center">
                <p className="text-sm text-zinc-400">
                  등록된 고정지출이 없습니다.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {items.map((item) => {
                  const remainingAmount =
                    item.remaining_months !== null &&
                    item.remaining_months !== undefined
                      ? Number(item.monthly_amount) * item.remaining_months
                      : null;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-zinc-800/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-black">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm font-bold text-orange-400">
                            월 {formatWon(Number(item.monthly_amount))}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => openEditForm(item)}
                          className="shrink-0 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-bold text-zinc-300"
                        >
                          수정
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-xl bg-zinc-900/80 p-3">
                          <div className="text-xs text-zinc-500">출금일</div>
                          <div className="mt-1 font-black">
                            {item.payment_day ? `매월 ${item.payment_day}일` : "미설정"}
                          </div>
                        </div>

                        <div className="rounded-xl bg-zinc-900/80 p-3">
                          <div className="text-xs text-zinc-500">이자율</div>
                          <div className="mt-1 font-black">
                            {item.interest_rate !== null &&
                            item.interest_rate !== undefined
                              ? `${item.interest_rate}%`
                              : "해당없음"}
                          </div>
                        </div>

                        <div className="rounded-xl bg-zinc-900/80 p-3">
                          <div className="text-xs text-zinc-500">남은 개월</div>
                          <div className="mt-1 font-black">
                            {item.remaining_months !== null &&
                            item.remaining_months !== undefined
                              ? `${item.remaining_months}개월`
                              : "계속"}
                          </div>
                        </div>

                        <div className="rounded-xl bg-zinc-900/80 p-3">
                          <div className="text-xs text-zinc-500">남은 납입예정액</div>
                          <div className="mt-1 font-black">
                            {remainingAmount !== null
                              ? formatWon(remainingAmount)
                              : "-"}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteItem(item)}
                        className="mt-3 text-xs font-bold text-red-400"
                      >
                        삭제
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <p className="mt-4 px-1 text-center text-[11px] leading-5 text-zinc-600">
            남은 납입예정액은 월 납입금 × 남은 개월 수를 기준으로 표시됩니다.
          </p>
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/85 p-3 backdrop-blur-sm">
          <div className="mx-auto my-6 w-full max-w-md rounded-3xl bg-white p-4 text-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600">
                  {form.id ? "고정지출 수정" : "고정지출 추가"}
                </p>
                <h2 className="mt-1 text-xl font-black">내 차계부</h2>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xl font-black"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold">항목명</span>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, title: e.target.value }))
                  }
                  placeholder="예: 차량 할부"
                  className="h-12 w-full rounded-xl border border-zinc-200 px-4 outline-none focus:border-orange-500"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold">월 납입금</span>
                <input
                  inputMode="numeric"
                  value={
                    form.monthlyAmount
                      ? Number(form.monthlyAmount.replace(/,/g, "")).toLocaleString("ko-KR")
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setForm((current) => ({ ...current, monthlyAmount: value }));
                  }}
                  placeholder="예: 1,000,000"
                  className="h-12 w-full rounded-xl border border-zinc-200 px-4 outline-none focus:border-orange-500"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-sm font-bold">매월 출금일</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={form.paymentDay}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, paymentDay: e.target.value }))
                    }
                    placeholder="예: 25"
                    className="h-12 w-full min-w-0 rounded-xl border border-zinc-200 px-4 outline-none focus:border-orange-500"
                  />
                </label>

                <label className="block min-w-0">
                  <span className="mb-1.5 block text-sm font-bold">이자율 %</span>
                  <input
                    inputMode="decimal"
                    value={form.interestRate}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        interestRate: e.target.value.replace(/[^0-9.]/g, ""),
                      }))
                    }
                    placeholder="예: 4.8"
                    className="h-12 w-full min-w-0 rounded-xl border border-zinc-200 px-4 outline-none focus:border-orange-500"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold">남은 개월 수</span>
                <input
                  type="number"
                  min="0"
                  value={form.remainingMonths}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      remainingMonths: e.target.value,
                    }))
                  }
                  placeholder="예: 18"
                  className="h-12 w-full rounded-xl border border-zinc-200 px-4 outline-none focus:border-orange-500"
                />
              </label>

              <button
                type="button"
                onClick={saveItem}
                disabled={saving}
                className="h-12 w-full rounded-xl bg-orange-600 text-sm font-black text-white disabled:bg-zinc-300"
              >
                {saving ? "저장 중..." : form.id ? "수정 저장" : "항목 추가"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}