/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { BookOpen, Scale, Award, Info, Book, Archive, HelpCircle } from "lucide-react";

interface TopicCard {
  title: string;
  arabicTitle: string;
  icon: any;
  color: string;
  summary: string;
  bullets: string[];
}

export default function EducationalCards() {
  const [activeTopic, setActiveTopic] = useState<number | null>(0);

  const topics: TopicCard[] = [
    {
      title: "Classification of Heirs",
      arabicTitle: "أصناف الورثة",
      icon: Scale,
      color: "emerald",
      summary: "Under Sharia jurisprudence, relatives are prioritized into three distinct tiers to determine distribution sequence:",
      bullets: [
        "**Zawil Furud (Quranic Sharers)**: The 12 heirs explicitly prescribed fixed fractional portions in the Quran (1/2, 1/4, 1/8, 2/3, 1/3, 1/6). They must be settled first (e.g., Spouses, Parents, Daughters).",
        "**Al-Asabah (Residuaries)**: Heirs who receive whatever remains of the estate (residue) after the Quranic Sharers take their shares. If no sharers exist, they take 100% (e.g., Sons, Full Brothers).",
        "**Zawil Arham (Distant Kin)**: Blood relatives not belonging to Quranic Sharers or Residuaries (e.g., Maternal aunts, nieces, grandchildren through daughters). They only inherit if there are absolutely no heirs in the top two tiers."
      ]
    },
    {
      title: "The Law of Exclusions",
      arabicTitle: "باب الحجب",
      icon: Book,
      color: "amber",
      summary: "Al-Hajb governs how closer relative links completely block (Hajb Hirman) or partially reduce (Hajb Nuqsan) deeper family branches:",
      bullets: [
        "**Impenetrable Heirs**: Five heirs cannot be excluded under any circumstances: Husband, Wife, Father, Mother, Son, and Daughter.",
        "**Lineal Blockers**: Sons completely exclude grandsons, granddaughters, brothers, sisters, and uncles.",
        "**Ascendant Blockers**: The Father completely excludes grandfather, paternal grandmothers, and siblings.",
        "**Mother's Exclusions**: The Mother completely excludes paternal and maternal grandmothers, and reduces maternal siblings if children are alive.",
        "**Sibling Hierarchy**: Full siblings block consaguine (paternal) siblings. Maternal (uterine) siblings are blocked by any living child or male ascendant."
      ]
    },
    {
      title: "The Logic of Al-Aoul",
      arabicTitle: "مسألة العول",
      icon: Award,
      color: "rose",
      summary: "Al-Aoul (proportional reduction) is triggered when many fixed sharers exist, making the sum of fractions exceed 1 (e.g., 2/3 + 1/2 + 1/6 = 8/6):",
      bullets: [
        "**Caliphate Solution**: First encountered during the caliphate of Umar ibn al-Khattab (RA). He consulted companions, and Ali ibn Abi Talib (RA) formulated the proportional logic.",
        "**Resolution Algebra**: The common denominator of the inheritance (usually 6, 12, or 24) is increased to equate to the sum of the numerators (the Siham).",
        "**Outcome**: All heirs have their final fractions reduced by the same ratio, resolving the mathematically impossible deficit without excluding anyone."
      ]
    },
    {
      title: "The Logic of Al-Radd",
      arabicTitle: "مسألة الرد",
      icon: Archive,
      color: "teal",
      summary: "Al-Radd (return of surplus) is the mathematical inverse of Aoul. It is triggered when there is a surplus left over (fractions do not sum to 1) and there are no Residuaries:",
      bullets: [
        "**Surplus Redistribution**: The excess portion of the estate is returned to the Quranic Sharers in proportion to their shares.",
        "**Spouse Exception**: Classically, the spouse (Husband/Wife) does not participate in Al-Radd. They receive only their original fixed share (1/2, 1/4, 1/8) and nothing more. The remaining surplus is shared only among blood relatives.",
        "**Modern Variation**: If absolutely no other blood relative is present, modern codes often return the surplus to the spouse to avoid state custody of funds."
      ]
    }
  ];

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-md p-6 h-full flex flex-col justify-between" id="educational-reference">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-emerald-600 shrink-0" />
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Faraid Educational Companion</h3>
      </div>
      
      <p className="text-[11px] text-slate-500 mb-4">
        Islamic probate mathematical algebra is highly logical, protecting vulnerable family links through unified proportional formulas. Select a topic to read details:
      </p>

      {/* Accordion Layout */}
      <div className="space-y-2.5 flex-1 overflow-y-auto">
        {topics.map((topic, idx) => {
          const Icon = topic.icon;
          const isActive = activeTopic === idx;

          return (
            <div 
              key={idx}
              className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                isActive 
                  ? "border-emerald-200/80 bg-stone-50/50" 
                  : "border-stone-100 hover:border-stone-200"
              }`}
            >
              <button
                onClick={() => setActiveTopic(isActive ? null : idx)}
                className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    isActive ? "bg-emerald-100 text-emerald-800" : "bg-stone-50 text-slate-500"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{topic.title}</h4>
                    <span className="text-[10px] font-mono text-emerald-700/80 tracking-widest">{topic.arabicTitle}</span>
                  </div>
                </div>
                <Info className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'rotate-180 text-emerald-600' : 'text-slate-400'}`} />
              </button>

              {isActive && (
                <div className="px-4 pb-4 pt-1 border-t border-dashed border-stone-200">
                  <p className="text-[11px] text-slate-600 mb-3 font-medium leading-relaxed">{topic.summary}</p>
                  <ul className="space-y-2">
                    {topic.bullets.map((bullet, bIdx) => {
                      // Custom bold parser or bullet renderer
                      const boldParts = bullet.split('**');
                      return (
                        <li key={bIdx} className="text-[10.5px] text-slate-700 flex items-start gap-1.5 leading-relaxed">
                          <span className="text-amber-500 mt-1 shrink-0">•</span>
                          <span>
                            {boldParts.map((part, pIdx) => {
                              if (pIdx % 2 === 1) {
                                return <strong key={pIdx} className="font-semibold text-slate-900">{part}</strong>;
                              }
                              return part;
                            })}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-stone-100 bg-amber-50/40 p-3 rounded-2xl border border-amber-100/40 flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="text-[10px] text-amber-800 font-medium">
          Source verses: **Surah An-Nisa (4:11, 4:12, 4:176)** form the primary algebraic foundation of Al-Faraid.
        </span>
      </div>
    </div>
  );
}
