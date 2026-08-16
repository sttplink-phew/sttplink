"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type Route = {
  id: string;
  title: string;
  sort_order: number;
  is_active: boolean;
};

export default function DailyPage() {
  const supabase = createClient();

  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  const [addingRoute, setAddingRoute] = useState(false);
  const [routeTitle, setRouteTitle] = useState("");
  const [savingRoute, setSavingRoute] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [showNewRouteForm, setShowNewRouteForm] = useState(false);
  const [activeLoadType, setActiveLoadType] = useState<"full" | "empty">("full");
  type RouteLog = {
    full20: number;
    full40: number;
    fullOther: number;
    empty20: number;
    empty40: number;
    emptyOther: number;
  };
  
  const [routeLogs, setRouteLogs] = useState<Record<string, RouteLog>>({});
  const [workDate, setWorkDate] = useState(() => {
    const now = new Date();
  
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const loadRoutes = async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("driver_routes")
      .select("id, title, sort_order, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      alert("노선 불러오기 오류: " + error.message);
      setLoading(false);
      return;
    }

    setRoutes(data ?? []);
    setLoading(false);
  };
  const loadDailyLog = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
  
    if (userError || !user) return;
  
    const { data, error } = await supabase
  .from("daily_route_logs")
  .select("route_logs")
  .eq("user_id", user.id)
  .eq("work_date", workDate)
  .maybeSingle();

if (error) {
  console.error("운행일지 불러오기 오류:", error);
  return;
}

if (data?.route_logs) {
  setRouteLogs(data.route_logs);
}
};
useEffect(() => {
  loadRoutes();
}, []);

useEffect(() => {
  setRouteLogs({});
  loadDailyLog();
}, [workDate]);

  const saveRoute = async () => {
    const title = routeTitle.trim();

    if (!title || savingRoute) return;

    setSavingRoute(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("로그인이 필요합니다.");
      setSavingRoute(false);
      return;
    }

    const nextOrder =
      routes.length === 0
        ? 1
        : Math.max(...routes.map((route) => route.sort_order)) + 1;

    const { data, error } = await supabase
      .from("driver_routes")
      .insert({
        user_id: user.id,
        title,
        sort_order: nextOrder,
        is_active: true,
      })
      .select("id, title, sort_order, is_active")
      .single();

    if (error) {
      alert("노선 저장 오류: " + error.message);
      setSavingRoute(false);
      return;
    }

    setRoutes((prev) => [...prev, data]);
    setRouteTitle("");
    setAddingRoute(false);
    setSavingRoute(false);
  };

  const saveDailyLog = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
  
    if (userError || !user) {
      alert("로그인이 필요합니다.");
      return;
    }
  
    const now = new Date();
  
    const { error } = await supabase
      .from("daily_route_logs")
      .upsert(
        {
          user_id: user.id,
          work_date: workDate,
          route_logs: routeLogs,
          updated_at: now.toISOString(),
        },
        {
          onConflict: "user_id,work_date",
        }
      );
  
    if (error) {
      console.error("운행일지 저장 오류:", error);
      alert("운행일지를 저장하지 못했습니다.");
      return;
    }
  
    setSelectedRouteId(null);
    setActiveLoadType("full");
    
    console.log("운행일지 저장 성공");
    alert("오늘 운행이 저장되었습니다.");
    };

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-6 text-white">
      <div className="mx-auto max-w-lg">
        <header className="mb-7 flex items-start justify-between">
          <div>
            <p className="text-xs font-black text-orange-500">
              STTP LINK
            </p>

            <h1 className="mt-1 text-2xl font-black">
              운행일지
            </h1>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold"
          >
            홈
          </Link>
        </header>

        <section className="space-y-3">

        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
  <div className="mb-2 text-sm font-bold text-zinc-300">
    운행 날짜
  </div>

  <input
  type="date"
  value={workDate}
  onChange={(e) => setWorkDate(e.target.value)}
  className="h-14 w-full min-w-0 max-w-full box-border rounded-xl border border-white/10 bg-zinc-800 px-4 text-base font-bold text-white outline-none focus:border-orange-500"
/>
</div>

        {loading && (
            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5 text-center text-sm text-zinc-400">
              노선을 불러오는 중...
            </div>
          )}

