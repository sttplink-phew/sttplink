"use client";

import Link from "next/link";
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
const supabase = createClient();

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    if (error) {
      alert(`로그인 오류: ${error.message}`);
      return;
    }
  
    const role = data.user?.user_metadata?.role;

if (role === "driver") {
  const { data: driverProfiles, error: driverError } = await supabase
  .from("drivers")
  .select("id")
  .eq("user_id", data.user.id)
  .limit(1);

  if (driverError) {
    alert(`운송차주 정보 확인 오류: ${driverError.message}`);
    return;
  }
  
  const next = new URLSearchParams(window.location.search).get("next");

if (next) {
  router.push(next);
  return;
}

const role = data.user?.user_metadata?.role;

  if (driverProfiles && driverProfiles.length > 0) {
    router.push("/driver/my");
  } else {
    router.push("/driver/profile");
  }

} else {
  router.push("/");
}
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-28 text-white sm:px-6">
        <section className="mx-auto max-w-md">
          <div className="rounded-3xl border border-white/10 bg-white p-6 text-zinc-900 shadow-2xl sm:p-8">
            <div className="text-center">
              <p className="text-sm font-bold text-orange-600">
                STTPLINK
              </p>

              <h1 className="mt-3 text-3xl font-bold">
                로그인
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                화주와 운송 차주는 하나의 계정으로 로그인합니다.
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-700">
                  이메일
                </span>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="example@email.com"
                  className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-700">
                  비밀번호
                </span>

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <button
                type="submit"
                className="h-14 w-full rounded-xl bg-orange-600 text-sm font-bold text-white transition hover:bg-orange-500"
              >
                로그인
              </button>
            </form>

            <div className="mt-6 border-t border-zinc-200 pt-6 text-center">
              <p className="text-sm text-zinc-500">
                아직 계정이 없으신가요?
              </p>

              <Link
                href="/signup"
                className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl border border-zinc-300 text-sm font-bold text-zinc-800 transition hover:border-orange-500 hover:text-orange-600"
              >
                회원가입
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}