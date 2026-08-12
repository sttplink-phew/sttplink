import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-brand-black">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange text-lg font-bold text-white">
              S
            </span>
            <div>
              <p className="text-xl font-semibold tracking-tight">
                STTP<span className="text-brand-orange">link</span>
              </p>
              <p className="text-sm text-brand-gray-400">
              운송차주를 위한 STTP LINK
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 text-sm text-brand-gray-400">
          <Link href="#about" className="transition-colors hover:text-brand-white">
  소개
</Link>

<Link href="#services" className="transition-colors hover:text-brand-white">
  서비스
</Link>

<Link
  href="/driver/register"
  className="transition-colors hover:text-brand-orange"
>
  운송차주 등록
</Link>
          </nav>
        </div>
        <div className="mt-8 text-sm text-brand-gray-400">
  <p className="font-semibold text-brand-white">운영자:6281</p>
  <p className="mt-1">광양항 운송차주 커뮤니티</p>

  <p className="mt-1">문의: sttplink@gmail.com</p>

</div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-sm text-brand-gray-400">
            &copy; {currentYear} STTPlink. All rights reserved.
          </p>
          <p className="text-xs text-brand-gray-500">
            컨테이너 · 중량물 · 대형 화물 · 건설장비
          </p>
        </div>
      </div>
    </footer>
  );
}
