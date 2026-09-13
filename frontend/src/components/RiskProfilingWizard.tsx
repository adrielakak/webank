import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InvestorRiskLevel } from "../types";
import { ArrowRight } from "lucide-react";

interface RiskProfilingWizardProps {
  onComplete: (tier: InvestorRiskLevel) => void;
}

const QUESTIONS = [
  {
    id: "goal",
    title: "What is your primary investment objective?",
    options: [
      { label: "Capital Preservation (Zero risk)", value: 1 },
      { label: "Stable Income & Inflation Hedge", value: 2 },
      { label: "Balanced Growth", value: 3 },
      { label: "Aggressive Appreciation", value: 5 },
    ],
  },
  {
    id: "horizon",
    title: "What is your investment time horizon?",
    options: [
      { label: "Less than 1 year", value: 1 },
      { label: "1 to 3 years", value: 2 },
      { label: "3 to 7 years", value: 3 },
      { label: "7+ years", value: 4 },
    ],
  },
  {
    id: "drawdown",
    title: "Maximum acceptable drawdown in a single year?",
    options: [
      { label: "0% (No tolerance)", value: 1 },
      { label: "-5% to -10%", value: 2 },
      { label: "-10% to -20%", value: 4 },
      { label: "More than -20%", value: 5 },
    ],
  },
];

export const RiskProfilingWizard: React.FC<RiskProfilingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleSelect = (val: number) => {
    const newScores = [...scores, val];
    setScores(newScores);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setIsCalculating(true);
      setTimeout(() => {
        const total = newScores.reduce((a, b) => a + b, 0);
        let tier: InvestorRiskLevel = "C1";
        if (total >= 12) tier = "C5";
        else if (total >= 10) tier = "C4";
        else if (total >= 7) tier = "C3";
        else if (total >= 5) tier = "C2";
        
        onComplete(tier);
      }, 2500); // Dramatic pause for calculation
    }
  };

  if (isCalculating) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-12 h-12 border-2 border-zinc-800 border-t-white rounded-full animate-spin" />
          <div className="text-center">
            <h2 className="text-2xl font-light tracking-tight mb-2">Analyzing Profile</h2>
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Running CSRC Suitability Algorithm...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQ = QUESTIONS[step];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col px-6 py-12 md:p-24 overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-12"
          >
            <div>
              <span className="font-mono text-zinc-500 text-sm mb-4 block">0{step + 1} / 0{QUESTIONS.length}</span>
              <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white leading-tight">
                {currentQ.title}
              </h1>
            </div>

            <div className="flex flex-col gap-3">
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(opt.value)}
                  className="w-full text-left px-6 py-5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all duration-300 flex items-center justify-between group"
                >
                  <span className="text-lg md:text-xl font-light">{opt.label}</span>
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300 text-zinc-400" />
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Progress bar at bottom */}
      <div className="w-full max-w-2xl mx-auto mt-12">
        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-white"
            initial={{ width: step === 0 ? "0%" : `${((step - 1) / QUESTIONS.length) * 100}%` }}
            animate={{ width: `${(step / QUESTIONS.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
};
