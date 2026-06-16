"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

type CopyMatch = {
  homeTeam: string;
  awayTeam: string;
  homeFlag?: string | null;
  awayFlag?: string | null;
  kickoff: string;
};

/**
 * Do'stlar uchun "taxmin shabloni" tugmasi. Bosilganda ertangi o'yinlar
 * ro'yxatini matn ko'rinishida clipboardga ko'chiradi — do'stlar uni
 * Telegram/WhatsApp'ga tashlab, har o'yin yoniga hisobni yozib,
 * adminga (Shohjahon) qaytarib yuboradi.
 */
export function CopyMatchesButton({
  matches,
  dateLabel,
  title = "Ertangi o'yinlar",
}: {
  matches: CopyMatch[];
  dateLabel: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  const buildText = () => {
    const header = `⚽ ${title} — ${dateLabel} (taxminlar)`;
    const lines = matches.map((m, i) => {
      const home = `${m.homeFlag ?? ""}${m.homeTeam}`.trim();
      const away = `${m.awayTeam}${m.awayFlag ?? ""}`.trim();
      return `${i + 1}. ${home} — ${away}: `;
    });
    return `${header}\n\n${lines.join("\n")}\n\nIsm: `;
  };

  const onCopy = async () => {
    const text = buildText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard API ishlamasa — eski usul
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
        copied
          ? "bg-emerald-600 text-white border-emerald-600"
          : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
      }`}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Nusxa olindi
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Taxmin shabloni
        </>
      )}
    </button>
  );
}
