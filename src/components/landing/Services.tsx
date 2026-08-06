const services = [
  {
    title: "Container Transport",
    description:
      "Port-to-warehouse and intermodal container logistics with AI-optimized scheduling and real-time visibility.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    title: "Heavy Haul",
    description:
      "Specialized transport for overweight and high-capacity loads with certified drivers and compliant routing.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    title: "Oversized Cargo",
    description:
      "Permit management, escort coordination, and precision planning for wide and tall freight movements.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
      </svg>
    ),
  },
  {
    title: "Construction Equipment",
    description:
      "Safe delivery of cranes, excavators, and heavy machinery to job sites with expert load securing.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03a2.652 2.652 0 00-3.802-3.802l-3.03 2.496M11.42 15.17l-3.03 2.496a2.652 2.652 0 01-3.802-3.802l2.496-3.03" />
      </svg>
    ),
  },
];

export function Services() {
  return (
    <section id="services" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-orange">
            Our Specializations
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Built for Complex Freight
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-gray-400">
            Container &bull; Heavy Haul &bull; Oversized Cargo
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <div
              key={service.title}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-brand-orange/30 hover:bg-brand-orange/5 hover:shadow-lg hover:shadow-brand-orange/5"
            >
              <div className="mb-4 inline-flex rounded-xl bg-brand-orange/10 p-3 text-brand-orange transition-colors group-hover:bg-brand-orange group-hover:text-white">
                {service.icon}
              </div>
              <h3 className="text-lg font-semibold text-brand-white">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-gray-400">
                {service.description}
              </p>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-brand-orange transition-all duration-300 group-hover:w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
