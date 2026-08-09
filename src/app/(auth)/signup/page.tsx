"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/client";

type AccountRole = "customer" | "driver";

export default function SignupPage() {
  const [role, setRole] = useState<AccountRole>("customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace("/driver/my");
      }
    });
  }, []);
  
  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  
    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    const phoneId = phone.replace(/[^0-9]/g, "");
const internalEmail = `${phoneId}@phone.sttplink.com`;
    const { data, error } = await supabase.auth.signUp({
      email: internalEmail,
      password,
      options: {
        data: {
          name,
          phone,
          role,
        },
      },
    });
    
    if (error) {
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
      alert("이미 가입된 전화번호입니다. 로그인해주세요.");
      return;
    }
    
    alert("회원가입이 완료되었습니다.");

if (role === "driver") {
  router.push("/driver/profile");
} else {
  router.push("/");
}

return;
  
    if (role === "driver") {
      router.push("/driver/profile");
    } else {
      router.push("/");
    }
  }
  
  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-28 text-white sm:px-6">
        <section className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-white/10 bg-white p-6 text-zinc-900 shadow-2xl sm:p-8">
            <div className="text-center">
              <p className="text-sm font-bold text-orange-600">
                STTPLINK
              </p>

              <h1 className="mt-3 text-3xl font-bold">
                회원가입
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                하나의 계정으로 화물 오더와 기사 기능을 이용할 수 있습니다.
              </p>
            </div>

            <form onSubmit={handleSignup} className="mt-8 space-y-5">
              <fieldset>
                <legend className="mb-3 text-sm font-bold text-zinc-700">
                  가입 유형
                </legend>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setRole("customer")}
                    className={`rounded-2xl border p-5 text-left transition ${
                      role === "customer"
                        ? "border-orange-600 bg-orange-50 ring-2 ring-orange-100"
                        : "border-zinc-200 bg-white hover:border-orange-300"
                    }`}
                  >
                    <span className="text-lg font-bold">
                      화주·일반 사용자
                    </span>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      화물 오더를 등록하고 배차 진행상황을 확인합니다.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("driver")}
                    className={`rounded-2xl border p-5 text-left transition ${
                      role === "driver"
                        ? "border-orange-600 bg-orange-50 ring-2 ring-orange-100"
                        : "border-zinc-200 bg-white hover:border-orange-300"
                    }`}
                  >
                    <span className="text-lg font-bold">
                      운송 차주
                    </span>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      차량과 운송 가능 조건을 등록하고 오더를 확인합니다.
                    </p>
                  </button>
                </div>
              </fieldset>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-700">
                  이름
                </span>

                <input
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="이름을 입력하세요"
                  className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-700">
                  휴대전화
                </span>

                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="010-0000-0000"
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
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="8자 이상 입력하세요"
                  className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-700">
                  비밀번호 확인
                </span>

                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwordConfirm}
                  onChange={(event) =>
                    setPasswordConfirm(event.target.value)
                  }
                  placeholder="비밀번호를 다시 입력하세요"
                  className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </label>

              {role === "driver" && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-800">
                  가입 후 차량 종류, 적재 가능 화물, 운송 가능 지역과
                  보험정보를 추가로 등록합니다.
                </div>
              )}

              <button
                type="submit"
                className="h-14 w-full rounded-xl bg-orange-600 text-sm font-bold text-white transition hover:bg-orange-500"
              >
                회원가입
              </button>
            </form>

            <div className="mt-6 border-t border-zinc-200 pt-6 text-center">
              <p className="text-sm text-zinc-500">
                이미 계정이 있으신가요?
              </p>

              <Link
                href="/login"
                className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl border border-zinc-300 text-sm font-bold text-zinc-800 transition hover:border-orange-500 hover:text-orange-600"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}