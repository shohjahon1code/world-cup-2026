import { Trophy, Star, Crown, Sparkles } from "lucide-react";

type Props = {
  champion?: { team: string; flag: string | null } | null;
};

export function TrophyCenter({ champion }: Props) {
  if (champion) return <ChampionView champion={champion} />;
  return <PendingView />;
}

function PendingView() {
  return (
    <div className="relative grid place-items-center w-full">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.25),transparent_60%)] pointer-events-none" />
      <div className="relative flex flex-col items-center gap-3">
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-amber-400" fill="currentColor" />
          <Star className="h-4 w-4 text-amber-300" fill="currentColor" />
          <Star className="h-3 w-3 text-amber-400" fill="currentColor" />
        </div>
        <div className="relative grid place-items-center h-28 w-28 sm:h-32 sm:w-32 rounded-3xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 shadow-2xl ring-4 ring-amber-200/60 trophy-glow">
          <Trophy
            className="h-16 w-16 sm:h-20 sm:w-20 text-white drop-shadow-lg"
            fill="currentColor"
          />
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.35em] text-emerald-200/90 font-extrabold">
            FIFA World Cup
          </div>
          <div className="text-base font-extrabold text-white mt-0.5">2026</div>
          <div className="text-[10.5px] text-emerald-100/80 font-semibold mt-1.5">
            Chempion endi belgilanadi
          </div>
        </div>
      </div>
    </div>
  );
}

function ChampionView({ champion }: { champion: { team: string; flag: string | null } }) {
  return (
    <div className="relative grid place-items-center w-full px-4">
      {/* Confetti dots */}
      <Confetti />

      <div className="relative flex flex-col items-center gap-4">
        {/* Crown */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-amber-300" fill="currentColor" />
          <Crown className="h-7 w-7 text-yellow-300 drop-shadow-lg crown" fill="currentColor" />
          <Sparkles className="h-3 w-3 text-amber-300" fill="currentColor" />
        </div>

        {/* Trophy + flag combo */}
        <div className="relative grid place-items-center h-32 w-32 sm:h-36 sm:w-36 rounded-3xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 shadow-2xl ring-4 ring-amber-200/60 trophy-glow">
          <Trophy
            className="h-16 w-16 sm:h-20 sm:w-20 text-white drop-shadow-lg"
            fill="currentColor"
          />
          {/* Flag overlay badge */}
          <div className="absolute -bottom-3 -right-3 h-14 w-14 rounded-2xl bg-white shadow-xl ring-2 ring-amber-300 grid place-items-center text-3xl">
            {champion.flag ?? "🏆"}
          </div>
        </div>

        {/* Champion label */}
        <div className="text-center mt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-300 text-amber-900 text-[10px] uppercase tracking-[0.3em] font-extrabold shadow-md">
            <Crown className="h-3 w-3" fill="currentColor" />
            Chempion 2026
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-white drop-shadow-lg">
            {champion.team}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-emerald-200/80 font-extrabold">
            FIFA World Cup
          </div>
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  // 12 ta kichik nuqta — random pozitsiya, animatsiyasiz statik (sodda effekt)
  const dots = [
    { c: "bg-amber-300", t: "10%", l: "12%", s: "h-1.5 w-1.5" },
    { c: "bg-emerald-300", t: "18%", l: "82%", s: "h-2 w-2" },
    { c: "bg-yellow-300", t: "40%", l: "8%", s: "h-1 w-1" },
    { c: "bg-rose-300", t: "62%", l: "88%", s: "h-1.5 w-1.5" },
    { c: "bg-sky-300", t: "75%", l: "16%", s: "h-2 w-2" },
    { c: "bg-amber-200", t: "30%", l: "92%", s: "h-1 w-1" },
    { c: "bg-yellow-400", t: "85%", l: "75%", s: "h-1.5 w-1.5" },
    { c: "bg-emerald-400", t: "8%", l: "55%", s: "h-1 w-1" },
    { c: "bg-rose-400", t: "92%", l: "40%", s: "h-1.5 w-1.5" },
    { c: "bg-amber-400", t: "55%", l: "5%", s: "h-2 w-2" },
    { c: "bg-sky-400", t: "25%", l: "35%", s: "h-1 w-1" },
    { c: "bg-yellow-200", t: "70%", l: "60%", s: "h-1 w-1" },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none">
      {dots.map((d, i) => (
        <span
          key={i}
          className={`absolute rounded-full ${d.c} ${d.s} opacity-70`}
          style={{ top: d.t, left: d.l }}
        />
      ))}
    </div>
  );
}
