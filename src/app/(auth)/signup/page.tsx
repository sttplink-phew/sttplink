"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/driver/my");
      }
    }

    checkUser();
  }, [router, supabase]);

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const phoneId = phone.replace(/[^0-9]/g, "");

    if (!name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    if (phoneId.length < 10) {
      alert("휴대전화 번호를 확인해주세요.");
      return;
    }

    if (password.length < 8) {
      alert("비밀번호는 8자 이상 입력해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!agreed) {
      alert("영업용 화물차량 운송차주 확인에 동의해주세요.");
      return;
    }

    setLoading(true);

    const internalEmail = `${phoneId}@phone.sttplink.com`;

    const { data, error } = await supabase.auth.signUp({
      email: internalEmail,
      password,
      options: {
        data: {
          name: name.trim(),
          phone: phoneId,
          role: "driver",
        },
      },
    });

    if (error) {
      setLoading(false);

      if (
        error.message.includes("already registered") ||
        error.message.includes("already been registered") ||
        error.message.includes("already exists")
      ) {
        alert("이미 가입된 전화번호입니다. 로그인해주세요.");
        return;
      }

      alert(`회원가입 오류: ${error.message}`);
      return;
    }

    if (data.user?.identities?.length === 0) {
      setLoading(false);
      alert("이미 가입된 전화번호입니다. 로그인해주세요.");
      return;
    }

    alert("회원가입이 완료되었습니다.");

    router.push("/driver/profile");
  }

  return (
    <>
      <Header />

      <main className="min-h-screen overflow-x-hidden bg-[#080808] px-4 pb-20 pt-24 text-white sm:px-6">
        <section className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-white/10 bg-white p-5 text-zinc-900 shadow-2xl sm:p-8">
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
                회원가입
              </h1>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                광양항 기반 컨테이너 운송차주 커뮤니티
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm font-black text-orange-700">
                운송차주 전용 서비스
              </p>

              <p className="mt-1 text-xs leading-5 text-orange-700/80">
                STTPLINK는 영업용 화물차량을 운행하는 운송차주를 위한
                서비스입니다.
              </p>
            </div>

            <form onSubmit={handleSignup} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-700">
                  이름
                </span>

                <input
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="이름을 입력하세요"
                  className="h-14 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-4 text-base outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-700">
                  휴대전화
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
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="8자 이상 입력하세요"
                  className="h-14 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-4 text-base outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-700">
                  비밀번호 확인
                </span>

                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={passwordConfirm}
                  onChange={(event) =>
                    setPasswordConfirm(event.target.value)
                  }
                  placeholder="비밀번호를 다시 입력하세요"
                  className="h-14 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-4 text-base outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-orange-600"
                />

                <span className="text-sm leading-6 text-zinc-700">
                  <strong className="font-black">
                    영업용 화물차량 운송차주임을 확인합니다.
                  </strong>
                  <br />
                  가입 후 차량정보를 등록하여 STTPLINK 서비스를
                  이용합니다.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="h-14 w-full rounded-xl bg-orange-600 text-base font-black text-white transition active:scale-[0.99] disabled:bg-zinc-400"
              >
                {loading ? "가입 처리 중..." : "회원가입"}
              </button>
            </form>

            <div className="mt-6 border-t border-zinc-200 pt-6 text-center">
              <p className="text-sm text-zinc-500">
                이미 계정이 있으신가요?
              </p>

              <Link
                href="/login"
                className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-zinc-300 text-sm font-bold text-zinc-800 transition active:bg-zinc-100"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-zinc-600">
            운행일지 · 터미널 정보 · 차량정비 · 일상점검
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}