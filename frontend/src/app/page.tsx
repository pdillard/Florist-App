import Link from 'next/link'

// Plain server component, no data fetching, no client hooks - keeps this
// page fully static (no risk of the prerender issues that hit /login
// before real Supabase env vars were set, see the deploy history). Auth
// state is handled by the Header, not this page: a signed-in merchant/
// driver/customer already gets the right nav link there.
export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-8 pb-16 pt-20 text-center sm:pt-28">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Stop the &ldquo;where are my flowers?&rdquo; calls.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
          Assign a driver, get photo and GPS proof the moment it&apos;s delivered, and give
          customers a live link to watch it happen &mdash; no more guessing, no more disputes you
          can&apos;t back up.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded bg-black px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 ease-out hover:bg-gray-800 active:scale-[0.97]"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-all duration-150 ease-out hover:bg-gray-50 active:scale-[0.97]"
          >
            Sign in
          </Link>
        </div>
      </section>

      <section className="border-t bg-gray-50 px-8 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-gray-500">
            How it works
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            <div>
              <div className="text-sm font-semibold text-gray-400">01</div>
              <h3 className="mt-1 font-semibold">Enter the order</h3>
              <p className="mt-1 text-sm text-gray-600">
                However it comes in &mdash; phone, walk-in, your own storefront. No new ordering
                system to learn.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-400">02</div>
              <h3 className="mt-1 font-semibold">Assign a driver</h3>
              <p className="mt-1 text-sm text-gray-600">
                They deliver and capture a timestamped photo at the door &mdash; the proof is
                built in, not an afterthought.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-400">03</div>
              <h3 className="mt-1 font-semibold">Customer tracks live</h3>
              <p className="mt-1 text-sm text-gray-600">
                A link that updates in real time. No app to download, nothing to remember to
                check.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-8 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold">Proof that holds up</h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            When someone calls saying their order never showed, you&apos;ll have a timestamp, a
            GPS point, and a photo &mdash; not just your word against theirs. It&apos;s the
            evidence you already need, captured automatically instead of chased down after the
            fact.
          </p>
        </div>
      </section>

      <section className="border-t px-8 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold">Works with what you already use</h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            This isn&apos;t a replacement for your storefront or POS &mdash; it&apos;s the delivery
            layer that sits next to it. Keep taking orders however you already do; this just
            handles getting them there and proving it.
          </p>
        </div>
      </section>

      <section className="border-t bg-gray-50 px-8 py-16 text-center">
        <h2 className="text-2xl font-bold">Ready to get your next delivery out the door?</h2>
        <div className="mt-6">
          <Link
            href="/login"
            className="rounded bg-black px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 ease-out hover:bg-gray-800 active:scale-[0.97]"
          >
            Get started
          </Link>
        </div>
      </section>
    </main>
  )
}
