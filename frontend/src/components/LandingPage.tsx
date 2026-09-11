import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

interface LandingPageProps {
  onLaunch: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
  }
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-zinc-800 selection:text-white relative overflow-hidden">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[50%] -left-[20%] w-[150%] h-[150%] rounded-full opacity-20 blur-[120px]"
          style={{
            background: "radial-gradient(circle, rgba(63,63,70,0.4) 0%, rgba(0,0,0,0) 60%)"
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.15, 0.05],
            x: [0, 100, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-[10%] w-[80%] h-[80%] rounded-full opacity-20 blur-[100px]"
          style={{
            background: "radial-gradient(circle, rgba(161,161,170,0.2) 0%, rgba(0,0,0,0) 60%)"
          }}
        />
      </div>

      {/* ── Navigation ── */}
      <nav className="fixed top-0 inset-x-0 z-50 px-6 py-6 md:px-12 md:py-8 flex items-center justify-between pointer-events-none">
        <div className="font-semibold text-lg tracking-tight pointer-events-auto flex items-center gap-2">
          WeAdvisory
          <span className="hidden md:inline-block px-2 py-0.5 ml-2 rounded text-[10px] uppercase font-mono tracking-widest bg-zinc-900 border border-zinc-800 text-zinc-400">
            Shenzhen Univ × WeBank
          </span>
        </div>
        <div className="flex gap-6 items-center pointer-events-auto">
          <a href="#" className="hidden md:block text-xs font-mono text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">Team</a>
          <a href="#" className="hidden md:block text-xs font-mono text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">Hackathon</a>
          <button
            onClick={onLaunch}
            className="text-sm font-medium hover:text-zinc-300 transition-colors"
          >
            Enter Sandbox
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col justify-center px-6 md:px-12 pt-24 pb-12 relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="max-w-5xl mx-auto w-full text-center md:text-left flex flex-col md:items-start items-center"
        >
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-[96px] font-light tracking-tighter leading-[1.05] mb-6">
            Advisory. <br />
            Redefined.
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg md:text-xl text-zinc-400 font-light max-w-2xl mb-12 leading-relaxed">
            The institutional wealth cockpit built for the Shenzhen University & WeBank Hackathon. Real-time Markowitz optimization and strict CSRC compliance.
          </motion.p>
          
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-6">
            <button
              onClick={onLaunch}
              className="group flex items-center gap-3 text-lg md:text-xl font-light hover:text-zinc-300 transition-colors pointer-events-auto bg-white hover:bg-zinc-200 text-black px-6 py-3 rounded-full"
            >
              Launch Sandbox
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Capabilities ── */}
      <section className="px-6 md:px-12 py-32 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="max-w-5xl mx-auto w-full"
        >
          <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-light tracking-tight mb-24 text-center md:text-left">
            Institutional capabilities <br />
            without the complexity.
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
            <motion.div variants={fadeUp} className="flex flex-col gap-6 group">
              <div className="text-zinc-500 font-mono text-sm uppercase tracking-widest transition-colors group-hover:text-zinc-300">01 / Engine</div>
              <h3 className="text-3xl font-light">Deterministic Optimization</h3>
              <p className="text-zinc-400 text-lg leading-relaxed font-light">
                Compute the Markowitz efficient frontier across 10 asset classes in under 100ms. No hallucinations, just pure mathematics subject to strict concentration bounds.
              </p>
            </motion.div>
            
            <motion.div variants={fadeUp} className="flex flex-col gap-6 group">
              <div className="text-zinc-500 font-mono text-sm uppercase tracking-widest transition-colors group-hover:text-zinc-300">02 / Compliance</div>
              <h3 className="text-3xl font-light">CSRC Sentinel</h3>
              <p className="text-zinc-400 text-lg leading-relaxed font-light">
                Absolute pre-trade blocks on suitability breaches. R4/R5 speculative assets can never reach C1–C3 investors. Guaranteed by the engine.
              </p>
            </motion.div>
            
            <motion.div variants={fadeUp} className="flex flex-col gap-6 group">
              <div className="text-zinc-500 font-mono text-sm uppercase tracking-widest transition-colors group-hover:text-zinc-300">03 / Risk</div>
              <h3 className="text-3xl font-light">Stochastic Modeling</h3>
              <p className="text-zinc-400 text-lg leading-relaxed font-light">
                Simulate 1,000 Geometric Brownian Motion paths across a 5-year horizon. Instantly visualize P10 stressed, P50 median, and P90 optimistic wealth scenarios.
              </p>
            </motion.div>
            
            <motion.div variants={fadeUp} className="flex flex-col gap-6 group">
              <div className="text-zinc-500 font-mono text-sm uppercase tracking-widest transition-colors group-hover:text-zinc-300">04 / Audit</div>
              <h3 className="text-3xl font-light">Cryptographic Ledger</h3>
              <p className="text-zinc-400 text-lg leading-relaxed font-light">
                Every advisory dialogue, risk profile change, and portfolio rebalance is hashed via SHA-256 to an immutable ledger for regulatory non-repudiation.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 md:px-12 py-32 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="max-w-4xl mx-auto w-full"
        >
          <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-light tracking-tight mb-20 text-center">
            Questions?
          </motion.h2>
          
          <div className="flex flex-col gap-4">
            {[
              {
                q: "What separates WeAdvisory from ChatGPT?",
                a: "A standalone LLM cannot solve matrix optimization. WeAdvisory pairs an Explainable AI conversational layer with a deterministic Python quantitative engine. Numbers are computed, never invented."
              },
              {
                q: "Does this replace Relationship Managers?",
                a: "No. It is a 'Human-in-the-Loop' copilot. It automates risk profiling, compliance checks, and optimization, allowing RMs to handle 10x the client volume while retaining discretionary control."
              },
              {
                q: "Why are gains red and losses green?",
                a: "We adhere to Chinese financial market conventions (CSRC, Shanghai, Shenzhen), where red represents rising asset prices and prosperity, and green denotes market drawdowns."
              },
              {
                q: "Is it auditable?",
                a: "Yes. Every action is fingerprinted with a SHA-256 hash and committed to an immutable ledger, providing a non-repudiable trail for compliance inspectors."
              }
            ].map((faq, i) => (
              <motion.div key={i} variants={fadeUp}>
                <FaqRow question={faq.q} answer={faq.a} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 md:px-12 py-12 flex flex-col md:flex-row justify-between items-center gap-6 text-zinc-600 font-mono text-xs uppercase tracking-widest relative z-10">
        <div>WeAdvisory © 2026</div>
        <div className="flex gap-8 text-center">
          <span>WeBank Track B</span>
          <span>CSRC Compliant</span>
        </div>
      </footer>
    </div>
  );
};

const FaqRow = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="py-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group pointer-events-auto"
      >
        <span className="text-2xl font-light group-hover:text-zinc-400 transition-colors">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-zinc-500"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-8 text-lg font-light text-zinc-400 leading-relaxed max-w-3xl">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
