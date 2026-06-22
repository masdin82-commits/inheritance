/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedScenario, CURRENCIES } from "../types";
import { Folder, Trash, Clock, FileSpreadsheet, ChevronRight } from "lucide-react";

interface HistoryPanelProps {
  scenarios: SavedScenario[];
  onLoad: (scenario: SavedScenario) => void;
  onDelete: (id: string) => void;
}

export default function HistoryPanel({ scenarios, onLoad, onDelete }: HistoryPanelProps) {
  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-md p-6 h-full flex flex-col justify-between" id="scenario-history">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Folder className="w-5 h-5 text-amber-500 shrink-0" />
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Saved Faraid Scenarios</h3>
        </div>
        
        <p className="text-[11px] text-slate-500 mb-4">
          Browse previously saved inheritance profiles. Click on a file profile to reload and compare distributions.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[300px] min-h-[160px] space-y-2">
        {scenarios.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
            <Clock className="w-6 h-6 text-slate-300 mb-2" />
            <p className="text-[11px] font-medium text-slate-500">No scenarios archived yet.</p>
            <p className="text-[10px] text-slate-400 mt-1">Calculations you save using the heart icon on the results sheet will appear here.</p>
          </div>
        ) : (
          scenarios.map((sc) => {
            const currency = CURRENCIES.find((c) => c.code === sc.currencyCode) || CURRENCIES[0];
            const sumEst = sc.inputs.estateValue;
            
            return (
              <div 
                key={sc.id}
                className="group flex items-center justify-between p-3 border border-stone-100 rounded-2xl hover:border-amber-200 hover:bg-stone-50 transition duration-200"
              >
                <button
                  onClick={() => onLoad(sc)}
                  className="flex-1 text-left flex items-start gap-2.5 cursor-pointer"
                >
                  <div className="p-2 bg-stone-50 group-hover:bg-amber-100 text-slate-500 group-hover:text-amber-800 rounded-xl shrink-0 transition-colors">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 transition-colors">{sc.name}</h4>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {new Date(sc.date).toLocaleDateString()} • {currency.symbol} {sumEst.toLocaleString()}
                    </span>
                  </div>
                </button>
                
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onDelete(sc.id)}
                    className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition"
                    title="Delete scenario"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onLoad(sc)}
                    className="p-1 text-slate-400 hover:text-emerald-600 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-[10px] text-slate-400">
        <span>Subtotal saved: **{scenarios.length} profile(s)**</span>
        <span>Local encryption active</span>
      </div>
    </div>
  );
}
