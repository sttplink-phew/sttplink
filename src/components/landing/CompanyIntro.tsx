export function CompanyIntro() {
  return (
    <section id="about" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-brand-black via-brand-gray-500/5 to-brand-black" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Text content */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-orange">
              About STTPlink
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Redefining Freight
              <br />
              <span className="text-brand-gray-300">for the Modern Era</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-brand-gray-300">
              STTPlink is building the next generation of freight logistics —
              an AI-powered platform designed from the ground up for the
              complexities of container transport, heavy haul, oversized cargo,
              and construction equipment.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-brand-gray-400">
              We connect professional drivers with enterprise customers through
              intelligent routing, real-time tracking, and seamless coordination.
              Our mission is simple: move freight smarter, faster, and safer.
            </p>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-6">
              {[
                { value: "100", label: "Driver Spots" },
                { value: "4", label: "Specializations" },
                { value: "24/7", label: "AI Support" },
              ].map((stat) => (
                <div key={stat.label} className="text-center sm:text-left">
                  <p className="text-2xl font-bold text-brand-orange sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-brand-gray-400 sm:text-sm">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Visual element */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-brand-orange/20 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-brand-gray-500/10 p-8 backdrop-blur-sm sm:p-10">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-brand-white">AI Freight Platform</p>
                  <p className="text-sm text-brand-gray-400">Powered by intelligence</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  "Smart route optimization",
                  "Real-time cargo tracking",
                  "Automated load matching",
                  "Predictive maintenance alerts",
                ].map((feature, index) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 px-4 py-3 transition-colors hover:border-brand-orange/20 hover:bg-brand-orange/5"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-orange/20">
                      <svg
                        className="h-3.5 w-3.5 text-brand-orange"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-sm text-brand-gray-200">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
