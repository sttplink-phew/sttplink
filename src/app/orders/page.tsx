"use client";

import { useEffect, useState } from "react";
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
  freight_price: string | null;
  status: string;
  driver_id: string | null;
};

export default function OrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      alert("오더 조회 중 오류가 발생했습니다.\n" + error.message);
      setLoading(false);
      return;
    }

    setOrders(data ?? []);
    setLoading(false);
  }
  async function acceptOrder(orderId: number) {
    const confirmed = window.confirm(
      "이 오더를 배차받으시겠습니까?\n\n배차 확정 후 화주 연락처와 상세 운송정보를 확인할 수 있습니다."
    );
  
    if (!confirmed) return;
  
    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) {
      alert("운송차주 로그인이 필요합니다.");
      window.location.href = "/login?next=/orders";
      return;
    }
  
    const { data, error } = await supabase
      .from("orders")
      .update({
        driver_id: user.id,
        status: "assigned",
      })
      .eq("id", orderId)
      .eq("status", "open")
      .select("id")
      .maybeSingle();
  
    if (error) {
      alert("배차 처리 중 오류가 발생했습니다.\n" + error.message);
      return;
    }
  
    if (!data) {
      alert("이미 다른 운송차주가 배차받은 오더입니다.");
      loadOrders();
      return;
    }
  
    alert("배차가 완료되었습니다.");
    window.location.href = `/orders/${orderId}`;
  }

  return (
    <main className="min-h-screen bg-black px-4 py-24 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 text-3xl font-bold">배차 가능한 오더</h1>

        {loading ? (
          <p className="text-zinc-400">오더를 불러오는 중입니다...</p>
        ) : orders.length === 0 ? (
          <p className="text-zinc-400">현재 배차 가능한 오더가 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-white/10 bg-zinc-900 p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-bold text-orange-500">
                    오더 #{order.id}
                  </span>
                  <span className="text-sm text-zinc-400">배차 대기</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <p>화물 종류: {order.cargo_type}</p>
                  <p>
                  제시 운임: {order.freight_price ? `${order.freight_price}원` : "미기입"}
</p>
                  <p>
                    상차: {order.pickup_date}{" "}
                    {order.pickup_time_flexible
                      ? "시간 상관없음"
                      : order.pickup_time}
                  </p>

                  <p>
                    하차: {order.delivery_date}{" "}
                    {order.delivery_time_flexible
                      ? "시간 상관없음"
                      : order.delivery_time}
                  </p>
                  </div>

<button
  onClick={() => acceptOrder(order.id)}
  className="mt-6 w-full rounded-xl bg-orange-600 px-4 py-3 font-bold text-white transition hover:bg-orange-500"
>
  배차 받기
</button>

</div>
))}
</div>
)}
</div>
</main>
);
}