{!loading &&
  routes
  .filter((route) => routeLogs[route.id] !== undefined)
  .map((route) => (
    <div key={route.id} className="space-y-2">

      <div
         onClick={() =>
          setSelectedRouteId(
            selectedRouteId === route.id ? null : route.id
          )
        }
        className="w-full rounded-2xl border border-white/10 bg-zinc-900 p-5 text-left"
      >
        <div className="flex items-center justify-between">
  <div className="text-lg font-black">
    {route.title}
  </div>

  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();

      setRouteLogs((prev) => {
        const next = { ...prev };
        delete next[route.id];
        return next;
      });

      if (selectedRouteId === route.id) {
        setSelectedRouteId(null);
      }
    }}
    className="rounded-lg border border-red-500/30 px-3 py-1 text-xs font-bold text-red-400"
  >
    삭제
  </button>
</div>

        <div className="mt-1 text-xs text-zinc-500">
          눌러서 오늘 운행 입력
        </div>
        </div>

      {selectedRouteId === route.id && (
        <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
          <div className="grid grid-cols-2 gap-2">
  <button
    type="button"
    onClick={() => setActiveLoadType("full")}
    className={`h-12 rounded-xl font-black ${
      activeLoadType === "full"
        ? "bg-orange-600 text-white"
        : "bg-zinc-800 text-zinc-400"
    }`}
  >
    FULL
  </button>

  <button
    type="button"
    onClick={() => setActiveLoadType("empty")}
    className={`h-12 rounded-xl font-black ${
      activeLoadType === "empty"
        ? "bg-orange-600 text-white"
        : "bg-zinc-800 text-zinc-400"
    }`}
  >
    EMPTY
  </button>
</div>

{activeLoadType === "full" && (
  <div className="mt-3 space-y-3">
    {/* FULL 20FT */}
    <div className="rounded-xl bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-black">20FT</div>

          <div className="mt-2 flex gap-3 text-xs text-zinc-400">
            <label>
              <input type="checkbox" className="mr-1" />
              위험물
            </label>

            <label>
              <input type="checkbox" className="mr-1" />
              기타
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
  <button
    type="button"
    onClick={() =>
      setRouteLogs((prev) => {
        const current = prev[route.id] ?? {
          full20: 0,
          full40: 0,
          fullOther: 0,
          empty20: 0,
          empty40: 0,
          emptyOther: 0,
        };

        return {
          ...prev,
          [route.id]: {
            ...current,
            full20: Math.max(0, current.full20 - 1),
          },
        };
      })
    }
    className="h-11 w-11 rounded-xl bg-zinc-800 text-xl font-black"
  >
    −
  </button>

  <div className="w-7 text-center text-xl font-black">
    {routeLogs[route.id]?.full20 ?? 0}
  </div>

  <button
    type="button"
    onClick={() =>
      setRouteLogs((prev) => {
        const current = prev[route.id] ?? {
          full20: 0,
          full40: 0,
          fullOther: 0,
          empty20: 0,
          empty40: 0,
          emptyOther: 0,
        };

        return {
          ...prev,
          [route.id]: {
            ...current,
            full20: current.full20 + 1,
          },
        };
      })
    }
    className="h-11 w-11 rounded-xl bg-orange-600 text-xl font-black"
  >
    +
  </button>
</div>
      </div>
    </div>

    {/* FULL 40FT */}
    <div className="rounded-xl bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-black">40FT</div>

          <div className="mt-2 flex gap-3 text-xs text-zinc-400">
            <label>
              <input type="checkbox" className="mr-1" />
              위험물
            </label>

            <label>
              <input type="checkbox" className="mr-1" />
              기타
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
  <button
    type="button"
    onClick={() =>
      setRouteLogs((prev) => {
        const current = prev[route.id] ?? {
          full20: 0,
          full40: 0,
          fullOther: 0,
          empty20: 0,
          empty40: 0,
          emptyOther: 0,
        };

        return {
          ...prev,
          [route.id]: {
            ...current,
            full40: Math.max(0, current.full40 - 1),
          },
        };
      })
    }
    className="h-11 w-11 rounded-xl bg-zinc-800 text-xl font-black"
  >
    −
  </button>

  <div className="w-7 text-center text-xl font-black">
    {routeLogs[route.id]?.full40 ?? 0}
  </div>

  <button
    type="button"
    onClick={() =>
      setRouteLogs((prev) => {
        const current = prev[route.id] ?? {
          full20: 0,
          full40: 0,
          fullOther: 0,
          empty20: 0,
          empty40: 0,
          emptyOther: 0,
        };

        return {
          ...prev,
          [route.id]: {
            ...current,
            full40: current.full40 + 1,
          },
        };
      })
    }
    className="h-11 w-11 rounded-xl bg-orange-600 text-xl font-black"
  >
    +
  </button>
</div>

      </div>
    </div>

{/* FULL 기타 */}
<div className="rounded-xl bg-zinc-900 p-4">
  <div className="flex items-center justify-between">
    <div>
      <div className="font-black">기타</div>

      <div className="mt-2 flex gap-3 text-xs text-zinc-400">
        <label>
          <input type="checkbox" className="mr-1" />
          위험물
        </label>

        <label>
          <input type="checkbox" className="mr-1" />
          기타
        </label>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() =>
          setRouteLogs((prev) => {
            const current = prev[route.id] ?? {
              full20: 0,
              full40: 0,
              fullOther: 0,
              empty20: 0,
              empty40: 0,
              emptyOther: 0,
            };

            return {
              ...prev,
              [route.id]: {
                ...current,
                fullOther: Math.max(0, current.fullOther - 1),
              },
            };
          })
        }
        className="h-11 w-11 rounded-xl bg-zinc-800 text-xl font-black"
      >
        −
      </button>

      <div className="w-7 text-center text-xl font-black">
        {routeLogs[route.id]?.fullOther ?? 0}
      </div>
      <button
        type="button"
        onClick={() =>
          setRouteLogs((prev) => {
            const current = prev[route.id] ?? {
              full20: 0,
              full40: 0,
              fullOther: 0,
              empty20: 0,
              empty40: 0,
              emptyOther: 0,
            };

            return {
              ...prev,
              [route.id]: {
                ...current,
                fullOther: current.fullOther + 1,
              },
            };
          })
        }
        className="h-11 w-11 rounded-xl bg-orange-600 text-xl font-black"
      >
        +
      </button>
    </div>
  </div>
</div>
  </div>
)}

{activeLoadType === "empty" && (
  <div className="mt-3 space-y-3">
    {/* EMPTY 20FT */}
    <div className="rounded-xl bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-black">20FT</div>

          <div className="mt-2 flex gap-3 text-xs text-zinc-400">
            <label>
              <input type="checkbox" className="mr-1" />
              위험물
            </label>

            <label>
              <input type="checkbox" className="mr-1" />
              기타
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
  <button
    type="button"
    onClick={() =>
      setRouteLogs((prev) => {
        const current = prev[route.id] ?? {
          full20: 0,
          full40: 0,
          fullOther: 0,
          empty20: 0,
          empty40: 0,
          emptyOther: 0,
        };

        return {
          ...prev,
          [route.id]: {
            ...current,
            empty20: Math.max(0, current.empty20 - 1),
          },
        };
      })
    }
    className="h-11 w-11 rounded-xl bg-zinc-800 text-xl font-black"
  >
    −
  </button>

  <div className="w-7 text-center text-xl font-black">
    {routeLogs[route.id]?.empty20 ?? 0}
  </div>

  <button
    type="button"
    onClick={() =>
      setRouteLogs((prev) => {
        const current = prev[route.id] ?? {
          full20: 0,
          full40: 0,
          fullOther: 0,
          empty20: 0,
          empty40: 0,
          emptyOther: 0,
        };

        return {
          ...prev,
          [route.id]: {
            ...current,
            empty20: current.empty20 + 1,
          },
        };
      })
    }
    className="h-11 w-11 rounded-xl bg-orange-600 text-xl font-black"
  >
    +
  </button>
</div>

      </div>
    </div>

    {/* EMPTY 40FT */}
    <div className="rounded-xl bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-black">40FT</div>

          <div className="mt-2 flex gap-3 text-xs text-zinc-400">
            <label>
              <input type="checkbox" className="mr-1" />
              위험물
            </label>

            <label>
              <input type="checkbox" className="mr-1" />
              기타
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
  <button
    type="button"
    onClick={() =>
      setRouteLogs((prev) => {
        const current = prev[route.id] ?? {
          full20: 0,
          full40: 0,
          fullOther: 0,
          empty20: 0,
          empty40: 0,
          emptyOther: 0,
        };

        return {
          ...prev,
          [route.id]: {
            ...current,
            empty40: Math.max(0, current.empty40 - 1),
          },
        };
      })
    }
    className="h-11 w-11 rounded-xl bg-zinc-800 text-xl font-black"
  >
    −
  </button>

  <div className="w-7 text-center text-xl font-black">
    {routeLogs[route.id]?.empty40 ?? 0}
  </div>

  <button
    type="button"
    onClick={() =>
      setRouteLogs((prev) => {
        const current = prev[route.id] ?? {
          full20: 0,
          full40: 0,
          empty20: 0,
          empty40: 0,
          fullOther: 0,
          emptyOther: 0,
        };

        return {
          ...prev,
          [route.id]: {
            ...current,
            empty40: current.empty40 + 1,
          },
        };
      })
    }
    className="h-11 w-11 rounded-xl bg-orange-600 text-xl font-black"
  >
    +
  </button>


      </div>
    </div>

    </div>
  {/* EMPTY 기타 */}
<div className="rounded-xl bg-zinc-900 p-4">
  <div className="flex items-center justify-between">
    <div>
      <div className="font-black">기타</div>

      <div className="mt-2 flex gap-3 text-xs text-zinc-400">
        <label>
          <input type="checkbox" className="mr-1" />
          위험물
        </label>

        <label>
          <input type="checkbox" className="mr-1" />
          기타
        </label>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() =>
          setRouteLogs((prev) => {
            const current = prev[route.id] ?? {
              full20: 0,
              full40: 0,
              fullOther: 0,
              empty20: 0,
              empty40: 0,
              emptyOther: 0,
            };

            return {
              ...prev,
              [route.id]: {
                ...current,
                emptyOther: Math.max(0, current.emptyOther - 1),
              },
            };
          })
        }
        className="h-11 w-11 rounded-xl bg-zinc-800 text-xl font-black"
      >
        −
      </button>

      <div className="w-7 text-center text-xl font-black">
        {routeLogs[route.id]?.emptyOther ?? 0}
      </div>

      <button
        type="button"
        onClick={() =>
          setRouteLogs((prev) => {
            const current = prev[route.id] ?? {
              full20: 0,
              full40: 0,
              fullOther: 0,
              empty20: 0,
              empty40: 0,
              emptyOther: 0,
            };

            return {
              ...prev,
              [route.id]: {
                ...current,
                emptyOther: current.emptyOther + 1,
              },
            };
          })
        }
        className="h-11 w-11 rounded-xl bg-orange-600 text-xl font-black"
      >
        +
      </button>
    </div>
  </div>
  </div>
  </div>
)}
</div>
)}
</div>
))}

