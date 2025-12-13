// app/(marketing)/page.tsx

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* NAVBAR */}
      <header className="w-full flex items-center justify-between py-2 px-8 border-b">
        <div className="flex items-center gap-3">
          <Image src="/next.svg" alt="Logo" width={60} height={60} />
          <span className="text-xl font-semibold">*Your name here*</span>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/sign-in")}
            className="text-base cursor-pointer"
          >
            Sign In
          </Button>
          <Button
            onClick={() => router.push("/sign-up")}
            className="text-base px-6 cursor-pointer"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* HERO SECTION */}
        <section className="flex flex-col md:flex-row items-center justify-between px-8 py-24 gap-16 max-w-6xl mx-auto w-full">
          <div className="flex flex-col gap-6 max-w-xl">
            <h1 className="text-5xl font-bold tracking-tight leading-tight">
              Compare ASINs. Outmaneuver Competitors. Win the Market.
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed">
              *Your name here* gives you the intelligence edge. Drop in your
              ASIN and stack it against rival listings with crisp analytics,
              real-time insights, and airtight performance benchmarking.
            </p>

            <div className="flex gap-4 mt-4">
              <Button
                size="lg"
                onClick={() => router.push("/dashboard")}
                className="px-8 py-6 text-lg cursor-pointer"
              >
                Launch Dashboard
              </Button>

              <Button
                size="lg"
                variant="secondary"
                onClick={() => router.push("/sign-in")}
                className="px-8 py-6 text-lg cursor-pointer"
              >
                Sign In
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-2">
              No credit card. No friction. Just data.
            </p>
          </div>

          <div className="relative w-full max-w-xl h-96 md:h-[450px]">
            <Image
              src="/hero-dashboard.png"
              alt="Dashboard Preview"
              fill
              className="object-contain drop-shadow-xl border"
            />
            <span className="flex items-center justify-center pt-56">
              Image goes here
            </span>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-20 bg-muted/30 border-t">
          <div className="max-w-6xl mx-auto px-8">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="flex flex-col gap-3">
                <h3 className="text-xl font-semibold">ASIN-to-ASIN Clarity</h3>
                <p className="text-muted-foreground">
                  Cut through the noise. Understand how your product stacks up
                  in seconds.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="text-xl font-semibold">Competitor Deep Dives</h3>
                <p className="text-muted-foreground">
                  Track pricing, ranking shifts, and listing changes with
                  precision.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="text-xl font-semibold">Insights That Convert</h3>
                <p className="text-muted-foreground">
                  Actionable intelligence that pushes your product ahead of the
                  pack.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER (STICKS AT BOTTOM) */}
      <footer className="py-10 border-t mt-auto">
        <div className="max-w-6xl mx-auto px-8 text-center text-sm text-muted-foreground">
          *Your name here* © {new Date().getFullYear()} — Precision. Discipline.
          Market Mastery.
        </div>
      </footer>
    </main>
  );
}
