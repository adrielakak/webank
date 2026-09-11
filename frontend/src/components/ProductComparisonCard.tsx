import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export const ProductComparisonCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-black py-4 flex flex-col gap-6"
    >
      <div className="flex items-end justify-between">
        <h3 className="text-xl font-light tracking-tight text-white">Product Comparison</h3>
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">C3 vs C4</span>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* C3 Column */}
        <div className="flex flex-col gap-6">
          <div className="border-b border-zinc-900 pb-2">
            <span className="text-sm font-mono text-zinc-400">Current</span>
            <div className="text-lg font-medium text-white">C3 Balanced</div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">Expected Return</span>
            <span className="text-4xl font-light tracking-tighter text-red-500">+6.00%</span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">Volatility (σ)</span>
            <span className="text-xl font-light text-zinc-300">5.53%</span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">Max Drawdown</span>
            <span className="text-xl font-light text-green-500">-10.0%</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">CSRC Tier</span>
            <span className="text-lg font-mono text-zinc-300">R3</span>
          </div>
        </div>

        {/* C4 Column */}
        <div className="flex flex-col gap-6 relative">
          {/* Subtle separator */}
          <div className="absolute -left-4 top-0 bottom-0 w-px bg-zinc-900" />
          
          <div className="border-b border-zinc-900 pb-2">
            <span className="text-sm font-mono text-zinc-400">Proposed</span>
            <div className="text-lg font-medium text-white">C4 Growth</div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">Expected Return</span>
            <span className="text-4xl font-light tracking-tighter text-red-500">+9.69%</span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">Volatility (σ)</span>
            <span className="text-xl font-light text-zinc-300">13.85%</span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">Max Drawdown</span>
            <span className="text-xl font-light text-green-500">-20.0%</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">CSRC Tier</span>
            <span className="text-lg font-mono text-zinc-300">R4</span>
          </div>
        </div>
      </div>

      <button className="mt-4 flex items-center justify-between w-full py-4 px-6 bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-2xl group">
        <span className="text-sm text-white">Initiate Risk Profile Upgrade</span>
        <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors group-hover:translate-x-1" />
      </button>
    </motion.div>
  );
};
