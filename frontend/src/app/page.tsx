import Link from 'next/link'
import { Camera, MapPin, Phone, Puzzle, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { Reveal } from '@/components/marketing/Reveal'
import { GradientBlobs } from '@/components/marketing/GradientBlobs'
import { TrackingCardMockup } from '@/components/marketing/TrackingCardMockup'

// Server component, no data fetching or client hooks of its own - the
// animated bits are isolated in small client components (Reveal,
// GradientBlobs, TrackingCardMockup) so this page stays fully static and
// carries none of the prerender risk that hit /login before real
// Supabase env vars existed (see the deploy history).
export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <GradientBlobs />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-8 pb-20 pt-20 sm:pt-28 lg:grid-cols-2 lg:items-center lg:gap-8">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
              <Sparkles className="h-3.5 w-3.5" />
              Built for local florists
            </div>

            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              Stop the{' '}
              <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                &ldquo;where are my flowers?&rdquo;
              </span>{' '}
              calls.
            </h1>

            <p className="mt-5 max-w-lg text-lg text-gray-600">
              Assign a driver, get photo and GPS proof the moment it&apos;s delivered, and give
              customers a live link to watch it happen &mdash; no more guessing, no more disputes
              you can&apos;t back up.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href="/login" variant="accent" className="px-6 py-3 text-base">
                Get started
              </Button>
              <Button href="/features" variant="secondary" className="px-6 py-3 text-base">
                See how it works
              </Button>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              First 30 days free &middot; No setup fees &middot; Works alongside your existing POS
            </p>
          </div>

          <TrackingCardMockup />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-gray-50 px-8 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-600">
              How it works
            </h2>
            <p className="mt-2 text-2xl font-bold sm:text-3xl">Three steps, start to finish</p>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Phone,
                step: '01',
                title: 'Enter the order',
                body: 'However it comes in — phone, walk-in, your own storefront. No new ordering system to learn.',
              },
              {
                icon: MapPin,
                step: '02',
                title: 'Assign a driver',
                body: 'They deliver and capture a timestamped photo at the door — the proof is built in, not an afterthought.',
              },
              {
                icon: Camera,
                step: '03',
                title: 'Customer tracks live',
                body: 'A link that updates in real time. No app to download, nothing to remember to check.',
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.1}>
                <div className="group h-full rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-colors duration-200 group-hover:bg-rose-600 group-hover:text-white">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-xs font-semibold text-gray-400">{item.step}</div>
                  <h3 className="mt-1 font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-gray-600">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiator */}
      <section className="px-8 py-20">
        <Reveal className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Proof that holds up</h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            When someone calls saying their order never showed, you&apos;ll have a timestamp, a
            GPS point, and a photo &mdash; not just your word against theirs. It&apos;s the
            evidence you already need, captured automatically instead of chased down after the
            fact.
          </p>
        </Reveal>
      </section>

      {/* Positioning */}
      <section className="border-t bg-gray-50 px-8 py-20">
        <Reveal className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <Puzzle className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Works with what you already use</h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            This isn&apos;t a replacement for your storefront or POS &mdash; it&apos;s the delivery
            layer that sits next to it. Keep taking orders however you already do; this just
            handles getting them there and proving it.
          </p>
        </Reveal>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden px-8 py-20 text-center">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-600 to-pink-600" />
        <Reveal className="relative">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to get your next delivery out the door?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-rose-100">
            Set up your shop in a few minutes &mdash; no credit card required to start.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-white px-6 py-3 text-base font-medium text-rose-700 shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.97]"
            >
              Get started
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-white/40 px-6 py-3 text-base font-medium text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-white hover:bg-white/10 active:translate-y-0 active:scale-[0.97]"
            >
              Talk to us
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
