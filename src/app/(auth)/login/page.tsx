"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const phoneId = phone.replace(/[^0-9]/g, "");

    if (!phoneId) {
      alert("전화번호를 입력해주세요.");
      return;
    }

    setLoading(true);

    const internalEmail = `${phoneId}@phone.sttplink.com`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: internalEmail,
      password,
    });

    if (error) {
      setLoading(false);
      alert("전화번호 또는 비밀번호를 확인해주세요.");
      return;
    }

    const user = data.user;

    if (!user) {
      setLoading(false);
      alert("로그인 정보를 확인할 수 없습니다.");
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");

    if (next) {
      router.push(next);
      return;
    }

    const role = user.user_metadata?.role;

    if (role === "driver") {
      const { data: driverProfiles, error: driverError } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (driverError) {
        setLoading(false);
        alert(`운송차주 정보 확인 오류: ${driverError.message}`);
        return;
      }

      if (driverProfiles && driverProfiles.length > 0) {
        router.push("/driver/my");
      } else {
        router.push("/driver/profile");
      }

      return;
    }

    router.push("/");
  }

  return (
    <>
      <Header />

      <main className="min-h-screen overflow-x-hidden bg-[#080808] px-4 pb-20 pt-24 text-white sm:px-6">
        <section className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-white/10 bg-white p-5 text-zinc-900 shadow-2xl sm:p-8">
            {/* 로고 */}
            <div className="flex flex-col items-center text-center">
              <div className="relative h-24 w-full max-w-[260px]">
                <Image
                  src="/flogo.png"
                  alt="STTPLINK"
                  fill
                  priority
                  className="object-contain"
                />
              </div>

              <h1 className="mt-3 text-2xl font-black sm:text-3xl">
                로그인
              </h1>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                광양항 기반 컨테이너 운송차주 커뮤니티
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-7 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-700">
                  전화번호
                </span>

                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="010-1234-5678"
                  className="h-14 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-4 text-base outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-700">
                  비밀번호
                </span>

                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="h-14 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-4 text-base outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="h-14 w-full rounded-xl bg-orange-600 text-base font-black text-white transition active:scale-[0.99] disabled:bg-zinc-400"
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </form>

            <div className="mt-6 border-t border-zinc-200 pt-6 text-center">
              <p className="text-sm text-zinc-500">
                아직 STTPLINK 회원이 아니신가요?
              </p>

              <Link
                href="/signup"
                className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-zinc-300 text-sm font-bold text-zinc-800 transition active:bg-zinc-100"
              >
                회원가입
              </Link>
            </div>
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-zinc-600">
            컨테이너 운송차주를 위한 운행 · 차량 · 터미널 정보 서비스
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}