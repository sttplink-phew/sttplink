"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Order = {
  id: number;
  cargo_type: string;
  pickup_date: string;
  pickup_time: string | null;
  pickup_time_flexible: boolean;
  delivery_date: string;
  delivery_time: string | null;
  delivery_time_flexible: boolean;
  pickup_location: string | null;
  delivery_location: string | null;
  special_notes: string | null;
  freight_price: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  payment_method: string | null;
  payment_timing: string | null;
  status: string;
  driver_id: string | null;
};

export default function OrderDetailPage() {
  const params = useParams();
  const supabase = createClient();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadOrder() {
      const orderId = Number(params.id);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = `/login?next=/orders/${orderId}`;
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (error) {
        setMessage("오더 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      if (!data) {
        setMessage("존재하지 않는 오더입니다.");
        setLoading(false);
        return;
      }

      if (data.driver_id !== user.id || data.status !== "assigned") {
        setMessage("이 오더의 상세정보를 볼 권한이 없습니다.");
        setLoading(false);
        return;
      }

      setOrder(data);
      setLoading(false);
    }

    loadOrder();
  }, [params.id, supabase]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-4 py-24 text-white">
        <div className="mx-auto max-w-3xl">오더 정보를 불러오는 중입니다...</div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-black px-4 py-24 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-zinc-900 p-8">
          {message}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-24 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="text-sm font-bold text-orange-500">
            배차 완료 · 오더 #{order.id}
          </p>
          <h1 className="mt-2 text-3xl font-bold">운송 상세정보</h1>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-zinc-900 p-6 sm:p-8">
          <Detail label="화물 종류" value={order.cargo_type} />

          <Detail
            label="상차 일정"
            value={`${order.pickup_date} ${
              order.pickup_time_flexible
                ? "시간 상관없음"
                : order.pickup_time || ""
            }`}
          />

          <Detail
            label="하차 일정"
            value={`${order.delivery_date} ${
              order.delivery_time_flexible
                ? "시간 상관없음"
                : order.delivery_time || ""
            }`}
          />

          <Detail label="상차 장소" value={order.pickup_location} />
          <Detail label="하차 장소" value={order.delivery_location} />

          <Detail
            label="제시 운임"
            value={
              order.freight_price
                ? `금 ${order.freight_price} 원`
                : "미입력"
            }
          />

          <Detail label="특이사항" value={order.special_notes} />

          <div className="my-6 border-t border-white/10" />

          <h2 className="text-xl font-bold text-orange-500">
            배차 후 공개 정보
          </h2>

          <Detail label="화주명" value={order.customer_name} />
          <Detail label="화주 연락처" value={order.customer_phone} />
          <Detail label="화주 이메일" value={order.customer_email} />
          <Detail label="지급방법" value={order.payment_method} />
          <Detail label="지급시점" value={order.payment_timing} />

          {order.customer_phone && (
            <a
              href={`tel:${order.customer_phone}`}
              className="mt-6 block rounded-xl bg-orange-600 px-6 py-4 text-center font-bold text-white hover:bg-orange-500"
            >
              화주에게 전화하기
            </a>
          )}
        </div>
      </div>
    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="grid gap-1 border-b border-white/5 pb-4 sm:grid-cols-[140px_1fr]">
      <span className="text-sm font-bold text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-100">{value || "미입력"}</span>
    </div>
  );
}