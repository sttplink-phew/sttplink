import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-16">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-brand-orange/10 blur-[120px] animate-pulse-glow" />
      <div className="absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-brand-orange/5 blur-[100px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="mb-8 opacity-0 animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/10 px-4 py-1.5 text-sm font-medium text-brand-orange-light">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-orange opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-orange" />
            </span>
            Now Recruiting Drivers
          </span>
        </div>

        {/* Main headline */}
        <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight opacity-0 animate-fade-in-up animation-delay-100 sm:text-5xl md:text-6xl lg:text-7xl">
          The Future of{" "}
          <span className="text-gradient">Freight</span>
          <br />
          Is Here
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-2xl text-lg text-brand-gray-300 opacity-0 animate-fade-in-up animation-delay-200 sm:text-xl">
          AI-powered logistics platform specialized in container transport,
          heavy haul, and oversized cargo — built for professionals who move
          the world.
        </p>

        {/* Service tags */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 opacity-0 animate-fade-in-up animation-delay-300">
          {["Container", "Heavy Haul", "Oversized Cargo", "Construction Equipment"].map(
            (service, index) => (
              <span
                key={service}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-brand-gray-200 backdrop-blur-sm transition-all hover:border-brand-orange/30 hover:bg-brand-orange/10"
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                {service}
              </span>
            )
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-col items-center gap-4 opacity-0 animate-fade-in-up animation-delay-500">
          <Link
            href="/driver/register"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl bg-brand-orange px-10 py-5 text-lg font-semibold text-white shadow-xl shadow-brand-orange/25 transition-all duration-300 hover:scale-[1.02] hover:bg-brand-orange-light hover:shadow-2xl hover:shadow-brand-orange/30 active:scale-[0.98] sm:px-14 sm:py-6 sm:text-xl"
          >
            <span className="relative z-10 flex items-center gap-3">
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
            </span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </Link>
          <p className="text-sm text-brand-gray-400 sm:text-base">
            Now recruiting the first{" "}
            <span className="font-semibold text-brand-orange">100</span>{" "}
            professional drivers.
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in animation-delay-800">
          <div className="flex flex-col items-center gap-2 text-brand-gray-500">
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <div className="h-8 w-5 rounded-full border border-white/20 p-1">
              <div className="h-2 w-full animate-bounce rounded-full bg-brand-orange" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
