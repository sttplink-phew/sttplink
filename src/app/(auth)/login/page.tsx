"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loginCode, setLoginCode] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  function handleCodeChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 20);

    setLoginCode(value);
  }

  function handlePinChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 4);

    setPin(value);
  }

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanCode = loginCode
      .replace(/\s+/g, "")
      .toUpperCase();

    const cleanPin = pin.replace(/\D/g, "");

    if (!cleanCode) {
      alert("포트코드를 입력해주세요.");
      return;
    }

    if (!/^[A-Z0-9]{5,20}$/.test(cleanCode)) {
      alert("포트코드를 확인해주세요.");
      return;
    }

    if (!/^\d{4}$/.test(cleanPin)) {
      alert("비밀번호는 숫자 4자리로 입력해주세요.");
      return;
    }

    setLoading(true);

    const internalEmail =
      `${cleanCode.toLowerCase()}@login.sttplink.com`;

    // 사용자는 4자리 PIN만 입력하고,
    // Supabase에는 6자리 이상 비밀번호로 전달
    const internalPassword = `ST${cleanPin}`;

    const { error } = await supabase.auth.signInWithPassword({
      email: internalEmail,
      password: internalPassword,
    });

    if (error) {
      setLoading(false);
      alert("포트코드 또는 비밀번호를 확인해주세요.");
      return;
    }

    const next = new URLSearchParams(
      window.location.search
    ).get("next");

    if (next) {
      router.push(next);
      router.refresh();
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <section className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl sm:p-8">
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

            <h1 className="mt-3 text-3xl font-black">
              로그인
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              포트코드와 비밀번호만 입력하세요.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="mt-8 space-y-5"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                포트코드
              </span>

              <input
                type="text"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                required
                value={loginCode}
                onChange={handleCodeChange}
                placeholder="예: LGDK6281"
                className="h-16 w-full rounded-2xl border border-white/10 bg-zinc-900 px-5 text-xl font-black uppercase tracking-wide text-white outline-none transition focus:border-orange-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                비밀번호
              </span>

              <input
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                required
                maxLength={4}
                value={pin}
                onChange={handlePinChange}
                placeholder="숫자 4자리"
                className="h-16 w-full rounded-2xl border border-white/10 bg-zinc-900 px-5 text-xl font-black tracking-[0.35em] text-white outline-none transition focus:border-orange-500"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="h-16 w-full rounded-2xl bg-orange-600 text-lg font-black text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-zinc-500">
              처음 이용하시나요?
            </p>

            <Link
              href="/signup"
              className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-white/15 text-sm font-bold text-zinc-300 transition active:bg-white/10"
            >
              회원가입
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-center">
            <p className="text-sm leading-6 text-zinc-400">
              본 사이트는{" "}
              <span className="font-bold text-orange-400">
                6281
              </span>
              의 비영리 목적 개인 사이트입니다.
              <br />
              허락 없이 계정 및 사이트 정보를
              <br />
              외부에 배포하거나 공유하지 마세요.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}