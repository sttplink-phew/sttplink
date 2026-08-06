import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-brand-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2 opacity-0 animate-fade-in-down"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange text-sm font-bold text-white transition-transform group-hover:scale-105">
            S
          </span>
          <span className="text-lg font-semibold tracking-tight text-brand-white">
            STTP<span className="text-brand-orange">link</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#about"
            className="text-sm text-brand-gray-300 transition-colors hover:text-brand-white"
          >
            About
          </Link>
          <Link
            href="#services"
            className="text-sm text-brand-gray-300 transition-colors hover:text-brand-white"
          >
            Services
          </Link>
          <Link
            href="/driver/register"
            className="rounded-full bg-brand-orange px-5 py-2 text-sm font-medium text-white transition-all hover:bg-brand-orange-light hover:shadow-lg hover:shadow-brand-orange/20"
          >
            Join as Driver
          </Link>
        </nav>

        <Link
          href="/driver/register"
          className="rounded-full bg-brand-orange px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-orange-light md:hidden"
        >
          Join
        </Link>
      </div>
    </header>
  );
}
