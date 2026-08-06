import Link from "next/link";

export function DriverCTA() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-t from-brand-orange/5 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-brand-orange/20 bg-gradient-to-br from-brand-orange/10 via-brand-black to-brand-black p-10 sm:p-16">
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-brand-orange/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-brand-orange/10 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-orange">
              Join Our Network
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Drive the Future of Freight
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-brand-gray-300">
              We&apos;re building an elite network of professional drivers.
              Be among the first 100 to join STTPlink and shape the future of
              AI-powered logistics.
            </p>

            <Link
              href="/driver/register"
              className="group mt-10 inline-flex items-center justify-center gap-3 rounded-2xl bg-brand-orange px-12 py-5 text-lg font-semibold text-white shadow-xl shadow-brand-orange/25 transition-all duration-300 hover:scale-[1.02] hover:bg-brand-orange-light hover:shadow-2xl hover:shadow-brand-orange/30 active:scale-[0.98] sm:px-16 sm:py-6 sm:text-xl"
            >
              Driver Registration
              <svg
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>

            <p className="mt-6 text-sm text-brand-gray-400">
              Now recruiting the first{" "}
              <span className="font-semibold text-brand-white">100</span>{" "}
              professional drivers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
