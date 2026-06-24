/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Calculator, 
  BookOpen, 
  DollarSign, 
  Users, 
  HelpCircle, 
  ArrowRight,
  TrendingUp, 
  FolderPlus,
  Scale, 
  Save, 
  FileText, 
  HelpCircle as QuestionIcon,
  ChevronRight,
  Sparkles,
  Info
} from "lucide-react";
import { calculateInheritance, CalculationResult, InheritanceInputs } from "./utils/inheritanceEngine";
import { SavedScenario, CURRENCIES, Currency } from "./types";
import EducationalCards from "./components/EducationalCards";
import HistoryPanel from "./components/HistoryPanel";

const getSingularName = (relationship: string): string => {
  const rel = relationship.toLowerCase();
  if (rel.includes("wife/wives") || rel.includes("wives")) return "Wife";
  if (rel.includes("maternal (uterine) sibling")) return "Maternal Sibling";
  return relationship;
};

const formatNumberWithCommas = (val: number | ""): string => {
  if (val === "") return "";
  return val.toLocaleString();
};

const parseCommaSeparatedNumber = (val: string): number | "" => {
  const clean = val.replace(/[^0-9]/g, "");
  if (clean === "") return "";
  return parseInt(clean, 10);
};

export default function App() {
  // --- 1. State declarations ---
  const [deceasedName, setDeceasedName] = useState<string>("");
  const [gender, setGender] = useState<'male' | 'female'>("male");
  const [estateValue, setEstateValue] = useState<number | "">(0);
  const [currency, setCurrency] = useState<Currency>(CURRENCIES[0]);
  
  // Financial dues
  const [debts, setDebts] = useState<number | "">(0);
  const [funeralExpenses, setFuneralExpenses] = useState<number | "">(0);
  const [bequests, setBequests] = useState<number | "">(0);

  // Surviving Family tree
  const [spouseCount, setSpouseCount] = useState<number>(0); // Wives if deceased is male, Husband if deceased is female
  const [sonsCount, setSonsCount] = useState<number>(0);
  const [daughtersCount, setDaughtersCount] = useState<number>(0);
  const [grandsonsCount, setGrandsonsCount] = useState<number>(0);
  const [granddaughtersCount, setGranddaughtersCount] = useState<number>(0);

  const [hasFather, setHasFather] = useState<boolean>(false);
  const [hasMother, setHasMother] = useState<boolean>(false);
  const [hasPaternalGrandfather, setHasPaternalGrandfather] = useState<boolean>(false);
  const [hasPaternalGrandmother, setHasPaternalGrandmother] = useState<boolean>(false);
  const [hasMaternalGrandmother, setHasMaternalGrandmother] = useState<boolean>(false);

  const [fullBrothersCount, setFullBrothersCount] = useState<number>(0);
  const [fullSistersCount, setFullSistersCount] = useState<number>(0);
  const [paternalBrothersCount, setPaternalBrothersCount] = useState<number>(0);
  const [paternalSistersCount, setPaternalSistersCount] = useState<number>(0);
  const [maternalSiblingsCount, setMaternalSiblingsCount] = useState<number>(0);

  // Active Madhab
  const [madhab, setMadhab] = useState<string>("Hanafi (Sunni Classic)");

  // Scenario management
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [scenarioNameInput, setScenarioNameInput] = useState<string>("");
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);

  // Dynamic calculations result
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);

  // --- 2. Side Effects ---
  // Load saved scenarios on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("faraid_scenarios");
      if (stored) {
        setSavedScenarios(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Could not parse saved stories:", e);
    }
  }, []);

  // Recalculate Faraid whenever inputs change
  useEffect(() => {
    const inputs: InheritanceInputs = {
      deceasedName,
      gender,
      estateValue: estateValue === "" ? 0 : estateValue,
      debts: debts === "" ? 0 : debts,
      funeralExpenses: funeralExpenses === "" ? 0 : funeralExpenses,
      bequests: bequests === "" ? 0 : bequests,
      spouseCount: gender === 'male' ? spouseCount : (spouseCount > 0 ? 1 : 0), // max 1 husband, up to 4 wives
      sonsCount,
      daughtersCount,
      grandsonsCount,
      granddaughtersCount,
      hasFather,
      hasMother,
      hasPaternalGrandfather,
      hasPaternalGrandmother,
      hasMaternalGrandmother,
      fullBrothersCount,
      fullSistersCount,
      paternalBrothersCount,
      paternalSistersCount,
      maternalSiblingsCount,
    };
    
    const results = calculateInheritance(inputs);
    setCalculation(results);
  }, [
    deceasedName,
    gender,
    estateValue,
    debts,
    funeralExpenses,
    bequests,
    spouseCount,
    sonsCount,
    daughtersCount,
    grandsonsCount,
    granddaughtersCount,
    hasFather,
    hasMother,
    hasPaternalGrandfather,
    hasPaternalGrandmother,
    hasMaternalGrandmother,
    fullBrothersCount,
    fullSistersCount,
    paternalBrothersCount,
    paternalSistersCount,
    maternalSiblingsCount,
  ]);

  // Adjust spouse inputs if deceased gender changes
  const handleGenderChange = (newGender: 'male' | 'female') => {
    setGender(newGender);
    if (newGender === 'male') {
      setSpouseCount(1); // default 1 wife
    } else {
      setSpouseCount(1); // max 1 husband
    }
  };

  // --- 3. Saved Scenario Operations ---
  const handleSaveScenario = () => {
    if (!scenarioNameInput.trim()) return;
    
    const newSc: SavedScenario = {
      id: Math.random().toString(),
      name: scenarioNameInput,
      date: new Date().toISOString(),
      inputs: {
        deceasedName,
        gender,
        estateValue: estateValue === "" ? 0 : estateValue,
        debts: debts === "" ? 0 : debts,
        funeralExpenses: funeralExpenses === "" ? 0 : funeralExpenses,
        bequests: bequests === "" ? 0 : bequests,
        spouseCount,
        sonsCount,
        daughtersCount,
        grandsonsCount,
        granddaughtersCount,
        hasFather,
        hasMother,
        hasPaternalGrandfather,
        hasPaternalGrandmother,
        hasMaternalGrandmother,
        fullBrothersCount,
        fullSistersCount,
        paternalBrothersCount,
        paternalSistersCount,
        maternalSiblingsCount,
      },
      currencyCode: currency.code
    };

    const updated = [newSc, ...savedScenarios];
    setSavedScenarios(updated);
    localStorage.setItem("faraid_scenarios", JSON.stringify(updated));
    setScenarioNameInput("");
    setShowSaveModal(false);
  };

  const handleLoadScenario = (sc: SavedScenario) => {
    const inputs = sc.inputs;
    setDeceasedName(inputs.deceasedName);
    setGender(inputs.gender);
    setEstateValue(inputs.estateValue);
    setDebts(inputs.debts);
    setFuneralExpenses(inputs.funeralExpenses);
    setBequests(inputs.bequests);
    setSpouseCount(inputs.spouseCount);
    setSonsCount(inputs.sonsCount);
    setDaughtersCount(inputs.daughtersCount);
    setGrandsonsCount(inputs.grandsonsCount);
    setGranddaughtersCount(inputs.granddaughtersCount);
    setHasFather(inputs.hasFather);
    setHasMother(inputs.hasMother);
    setHasPaternalGrandfather(inputs.hasPaternalGrandfather);
    setHasPaternalGrandmother(inputs.hasPaternalGrandmother);
    setHasMaternalGrandmother(inputs.hasMaternalGrandmother);
    setFullBrothersCount(inputs.fullBrothersCount);
    setFullSistersCount(inputs.fullSistersCount);
    setPaternalBrothersCount(inputs.paternalBrothersCount);
    setPaternalSistersCount(inputs.paternalSistersCount);
    setMaternalSiblingsCount(inputs.maternalSiblingsCount);
    
    const cur = CURRENCIES.find((c) => c.code === sc.currencyCode);
    if (cur) setCurrency(cur);

    // Scroll to results sheet
    document.getElementById("faraid-results")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteScenario = (id: string) => {
    const filtered = savedScenarios.filter((sc) => sc.id !== id);
    setSavedScenarios(filtered);
    localStorage.setItem("faraid_scenarios", JSON.stringify(filtered));
  };

  // --- 4. Chart drawing details ---
  const activeHeirs = calculation?.heirs.filter((h) => !h.isExcluded && h.percentage > 0) || [];
  
  // Calculate donut chart segments
  let accumulatedPercent = 0;
  const radius = 55;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // approx 345.57

  const chartSegments = activeHeirs.map((heir, idx) => {
    const sharePercent = heir.percentage;
    const strokeDash = (sharePercent / 100) * circumference;
    const strokeOffset = circumference - ((accumulatedPercent / 100) * circumference);
    accumulatedPercent += sharePercent;
    
    // Aesthetic Islamic tile color mappings
    const colors = [
      "#0d9488", // teal-600
      "#0891b2", // cyan-600
      "#059669", // emerald-600
      "#b45309", // amber-700
      "#d97706", // amber-600
      "#4f46e5", // indigo-600
      "#7c3aed", // violet-600
      "#2563eb", // blue-600
      "#16a34a", // green-600
    ];
    const segmentColor = colors[idx % colors.length];

    return {
      ...heir,
      strokeDash: `${strokeDash} ${circumference}`,
      strokeOffset,
      color: segmentColor
    };
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 font-sans antialiased pb-16">
      {/* 1. Header Hero Panel */}
      <header className="relative bg-emerald-950 text-white min-h-[220px] flex items-center overflow-hidden border-b-[6px] border-amber-400">
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d97706_1.5px,transparent_1.5px)] [background-size:16px_16px]"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950 via-teal-950 to-[#0e4438]/40"></div>
        
        <div className="max-w-7xl mx-auto px-6 w-full relative z-10 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 font-semibold text-[10px] tracking-widest uppercase border border-amber-500/30 px-3 py-1 rounded-full">
              <Scale className="w-3.5 h-3.5" /> Faraid Algebraic Dashboard
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#FFFDF9] tracking-tight">
              Islamic Inheritance Calculator
            </h1>
            <p className="text-xs text-stone-300 max-w-xl font-medium leading-relaxed">
              Deconstruct estates based on classical Sunni Faraid rules. Solves Al-Aoul, Al-Radd, and complex family exclusions with a mathematical layout and AI Scholar explanations.
            </p>
          </div>
          
          <div className="shrink-0 flex items-center gap-4 bg-emerald-900/60 p-4 border border-emerald-850 rounded-2xl">
            <div className="text-right">
              <span className="text-[10px] text-emerald-200 block uppercase font-mono font-bold tracking-wider">Active School (Madhab)</span>
              <select
                value={madhab}
                onChange={(e) => setMadhab(e.target.value)}
                className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer focus:ring-0 mt-0.5 border-none"
              >
                <option value="Hanafi (Sunni Classic)" className="text-slate-800 bg-white">Hanafi School</option>
                <option value="Shafi'i (Sunni)" className="text-slate-800 bg-white">Shafi'i School</option>
                <option value="Maliki (Sunni)" className="text-slate-800 bg-white">Maliki School</option>
                <option value="Hanbali (Sunni)" className="text-slate-800 bg-white">Hanbali School</option>
              </select>
            </div>
            <div className="w-[1px] h-8 bg-emerald-800/85"></div>
            <div className="p-2 bg-emerald-950 border border-emerald-800 rounded-xl">
              <Scale className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT 5 COLUMNS: DATA & FAMILY TREE INPUTS */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-stone-200/80 shadow-md p-6 relative overflow-hidden" id="estate-config">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full pointer-events-none -mr-8 -mt-8"></div>
              
              <div className="flex items-center gap-2 mb-5 border-b border-stone-100 pb-3">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 tracking-tight">1. Estate Config & Estate Liabilities</h2>
                  <p className="text-[10px] text-slate-400">Financial records of deceased before probate distribution</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Deceased details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Deceased Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Abdullah"
                      value={deceasedName}
                      onChange={(e) => setDeceasedName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Deceased Gender</label>
                    <div className="grid grid-cols-2 p-1 bg-stone-100/80 rounded-xl border border-stone-200/40">
                      <button
                        type="button"
                        onClick={() => handleGenderChange('male')}
                        className={`py-1.5 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer ${
                          gender === 'male' ? 'bg-emerald-700 text-white shadow' : 'text-slate-600'
                        }`}
                      >
                        Male
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenderChange('female')}
                        className={`py-1.5 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer ${
                          gender === 'female' ? 'bg-[#D97706] text-white shadow' : 'text-slate-600'
                        }`}
                      >
                        Female
                      </button>
                    </div>
                  </div>
                </div>

                {/* Gross asset & Currency select */}
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-8">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Gross Estate Value</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-semibold text-slate-400">
                        {currency.symbol}
                      </span>
                      <input
                        type="text"
                        value={formatNumberWithCommas(estateValue)}
                        onChange={(e) => {
                          setEstateValue(parseCommaSeparatedNumber(e.target.value));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800"
                      />
                    </div>
                  </div>
                  <div className="col-span-4">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Currency</label>
                    <select
                      value={currency.code}
                      onChange={(e) => {
                        const cur = CURRENCIES.find((c) => c.code === e.target.value);
                        if (cur) setCurrency(cur);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 font-bold"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="h-[1px] bg-stone-100 my-1"></div>

                {/* Debts, Funeral, and Wills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">
                      Outstanding Debts
                    </label>
                    <input
                      type="text"
                      value={formatNumberWithCommas(debts)}
                      onChange={(e) => {
                        setDebts(parseCommaSeparatedNumber(e.target.value));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Funeral Costs
                    </label>
                    <input
                      type="text"
                      value={formatNumberWithCommas(funeralExpenses)}
                      onChange={(e) => {
                        setFuneralExpenses(parseCommaSeparatedNumber(e.target.value));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">
                      Legal Bequests / Wills
                      <span className="text-[8px] text-amber-600 bg-amber-50 border border-amber-100 px-1 rounded hover:bg-amber-100 cursor-help" title="Sharia law caps private wills to a maximum of 1/3 of estate after funeral/debts.">
                        Max 1/3
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formatNumberWithCommas(bequests)}
                      onChange={(e) => {
                        setBequests(parseCommaSeparatedNumber(e.target.value));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* FAMILY TREE CONFIG SHEET */}
            <div className="bg-white rounded-3xl border border-stone-200/80 shadow-md p-6" id="family-tree-config">
              <div className="flex items-center gap-2 mb-5 border-b border-stone-100 pb-3">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 tracking-tight">2. Surviving Family Kin</h2>
                  <p className="text-[10px] text-slate-400">Configure surviving heirs eligible under Islamic jurisprudence</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Spouse and Children Category */}
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Primary Offspring & Spouses</h3>
                  <div className="space-y-2.5">
                    
                    {/* Spouse Counter */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700">{gender === 'male' ? "Wives (Spouse)" : "Husband (Spouse)"}</h4>
                        <span className="text-[9px] font-mono text-emerald-700 font-semibold">{gender === 'male' ? "Zawjah" : "Zowj"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSpouseCount(Math.max(0, spouseCount - 1))}
                          className="w-7 h-7 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg font-bold text-xs flex items-center justify-center cursor-pointer select-none"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono text-slate-800">{spouseCount}</span>
                        <button
                          type="button"
                          onClick={() => setSpouseCount(Math.min(gender === 'male' ? 4 : 1, spouseCount + 1))}
                          className="w-7 h-7 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg font-bold text-xs flex items-center justify-center cursor-pointer select-none"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Sons Counter */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700">Sons</h4>
                        <span className="text-[9px] font-mono text-emerald-700 font-semibold">Ibn (Residuary)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSonsCount(Math.max(0, sonsCount - 1))}
                          className="w-7 h-7 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg font-bold text-xs flex items-center justify-center cursor-pointer select-none"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono text-slate-800">{sonsCount}</span>
                        <button
                          type="button"
                          onClick={() => setSonsCount(sonsCount + 1)}
                          className="w-7 h-7 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg font-bold text-xs flex items-center justify-center cursor-pointer select-none"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Daughters Counter */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700">Daughters</h4>
                        <span className="text-[9px] font-mono text-emerald-700 font-semibold">Bint (Quranic Sharer / Residuary)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDaughtersCount(Math.max(0, daughtersCount - 1))}
                          className="w-7 h-7 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg font-bold text-xs flex items-center justify-center cursor-pointer select-none"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono text-slate-800">{daughtersCount}</span>
                        <button
                          type="button"
                          onClick={() => setDaughtersCount(daughtersCount + 1)}
                          className="w-7 h-7 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg font-bold text-xs flex items-center justify-center cursor-pointer select-none"
                        >
                          +
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Parents & Grandparents Category */}
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Parents & Grandparents</h3>
                  <div className="space-y-2.5">
                    
                    {/* Mother Alive Switch */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700">Mother</h4>
                        <span className="text-[9px] font-mono text-emerald-700 font-semibold">Umm (Quranic Sharer)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHasMother(!hasMother)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                          hasMother ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {hasMother ? 'Alive' : 'Deceased'}
                      </button>
                    </div>

                    {/* Father Alive Switch */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700">Father</h4>
                        <span className="text-[9px] font-mono text-emerald-700 font-semibold">Ab (Quranic / Residuary)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHasFather(!hasFather)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                          hasFather ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {hasFather ? 'Alive' : 'Deceased'}
                      </button>
                    </div>

                    {/* Grandparents collapsible configs */}
                    <div className="border border-stone-200/50 rounded-2xl bg-white p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600">Surviving Grandparents (Abas)</span>
                        <HelpCircle className="w-3.5 h-3.5 text-slate-350 cursor-help" title="Grandparents inherit if Mother/Father are absent." />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* Paternal Grandfather */}
                        <label className="flex items-center gap-2 cursor-pointer bg-stone-50 hover:bg-stone-100/50 p-2 rounded-xl border border-stone-100 select-none">
                          <input
                            type="checkbox"
                            checked={hasPaternalGrandfather}
                            onChange={(e) => setHasPaternalGrandfather(e.target.checked)}
                            className="rounded border-stone-300 pointer-events-auto h-4 w-4 bg-white text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="leading-tight">
                            <span className="text-[10px] font-bold block text-slate-700">Pat. Grandfather</span>
                            <span className="text-[8px] font-mono text-emerald-700">Jadd-ul-Sahih</span>
                          </div>
                        </label>

                        {/* Paternal Grandmother */}
                        <label className="flex items-center gap-2 cursor-pointer bg-stone-50 hover:bg-stone-100/50 p-2 rounded-xl border border-stone-100 select-none">
                          <input
                            type="checkbox"
                            checked={hasPaternalGrandmother}
                            onChange={(e) => setHasPaternalGrandmother(e.target.checked)}
                            className="rounded border-stone-300 pointer-events-auto h-4 w-4 bg-white text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="leading-tight">
                            <span className="text-[10px] font-bold block text-slate-700">Pat. Grandmother</span>
                            <span className="text-[8px] font-mono text-emerald-700">Jaddah (Ab)</span>
                          </div>
                        </label>

                        {/* Maternal Grandmother */}
                        <label className="flex items-center gap-2 cursor-pointer bg-stone-50 hover:bg-stone-100/50 p-2 rounded-xl border border-stone-100 col-span-1 sm:col-span-2 select-none">
                          <input
                            type="checkbox"
                            checked={hasMaternalGrandmother}
                            onChange={(e) => setHasMaternalGrandmother(e.target.checked)}
                            className="rounded border-stone-300 pointer-events-auto h-4 w-4 bg-white text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="leading-tight">
                            <span className="text-[10px] font-bold block text-slate-700">Maternal Grandmother</span>
                            <span className="text-[8px] font-mono text-emerald-700">Jaddah (Umm)</span>
                          </div>
                        </label>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Sibling branches */}
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Siblings & Collaterals</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    
                    {/* Full Brothers */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 border border-stone-100">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-700">Full Brothers</h4>
                        <span className="text-[8.5px] font-mono text-emerald-700 block">Shaqeeq</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFullBrothersCount(Math.max(0, fullBrothersCount - 1))}
                          className="w-6 h-6 bg-white border border-stone-200 rounded font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-semibold w-4 text-center font-mono">{fullBrothersCount}</span>
                        <button
                          type="button"
                          onClick={() => setFullBrothersCount(fullBrothersCount + 1)}
                          className="w-6 h-6 bg-white border border-stone-200 rounded font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Full Sisters */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 border border-stone-100">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-700">Full Sisters</h4>
                        <span className="text-[8.5px] font-mono text-emerald-700 block">Shaqeeqah</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFullSistersCount(Math.max(0, fullSistersCount - 1))}
                          className="w-6 h-6 bg-white border border-stone-200 rounded font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-semibold w-4 text-center font-mono">{fullSistersCount}</span>
                        <button
                          type="button"
                          onClick={() => setFullSistersCount(fullSistersCount + 1)}
                          className="w-6 h-6 bg-white border border-stone-200 rounded font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Consanguine (Paternal) Brothers */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 border border-stone-100">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-700">Paternal Bros</h4>
                        <span className="text-[8.5px] font-mono text-emerald-700 block">Akh li-Ab</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPaternalBrothersCount(Math.max(0, paternalBrothersCount - 1))}
                          className="w-6 h-6 bg-white border border-stone-200 rounded font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-semibold w-4 text-center font-mono">{paternalBrothersCount}</span>
                        <button
                          type="button"
                          onClick={() => setPaternalBrothersCount(paternalBrothersCount + 1)}
                          className="w-6 h-6 bg-white border border-stone-200 rounded font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Consanguine (Paternal) Sisters */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 border border-stone-100">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-700">Paternal Sists</h4>
                        <span className="text-[8.5px] font-mono text-emerald-700 block">Ukht li-Ab</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPaternalSistersCount(Math.max(0, paternalSistersCount - 1))}
                          className="w-6 h-6 bg-white border border-stone-200 rounded font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-semibold w-4 text-center font-mono">{paternalSistersCount}</span>
                        <button
                          type="button"
                          onClick={() => setPaternalSistersCount(paternalSistersCount + 1)}
                          className="w-6 h-6 bg-white border border-stone-200 rounded font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Uterine (Maternal) Siblings */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 border border-stone-100 col-span-1 sm:col-span-2">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-700">Maternal (Uterine) Siblings</h4>
                        <span className="text-[8.5px] font-mono text-emerald-700 block text-xs">Akh/Ukht li-Umm (Divided equally maternal link)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setMaternalSiblingsCount(Math.max(0, maternalSiblingsCount - 1))}
                          className="w-6 h-6 bg-white border border-stone-200 rounded font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-semibold w-4 text-center font-mono">{maternalSiblingsCount}</span>
                        <button
                          type="button"
                          onClick={() => setMaternalSiblingsCount(maternalSiblingsCount + 1)}
                          className="w-6 h-6 bg-white border border-stone-200 rounded font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Grandchildren Group */}
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Grandchildren (from Sons)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    
                    {/* Grandsons */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 border border-stone-100">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-700">Grandsons</h4>
                        <span className="text-[8.5px] font-mono text-emerald-700 block">Ibn Ibn</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setGrandsonsCount(Math.max(0, grandsonsCount - 1))}
                          className="w-6 h-6 bg-white border border-stone-200 rounded font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-semibold w-4 text-center font-mono">{grandsonsCount}</span>
                        <button
                          type="button"
                          onClick={() => setGrandsonsCount(grandsonsCount + 1)}
                          className="w-6 h-6 bg-white border border-stone-200 rounded font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Granddaughters */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 border border-stone-100">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-700">Granddaughters</h4>
                        <span className="text-[8.5px] font-mono text-emerald-700 block">Bint Ibn</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setGranddaughtersCount(Math.max(0, granddaughtersCount - 1))}
                          className="w-6 h-6 bg-white border border-stone-200 rounded font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-semibold w-4 text-center font-mono">{granddaughtersCount}</span>
                        <button
                          type="button"
                          onClick={() => setGranddaughtersCount(granddaughtersCount + 1)}
                          className="w-6 h-6 bg-white border border-stone-200 rounded font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT 7 COLUMNS: CALCULATED RESULTS, AI SCHOLAR AND CHEATSHEETS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. MATH CALCULATOR RESULTS CARD */}
            <div className="bg-white rounded-3xl border border-stone-200/80 shadow-md p-6 relative" id="faraid-results">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 tracking-tight">Faraid Distribution Sheets</h2>
                    <p className="text-[10px] text-slate-400">Exact fractions, algebraic percentages, and cash payouts</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="bg-stone-50 hover:bg-stone-100 text-slate-600 hover:text-emerald-700 text-xs font-semibold px-3 py-2 rounded-xl border border-stone-200/80 transition duration-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-emerald-600" />
                    Save scenario
                  </button>
                </div>
              </div>

              {/* Financial Balance Summary Banner */}
              {calculation && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-stone-50/50 border border-stone-150 mb-6 text-center">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Gross Estate</span>
                    <p className="text-sm font-bold font-mono text-slate-700 mt-0.5">{currency.symbol} {calculation.inputs.estateValue.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold pr-0.5 tracking-wider">Total Deductions</span>
                    <p className="text-sm font-bold font-mono text-amber-700 mt-0.5">
                      -{currency.symbol} {(calculation.debtsDeducted + calculation.funeralDeducted + calculation.bequestsDeducted).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block tracking-wider">Net estate (Tarikah)</span>
                    <p className="text-sm font-extrabold font-mono text-emerald-800 mt-0.5">{currency.symbol} {calculation.netEstate.toLocaleString()}</p>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Adjustment style</span>
                    <div className="mt-1">
                      {calculation.adjustmentType === 'normal' && (
                        <span className="inline-block bg-teal-100 text-teal-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-teal-200">
                          Normal (balanced)
                        </span>
                      )}
                      {calculation.adjustmentType === 'aoul' && (
                        <span className="inline-block bg-rose-100 text-rose-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-rose-200 animate-pulse" title="Quranic shares sum > 1. Common denominator expanded proportionately.">
                          Al-Aoul (Deficit)
                        </span>
                      )}
                      {calculation.adjustmentType === 'radd' && (
                        <span className="inline-block bg-sky-100 text-sky-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-sky-200" title="Quranic shares sum < 1 with no Residuaries. Remaining estate returned back.">
                          Al-Radd (Surplus)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic visual Pie Chart & list Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center mb-6">
                
                {/* SVG Ring Donut Chart */}
                <div className="md:col-span-5 flex flex-col items-center justify-center">
                  <div className="relative w-36 h-36">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      {/* background track */}
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="transparent"
                        stroke="#f1f5f9"
                        strokeWidth={strokeWidth}
                      />
                      
                      {activeHeirs.length === 0 ? (
                        <circle
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="transparent"
                          stroke="#cbd5e1"
                          strokeWidth={strokeWidth}
                        />
                      ) : (
                        chartSegments.map((seg, idx) => (
                          <motion.circle
                            key={idx}
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="transparent"
                            stroke={seg.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={seg.strokeDash}
                            strokeDashoffset={seg.strokeOffset}
                            strokeLinecap="butt"
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: seg.strokeOffset }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                          />
                        ))
                      )}
                    </svg>

                    {/* Centered label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Active Shares</span>
                      <span className="text-base font-extrabold text-emerald-950 font-mono">
                        {activeHeirs.length} Heirs
                      </span>
                      <span className="text-[8px] text-slate-400 font-semibold font-mono">Algebra validated</span>
                    </div>
                  </div>
                  
                  {activeHeirs.length > 0 && (
                    <div className="flex flex-wrap gap-x-2.5 gap-y-1 justify-center max-w-[200px] mt-4.5">
                      {chartSegments.map((seg, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded" style={{ backgroundColor: seg.color }}></span>
                          <span className="text-[9px] font-bold text-slate-600">{seg.relationship}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Heir shares lists */}
                <div className="md:col-span-7 space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest border-b border-stone-100 pb-1 mb-2">Active Recipient Breakdown</h3>
                  
                  {activeHeirs.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6 font-medium">No active heirs receiving allocations. Configure surviving kin on the left.</p>
                  ) : (
                    activeHeirs.map((heir, idx) => {
                      const color = chartSegments[idx % chartSegments.length]?.color || "#0d9488";
                      return (
                        <div 
                          key={idx}
                          className="p-2.5 hover:bg-stone-50/50 rounded-xl border border-stone-100/40 transition duration-150"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">
                                  {heir.relationship} {heir.count > 1 ? `(x${heir.count})` : ""}
                                </h4>
                                <span className="text-[9px] font-mono text-emerald-800 font-semibold">{heir.arabicName} • {heir.type === 'sharer' ? `Fixed Sharer (${heir.baseShare})` : 'Residuary (Asabah)'}</span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <span className="text-xs font-bold font-mono text-slate-800 block">
                                {currency.symbol} {heir.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 font-mono bg-stone-100 px-1.5 py-0.5 rounded-md mt-0.5 inline-block">
                                {heir.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          {heir.count > 1 && (
                            <div className="mt-2.5 pl-4 border-l border-dashed border-stone-200/80 space-y-1.5 pt-1">
                              {Array.from({ length: heir.count }).map((_, i) => {
                                const individualAmount = heir.amount / heir.count;
                                const individualPercentage = heir.percentage / heir.count;
                                const singularLabel = `${getSingularName(heir.relationship)} ${i + 1}`;
                                return (
                                  <div key={i} className="flex items-center justify-between text-[11px] text-slate-600">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-stone-300"></span>
                                      <span className="font-medium text-slate-600">{singularLabel}</span>
                                    </div>
                                    <div className="flex items-center gap-2 font-mono">
                                      <span className="font-semibold text-slate-700">{currency.symbol}{Math.round(individualAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                      <span className="text-[9px] text-slate-400 bg-stone-100/50 px-1.5 rounded">
                                        {individualPercentage.toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

              {/* SECTION: EXCLUDED INHERITORS (HAJB) */}
              {calculation && calculation.heirs.some((h) => h.isExcluded && h.count > 0) && (
                <div className="bg-[#FAF9F5] border border-amber-200/40 rounded-2xl p-4.5 mt-4">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Scale className="w-4.5 h-4.5 text-amber-700 shrink-0" />
                    <h3 className="text-xs font-bold text-slate-850">Applied Exclusion Jurisprudence (Hajb)</h3>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                    Under standard Faraid law, some relatives cannot inherit in the presence of closer kin links. The following relatives take 0% share due to Hajb:
                  </p>
                  
                  <div className="space-y-1.5">
                    {calculation.heirs
                      .filter((h) => h.isExcluded && h.count > 0)
                      .map((heir, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[10.5px] bg-white p-2.5 rounded-xl border border-stone-100 shadow-sm">
                          <span className="text-rose-500 mt-0.5 shrink-0">✕</span>
                          <div>
                            <span className="font-bold text-slate-800">{heir.relationship} ({heir.arabicName})</span>
                            <span className="text-slate-500 block leading-normal italic mt-0.5">Explanation: {heir.exclusionReason}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* SECTION: GENERAL CALCULATION LOGICAL ALGEBRA STEPS */}
              {calculation && calculation.steps.length > 0 && (
                <div className="mt-5 border-t border-stone-100 pt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">Chronology of Distributions</span>
                  <div className="space-y-1.5">
                    {calculation.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-600 leading-relaxed">
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* 3. SCENARIOS ARCHIVE HISTORY PANEL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HistoryPanel 
                scenarios={savedScenarios}
                onLoad={handleLoadScenario}
                onDelete={handleDeleteScenario}
              />
              <EducationalCards />
            </div>

          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-20 border-t border-stone-200/60 bg-[#FAF9F5] py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6 space-y-4">
          <p className="font-semibold text-slate-600 uppercase tracking-wider text-[10px]">Islamic Probate Algebra Engine</p>
          <p className="max-w-md mx-auto leading-normal text-stone-400">
            Faraid math is calculated by direct Sunni law of inheritance ratios (Furud). AI analysis is trained on top Sunni classical madhab codes but should be validated by registered legal bodies.
          </p>

          {/* Quick Reference Search Indexes */}
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto pt-2">
            {[
              "Islamic inheritance calculator with amount",
              "Islamic inheritance calculator Hanafi",
              "Islamic inheritance calculator Maliki",
              "Islamic inheritance calculator Shafi'i",
              "Islamic inheritance calculator Hambali",
              "Islamic inheritance calculator app"
            ].map((kw, i) => (
              <span key={i} className="text-[10px] text-slate-500 bg-stone-100 hover:bg-stone-200/50 px-3 py-1 rounded-full transition-colors border border-stone-200/40">
                {kw}
              </span>
            ))}
          </div>

          <p className="text-[10px] text-stone-400/80 pt-2">© 2026 Al-Faraid Scholar. Licensed under Apache 2.0.</p>
        </div>
      </footer>

      {/* SAVE SCENARIO MODAL COOP */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-stone-150 p-6 max-w-sm w-full shadow-2xl relative">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              <FolderPlus className="w-5 h-5 text-emerald-600" />
              Save Probate Scenario
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-normal">
              Archive these distribution assets so you can easily reload and review them in future sessions.
            </p>
            
            <div className="my-4">
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Scenario Name</label>
              <input
                type="text"
                placeholder="e.g. Abdullah Estate Option A"
                value={scenarioNameInput}
                onChange={(e) => setScenarioNameInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowSaveModal(false); setScenarioNameInput(""); }}
                className="px-3.5 py-2 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScenario}
                disabled={!scenarioNameInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-md cursor-pointer"
              >
                Archive Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
