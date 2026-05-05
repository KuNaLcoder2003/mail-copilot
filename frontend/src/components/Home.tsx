import type React from "react";
import { useEffect, useState, useRef } from "react";
import { getCompleteThread, getMails, sendDraftPrompt } from "../api";

export interface ChatMessage {
    id?: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp?: string;
}

interface DraftReplyChatModalProps {
    threadId: string;
    threadSubject: string;
    onClose: () => void;
    /** Optional: initial AI-generated draft to seed the conversation */
    initialDraft?: string;
}

/**
 * Mail Copilot — Home (Inbox)
 * Same design system as SignIn: dark canvas, Fraunces serif + Geist + JetBrains Mono,
 * lime + electric purple accents, gridlines, grain, drifting orbs.
 */

// ─────────── Types ───────────
interface Mail {
    id: string;
    from: string;
    to: string;
    user_id: string;
    body: string;
    html: string;
    intent: string;
    subject: string;
    time: string;
    mail_id: string;
    thread_id: string;
    cc: string;
    category: string;
}

interface User {
    id: string;
    email: string;
    name: string;
    created_at?: string;
    updated_at?: string;
}

// ─────────── Helpers ───────────
const parseFrom = (from: string): { name: string; email: string } => {
    const match = from.match(/^(.*?)\s*<(.+?)>\s*$/);
    if (match) {
        return {
            name: match[1].replace(/^"|"$/g, "").trim() || match[2],
            email: match[2],
        };
    }
    return { name: from, email: from };
};

