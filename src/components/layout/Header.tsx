"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#080808]/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center">
  <Image
    src="/sttplo.png"
    alt="STTPLINK"
    width={750}
    height={250}
    priority
    className="h-40 w-auto -ml-14 scale-[2] origin-left object-contain"
  />
</Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/orders"
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 hover:text-white sm:block"
          >
            내 오더
          </Link>

          <Link
            href="/"
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-500"
          >
            오더 등록
          </Link>

          <Link
            href="/driver/register"
            className="hidden rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-zinc-400 transition hover:border-white/30 hover:text-white sm:block"
          >
            운송차주 등록
          </Link>

          {user ? (
            <>
  <Link
    href="/driver/my"
    className="rounded-lg border border-white/20 px-3 py-2 text-sm font-bold text-white transition hover:border-orange-500 hover:text-orange-400"
  >
    내 정보
  </Link>

  <button
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
    로그인
  </Link>
)}
        </nav>
      </div>
    </header>
  );
}