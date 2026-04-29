import React from "react";
import { sigin } from "../api";

/**
 * Mail Copilot — Sign-in
 * Single-file React (TSX) component. Tailwind for layout/utilities,
 * inline <style> for fonts, custom colors, animations and grain.
 * No required props. Default export.
 */
const SignIn: React.FC = () => {
    return (
        <div
            className="relative min-h-screen w-full overflow-hidden"
            style={{
                backgroundColor: "#0A0B0F",
                color: "#F5F2ED",
                fontFamily: "'Geist', system-ui, sans-serif",
            }}
        >
            {/* ─────────── Fonts, keyframes, custom utilities ─────────── */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Geist:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        * { -webkit-font-smoothing: antialiased; }

        .font-serif-display { font-family: 'Fraunces', 'Times New Roman', serif; font-optical-sizing: auto; letter-spacing: -0.02em; }
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }

        .grain {
          background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.35 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>");
          opacity: 0.07;
          mix-blend-mode: overlay;
        }

        .gridlines {
          background-image:
            linear-gradient(to right, rgba(245,242,237,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(245,242,237,0.05) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
        }

        .orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(110px);
          opacity: 0.55;
          pointer-events: none;
        }
        .orb-purple { background: #7C3AED; width: 520px; height: 520px; top: -180px; left: -160px; animation: drift1 22s ease-in-out infinite alternate; }
        .orb-green  { background: #84F26A; width: 460px; height: 460px; bottom: -200px; right: -140px; opacity: 0.35; animation: drift2 26s ease-in-out infinite alternate; }

        @keyframes drift1 { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(60px, 80px) scale(1.1); } }
        @keyframes drift2 { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(-80px, -60px) scale(1.08); } }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reveal { opacity: 0; animation: fadeUp 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) forwards; }

        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(197,255,74,0.7); }
          50%      { box-shadow: 0 0 0 8px rgba(197,255,74,0); }
        }
        .pulse-dot { animation: pulse-dot 2s ease-out infinite; }

        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track { animation: ticker 40s linear infinite; }

        .preview-card {
          transform: rotate(-3deg);
          transition: transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .preview-card:hover { transform: rotate(-1deg) translateY(-4px); }

        .google-btn {
          transition: all 0.25s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .google-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 40px -12px rgba(197,255,74,0.35), 0 0 0 1px rgba(197,255,74,0.4) inset;
        }
        .google-btn:active { transform: translateY(0); }

        .signin-card {
          background:
            radial-gradient(120% 80% at 0% 0%, rgba(167,139,250,0.10), transparent 55%),
            radial-gradient(120% 80% at 100% 100%, rgba(197,255,74,0.07), transparent 55%),
            rgba(255,255,255,0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(245,242,237,0.10);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.06) inset,
            0 40px 80px -30px rgba(0,0,0,0.7);
        }

        .accent-green { color: #C5FF4A; }
        .accent-purple { color: #A78BFA; }
        .bg-card-soft { background: rgba(255,255,255,0.03); }
        .border-soft { border-color: rgba(245,242,237,0.08); }

        .divider-or::before, .divider-or::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(245,242,237,0.10);
        }

        /* Stagger */
        .d1 { animation-delay: 0.05s; }
        .d2 { animation-delay: 0.18s; }
        .d3 { animation-delay: 0.30s; }
        .d4 { animation-delay: 0.42s; }
        .d5 { animation-delay: 0.55s; }
        .d6 { animation-delay: 0.68s; }
        .d7 { animation-delay: 0.85s; }
      `}</style>

            {/* ─────────── Background layers ─────────── */}
            <div className="absolute inset-0 gridlines pointer-events-none" />
            <div className="orb orb-purple" />
            <div className="orb orb-green" />
            <div className="absolute inset-0 grain pointer-events-none" />

            {/* ─────────── Top bar ─────────── */}
            <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 lg:px-14 pt-7">
                <div className="flex items-center gap-3 reveal d1">
                    <div
                        className="relative h-7 w-7 grid place-items-center rounded-md"
                        style={{
                            background:
                                "linear-gradient(135deg, #C5FF4A 0%, #A78BFA 100%)",
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M3 6.5L12 13L21 6.5M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z"
                                stroke="#0A0B0F"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <div className="leading-tight">
                        <div className="font-mono text-[11px] tracking-[0.22em] uppercase opacity-95">
                            Mail<span className="accent-green">·</span>Copilot
                        </div>
                        <div className="font-mono text-[9px] tracking-[0.3em] uppercase opacity-50">
                            Inbox intelligence
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-6 reveal d2">
                    <span className="font-mono text-[10px] tracking-[0.25em] uppercase opacity-50">
                        v 2.4 · build 1187
                    </span>
                    <div className="flex items-center gap-2">
                        <span
                            className="h-1.5 w-1.5 rounded-full pulse-dot"
                            style={{ background: "#C5FF4A" }}
                        />
                        <span className="font-mono text-[10px] tracking-[0.25em] uppercase opacity-70">
                            All systems nominal
                        </span>
                    </div>
                </div>
            </header>

            {/* ─────────── Main content ─────────── */}
            <main className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 lg:px-14 pt-16 lg:pt-24 pb-32">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">
                    {/* ── Left: editorial copy ── */}
                    <section className="lg:col-span-7 lg:pr-8">
                        {/* Badge */}
                        <div className="reveal d1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-soft border bg-card-soft">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#A78BFA" }} />
                            <span className="font-mono text-[10px] tracking-[0.25em] uppercase opacity-80">
                                Introducing · 2026 release
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="reveal d2 font-serif-display mt-6 text-[3.25rem] sm:text-[4.25rem] lg:text-[5.5rem] leading-[0.95] font-light">
                            Email that{" "}
                            <span className="italic font-normal accent-green relative">
                                answers
                                <svg
                                    className="absolute left-0 -bottom-2 w-full"
                                    height="14"
                                    viewBox="0 0 200 14"
                                    preserveAspectRatio="none"
                                >
                                    <path
                                        d="M2 8 Q 50 2, 100 7 T 198 6"
                                        stroke="#C5FF4A"
                                        strokeWidth="2"
                                        fill="none"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </span>
                            <br />
                            itself.
                        </h1>

                        {/* Subhead */}
                        <p className="reveal d3 mt-8 text-base sm:text-lg max-w-xl leading-relaxed" style={{ color: "rgba(245,242,237,0.70)" }}>
                            Mail Copilot reads, drafts, summarizes, and triages — in your
                            voice, on your schedule. Reclaim the four hours a day your inbox
                            quietly stole.
                        </p>

                        {/* Feature list */}
                        <ul className="reveal d4 mt-10 space-y-3.5 max-w-md">
                            {[
                                ["Drafts replies", "in your tone, every time"],
                                ["Summarizes threads", "ten emails into three lines"],
                                ["Triages priority", "so the urgent never waits"],
                            ].map(([title, desc]) => (
                                <li key={title} className="flex items-start gap-4">
                                    <span
                                        className="mt-1.5 h-3 w-3 flex-none rounded-sm rotate-45"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #C5FF4A 0%, #A78BFA 100%)",
                                        }}
                                    />
                                    <div>
                                        <span className="text-[15px]" style={{ color: "#F5F2ED" }}>
                                            {title}
                                        </span>
                                        <span className="text-[15px]" style={{ color: "rgba(245,242,237,0.55)" }}>
                                            {" "}— {desc}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* Stat strip */}
                        <div className="reveal d5 mt-12 flex flex-wrap gap-x-10 gap-y-4">
                            <div>
                                <div className="font-serif-display text-3xl">
                                    4.2<span className="accent-green">h</span>
                                </div>
                                <div className="font-mono text-[10px] tracking-[0.2em] uppercase opacity-50 mt-1">
                                    saved per week
                                </div>
                            </div>
                            <div>
                                <div className="font-serif-display text-3xl">
                                    87<span className="accent-purple">%</span>
                                </div>
                                <div className="font-mono text-[10px] tracking-[0.2em] uppercase opacity-50 mt-1">
                                    drafts kept as-is
                                </div>
                            </div>
                            <div>
                                <div className="font-serif-display text-3xl">
                                    192k<span className="accent-green">+</span>
                                </div>
                                <div className="font-mono text-[10px] tracking-[0.2em] uppercase opacity-50 mt-1">
                                    inboxes onboarded
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Right: stacked preview + sign-in cards ── */}
                    <section className="lg:col-span-5 relative flex flex-col">
                        {/* Mock email preview — decorative card stacked above sign-in */}
                        <div className="reveal d6 preview-card hidden sm:block relative z-0 self-start w-[280px] ml-2 sm:ml-4 lg:ml-6">
                            <div
                                className="rounded-2xl p-4 border"
                                style={{
                                    background: "rgba(15,16,22,0.85)",
                                    borderColor: "rgba(245,242,237,0.12)",
                                    boxShadow:
                                        "0 30px 60px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(167,139,250,0.15) inset",
                                    backdropFilter: "blur(8px)",
                                }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex gap-1.5">
                                        <span className="h-2 w-2 rounded-full" style={{ background: "rgba(245,242,237,0.25)" }} />
                                        <span className="h-2 w-2 rounded-full" style={{ background: "rgba(245,242,237,0.25)" }} />
                                        <span className="h-2 w-2 rounded-full" style={{ background: "rgba(245,242,237,0.25)" }} />
                                    </div>
                                    <span className="font-mono text-[9px] tracking-widest opacity-50">11:24</span>
                                </div>

                                <div className="flex items-center gap-2.5 mb-2">
                                    <div
                                        className="h-7 w-7 rounded-full grid place-items-center text-[11px] font-medium"
                                        style={{ background: "#A78BFA", color: "#0A0B0F" }}
                                    >
                                        SC
                                    </div>
                                    <div className="leading-tight">
                                        <div className="text-[12px]">Sarah Chen</div>
                                        <div className="font-mono text-[9px] opacity-50">stripe.com</div>
                                    </div>
                                </div>

                                <div className="text-[12px] mb-3 leading-snug">
                                    Re: Q4 budget review — need approval by EOD
                                </div>

                                <div
                                    className="rounded-lg p-3 mb-3 border"
                                    style={{
                                        background: "rgba(197,255,74,0.06)",
                                        borderColor: "rgba(197,255,74,0.20)",
                                    }}
                                >
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#C5FF4A">
                                            <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
                                        </svg>
                                        <span className="font-mono text-[9px] tracking-[0.18em] uppercase accent-green">
                                            Copilot summary
                                        </span>
                                    </div>
                                    <div className="text-[11px] leading-snug" style={{ color: "rgba(245,242,237,0.85)" }}>
                                        Sarah needs $40K for the migration sprint. Approve the ask, push the timeline to Friday.
                                    </div>
                                </div>

                                <div className="flex gap-1.5">
                                    <button
                                        className="flex-1 text-[10px] py-1.5 rounded-md font-mono tracking-wide"
                                        style={{ background: "#C5FF4A", color: "#0A0B0F" }}
                                    >
                                        Use draft
                                    </button>
                                    <button
                                        className="text-[10px] py-1.5 px-2.5 rounded-md font-mono tracking-wide border"
                                        style={{ borderColor: "rgba(245,242,237,0.15)", color: "rgba(245,242,237,0.7)" }}
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>

                            {/* Caption tag — inherits parent's tilt naturally */}
                            <div className="font-mono text-[9px] tracking-[0.25em] uppercase opacity-40 mt-3 ml-2">
                                ↑ live preview · not your real inbox
                            </div>
                        </div>

                        {/* Sign-in card — sits on top of preview via z-index + slight negative margin */}
                        <div className="reveal d7 signin-card relative z-10 rounded-3xl p-8 sm:p-10 mt-8 sm:-mt-10">
                            {/* corner tag */}
                            <div
                                className="absolute -top-3 right-6 px-2.5 py-1 rounded-full border"
                                style={{
                                    background: "#0A0B0F",
                                    borderColor: "rgba(167,139,250,0.4)",
                                }}
                            >
                                <span className="font-mono text-[9px] tracking-[0.22em] uppercase accent-purple">
                                    Secure · OAuth 2.0
                                </span>
                            </div>

                            <div className="mb-8">
                                <p className="font-mono text-[10px] tracking-[0.28em] uppercase opacity-50 mb-3">
                                    / 01 — Authenticate
                                </p>
                                <h2 className="font-serif-display text-3xl sm:text-4xl leading-tight">
                                    Sign in to your<br />
                                    <span className="italic accent-purple">copilot.</span>
                                </h2>
                                <p className="mt-4 text-sm" style={{ color: "rgba(245,242,237,0.55)" }}>
                                    We only need read &amp; draft access. Your mail never leaves
                                    your account, and never trains a model.
                                </p>
                            </div>

                            {/* Google button */}
                            <button
                                type="button"
                                onClick={async () => {
                                    const repsone = await sigin()
                                    if (!repsone) {
                                        return
                                    }
                                    const data = repsone.data
                                    window.open(data.url)
                                }}
                                className="google-btn w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl text-[15px] font-medium relative cursor-pointer"
                                style={{
                                    background: "#F5F2ED",
                                    color: "#0A0B0F",
                                    boxShadow:
                                        "0 1px 0 rgba(255,255,255,0.6) inset, 0 12px 30px -10px rgba(0,0,0,0.5)",
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.61z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                <span>Continue with Google</span>
                                <svg
                                    className="ml-1 opacity-40"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        d="M5 12H19M19 12L13 6M19 12L13 18"
                                        stroke="#0A0B0F"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>

                            {/* Trust badges */}
                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"
                                            stroke="#C5FF4A"
                                            strokeWidth="2"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M9 12L11 14L15 10"
                                            stroke="#C5FF4A"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <span className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-60">
                                        End-to-end encrypted
                                    </span>
                                </div>
                                <div className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-40">
                                    SOC 2 · GDPR
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="divider-or my-7 flex items-center gap-4 font-mono text-[10px] tracking-[0.25em] uppercase opacity-40">
                                Or
                            </div>

                            {/* SSO link */}
                            <button
                                type="button"
                                className="w-full text-center font-mono text-[11px] tracking-[0.18em] uppercase opacity-60 hover:opacity-100 transition-opacity"
                            >
                                Sign in with corporate SSO →
                            </button>

                            {/* Fine print */}
                            <p className="mt-8 text-[11px] leading-relaxed text-center" style={{ color: "rgba(245,242,237,0.4)" }}>
                                By continuing you agree to our{" "}
                                <span className="underline underline-offset-2 decoration-dotted cursor-pointer hover:opacity-80">
                                    Terms
                                </span>{" "}
                                &amp;{" "}
                                <span className="underline underline-offset-2 decoration-dotted cursor-pointer hover:opacity-80">
                                    Privacy
                                </span>
                                . First 14 days are on us.
                            </p>
                        </div>
                    </section>
                </div>
            </main>

            {/* ─────────── Activity ticker ─────────── */}
            <div
                className="absolute bottom-0 inset-x-0 z-10 overflow-hidden border-t border-soft"
                style={{ background: "rgba(10,11,15,0.6)", backdropFilter: "blur(8px)" }}
            >
                <div className="flex items-center">
                    <div className="shrink-0 px-5 py-3 border-r border-soft flex items-center gap-2">
                        <span
                            className="h-1.5 w-1.5 rounded-full pulse-dot"
                            style={{ background: "#C5FF4A" }}
                        />
                        <span className="font-mono text-[10px] tracking-[0.25em] uppercase opacity-70">
                            Live
                        </span>
                    </div>
                    <div className="flex-1 overflow-hidden py-3">
                        <div className="ticker-track flex gap-10 whitespace-nowrap font-mono text-[11px] tracking-wider uppercase opacity-60">
                            {[...Array(2)].map((_, dup) => (
                                <React.Fragment key={dup}>
                                    <span><span className="accent-green">drafted</span> · reply to sarah · 2s ago</span>
                                    <span><span className="accent-purple">summarized</span> · newsletter digest · 4s ago</span>
                                    <span><span className="accent-green">scheduled</span> · send at 9:00 am · 7s ago</span>
                                    <span><span className="accent-purple">triaged</span> · 38 emails sorted · 12s ago</span>
                                    <span><span className="accent-green">archived</span> · 12 promos · 18s ago</span>
                                    <span><span className="accent-purple">followed up</span> · 3 stale threads · 22s ago</span>
                                    <span><span className="accent-green">unsubscribed</span> · 4 lists · 28s ago</span>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignIn;