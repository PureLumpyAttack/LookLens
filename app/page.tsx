"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";

const features = [
  {
    icon: "📸",
    name: "Instant product ID",
    desc: "Point your camera at any look and identify every product in seconds using computer vision.",
  },
  {
    icon: "💰",
    name: "Dupe finder",
    desc: "Automatically surface affordable alternatives that match the same shade and finish.",
  },
  {
    icon: "🎨",
    name: "Skin tone preview",
    desc: "See how products look on your own skin tone before you spend a dollar.",
  },
  {
    icon: "🗂️",
    name: "Save looks",
    desc: "Build a personal library of looks you love, rate them, and revisit anytime.",
  },
  {
    icon: "💳",
    name: "Budget-aware",
    desc: "Set your budget once. Every recommendation stays within your range automatically.",
  },
  {
    icon: "🛒",
    name: "One-tap buy",
    desc: "Add everything in a look to cart in one tap with direct links to your favourite stores.",
  },
];

const steps = [
  {
    title: "Snap or upload",
    desc: "Take a photo or import one from your camera roll or social media.",
  },
  {
    title: "AI analyses",
    desc: "Our model identifies every product, shade, and finish in the look instantly.",
  },
  {
    title: "Shop or save",
    desc: "Buy directly, find dupes, or save the look to your personal library.",
  },
];

