import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#080808]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-sm font-black text-white">
            S
          </span>

          <div>
            <p className="text-base font-black tracking-tight text-white">
              STTPLINK
            </p>

            <p className="hidden text-[10px] text-zinc-500 sm:block">
              Heavy Transport Platform
            </p>
          </div>
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
            href="/driver"
            className="hidden rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-zinc-400 transition hover:border-white/30 hover:text-white sm:block"
          >
            기사 등록
          </Link>

          <Link
            href="/login"
            className="rounded-lg border border-white/20 px-3 py-2 text-sm font-bold text-white transition hover:border-orange-500 hover:text-orange-400"
          >
            로그인
          </Link>
        </nav>
      </div>
    </header>
  );
}