const formatTime = (time: string): string => {
    const date = new Date(time);
    if (isNaN(date.getTime())) return "—";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);

    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffH < 24) return `${diffH}h ago`;
    if (diffD < 7) return `${diffD}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const initialsOf = (name: string): string => {
    const parts = name.replace(/[<>"]/g, "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const categoryStyle = (
    cat: string
): { fg: string; bg: string; border: string } => {
    switch (cat?.toUpperCase()) {
        case "PURCHASE":
            return {
                fg: "#A78BFA",
                bg: "rgba(167,139,250,0.10)",
                border: "rgba(167,139,250,0.30)",
            };
        case "COLLABORATION":
            return {
                fg: "#C5FF4A",
                bg: "rgba(197,255,74,0.08)",
                border: "rgba(197,255,74,0.28)",
            };
        case "PERSONAL":
            return {
                fg: "#FBBF77",
                bg: "rgba(251,191,119,0.08)",
                border: "rgba(251,191,119,0.28)",
            };
        default:
            return {
                fg: "#F5F2ED",
                bg: "rgba(245,242,237,0.05)",
                border: "rgba(245,242,237,0.15)",
            };
    }
};

// avatar background palette — deterministic by name
const avatarPalette = ["#A78BFA", "#C5FF4A", "#FBBF77", "#7DD3FC", "#F472B6"];
const avatarColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return avatarPalette[hash % avatarPalette.length];
};

// ─────────── Component ───────────
const Home: React.FC = () => {
    const [mails, setMails] = useState<Mail[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
    const [filter, setFilter] = useState<string>("ALL");
    const [isFullContextOpen, setFullContextOpen] = useState<boolean>(false)

    useEffect(() => {
        getMails()
            .then((data: any) => {
                console.log(data.data);
                setMails(data?.data?.mails ?? []);
                setUser(data?.data?.user ?? null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // close detail drawer on ESC
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSelectedMail(null);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const categories = Array.from(
        new Set(mails.map((m) => m.category).filter(Boolean))
    );

    const filteredMails =
        filter === "ALL" ? mails : mails.filter((m) => m.category === filter);

    const counts: Record<string, number> = mails.reduce((acc, m) => {
        acc[m.category] = (acc[m.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div
            className="relative min-h-screen w-full overflow-x-hidden"
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
          opacity: 0.06;
          mix-blend-mode: overlay;
        }

        .gridlines {
          background-image:
            linear-gradient(to right, rgba(245,242,237,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(245,242,237,0.04) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse at top, black 20%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse at top, black 20%, transparent 80%);
        }

        .orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(110px);
          pointer-events: none;
        }
        .orb-purple { background: #7C3AED; width: 420px; height: 420px; top: -160px; left: -120px; opacity: 0.40; animation: drift1 22s ease-in-out infinite alternate; }
        .orb-green  { background: #84F26A; width: 360px; height: 360px; top: 20%; right: -140px; opacity: 0.18; animation: drift2 28s ease-in-out infinite alternate; }

        @keyframes drift1 { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(60px, 60px) scale(1.08); } }
        @keyframes drift2 { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(-60px, 40px) scale(1.06); } }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reveal { opacity: 0; animation: fadeUp 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) forwards; }
        .d1 { animation-delay: 0.05s; }
        .d2 { animation-delay: 0.15s; }
        .d3 { animation-delay: 0.25s; }
        .d4 { animation-delay: 0.35s; }

        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(197,255,74,0.7); }
          50%      { box-shadow: 0 0 0 8px rgba(197,255,74,0); }
        }
        .pulse-dot { animation: pulse-dot 2s ease-out infinite; }

        .accent-green { color: #C5FF4A; }
        .accent-purple { color: #A78BFA; }
        .border-soft { border-color: rgba(245,242,237,0.08); }

        /* Inbox row */
        .mail-row {
          transition: background 0.18s ease, border-color 0.18s ease;
          border-bottom: 1px solid rgba(245,242,237,0.05);
        }
        .mail-row:hover {
          background: rgba(255,255,255,0.025);
        }
        .mail-row:hover .row-action {
          opacity: 1;
          transform: translateX(0);
        }
        .row-action {
          opacity: 0.5;
          transform: translateX(-4px);
          transition: all 0.2s ease;
        }

        /* Filter chip */
        .chip {
          transition: all 0.2s ease;
          border: 1px solid rgba(245,242,237,0.10);
          background: rgba(255,255,255,0.02);
        }
        .chip:hover { border-color: rgba(245,242,237,0.25); background: rgba(255,255,255,0.04); }
        .chip-active {
          background: #F5F2ED !important;
          color: #0A0B0F !important;
          border-color: #F5F2ED !important;
        }

        /* Detail drawer */
        @keyframes slideIn {
          from { transform: translateX(40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .drawer-backdrop { animation: fadeBackdrop 0.25s ease forwards; }
        .drawer-panel { animation: slideIn 0.32s cubic-bezier(0.2, 0.7, 0.2, 1) forwards; }

        /* Loading shimmer */
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.6s infinite linear;
        }

        /* Scrollbar inside drawer body */
        .body-scroll::-webkit-scrollbar { width: 6px; }
        .body-scroll::-webkit-scrollbar-track { background: transparent; }
        .body-scroll::-webkit-scrollbar-thumb { background: rgba(245,242,237,0.15); border-radius: 3px; }
        .body-scroll::-webkit-scrollbar-thumb:hover { background: rgba(245,242,237,0.25); }

        .table-head-cell {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(245,242,237,0.45);
          font-weight: 500;
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid rgba(245,242,237,0.10);
          white-space: nowrap;
        }
        .table-cell {
          padding: 16px;
          vertical-align: middle;
        }
      `}</style>

            {/* ─────────── Background layers ─────────── */}
            <div className="absolute inset-0 gridlines pointer-events-none" />
            <div className="orb orb-purple" />
            <div className="orb orb-green" />
            <div className="absolute inset-0 grain pointer-events-none" />

            {/* ─────────── Top bar ─────────── */}
            <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 lg:px-14 pt-7 pb-4">
                <div className="flex items-center gap-3 reveal d1">
                    <div
                        className="relative h-7 w-7 grid place-items-center rounded-md"
                        style={{
                            background: "linear-gradient(135deg, #C5FF4A 0%, #A78BFA 100%)",
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
                    <div className="flex items-center gap-2">
                        <span
                            className="h-1.5 w-1.5 rounded-full pulse-dot"
                            style={{ background: "#C5FF4A" }}
                        />
                        <span className="font-mono text-[10px] tracking-[0.25em] uppercase opacity-70">
                            Live · syncing
                        </span>
                    </div>
                    {user && (
                        <div className="flex items-center gap-2.5">
                            <div
                                className="h-7 w-7 rounded-full grid place-items-center text-[11px] font-medium"
                                style={{
                                    background: avatarColor(user.name || user.email),
                                    color: "#0A0B0F",
                                }}
                            >
                                {initialsOf(user.name || user.email)}
                            </div>
                            <div className="leading-tight text-right">
                                <div className="text-[12px]">{user.name}</div>
                                <div className="font-mono text-[9px] opacity-50">{user.email}</div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* ─────────── Main ─────────── */}
            <main className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 lg:px-14 pt-8 pb-20">
                {/* Greeting */}
                <section className="reveal d1 mb-10">
                    <p className="font-mono text-[10px] tracking-[0.28em] uppercase opacity-50 mb-3">
                        / Inbox · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                    </p>
                    <h1 className="font-serif-display text-[2.5rem] sm:text-[3.5rem] leading-[0.98] font-light">
                        Good to see you,{" "}
                        <span className="italic accent-purple">
                            {user?.name?.split(" ")[0] || "friend"}.
                        </span>
                    </h1>
                    <p
                        className="mt-4 text-base max-w-xl"
                        style={{ color: "rgba(245,242,237,0.60)" }}
                    >
                        {loading
                            ? "Pulling your latest threads…"
                            : `${mails.length} ${mails.length === 1 ? "thread" : "threads"} synced. Copilot has read, summarized, and triaged everything below.`}
                    </p>
                </section>

                {/* Stat strip */}
                <section className="reveal d2 grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                    <StatCard label="Total" value={mails.length} accent="#F5F2ED" />
                    <StatCard
                        label="Purchase"
                        value={counts["PURCHASE"] || 0}
                        accent="#A78BFA"
                    />
                    <StatCard
                        label="Collaboration"
                        value={counts["COLLABORATION"] || 0}
                        accent="#C5FF4A"
                    />
                    <StatCard
                        label="Other"
                        value={
                            mails.length -
                            (counts["PURCHASE"] || 0) -
                            (counts["COLLABORATION"] || 0)
                        }
                        accent="#FBBF77"
                    />
                </section>

                {/* Filter chips */}
                <section className="reveal d3 flex items-center gap-2 mb-5 flex-wrap">
                    <span className="font-mono text-[10px] tracking-[0.25em] uppercase opacity-40 mr-2">
                        Filter
                    </span>
                    <FilterChip
                        label="All"
                        active={filter === "ALL"}
                        onClick={() => setFilter("ALL")}
                        count={mails.length}
                    />
                    {categories.map((c) => (
                        <FilterChip
                            key={c}
                            label={c.toLowerCase()}
                            active={filter === c}
                            onClick={() => setFilter(c)}
                            count={counts[c] || 0}
                            accent={categoryStyle(c).fg}
                        />
                    ))}
                </section>

                {/* Inbox table */}
                <section
                    className="reveal d4 rounded-2xl overflow-hidden border"
                    style={{
                        background: "rgba(255,255,255,0.025)",
                        borderColor: "rgba(245,242,237,0.08)",
                        boxShadow: "0 30px 60px -30px rgba(0,0,0,0.6)",
                    }}
                >
                    {/* Table header strip */}
                    <div
                        className="flex items-center justify-between px-4 py-3"
                        style={{
                            background: "rgba(255,255,255,0.02)",
                            borderBottom: "1px solid rgba(245,242,237,0.06)",
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="#C5FF4A">
                                <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
                            </svg>
                            <span className="font-mono text-[10px] tracking-[0.22em] uppercase accent-green">
                                Triaged by Copilot
                            </span>
                        </div>
                        <span className="font-mono text-[10px] tracking-[0.22em] uppercase opacity-40">
                            {filteredMails.length} {filteredMails.length === 1 ? "thread" : "threads"}
                        </span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full" style={{ borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <th className="table-head-cell" style={{ width: "26%" }}>
                                        From
                                    </th>
                                    <th className="table-head-cell">Subject</th>
                                    <th className="table-head-cell" style={{ width: "140px" }}>
                                        Category
                                    </th>
                                    <th className="table-head-cell" style={{ width: "120px" }}>
                                        CC
                                    </th>
                                    <th className="table-head-cell" style={{ width: "90px" }}>
                                        Time
                                    </th>
                                    <th
                                        className="table-head-cell"
                                        style={{ width: "70px", textAlign: "right" }}
                                    >
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && <LoadingRows />}

                                {!loading && filteredMails.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="table-cell">
                                            <div className="text-center py-12">
                                                <p className="font-serif-display text-2xl italic accent-purple mb-2">
                                                    Inbox zero.
                                                </p>
                                                <p
                                                    className="text-sm"
                                                    style={{ color: "rgba(245,242,237,0.5)" }}
                                                >
                                                    Nothing in this view. Copilot will let you know when something arrives.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    filteredMails.map((mail) => {
                                        const sender = parseFrom(mail.from);
                                        const cat = categoryStyle(mail.category);
                                        return (
                                            <tr
                                                key={mail.id}
                                                className="mail-row cursor-pointer"
                                                onClick={() => setSelectedMail(mail)}
                                            >
                                                {/* From */}
                                                <td className="table-cell">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div
                                                            className="h-8 w-8 flex-none rounded-full grid place-items-center text-[11px] font-medium"
                                                            style={{
                                                                background: avatarColor(sender.name),
                                                                color: "#0A0B0F",
                                                            }}
                                                        >
                                                            {initialsOf(sender.name)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-[14px] truncate">
                                                                {sender.name}
                                                            </div>
                                                            <div className="font-mono text-[10px] opacity-50 truncate">
                                                                {sender.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Subject */}
                                                <td className="table-cell">
                                                    <div className="text-[14px] truncate max-w-[420px]">
                                                        {mail.subject || "(no subject)"}
                                                    </div>
                                                    {mail.intent && (
                                                        <div
                                                            className="text-[12px] truncate max-w-[420px] mt-0.5"
                                                            style={{ color: "rgba(245,242,237,0.45)" }}
                                                        >
                                                            {mail.intent}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Category */}
                                                <td className="table-cell">
                                                    <span
                                                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border font-mono text-[10px] tracking-[0.18em] uppercase"
                                                        style={{
                                                            background: cat.bg,
                                                            color: cat.fg,
                                                            borderColor: cat.border,
                                                        }}
                                                    >
                                                        <span
                                                            className="h-1 w-1 rounded-full"
                                                            style={{ background: cat.fg }}
                                                        />
                                                        {mail.category?.toLowerCase() || "—"}
                                                    </span>
                                                </td>

                                                {/* CC — placeholder column. Display logic intentionally left to caller. */}
                                                <td className="table-cell">
                                                    <div
                                                        className="font-mono text-[11px] opacity-50"
                                                        data-cc={mail.cc /* raw CC string available here */}
                                                    >
                                                        {/* TODO: render CC contents */}
                                                    </div>
                                                </td>

                                                {/* Time */}
                                                <td className="table-cell">
                                                    <div className="font-mono text-[11px] opacity-60">
                                                        {formatTime(mail.time)}
                                                    </div>
                                                </td>

                                                {/* Action */}
                                                <td className="table-cell" style={{ textAlign: "right" }}>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedMail(mail);
                                                        }}
                                                        className="row-action inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[10px] tracking-[0.18em] uppercase border"
                                                        style={{
                                                            background: "rgba(197,255,74,0.08)",
                                                            borderColor: "rgba(197,255,74,0.30)",
                                                            color: "#C5FF4A",
                                                        }}
                                                    >
                                                        View
                                                        <svg
                                                            width="10"
                                                            height="10"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                        >
                                                            <path
                                                                d="M5 12H19M19 12L13 6M19 12L13 18"
                                                                stroke="#C5FF4A"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {/* ─────────── Detail drawer ─────────── */}
            {selectedMail && !isFullContextOpen && (
                <DetailDrawer
                    setFullContext={setFullContextOpen}
                    mail={selectedMail}
                    onClose={() => setSelectedMail(null)}
                />
            )}
            {
                isFullContextOpen && <FullContextModal threadId={selectedMail.thread_id} onClose={setFullContextOpen} mail={selectedMail} />
            }
        </div>
    );
};

// ─────────── Sub-components ───────────

const StatCard: React.FC<{ label: string; value: number; accent: string }> = ({
    label,
    value,
    accent,
}) => (
    <div
        className="rounded-xl p-4 border"
        style={{
            background: "rgba(255,255,255,0.025)",
            borderColor: "rgba(245,242,237,0.08)",
        }}
    >
        <div className="flex items-baseline gap-1.5">
            <span className="font-serif-display text-3xl" style={{ color: accent }}>
                {value}
            </span>
        </div>
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase opacity-50 mt-1">
            {label}
        </div>
    </div>
);

const FilterChip: React.FC<{
    label: string;
    active: boolean;
    count: number;
    onClick: () => void;
    accent?: string;
}> = ({ label, active, count, onClick, accent }) => (
    <button
        type="button"
        onClick={onClick}
        className={`chip ${active ? "chip-active" : ""
            } inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-[10px] tracking-[0.2em] uppercase`}
        style={{ color: !active && accent ? accent : undefined }}
    >
        <span>{label}</span>
        <span className="opacity-60">{count}</span>
    </button>
);

const LoadingRows: React.FC = () => (
    <>
        {[1, 2, 3, 4].map((i) => (
            <tr
                key={i}
                style={{ borderBottom: "1px solid rgba(245,242,237,0.05)" }}
            >
                <td className="table-cell">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full shimmer" />
                        <div className="space-y-1.5 flex-1">
                            <div className="h-3 w-32 shimmer rounded" />
                            <div className="h-2.5 w-24 shimmer rounded" />
                        </div>
                    </div>
                </td>
                <td className="table-cell">
                    <div className="h-3 w-64 shimmer rounded" />
                </td>
                <td className="table-cell">
                    <div className="h-5 w-20 shimmer rounded-full" />
                </td>
                <td className="table-cell">
                    <div className="h-3 w-12 shimmer rounded" />
                </td>
                <td className="table-cell">
                    <div className="h-3 w-12 shimmer rounded" />
                </td>
                <td className="table-cell">
                    <div className="h-6 w-14 shimmer rounded ml-auto" />
                </td>
            </tr>
        ))}
    </>
);

const DetailDrawer: React.FC<{ mail: Mail; onClose: () => void, setFullContext: React.Dispatch<React.SetStateAction<boolean>> }> = ({
    mail,
    onClose,
    setFullContext
}) => {
    const sender = parseFrom(mail.from);
    const cat = categoryStyle(mail.category);

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="drawer-backdrop absolute inset-0"
                style={{ background: "rgba(10,11,15,0.7)", backdropFilter: "blur(4px)" }}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className="drawer-panel relative h-full w-full sm:max-w-[640px] flex flex-col"
                style={{
                    background: "#0F1015",
                    borderLeft: "1px solid rgba(245,242,237,0.08)",
                    boxShadow: "-30px 0 60px -20px rgba(0,0,0,0.7)",
                }}
            >
                {/* Drawer header */}
                <div
                    className="flex items-center justify-between px-7 py-5"
                    style={{ borderBottom: "1px solid rgba(245,242,237,0.06)" }}
                >
                    <div className="flex items-center gap-2">
                        <span
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border font-mono text-[10px] tracking-[0.18em] uppercase"
                            style={{
                                background: cat.bg,
                                color: cat.fg,
                                borderColor: cat.border,
                            }}
                        >
                            <span
                                className="h-1 w-1 rounded-full"
                                style={{ background: cat.fg }}
                            />
                            {mail.category?.toLowerCase() || "uncategorized"}
                        </span>
                        <span className="font-mono text-[10px] tracking-[0.22em] uppercase opacity-40">
                            · Thread {mail.thread_id?.slice(0, 8) || mail.id.slice(0, 8)}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/5 transition-colors"
                        aria-label="Close"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M6 6L18 18M6 18L18 6"
                                stroke="#F5F2ED"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>

                {/* Drawer body — scrollable */}
                <div className="body-scroll flex-1 overflow-y-auto px-7 py-6">
                    {/* Subject */}
                    <h2 className="font-serif-display text-[2rem] leading-tight font-light mb-5">
                        {mail.subject || "(no subject)"}
                    </h2>

                    {/* Sender block */}
                    <div className="flex items-start gap-3 mb-6">
                        <div
                            className="h-10 w-10 flex-none rounded-full grid place-items-center text-[13px] font-medium"
                            style={{
                                background: avatarColor(sender.name),
                                color: "#0A0B0F",
                            }}
                        >
                            {initialsOf(sender.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[14px]">{sender.name}</div>
                            <div className="font-mono text-[11px] opacity-55 truncate">
                                {sender.email}
                            </div>
                            <div className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-40 mt-1">
                                {new Date(mail.time).toLocaleString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Meta grid: To / CC */}
                    <div
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-4 rounded-xl border"
                        style={{
                            background: "rgba(255,255,255,0.02)",
                            borderColor: "rgba(245,242,237,0.06)",
                        }}
                    >
                        <MetaField label="To" value={mail.to} />
                        {/* CC — placeholder; render logic intentionally left to caller */}
                        <div>
                            <div className="font-mono text-[9px] tracking-[0.22em] uppercase opacity-40 mb-1">
                                CC
                            </div>
                            <div
                                className="text-[12px] opacity-50 break-words"
                                data-cc={mail.cc}
                            >
                                {/* TODO: render CC contents */}
                            </div>
                        </div>
                    </div>

                    {/* Copilot summary box — same accent treatment as the SignIn preview */}
                    {mail.intent && (
                        <div
                            className="rounded-xl p-4 mb-6 border"
                            style={{
                                background: "rgba(197,255,74,0.06)",
                                borderColor: "rgba(197,255,74,0.22)",
                            }}
                        >
                            <div className="flex items-center gap-1.5 mb-2">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="#C5FF4A">
                                    <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
                                </svg>
                                <span className="font-mono text-[9px] tracking-[0.22em] uppercase accent-green">
                                    Copilot summary
                                </span>
                            </div>
                            <p
                                className="text-[14px] leading-relaxed"
                                style={{ color: "rgba(245,242,237,0.88)" }}
                            >
                                {mail.intent}
                            </p>
                        </div>
                    )}

                    {/* Body */}
                    <div className="mb-2 font-mono text-[9px] tracking-[0.22em] uppercase opacity-40">
                        Message body
                    </div>
                    <div
                        className="rounded-xl p-5 border whitespace-pre-wrap text-[13px] leading-relaxed"
                        style={{
                            background: "rgba(255,255,255,0.02)",
                            borderColor: "rgba(245,242,237,0.06)",
                            color: "rgba(245,242,237,0.85)",
                            fontFamily: "'Geist', system-ui, sans-serif",
                            maxHeight: "none",
                            wordBreak: "break-word",
                        }}
                    >
                        {mail.body?.trim() || (
                            <span className="opacity-50 italic">
                                (No plain-text body available — this email is HTML-only.)
                            </span>
                        )}
                    </div>
                </div>

                {/* Drawer action footer */}
                <div
                    className="flex items-center gap-2 px-7 py-4"
                    style={{
                        borderTop: "1px solid rgba(245,242,237,0.06)",
                        background: "rgba(255,255,255,0.015)",
                    }}
                >
                    <button
                        type="button"
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg font-mono text-[11px] tracking-[0.18em] uppercase"
                        style={{ background: "#C5FF4A", color: "#0A0B0F" }}
                    >
                        Draft reply
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            console.log('Clicked')
                            // onClose()
                            setFullContext(true)
                        }}
                        className="px-4 py-2.5 rounded-lg font-mono text-[11px] tracking-[0.18em] uppercase border bg-red-500 text-white font-bold cursor-pointer"
                        style={{
                            borderColor: "rgba(245,242,237,0.15)",
                            color: "rgba(245,242,237,0.7)",
                        }}
                    >
                        Get Thread Context
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2.5 rounded-lg font-mono text-[11px] tracking-[0.18em] uppercase border bg-blue-500 text-white font-bold cursor-pointer"
                        style={{
                            borderColor: "rgba(245,242,237,0.15)",
                            color: "rgba(245,242,237,0.7)",
                        }}
                    >
                        Generate Thread Context
                    </button>
                </div>
            </div>
        </div>
    );
};

export const FullContextModal: React.FC<{
    threadId: string;
    onClose: React.Dispatch<React.SetStateAction<boolean>>;
    mail: Mail;
}> = ({ threadId, onClose, mail }) => {
    const cat = categoryStyle(mail.category);

    const [mails, setMails] = useState<Mail[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [threadContext, setThreadContext] = useState<{ id: string, thread_id: string, user_id: string, context: string } | null>(null);
    const [chatOpen, setChatOpen] = useState<boolean>(false);


    useEffect(() => {
        setIsLoading(true);
        getCompleteThread(threadId)
            .then(
                (data: {
                    data: { valid: boolean; mails: Mail[]; thread_context: { id: string, thread_id: string, user_id: string, context: string } };
                }) => {
                    if (data.data.valid) {
                        setMails(data.data.mails);
                        setThreadContext(data.data.thread_context);
                    } else {
                        setMails([]);
                        setThreadContext(null);
                    }
                    setIsLoading(false);
                }
            )
            .catch(() => {
                setMails([]);
                setThreadContext(null);
                setIsLoading(false);
            });
    }, [threadId]);

    // ESC to close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose(false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    // Sort chronologically — oldest first, latest at bottom (natural reading order)
    const sortedMails = [...mails].sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    return (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center">
            {/* Backdrop */}
            <div
                style={{
                    background: "rgba(10,11,15,0.75)",
                    backdropFilter: "blur(6px)",
                }}
                onClick={() => onClose(false)}
                className="drawer-backdrop absolute inset-0"
            />

            {/* Modal panel — full-height, centered, max-w-5xl */}
            <div
                className="drawer-panel relative h-full w-full max-w-5xl flex flex-col"
                style={{
                    background: "#0F1015",
                    borderLeft: "1px solid rgba(245,242,237,0.08)",
                    borderRight: "1px solid rgba(245,242,237,0.08)",
                    boxShadow: "0 0 80px -10px rgba(0,0,0,0.85)",
                }}
            >
                {/* ─── Header ─── */}
                <div
                    className="flex items-center justify-between px-7 py-5 flex-none"
                    style={{ borderBottom: "1px solid rgba(245,242,237,0.06)" }}
                >
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border font-mono text-[10px] tracking-[0.18em] uppercase flex-none"
                            style={{
                                background: cat.bg,
                                color: cat.fg,
                                borderColor: cat.border,
                            }}
                        >
                            <span
                                className="h-1 w-1 rounded-full"
                                style={{ background: cat.fg }}
                            />
                            {mail.category?.toLowerCase() || "uncategorized"}
                        </span>
                        <span className="font-mono text-[10px] tracking-[0.22em] uppercase opacity-40">
                            · Thread {mail.thread_id?.slice(0, 10) || mail.id.slice(0, 10)}
                        </span>
                        {!isLoading && sortedMails.length > 0 && (
                            <span className="font-mono text-[10px] tracking-[0.22em] uppercase opacity-40">
                                · {sortedMails.length}{" "}
                                {sortedMails.length === 1 ? "msg" : "msgs"}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => onClose(false)}
                        className="h-8 w-8 flex-none grid place-items-center rounded-md hover:bg-white/5 transition-colors"
                        aria-label="Close"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M6 6L18 18M6 18L18 6"
                                stroke="#F5F2ED"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>

                {/* ─── Body (scrollable) ─── */}
                <div className="body-scroll flex-1 overflow-y-auto px-7 py-7">
                    {/* Subject */}
                    <p className="font-mono text-[10px] tracking-[0.28em] uppercase opacity-50 mb-3">
                        / Full thread context
                    </p>
                    <h2 className="font-serif-display text-[2rem] sm:text-[2.5rem] leading-[1.05] font-light mb-8">
                        {mail.subject || "(no subject)"}
                    </h2>

                    {/* Thread-level Copilot summary */}
                    {isLoading && (
                        <div
                            className="rounded-xl p-5 mb-8 border space-y-2"
                            style={{
                                background: "rgba(197,255,74,0.04)",
                                borderColor: "rgba(197,255,74,0.18)",
                            }}
                        >
                            <div className="h-3 w-40 shimmer rounded" />
                            <div className="h-3 w-full shimmer rounded" />
                            <div className="h-3 w-3/4 shimmer rounded" />
                        </div>
                    )}

                    {!isLoading && threadContext && (
                        <div
                            className="rounded-xl p-5 mb-8 border"
                            style={{
                                background: "rgba(197,255,74,0.06)",
                                borderColor: "rgba(197,255,74,0.22)",
                            }}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#C5FF4A">
                                    <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
                                </svg>
                                <span className="font-mono text-[10px] tracking-[0.22em] uppercase accent-green">
                                    Copilot · thread context
                                </span>
                            </div>
                            <p
                                className="text-[14px] leading-relaxed"
                                style={{ color: "rgba(245,242,237,0.88)" }}
                            >
                                {threadContext.context}
                            </p>
                        </div>
                    )}

                    {/* Conversation header */}
                    <div className="flex items-center gap-3 mb-5">
                        <span className="font-mono text-[10px] tracking-[0.25em] uppercase opacity-50">
                            Conversation
                        </span>
                        <span
                            className="flex-1 h-px"
                            style={{ background: "rgba(245,242,237,0.08)" }}
                        />
                    </div>

                    {/* Loading state for messages */}
                    {isLoading && (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="rounded-xl p-5 border space-y-3"
                                    style={{
                                        background: "rgba(255,255,255,0.02)",
                                        borderColor: "rgba(245,242,237,0.06)",
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full shimmer" />
                                        <div className="space-y-1.5 flex-1">
                                            <div className="h-3 w-32 shimmer rounded" />
                                            <div className="h-2.5 w-48 shimmer rounded" />
                                        </div>
                                    </div>
                                    <div className="h-3 w-full shimmer rounded" />
                                    <div className="h-3 w-5/6 shimmer rounded" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && sortedMails.length === 0 && (
                        <div
                            className="rounded-xl p-12 border text-center"
                            style={{
                                background: "rgba(255,255,255,0.02)",
                                borderColor: "rgba(245,242,237,0.06)",
                            }}
                        >
                            <p className="font-serif-display text-2xl italic accent-purple mb-2">
                                No thread found.
                            </p>
                            <p
                                className="text-sm"
                                style={{ color: "rgba(245,242,237,0.5)" }}
                            >
                                Couldn't load the conversation — try again in a moment.
                            </p>
                        </div>
                    )}

                    {/* Conversation timeline */}
                    {!isLoading && sortedMails.length > 0 && (
                        <div className="relative">
                            {/* vertical rail */}
                            <div
                                className="absolute left-5 top-5 bottom-5 w-px hidden sm:block"
                                style={{ background: "rgba(245,242,237,0.08)" }}
                            />

                            <div className="space-y-4">
                                {sortedMails.map((m, idx) => {
                                    const sender = parseFrom(m.from);
                                    const isLatest = idx === sortedMails.length - 1;

                                    return (
                                        <article
                                            key={m.id}
                                            className="relative rounded-xl p-5 border sm:ml-12"
                                            style={{
                                                background: isLatest
                                                    ? "rgba(167,139,250,0.04)"
                                                    : "rgba(255,255,255,0.02)",
                                                borderColor: isLatest
                                                    ? "rgba(167,139,250,0.20)"
                                                    : "rgba(245,242,237,0.06)",
                                            }}
                                        >
                                            {/* timeline dot */}
                                            <div
                                                className="absolute -left-7 top-7 h-3 w-3 rounded-full hidden sm:block"
                                                style={{
                                                    background: isLatest ? "#A78BFA" : "#3a3b40",
                                                    boxShadow: isLatest
                                                        ? "0 0 0 4px rgba(167,139,250,0.18)"
                                                        : "0 0 0 4px #0F1015",
                                                }}
                                            />

                                            {/* sender row */}
                                            <div className="flex items-start gap-3 mb-4">
                                                <div
                                                    className="h-10 w-10 flex-none rounded-full grid place-items-center text-[13px] font-medium"
                                                    style={{
                                                        background: avatarColor(sender.name),
                                                        color: "#0A0B0F",
                                                    }}
                                                >
                                                    {initialsOf(sender.name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[14px]">{sender.name}</span>
                                                        {isLatest && (
                                                            <span
                                                                className="font-mono text-[9px] tracking-[0.22em] uppercase px-1.5 py-0.5 rounded"
                                                                style={{
                                                                    background: "rgba(167,139,250,0.14)",
                                                                    color: "#A78BFA",
                                                                }}
                                                            >
                                                                Latest
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="font-mono text-[11px] opacity-55 truncate">
                                                        {sender.email}
                                                    </div>
                                                    <div className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-40 mt-0.5">
                                                        {new Date(m.time).toLocaleString("en-US", {
                                                            weekday: "short",
                                                            month: "short",
                                                            day: "numeric",
                                                            hour: "numeric",
                                                            minute: "2-digit",
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* To / CC meta */}
                                            <div
                                                className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3 rounded-lg border"
                                                style={{
                                                    background: "rgba(0,0,0,0.20)",
                                                    borderColor: "rgba(245,242,237,0.05)",
                                                }}
                                            >
                                                <div>
                                                    <div className="font-mono text-[9px] tracking-[0.22em] uppercase opacity-40 mb-1">
                                                        To
                                                    </div>
                                                    <div className="text-[11px] opacity-80 break-words">
                                                        {m.to || "—"}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-mono text-[9px] tracking-[0.22em] uppercase opacity-40 mb-1">
                                                        CC
                                                    </div>
                                                    <div
                                                        className="text-[11px] opacity-50 break-words"
                                                        data-cc={m.cc}
                                                    >
                                                        {/* TODO: render CC contents */}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Per-mail Copilot summary */}
                                            {m.intent && (
                                                <div
                                                    className="rounded-lg p-3 mb-4 border"
                                                    style={{
                                                        background: "rgba(197,255,74,0.05)",
                                                        borderColor: "rgba(197,255,74,0.18)",
                                                    }}
                                                >
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <svg
                                                            width="10"
                                                            height="10"
                                                            viewBox="0 0 24 24"
                                                            fill="#C5FF4A"
                                                        >
                                                            <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
                                                        </svg>
                                                        <span className="font-mono text-[9px] tracking-[0.22em] uppercase accent-green">
                                                            Summary
                                                        </span>
                                                    </div>
                                                    <p
                                                        className="text-[12px] leading-relaxed"
                                                        style={{ color: "rgba(245,242,237,0.85)" }}
                                                    >
                                                        {m.intent}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Body */}
                                            {m.body?.trim() ? (
                                                <div
                                                    className="text-[13px] leading-relaxed whitespace-pre-wrap"
                                                    style={{
                                                        color: "rgba(245,242,237,0.82)",
                                                        wordBreak: "break-word",
                                                    }}
                                                >
                                                    {m.body.trim()}
                                                </div>
                                            ) : (
                                                <div className="text-[12px] italic opacity-40">
                                                    (No plain-text body — HTML-only message.)
                                                </div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Footer ─── */}
                <div
                    className="flex items-center gap-2 px-7 py-4 flex-none"
                    style={{
                        borderTop: "1px solid rgba(245,242,237,0.06)",
                        background: "rgba(255,255,255,0.015)",
                    }}
                >
                    <button
                        onClick={() => setChatOpen(true)}
                        type="button"
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg font-mono text-[11px] tracking-[0.18em] uppercase"
                        style={{ background: "#C5FF4A", color: "#0A0B0F" }}
                    >
                        Draft reply to thread
                    </button>
                    <button
                        type="button"
                        onClick={() => onClose(false)}
                        className="px-4 py-2.5 rounded-lg font-mono text-[11px] tracking-[0.18em] uppercase border"
                        style={{
                            borderColor: "rgba(245,242,237,0.15)",
                            color: "rgba(245,242,237,0.7)",
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
            {chatOpen && (
                <DraftReplyChatModal
                    threadId={threadId}
                    threadSubject={mail.subject}
                    initialDraft="" // optional pre-generated draft
                    onClose={() => setChatOpen(false)}
                />
            )}
        </div>
    );
};

const MetaField: React.FC<{ label: string; value: string }> = ({
    label,
    value,
}) => (
    <div>
        <div className="font-mono text-[9px] tracking-[0.22em] uppercase opacity-40 mb-1">
            {label}
        </div>
        <div className="text-[12px] opacity-80 break-words">{value || "—"}</div>
    </div>
);


const DraftReplyChatModal: React.FC<DraftReplyChatModalProps> = ({
    threadId,
    threadSubject,
    onClose,
    initialDraft = "",
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>(() =>
        initialDraft
            ? [
                {
                    role: "assistant",
                    content:
                        "Here's a first draft based on the full thread. Tell me what to change — tone, length, specific wording, anything.",
                },
            ]
            : [
                {
                    role: "assistant",
                    content:
                        "Ready when you are. Describe how you'd like to reply — formal, casual, push back, ask for clarification — and I'll draft it.",
                },
            ]
    );
    const [draft, setDraft] = useState<string>(initialDraft);
    const [input, setInput] = useState<string>("");
    const [isSending, setIsSending] = useState<boolean>(false);

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);

    // Autofocus input on open
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // ESC closes
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    // Auto-scroll to bottom when messages or sending state changes
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [messages, isSending]);

    // Auto-resize textarea up to a max
    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 140) + "px";
    }, [input]);

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || isSending) return;

        const userMsg: ChatMessage = {
            role: "user",
            content: trimmed,
            timestamp: new Date().toISOString(),
        };

        // Optimistic update: show user message + reset input + flag sending
        const nextMessages = [...messages, userMsg];
        setMessages(nextMessages);
        setInput("");
        setIsSending(true);

        try {
            const response: any = await sendDraftPrompt(
                { thread_id: threadId, user_prompt: userMsg.content }
            );

            // Backend returns the canonical messages array — replace local state with it
            const serverMessages: ChatMessage[] | undefined =
                [...messages, userMsg, response?.data?.message];
            const serverDraft: string | undefined = response?.data?.draft;

            console.log('Server Messages is : ', serverMessages)

            if (Array.isArray(serverMessages)) {
                console.log(serverMessages)
                setMessages(serverMessages);
            }
            if (typeof serverDraft === "string") {
                setDraft(serverDraft);
            }
        } catch (err) {
            console.error("Draft prompt failed:", err);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        "Hmm, that didn't go through. Try again — and if it keeps happening, the connection's probably hiccupping.",
                },
            ]);
        } finally {
            setIsSending(false);
            // Refocus input for next prompt
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter sends, Shift+Enter inserts newline
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Filter out system messages from display (still kept in state for backend)
    const visibleMessages = messages.filter((m) => m.role !== "system");

    return (
        <div className="fixed inset-0 z-[60] flex items-stretch justify-center">
            {/* Backdrop */}
            <div
                className="drawer-backdrop absolute inset-0"
                style={{
                    background: "rgba(10,11,15,0.78)",
                    backdropFilter: "blur(8px)",
                }}
                onClick={onClose}
            />

            {/* Inline styles for animations specific to this modal */}
            <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg-in { animation: msgIn 0.3s cubic-bezier(0.2,0.7,0.2,1) forwards; }
 
        @keyframes thinkingBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .think-dot {
          display: inline-block;
          width: 6px; height: 6px; border-radius: 9999px;
          background: #A78BFA;
          animation: thinkingBounce 1.4s infinite ease-in-out both;
        }
        .think-dot:nth-child(1) { animation-delay: -0.32s; }
        .think-dot:nth-child(2) { animation-delay: -0.16s; }
 
        .chat-scroll::-webkit-scrollbar { width: 6px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(245,242,237,0.15); border-radius: 3px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(245,242,237,0.25); }
 
        .chat-input::placeholder { color: rgba(245,242,237,0.35); }
        .chat-input:focus { outline: none; }
 
        @keyframes chatModalIn {
          from { transform: translateY(20px) scale(0.98); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        .chat-modal-panel { animation: chatModalIn 0.3s cubic-bezier(0.2,0.7,0.2,1) forwards; }
 
        .send-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px -8px rgba(197,255,74,0.4);
        }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .send-btn { transition: all 0.18s ease; }
      `}</style>

            {/* Panel — slightly narrower than thread modal so it feels like a focused tool */}
            <div
                className="chat-modal-panel relative h-full w-full max-w-3xl flex flex-col my-0"
                style={{
                    background: "#0F1015",
                    borderLeft: "1px solid rgba(245,242,237,0.08)",
                    borderRight: "1px solid rgba(245,242,237,0.08)",
                    boxShadow: "0 0 80px -10px rgba(0,0,0,0.85)",
                }}
            >
                {/* ─── Header ─── */}
                <div
                    className="flex items-center justify-between px-7 py-5 flex-none"
                    style={{ borderBottom: "1px solid rgba(245,242,237,0.06)" }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className="h-8 w-8 flex-none grid place-items-center rounded-md"
                            style={{
                                background:
                                    "linear-gradient(135deg, #C5FF4A 0%, #A78BFA 100%)",
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M12 2L4 7L12 12L20 7L12 2Z M4 17L12 22L20 17 M4 12L12 17L20 12"
                                    stroke="#0A0B0F"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="font-mono text-[9px] tracking-[0.28em] uppercase opacity-50">
                                / Drafting reply
                            </p>
                            <p className="text-[14px] truncate">
                                <span className="italic" style={{ fontFamily: "'Fraunces', serif", color: "#A78BFA" }}>
                                    Re:
                                </span>{" "}
                                <span className="opacity-90">
                                    {threadSubject || "(no subject)"}
                                </span>
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 w-8 flex-none grid place-items-center rounded-md hover:bg-white/5 transition-colors"
                        aria-label="Close"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M6 6L18 18M6 18L18 6"
                                stroke="#F5F2ED"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>

                {/* ─── Live Draft Preview (top) ─── */}
                {draft && (
                    <div
                        className="flex-none px-7 pt-5 pb-4"
                        style={{
                            borderBottom: "1px solid rgba(245,242,237,0.06)",
                            background: "rgba(255,255,255,0.015)",
                        }}
                    >
                        <div className="flex items-center gap-2 mb-2.5">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="#C5FF4A">
                                <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
                            </svg>
                            <span
                                className="font-mono text-[9px] tracking-[0.22em] uppercase"
                                style={{ color: "#C5FF4A" }}
                            >
                                Current draft
                            </span>
                            <span className="flex-1 h-px" style={{ background: "rgba(245,242,237,0.06)" }} />
                            <button
                                type="button"
                                onClick={() => navigator.clipboard?.writeText(draft)}
                                className="font-mono text-[9px] tracking-[0.22em] uppercase opacity-50 hover:opacity-100 transition-opacity"
                            >
                                Copy
                            </button>
                        </div>
                        <div
                            className="rounded-lg p-4 max-h-[160px] overflow-y-auto chat-scroll text-[13px] leading-relaxed whitespace-pre-wrap"
                            style={{
                                background: "rgba(197,255,74,0.05)",
                                border: "1px solid rgba(197,255,74,0.18)",
                                color: "rgba(245,242,237,0.92)",
                                fontFamily: "'Geist', system-ui, sans-serif",
                            }}
                        >
                            {draft}
                        </div>
                    </div>
                )}

                {/* ─── Chat scroll area ─── */}
                <div
                    ref={scrollRef}
                    className="chat-scroll flex-1 overflow-y-auto px-7 py-6"
                >
                    <div className="space-y-4">
                        {visibleMessages.map((m, idx) => (
                            <ChatBubble key={m.id || `${m.role}-${idx}`} message={m} />
                        ))}

                        {/* Thinking indicator */}
                        {isSending && (
                            <div className="msg-in flex justify-start">
                                <div className="flex items-end gap-2 max-w-[85%]">
                                    <div
                                        className="h-7 w-7 flex-none rounded-full grid place-items-center"
                                        style={{
                                            background: "linear-gradient(135deg, #C5FF4A 0%, #A78BFA 100%)",
                                        }}
                                    >
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#0A0B0F">
                                            <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
                                        </svg>
                                    </div>
                                    <div
                                        className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1"
                                        style={{
                                            background: "rgba(167,139,250,0.10)",
                                            border: "1px solid rgba(167,139,250,0.22)",
                                        }}
                                    >
                                        <span className="think-dot" />
                                        <span className="think-dot" />
                                        <span className="think-dot" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Input bar ─── */}
                <div
                    className="flex-none px-7 py-4"
                    style={{
                        borderTop: "1px solid rgba(245,242,237,0.06)",
                        background: "rgba(255,255,255,0.015)",
                    }}
                >
                    <div
                        className="flex items-end gap-3 rounded-xl p-3 border"
                        style={{
                            background: "rgba(0,0,0,0.30)",
                            borderColor: "rgba(245,242,237,0.10)",
                        }}
                    >
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            disabled={isSending}
                            placeholder="Tell Copilot how to tailor the reply… (e.g. “make it more apologetic”, “shorter”, “push back politely”)"
                            className="chat-input flex-1 bg-transparent border-none resize-none text-[14px] leading-relaxed"
                            style={{
                                color: "#F5F2ED",
                                fontFamily: "'Geist', system-ui, sans-serif",
                                minHeight: "24px",
                                maxHeight: "140px",
                            }}
                        />
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={!input.trim() || isSending}
                            className="send-btn flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-mono text-[11px] tracking-[0.18em] uppercase"
                            style={{
                                background: "#C5FF4A",
                                color: "#0A0B0F",
                            }}
                        >
                            Send
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M5 12H19M19 12L13 6M19 12L13 18"
                                    stroke="#0A0B0F"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Footer hint row */}
                    <div className="flex items-center justify-between mt-3 px-1">
                        <span className="font-mono text-[9px] tracking-[0.22em] uppercase opacity-40">
                            Enter to send · Shift + Enter for newline
                        </span>
                        {draft && (
                            <button
                                type="button"
                                className="font-mono text-[9px] tracking-[0.22em] uppercase opacity-70 hover:opacity-100 transition-opacity"
                                style={{ color: "#C5FF4A" }}
                            >
                                Use this draft →
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────── Chat bubble ───────────
const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === "user";

    if (isUser) {
        return (
            <div className="msg-in flex justify-end">
                <div className="flex items-end gap-2 max-w-[85%] flex-row-reverse">
                    {/* User pill — no avatar; use a small lime tag */}
                    <div
                        className="rounded-2xl rounded-br-sm px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap"
                        style={{
                            background: "#C5FF4A",
                            color: "#0A0B0F",
                            wordBreak: "break-word",
                            fontFamily: "'Geist', system-ui, sans-serif",
                        }}
                    >
                        {message.content}
                    </div>
                </div>
            </div>
        );
    }

    // Assistant
    return (
        <div className="msg-in flex justify-start">
            <div className="flex items-end gap-2 max-w-[85%]">
                <div
                    className="h-7 w-7 flex-none rounded-full grid place-items-center"
                    style={{
                        background: "linear-gradient(135deg, #C5FF4A 0%, #A78BFA 100%)",
                    }}
                >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#0A0B0F">
                        <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
                    </svg>
                </div>
                <div
                    className="rounded-2xl rounded-bl-sm px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap"
                    style={{
                        background: "rgba(167,139,250,0.10)",
                        border: "1px solid rgba(167,139,250,0.22)",
                        color: "rgba(245,242,237,0.92)",
                        wordBreak: "break-word",
                        fontFamily: "'Geist', system-ui, sans-serif",
                    }}
                >
                    {message.content}
                </div>
            </div>
        </div>
    );
};

export default Home;