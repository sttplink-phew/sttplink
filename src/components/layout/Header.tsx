"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export function Header() {
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [vehicleNumber, setVehicleNumber] = useState("");

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (!user) {
        setVehicleNumber("");
        return;
      }

      const { data: driver } = await supabase
        .from("drivers")
        .select("vehicle_number")
        .eq("user_id", user.id)
        .maybeSingle();

      setVehicleNumber(driver?.vehicle_number ?? "");
    }

    loadUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const driverLabel = vehicleNumber
    ? `${vehicleNumber.slice(-4)}님`
    : "내 정보";

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#080808]/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/mlogo.png"
            alt="STTPLINK"
            width={750}
            height={250}
            priority
            className="h-24 w-auto -ml-6 object-contain sm:h-36 sm:-ml-12"
          />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <span className="px-2 text-sm font-bold text-orange-400">
                {driverLabel}
              </span>

              <Link
                href="/driver/my"
                className="rounded-lg border border-white/20 px-3 py-2 text-sm font-bold text-white transition hover:border-orange-500 hover:text-orange-400"
              >
                내 정보
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-white/20 px-3 py-2 text-sm font-bold text-white transition hover:border-orange-500 hover:text-orange-400"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-white/20 px-3 py-2 text-sm font-bold text-white transition hover:border-orange-500 hover:text-orange-400"
            >
              로그인을하세요
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}