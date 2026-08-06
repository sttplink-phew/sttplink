import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero, CompanyIntro, Services, DriverCTA } from "@/components/landing";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <CompanyIntro />
        <Services />
        <DriverCTA />
      </main>
      <Footer />
    </>
  );
}
