"use client";

import { useState } from "react";
import { ChevronRight, Flame, Swords, Medal, Trophy as TrophyIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { BracketMatch } from "./BracketMatch";
import { TrophyCenter } from "./TrophyCenter";
import type { SerializedMatch } from "@/lib/queries";
import type { RoundKey } from "@/lib/tournament";

type Props = {
  rounds: Record<RoundKey, SerializedMatch[]>;
  champion?: { team: string; flag: string | null } | null;
};

type Meta = {
  short: string;
  full: string;
  hint: string;
  icon: React.ReactNode;
  accent: string; // tailwind classes for accent bar / chip
  ring: string;
};

const META: Record<RoundKey, Meta> = {
  "Round of 32": {
    short: "1/16",
    full: "Round of 32",
    hint: "32 jamoa · pley-off boshlanishi",
    icon: <Flame className="h-3.5 w-3.5" />,
    accent: "bg-sky-500 text-white",
    ring: "ring-sky-200",
  },
  "Round of 16": {
    short: "1/8",
    full: "Round of 16",
    hint: "16 jamoa",
    icon: <Flame className="h-3.5 w-3.5" />,
    accent: "bg-indigo-500 text-white",
    ring: "ring-indigo-200",
  },
  "Quarter-final": {
    short: "1/4",
    full: "Chorak final",
    hint: "8 jamoa",
    icon: <Swords className="h-3.5 w-3.5" />,
    accent: "bg-violet-500 text-white",
    ring: "ring-violet-200",
  },
  "Semi-final": {
    short: "1/2",
    full: "Yarim final",
    hint: "4 jamoa",
    icon: <Medal className="h-3.5 w-3.5" />,
    accent: "bg-orange-500 text-white",
    ring: "ring-orange-200",
  },
  "Match for third place": {
    short: "3-o'rin",
    full: "3-o'rin uchun",
    hint: "Bronza medal",
    icon: <Medal className="h-3.5 w-3.5" />,
    accent: "bg-amber-600 text-white",
    ring: "ring-amber-200",
  },
  Final: {
    short: "Final",
    full: "Final",
    hint: "Chempion belgilanadi",
    icon: <TrophyIcon className="h-3.5 w-3.5" />,
    accent: "bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900",
    ring: "ring-amber-300",
  },
};

const TABS: RoundKey[] = [
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Final",
];

export function Bracket({ rounds, champion }: Props) {
  return (
    <div className="space-y-5">
      {/* Trophy hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 text-white shadow-xl py-8">
        <div className="absolute inset-0 pitch-stripes opacity-30 pointer-events-none" />
        <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />
        <TrophyCenter champion={champion} />
      </section>

      {/* Mobile: per-round tabs */}
      <div className="md:hidden">
        <MobileBracket rounds={rounds} />
      </div>

      {/* Desktop: side-by-side columns */}
      <div className="hidden md:block">
        <DesktopBracket rounds={rounds} />
      </div>
    </div>
  );
}

function MobileBracket({ rounds }: { rounds: Record<RoundKey, SerializedMatch[]> }) {
  const [active, setActive] = useState<RoundKey>(() => firstNonEmpty(rounds) ?? "Round of 32");
  const matches = rounds[active] ?? [];
  const thirdPlace = rounds["Match for third place"] ?? [];
  const meta = META[active];
  const finishedCount = matches.filter((m) => m.status === "FINISHED").length;

  return (
    <div className="space-y-3">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 px-2">
        {TABS.map((r, i) => {
          const isActive = r === active;
          const isDone = (rounds[r] ?? []).every((m) => m.status === "FINISHED") && (rounds[r] ?? []).length > 0;
          return (
            <div key={r} className="flex items-center gap-1.5">
              <button
                onClick={() => setActive(r)}
                aria-label={META[r].full}
                className={cn(
                  "h-2.5 rounded-full transition-all",
                  isActive ? "w-8 bg-emerald-600" : isDone ? "w-2.5 bg-emerald-400" : "w-2.5 bg-slate-200"
                )}
              />
              {i < TABS.length - 1 && (
                <ChevronRight className="h-3 w-3 text-slate-300" />
              )}
            </div>
          );
        })}
      </div>

      {/* Tab strip */}
      <div className="overflow-x-auto -mx-4 px-4 scrollbar-thin">
        <div className="inline-flex gap-1 rounded-2xl bg-slate-100 p-1 ring-1 ring-slate-200">
          {TABS.map((r) => {
            const cnt = rounds[r]?.length ?? 0;
            const isActive = r === active;
            return (
              <button
                key={r}
                onClick={() => setActive(r)}
                className={cn(
                  "px-3 h-9 rounded-xl text-[12px] font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5",
                  isActive
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <span className="hidden sm:inline">{META[r].icon}</span>
                {META[r].short}
                <span
                  className={cn(
                    "text-[9.5px] px-1 rounded font-bold",
                    isActive ? "bg-slate-200 text-slate-700" : "bg-slate-300/40 text-slate-500"
                  )}
                >
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Round header */}
      <div className="rounded-2xl bg-white border border-[var(--border)] overflow-hidden shadow-sm">
        <div className={cn("px-4 py-2.5 flex items-center gap-2.5", meta.accent)}>
          <span className="inline-grid place-items-center h-7 w-7 rounded-lg bg-white/25 backdrop-blur shrink-0">
            {meta.icon}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-[14px] leading-tight">{meta.full}</div>
            <div className="text-[10px] opacity-90 font-semibold mt-0.5">{meta.hint}</div>
          </div>
          {matches.length > 0 && (
            <div className="text-right">
              <div className="text-[16px] font-black tabular-nums leading-none">
                {finishedCount}<span className="opacity-60 text-[12px]">/{matches.length}</span>
              </div>
              <div className="text-[8.5px] uppercase tracking-wider font-extrabold opacity-80 mt-0.5">
                tugadi
              </div>
            </div>
          )}
        </div>

        <div className="p-3 space-y-2">
          {matches.length ? (
            matches.map((m) => (
              <BracketMatch
                key={m.id}
                match={m}
                isFinal={active === "Final"}
              />
            ))
          ) : (
            <div className="py-8 text-center text-sm text-slate-400">
              Hali ushbu bosqich o'yinlari yo'q
            </div>
          )}

          {active === "Final" && thirdPlace.length > 0 && (
            <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
              <div className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-amber-700 mb-2 px-1 flex items-center gap-1.5">
                <Medal className="h-3 w-3" />
                3-o'rin uchun
              </div>
              <div className="space-y-2">
                {thirdPlace.map((m) => (
                  <BracketMatch key={m.id} match={m} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DesktopBracket({ rounds }: { rounds: Record<RoundKey, SerializedMatch[]> }) {
  const cols: { key: RoundKey; matches: SerializedMatch[] }[] = TABS.map((k) => ({
    key: k,
    matches: rounds[k] ?? [],
  }));
  const thirdPlace = rounds["Match for third place"] ?? [];

  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-50 to-white border border-[var(--border)] p-5 overflow-x-auto shadow-sm">
      <div className="flex items-stretch gap-3 min-w-max">
        {cols.map((c, idx) => {
          const meta = META[c.key];
          const finishedCount = c.matches.filter((m) => m.status === "FINISHED").length;
          return (
            <div key={c.key} className="flex flex-col gap-3 w-[240px] flex-shrink-0">
              {/* Round header chip */}
              <div
                className={cn(
                  "rounded-2xl px-3 py-2 ring-1 shadow-sm",
                  meta.accent,
                  meta.ring
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-grid place-items-center h-7 w-7 rounded-lg bg-white/25 backdrop-blur shrink-0">
                    {meta.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-[13px] leading-tight">{meta.full}</div>
                    <div className="text-[9.5px] opacity-90 font-semibold mt-0.5">
                      {finishedCount}/{c.matches.length} tugadi
                    </div>
                  </div>
                </div>
              </div>

              {/* Matches */}
              <div
                className={cn(
                  "flex flex-col gap-2 justify-around flex-1",
                  c.key === "Final" && "justify-center"
                )}
              >
                {c.matches.length ? (
                  c.matches.map((m) => (
                    <BracketMatch
                      key={m.id}
                      match={m}
                      isFinal={c.key === "Final"}
                    />
                  ))
                ) : (
                  <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 py-10 text-center text-[11px] text-slate-400 font-bold">
                    Kutilmoqda
                  </div>
                )}

                {c.key === "Final" && thirdPlace.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dashed border-amber-300">
                    <div className="text-[9.5px] uppercase tracking-wider font-extrabold text-amber-700 mb-2 flex items-center gap-1.5 justify-center">
                      <Medal className="h-3 w-3" />
                      3-o'rin uchun
                    </div>
                    <div className="space-y-2">
                      {thirdPlace.map((m) => (
                        <BracketMatch key={m.id} match={m} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Arrow to next round */}
              {idx < cols.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2">
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function firstNonEmpty(
  rounds: Record<RoundKey, SerializedMatch[]>
): RoundKey | null {
  for (const r of TABS) {
    if ((rounds[r] ?? []).length > 0) return r;
  }
  return null;
}
