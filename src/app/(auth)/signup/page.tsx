"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [portCode, setPortCode] = useState("");
  const [vehicleLast4, setVehicleLast4] = useState("");
  const [pin, setPin] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/");
      }
    }

    checkUser();
  }, [router, supabase]);

  function handlePortCodeChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);

    setPortCode(value);
  }

  function handleVehicleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 4);

    setVehicleLast4(value);
  }

  function handlePinChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 4);

    setPin(value);
  }

  async function handleSignup(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanPortCode = portCode
      .trim()
      .toUpperCase();

    if (!cleanPortCode) {
      alert("포트코드를 입력해주세요.");
      return;
    }

    if (!/^[A-Z0-9]+$/.test(cleanPortCode)) {
      alert("포트코드는 영문과 숫자만 사용할 수 있습니다.");
      return;
    }

    if (!/^\d{4}$/.test(vehicleLast4)) {
      alert("차량번호 뒤 4자리를 입력해주세요.");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      alert("비밀번호는 숫자 4자리로 입력해주세요.");
      return;
    }

    if (!agreed) {
      alert("이용 안내를 확인해주세요.");
      return;
    }

    setLoading(true);

    const loginCode =
      `${cleanPortCode}${vehicleLast4}`.toUpperCase();

    const internalEmail =
      `${loginCode.toLowerCase()}@login.sttplink.com`;

    // 사용자는 4자리 PIN만 입력
    // Supabase 내부에는 6자리 이상으로 저장
    const internalPassword = `ST${pin}`;

    const { data, error } = await supabase.auth.signUp({
      email: internalEmail,
      password: internalPassword,
      options: {
        data: {
          role: "driver",
          login_code: loginCode,
          port_code: cleanPortCode,
          vehicle_last4: vehicleLast4,
        },
      },
    });

    if (error) {
      setLoading(false);

      if (
        error.message.toLowerCase().includes("already") ||
        error.message.toLowerCase().includes("registered") ||
        error.message.toLowerCase().includes("exists")
      ) {
        alert("이미 사용 중인 로그인 아이디입니다.");
        return;
      }

      alert(`회원가입 오류: ${error.message}`);
      return;
    }

    const user = data.user;

    if (!user) {
      setLoading(false);
      alert("회원정보 생성에 실패했습니다.");
      return;
    }

    const { error: driverError } = await supabase
      .from("drivers")
      .insert({
        user_id: user.id,
        login_code: loginCode,
        port_code: cleanPortCode,
        vehicle_number: vehicleLast4,
        rank: 1,
      });

    if (driverError) {
      setLoading(false);

      alert(
        "계정은 생성되었지만 기본정보 저장 중 오류가 발생했습니다."
      );

      return;
    }

    alert(
      `가입이 완료되었습니다.\n\n로그인 아이디: ${loginCode}`
    );

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
              회원가입
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              필요한 정보만 간단하게 입력하세요.
            </p>
          </div>

          <form
            onSubmit={handleSignup}
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
                value={portCode}
                onChange={handlePortCodeChange}
                placeholder="예: LGDK"
                className="h-16 w-full rounded-2xl border border-white/10 bg-zinc-900 px-5 text-xl font-black uppercase tracking-wide text-white outline-none transition focus:border-orange-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                차량번호 뒤 4자리
              </span>

              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={4}
                value={vehicleLast4}
                onChange={handleVehicleChange}
                placeholder="6281"
                className="h-16 w-full rounded-2xl border border-white/10 bg-zinc-900 px-5 text-xl font-black tracking-[0.2em] text-white outline-none transition focus:border-orange-500"
              />
            </label>

            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
              <div className="text-xs text-zinc-500">
                로그인 아이디
              </div>

              <div className="mt-1 text-2xl font-black text-orange-400">
                {portCode || "LGDK"}
                {vehicleLast4 || "6281"}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                비밀번호
              </span>

              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                required
                maxLength={4}
                value={pin}
                onChange={handlePinChange}
                placeholder="숫자 4자리"
                className="h-16 w-full rounded-2xl border border-white/10 bg-zinc-900 px-5 text-xl font-black tracking-[0.35em] text-white outline-none transition focus:border-orange-500"
              />
            </label>

            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
              <div className="text-lg font-black text-orange-400">
                이용 안내
              </div>

              <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                <p>
                  <strong className="text-white">
                    STTPLINK는 6281이 개인적으로 제작·운영하는
                    비영리 목적의 개인 사이트입니다.
                  </strong>
                </p>

                <p>
                  상업적 서비스나 영리 활동을 목적으로
                  운영하지 않으며, 가까운 지인들의 편리한
                  업무 활용을 위해 만들어졌습니다.
                </p>

                <p>
                  회원가입 시 서비스 이용에 필요한
                  <strong className="text-white">
                    {" "}
                    포트코드와 차량번호 일부 등 최소한의 정보만 사용
                  </strong>
                  하며, 서비스 데이터는
                  <strong className="text-white">
                    {" "}
                    Supabase를 통해 관리
                  </strong>
                  됩니다.
                </p>

                <p>
                  STTPLINK는 별도의 프로그램이나 파일을
                  다운로드하거나 설치하는 방식이 아닌
                  <strong className="text-white">
                    {" "}
                    웹브라우저 접속형 서비스
                  </strong>
                  입니다.
                </p>

                <p>
                  사이트 이용을 위해 출처가 불분명한
                  프로그램, 실행파일 또는 앱을 설치할
                  필요가 없습니다.
                </p>

                <div className="rounded-xl border border-orange-500/30 bg-black p-4 text-center">
                  <p className="font-black text-orange-400">
                    본 사이트는 공개 회원 모집을 목적으로
                    운영하지 않습니다.
                  </p>
                </div>

                <p>
                  개인적인 용도로 운영되는 사이트이므로
                  사용자가 불필요하게 많아지는 것을
                  원하지 않습니다.
                </p>

                <p className="font-bold text-white">
                  운영자의 허락 없이 계정, 접속정보 또는
                  사이트 주소를 다른 사람에게 배포하거나
                  공유하지 마세요.
                </p>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-zinc-900 p-4">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) =>
                  setAgreed(event.target.checked)
                }
                className="mt-1 h-5 w-5 shrink-0 accent-orange-600"
              />

              <span className="text-sm font-bold leading-6 text-zinc-300">
                위 내용을 확인했으며 동의합니다.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !agreed}
              className="h-16 w-full rounded-2xl bg-orange-600 text-lg font-black text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "가입 처리 중..." : "가입하기"}
            </button>
          </form>

          <div className="mt-7 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-zinc-500">
              이미 계정이 있으신가요?
            </p>

            <Link
              href="/login"
              className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-white/15 text-sm font-bold text-zinc-300 transition active:bg-white/10"
            >
              로그인
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}