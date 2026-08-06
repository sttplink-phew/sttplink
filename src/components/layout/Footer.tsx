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
                AI-Powered Freight Platform
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 text-sm text-brand-gray-400">
            <Link href="#about" className="transition-colors hover:text-brand-white">
              About
            </Link>
            <Link href="#services" className="transition-colors hover:text-brand-white">
              Services
            </Link>
            <Link
              href="/driver/register"
              className="transition-colors hover:text-brand-orange"
            >
              Driver Registration
            </Link>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-sm text-brand-gray-400">
            &copy; {currentYear} STTPlink. All rights reserved.
          </p>
          <p className="text-xs text-brand-gray-500">
            Container &bull; Heavy Haul &bull; Oversized Cargo &bull; Construction Equipment
          </p>
        </div>
      </div>
    </footer>
  );
}