{!loading && routes.length === 0 && !addingRoute && (
  <button
    type="button"
    onClick={() => setAddingRoute(true)}
    className="w-full rounded-2xl border border-white/10 bg-zinc-900 p-5 text-left"
  >
    <div className="text-lg font-black">노선1</div>

    <div className="mt-1 text-xs text-zinc-500">
      제목을 입력해 첫 운행항목을 만들어보세요
    </div>
  </button>
)}

{!loading && routes.length > 0 && !addingRoute && (
  <button
    type="button"
    onClick={() => setAddingRoute(true)}
    className="h-14 w-full rounded-2xl border border-dashed border-white/20 text-sm font-black text-zinc-300"
  >
    + 노선 추가
  </button>
)}

{addingRoute && (
  <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
    {!showNewRouteForm ? (
      <>
        <div className="mb-3 text-sm font-black text-zinc-300">
          추가할 노선 선택
        </div>

        <div className="space-y-2">
          {routes
            .filter((route) => routeLogs[route.id] === undefined)
            .map((route) => (
              <button
                key={route.id}
                type="button"
                onClick={() => {
                  setRouteLogs((prev) => ({
                    ...prev,
                    [route.id]: {
                      full20: 0,
                      full40: 0,
                      fullOther: 0,
                      empty20: 0,
                      empty40: 0,
                      emptyOther: 0,
                    },
                  }));

                  setAddingRoute(false);
                  setShowNewRouteForm(false);
                  setSelectedRouteId(route.id);
                }}
                className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-left font-bold"
              >
                {route.title}
              </button>
            ))}
        </div>

        {routes.filter(
          (route) => routeLogs[route.id] === undefined
        ).length === 0 && (
          <div className="py-3 text-center text-sm text-zinc-500">
            추가할 기존 노선이 없습니다.
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setRouteTitle("");
            setShowNewRouteForm(true);
          }}
          className="mt-3 h-11 w-full rounded-xl bg-orange-600 text-sm font-black text-white"
        >
          + 새 노선 만들기
        </button>

        <button
          type="button"
          onClick={() => {
            setAddingRoute(false);
            setShowNewRouteForm(false);
          }}
          className="mt-2 h-11 w-full rounded-xl border border-white/10 text-sm font-bold text-zinc-400"
        >
          닫기
        </button>
      </>
    ) : (
      <>
        <div className="mb-3 text-sm font-black text-zinc-300">
          새 노선 만들기
        </div>

        <input
          type="text"
          value={routeTitle}
          onChange={(e) => setRouteTitle(e.target.value)}
          placeholder="노선 제목 입력"
          className="h-14 w-full rounded-xl border border-white/10 bg-zinc-800 px-4 text-base font-bold text-white outline-none focus:border-orange-500"
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setRouteTitle("");
              setShowNewRouteForm(false);
            }}
            className="h-12 rounded-xl bg-zinc-800 font-bold"
          >
            취소
          </button>

          <button
            type="button"
            onClick={async () => {
              await saveRoute();
              setShowNewRouteForm(false);
            }}
            disabled={!routeTitle.trim() || savingRoute}
            className="h-12 rounded-xl bg-orange-600 font-black disabled:opacity-40"
          >
            {savingRoute ? "저장 중..." : "제목 저장"}
          </button>
          
        </div>
        </>
    )}
  </div>
)}

<div
  onClick={saveDailyLog}
  className="relative z-50 mt-4 flex h-16 w-full cursor-pointer items-center justify-center rounded-2xl bg-orange-600 text-lg font-black text-white"
>
  운행 저장
</div>

</section>
</div>
</main>
);
}