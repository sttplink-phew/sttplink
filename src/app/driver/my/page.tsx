"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/client";

type DriverProfile = {
  id: number;
  user_id: string;
  vehicle_types: string[];
  cargo_types: string[];
  load_conditions: string[];
  regions: string[];
  business_info: string[];
  vehicle_number: string | null;
  business_number: string | null;
  memo: string | null;
};

export default function DriverMyPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
  .from("drivers")
  .select("*")
  .eq("user_id", user.id)
  .limit(1);

      if (error) {
        alert(`운송차주 정보 조회 오류: ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        router.push("/driver/profile");
        return;
      }
      
      setProfile(data[0]);
      setLoading(false);
    }

    loadProfile();
  }, [router, supabase]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#080808] px-4 pt-28 text-white">
          <div className="mx-auto max-w-5xl">불러오는 중...</div>
        </main>
      </>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-28 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <p className="text-sm font-bold text-orange-500">STTPLINK</p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              내 운송차주 정보
            </h1>

            <p className="mt-3 text-zinc-400">
              현재 등록된 차량 및 운송 가능 정보를 확인할 수 있습니다.
            </p>
          </div>

          <section className="rounded-3xl bg-white p-6 text-zinc-900 shadow-2xl sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <InfoBox title="차량 종류" items={profile.vehicle_types} />
              <InfoBox title="적재 가능 화물" items={profile.cargo_types} />
              <InfoBox title="적재 조건" items={profile.load_conditions} />
              <InfoBox title="운송 가능 지역" items={profile.regions} />
              <InfoBox title="보험 / 사업자 정보" items={profile.business_info} />

              <InfoBox
                title="차량번호"
                items={profile.vehicle_number ? [profile.vehicle_number] : []}
              />

              <InfoBox
                title="사업자번호"
                items={profile.business_number ? [profile.business_number] : []}
              />

              <div className="rounded-2xl bg-zinc-50 p-5 sm:col-span-2">
                <p className="text-sm font-bold text-zinc-700">
                  특이사항 / 메모
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">
                  {profile.memo || "등록된 메모가 없습니다."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/driver/profile")}
              className="mt-7 h-14 w-full rounded-xl bg-orange-600 text-sm font-bold text-white transition hover:bg-orange-500"
            >
              운송차주 정보 수정
            </button>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

function InfoBox({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-5">
      <p className="text-sm font-bold text-zinc-700">{title}</p>

      <p className="mt-2 text-sm leading-6 text-zinc-600">
        {items?.length > 0 ? items.join(" · ") : "등록 정보 없음"}
      </p>
    </div>
  );
}