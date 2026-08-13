"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

export function Header() {
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (!user) {
        setVehicleNumber("");
        setLoading(false);
        return;
      }

      const { data: driver } = await supabase
        .from("drivers")
        .select("vehicle_number")
        .eq("user_id", user.id)
        .maybeSingle();

      setVehicleNumber(driver?.vehicle_number ?? "");
      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (!session?.user) {
        setVehicleNumber("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const driverLabel = vehicleNumber
    ? `${vehicleNumber.slice(-4)}님`
    : "내정보";

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#080808]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-3 sm:h-20 sm:px-5">

        {/* STTPLINK 로고 */}
        <Link
          href="/"
          aria-label="STTPLINK 홈"
          className="flex min-w-0 items-center"
        >
          <Image
            src="/flogo.png"
            alt="STTPLINK"
            width={1200}
            height={500}
            priority
            className="h-12 w-auto max-w-[185px] object-contain sm:h-16 sm:max-w-[260px]"
          />
        </Link>

        {/* 사용자 메뉴 */}
        <nav className="ml-2 flex shrink-0 items-center gap-2">
          {!loading && user ? (
            <>
              <Link
                href="/driver/my"
                className="rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-black text-orange-400 transition active:scale-[0.98]"
              >
                {driverLabel}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-white/15 px-3 py-2 text-sm font-bold text-zinc-300 transition active:bg-white/10"
              >
                로그아웃
              </button>
            </>
          ) : !loading ? (
            <Link
              href="/login"
              className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-black text-white transition active:scale-[0.98]"
            >
              로그인
            </Link>
          ) : (
            <div className="h-9 w-16" />
          )}
        </nav>
      </div>
    </header>
  );
}