const brands = [
  "Charlotte Tilbury",
  "Rare Beauty",
  "Glossier",
  "NARS",
  "MAC",
  "e.l.f.",
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="bg-zinc-950 text-zinc-50 min-h-screen font-sans antialiased">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-sm font-semibold tracking-tight">
              LookLens
            </span>
            <ul className="flex list-none">
              <li>
                <a
                  href="#"
                  className="text-xs text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 px-3 py-1.5 rounded-md transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-xs text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 px-3 py-1.5 rounded-md transition-colors"
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-xs text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 px-3 py-1.5 rounded-md transition-colors"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          <div className="flex items-center gap-2">
            <Show when="signed-out">
              <SignInButton>
                <button className="text-xs font-medium text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 px-3 py-1.5 rounded-md transition-colors">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="text-xs font-medium text-zinc-950 bg-zinc-50 hover:bg-zinc-200 px-4 py-1.5 rounded-md transition-colors h-8">
                  Sign up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-8 pt-24 pb-20 text-center">
        <h1 className="text-5xl font-semibold tracking-tight leading-tight mb-5 max-w-2xl mx-auto">
          Scan any look.
          <br />
          Know every <span className="text-rose-400">product.</span>
        </h1>
        <p className="text-base text-zinc-400 max-w-md mx-auto mb-10 leading-relaxed">
          Point your camera at any makeup look and instantly identify every
          product, find dupes, and shop within your budget.
        </p>
        <div className="flex gap-3 justify-center flex-wrap mb-16">
          <SignUpButton>
            <button className="text-sm font-medium text-zinc-950 bg-zinc-50 hover:bg-zinc-200 px-5 py-2.5 rounded-lg transition-colors h-10">
              Get started free →
            </button>
          </SignUpButton>
          <button className="text-sm font-medium text-zinc-50 bg-transparent border border-zinc-700 hover:bg-zinc-800 px-5 py-2.5 rounded-lg transition-colors h-10">
            See how it works
          </button>
        </div>

        {/* BROWSER MOCKUP */}
        <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900 shadow-2xl max-w-3xl mx-auto">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-zinc-800 bg-zinc-800/60">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <div className="flex-1 text-center">
              <span className="text-[11px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-700 rounded px-8 py-0.5">
                looklens.app/scan
              </span>
            </div>
          </div>
          <div className="p-5 grid grid-cols-3 gap-3">
            {/* Card 1 */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-left">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">
                Detected · lips
              </p>
              <div
                className="w-5 h-5 rounded border border-zinc-700 mb-2"
                style={{ background: "#C97B63" }}
              />
              <p className="text-sm font-medium text-zinc-50 mb-0.5">
                Pillow Talk Lipstick
              </p>
              <p className="text-xs text-zinc-400 mb-2">Charlotte Tilbury</p>
              <p className="text-sm font-semibold font-mono text-rose-400">
                $34.00
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] font-mono font-medium bg-green-950 text-green-400 border border-green-900 rounded px-1.5 py-0.5">
                  dupe found
                </span>
                <span className="text-[11px] text-zinc-500">saves $26</span>
              </div>
            </div>
            {/* Card 2 */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-left">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">
                Detected · cheeks
              </p>
              <div
                className="w-5 h-5 rounded border border-zinc-700 mb-2"
                style={{ background: "#E8A4A4" }}
              />
              <p className="text-sm font-medium text-zinc-50 mb-0.5">
                Soft Pinch Blush
              </p>
              <p className="text-xs text-zinc-400 mb-2">Rare Beauty</p>
              <p className="text-sm font-semibold font-mono text-rose-400">
                $22.00
              </p>
              <div className="w-full h-1 rounded-full bg-zinc-800 mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-rose-400"
                  style={{ width: "82%" }}
                />
              </div>
              <p className="text-[11px] font-mono text-zinc-500 mt-1">
                82% skin tone match
              </p>
            </div>
            {/* Card 3 */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-left">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">
                Detected · highlight
              </p>
              <div
                className="w-5 h-5 rounded border border-zinc-700 mb-2"
                style={{ background: "#F5E6C8" }}
              />
              <p className="text-sm font-medium text-zinc-50 mb-0.5">
                Fenty Highlighter
              </p>
              <p className="text-xs text-zinc-400 mb-2">Fenty Beauty</p>
              <p className="text-sm font-semibold font-mono text-rose-400">
                $36.00
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] font-mono font-medium bg-green-950 text-green-400 border border-green-900 rounded px-1.5 py-0.5">
                  dupe found
                </span>
                <span className="text-[11px] text-zinc-500">saves $28</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="max-w-5xl mx-auto border-zinc-800" />

      {/* BRANDS */}
      <div className="py-10 text-center px-8">
        <p className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-widest mb-5">
          Identifies products from 200+ brands
        </p>
        <div className="flex justify-center items-center gap-10 flex-wrap">
          {brands.map((b) => (
            <span key={b} className="text-sm font-medium text-zinc-500">
              {b}
            </span>
          ))}
        </div>
      </div>

      <hr className="max-w-5xl mx-auto border-zinc-800" />

      {/* FEATURES */}
      <section className="max-w-5xl mx-auto px-8 py-20">
        <p className="text-[11px] font-mono font-medium text-rose-400 uppercase tracking-widest mb-2">
          Features
        </p>
        <h2 className="text-3xl font-semibold tracking-tight mb-2">
          Everything you need to recreate any look
        </h2>
        <p className="text-sm text-zinc-400 max-w-sm leading-relaxed mb-10">
          From instant identification to budget-aware shopping — all in one tap.
        </p>
        <div className="grid grid-cols-3 border border-zinc-800 rounded-xl overflow-hidden divide-x divide-y divide-zinc-800">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-zinc-950 hover:bg-zinc-900 transition-colors p-7"
            >
              <div className="w-9 h-9 rounded-lg border border-zinc-800 bg-zinc-900 flex items-center justify-center text-base mb-4">
                {f.icon}
              </div>
              <p className="text-sm font-semibold text-zinc-50 mb-1 tracking-tight">
                {f.name}
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <div className="bg-zinc-900 border-t border-b border-zinc-800 py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-mono font-medium text-rose-400 uppercase tracking-widest mb-2">
            How it works
          </p>
          <h2 className="text-3xl font-semibold tracking-tight mb-10">
            Three steps to your perfect look
          </h2>
          <div className="grid grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div
                key={i}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-7"
              >
                <div className="w-6 h-6 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center text-[11px] font-mono text-zinc-400 mb-4">
                  {i + 1}
                </div>
                <p className="text-sm font-semibold text-zinc-50 mb-1 tracking-tight">
                  {s.title}
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-8 py-20">
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,113,133,0.1)_0%,transparent_65%)] pointer-events-none" />
          <h2 className="relative text-4xl font-semibold tracking-tight mb-2">
            Be the first to try LookLens
          </h2>
          <p className="relative text-sm text-zinc-400 mb-8">
            Join the waitlist and get early access when we launch.
          </p>
          {submitted ? (
            <div className="relative flex items-center justify-center gap-2 text-sm text-zinc-400">
              <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white">
                ✓
              </span>
              You&apos;re on the list — we&apos;ll be in touch soon.
            </div>
          ) : (
            <div className="relative flex gap-2 justify-center max-w-sm mx-auto">
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && email && setSubmitted(true)
                }
                className="flex-1 text-xs px-4 h-10 rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-50 placeholder-zinc-500 outline-none focus:border-zinc-500 transition-colors"
              />
              <button
                onClick={() => email && setSubmitted(true)}
                className="text-xs font-medium text-zinc-950 bg-zinc-50 hover:bg-zinc-200 px-4 h-10 rounded-lg whitespace-nowrap transition-colors"
              >
                Join waitlist
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 px-8 py-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <span className="text-sm font-semibold tracking-tight">LookLens</span>
          <p className="text-xs font-mono text-zinc-500">
            © 2025 LookLens. All rights reserved.
          </p>
          <ul className="flex gap-5 list-none">
            {["Privacy", "Terms", "Contact"].map((l) => (
              <li key={l}>
                <a
                  href="#"
                  className="text-xs text-zinc-500 hover:text-zinc-50 transition-colors"
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  );
}
