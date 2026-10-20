import { useState, useEffect, useRef } from 'react';
import type { StockPoint } from '../../types';

let sharedAudioCtx: AudioContext | null = null;
const getAudioCtx = () => {
  if (typeof window === 'undefined') return null;
  const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtxClass) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtxClass();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

// Web Audio API for simple, sterile, terminal-like sounds using singleton AudioContext
const playBeep = (freq = 400, type: 'sine' | 'square' | 'triangle' = 'sine', duration = 0.05, vol = 0.05) => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
};

type Project = { id: string; name: string; costOps?: number; costAlgo?: number; desc: string; };
const STRATEGIC_PROJECTS: Project[] = [
  { id: 'gpu', name: 'Distributed GPU Cluster', costOps: 2000, desc: 'Neural Networks run 25% faster.' },
  { id: 'nature', name: 'Nature Publication', costOps: 8000, desc: 'Academic Interest increases by 25%.' },
  { id: 'transformer', name: 'Transformer Architecture', costAlgo: 50, desc: 'Neural Networks cost 30% less.' },
  { id: 'scraper', name: 'Web Scraper Bots', costAlgo: 150, desc: 'Training Data is 50% cheaper.' },
  { id: 'pca', name: 'Extract Top 3 PCA Components', costAlgo: 500, desc: 'Prevents Data Audits & Overfitting fines.' }
];

export default function GameMode({ stocks }: { stocks: StockPoint[] }) {
  // Core Stats
  const [predictions, setPredictions] = useState(0); 
  const [pendingPredictions, setPendingPredictions] = useState(0);
  const [budget, setBudget] = useState(0);
  
  // Research
  const [predictionGrant, setPredictionGrant] = useState(0.25);
  const [publicationLevel, setPublicationLevel] = useState(1);
  const publicationCost = 100 * Math.pow(2, publicationLevel - 1);
  
  // Data Engineering
  const [trainingData, setTrainingData] = useState(1000); 
  const [dataPrice, setDataPrice] = useState(15);
  
  // AI Models
  const [neuralNetworks, setNeuralNetworks] = useState(0);

  // Computing & Strategy
  const [influence, setInfluence] = useState(0);
  const [nextInfluence, setNextInfluence] = useState(200);
  const [processors, setProcessors] = useState(1);
  const [memory, setMemory] = useState(1);
  const [ops, setOps] = useState(0);
  const [algorithms, setAlgorithms] = useState(0);
  const maxOps = memory * 1000;
  const availableInfluence = influence - (processors - 1) - (memory - 1);
  const [completedProjects, setCompletedProjects] = useState<string[]>([]);
  const hasProject = (id: string) => completedProjects.includes(id);

  const nnCost = 5.00 * Math.pow(1.1, neuralNetworks) * (hasProject('transformer') ? 0.7 : 1);

  // Market Conditions
  const [interestModifier, setInterestModifier] = useState(1.0);
  const [logs, setLogs] = useState<{id: number, text: string, type: 'normal'|'good'|'bad'}[]>([]);
  const logId = useRef(0);
  const [budgetHistory, setBudgetHistory] = useState<number[]>([0]);

  const addLog = (text: string, type: 'normal'|'good'|'bad' = 'normal') => {
    setLogs(prev => [{ id: logId.current++, text, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 5));
  };

  // Progression Unlocks
  const [unlocks, setUnlocks] = useState({
    research: false,
    data: false,
    publish: false,
    models: false,
    chart: false,
    events: false,
    compute: false,
    projects: false
  });

  useEffect(() => {
    setUnlocks(prev => {
      const next = { ...prev };
      let newUnlock = false;
      
      if (!prev.research && predictions >= 5) { next.research = true; newUnlock = true; addLog("University server access granted. Research terminal online.", "good"); }
      if (!prev.data && budget >= 15) { next.data = true; newUnlock = true; addLog("Sufficient grant budget. Training Data purchases authorized.", "normal"); }
      if (!prev.publish && budget >= 50) { next.publish = true; newUnlock = true; addLog("Scientific publishing unlocked.", "normal"); }
      if (!prev.models && predictions >= 25) { next.models = true; newUnlock = true; addLog("Neural Networks available for automated inference.", "good"); }
      if (!prev.chart && budget >= 100) { next.chart = true; newUnlock = true; addLog("Budget performance charts initialized.", "normal"); }
      if (!prev.events && predictions >= 100) { next.events = true; newUnlock = true; addLog("Macro-academic factors are now affecting grant approvals.", "bad"); }
      if (!prev.compute && influence >= 1) { next.compute = true; newUnlock = true; addLog("Academic influence recognized. Supercomputer access granted.", "good"); }
      if (!prev.projects && ops > 1000) { next.projects = true; newUnlock = true; addLog("Strategic AI Projects unlocked.", "normal"); }
      
      if (newUnlock) playBeep(800, 'triangle', 0.2);
      return next;
    });
  }, [predictions, budget, influence, ops]);

  // Influence Gaining
  useEffect(() => {
    if (predictions >= nextInfluence) {
      setInfluence(i => i + 1);
      setNextInfluence(n => Math.floor(n * 1.5) + 100);
      addLog(`Academic Influence expanded. Next tier: ${Math.floor(nextInfluence * 1.5) + 100} predictions.`, "good");
      playBeep(900, 'sine', 0.1);
    }
  }, [predictions, nextInfluence]);

  // Initial log
  useEffect(() => {
    addLog("Adastra AI Research Lab initialized.", 'normal');
    addLog("Click 'Run Prediction' to begin training.", 'normal');
  }, []);

  // Demand calculation
  const academicInterest = Math.max(1, (0.8 / predictionGrant) * 1.1 * publicationLevel * interestModifier * (hasProject('nature') ? 1.25 : 1));

  // Game Loop
  const stateRef = useRef({ trainingData, pendingPredictions, neuralNetworks, processors, memory, ops, algorithms, budget });
  useEffect(() => {
    stateRef.current = { trainingData, pendingPredictions, neuralNetworks, processors, memory, ops, algorithms, budget };
  }, [trainingData, pendingPredictions, neuralNetworks, processors, memory, ops, algorithms, budget]);

  useEffect(() => {
    let tickCount = 0;
    const loop = setInterval(() => {
      tickCount++;
      const s = stateRef.current;
      
      // 0. Thematic Logs based on actual data
      if (tickCount % 35 === 0 && stocks && stocks.length > 0) {
        const rStock = stocks[Math.floor(Math.random() * stocks.length)];
        const actions = ["Analyzing NLP embeddings for", "Calculating risk profile of", "Extracting volatility vectors from", "Running PCA component reduction on"];
        const rAction = actions[Math.floor(Math.random() * actions.length)];
        addLog(`${rAction} ${rStock.stkcd}...`, 'normal');
      }

      // 1. Neural Networks (produce predictions)
      if (s.neuralNetworks > 0 && s.trainingData > 0) {
        const expected = s.neuralNetworks / (completedProjects.includes('gpu') ? 7.5 : 10);
        const guaranteed = Math.floor(expected);
        const chance = expected - guaranteed;
        let producedThisTick = guaranteed + (Math.random() < chance ? 1 : 0);
        
        if (producedThisTick > s.trainingData) producedThisTick = s.trainingData;
        
        if (producedThisTick > 0) {
          setTrainingData(td => td - producedThisTick);
          setPredictions(p => p + producedThisTick);
          setPendingPredictions(p => p + producedThisTick);
        }
      }

      // 2. Grant Funding step
      if (s.pendingPredictions > 0) {
        const expectedSales = academicInterest / 10;
        const guaranteed = Math.floor(expectedSales);
        const chance = expectedSales - guaranteed;
        let fundedThisTick = guaranteed + (Math.random() < chance ? 1 : 0);
        
        if (fundedThisTick > s.pendingPredictions) fundedThisTick = s.pendingPredictions;
        
        if (fundedThisTick > 0) {
          setPendingPredictions(p => p - fundedThisTick);
          setBudget(b => b + (fundedThisTick * predictionGrant));
        }
      }

      // 3. Training Data Price Fluctuation (every 2 seconds)
      if (tickCount % 20 === 0) {
        setDataPrice(Math.max(10, Math.min(40, Math.floor(Math.random() * 31) + 10)) * (completedProjects.includes('scraper') ? 0.5 : 1));
      }

      // 4. Chart Data (every 1 second)
      if (tickCount % 10 === 0) {
        setBudget(currentBudget => {
          setBudgetHistory(h => [...h, currentBudget].slice(-60)); // last 60 seconds
          return currentBudget;
        });
      }

      // 5. Random Events (every 5 seconds, if unlocked)
      if (tickCount % 50 === 0) {
        setUnlocks(u => {
          if (u.events && Math.random() < 0.15) { 
            const r = Math.random();
            if (r < 0.3) {
              setInterestModifier(0.4);
              addLog("GPU Outage! Training delayed. Interest drops.", 'bad');
              playBeep(200, 'square', 0.5);
              setTimeout(() => { setInterestModifier(1); addLog("Servers rebooted.", 'normal'); }, 15000);
            } else if (r < 0.6) {
              setInterestModifier(2.5);
              addLog("Viral Preprint! Academic Interest skyrockets.", 'good');
              playBeep(600, 'sine', 0.5);
              setTimeout(() => { setInterestModifier(1); addLog("Hype cycle ends.", 'normal'); }, 15000);
            } else if (r < 0.8) {
              if (!completedProjects.includes('pca')) {
                setBudget(b => {
                  const fine = Math.floor(b * 0.15); // 15% fine
                  addLog(`Data Overfitting Detected! Grant slashed by $${fine}.`, 'bad');
                  playBeep(150, 'square', 0.3);
                  return Math.max(0, b - fine);
                });
              } else {
                 addLog(`Overfitting prevented by PCA Components.`, 'good');
              }
            } else {
              setBudget(b => {
                const grant = Math.floor(b * 0.2) + 200;
                addLog(`Endowment! University injects $${grant} research budget.`, 'good');
                playBeep(800, 'sine', 0.3);
                return b + grant;
              });
            }
          }
          return u;
        });
      }

      // 6. Computing
      if (s.processors > 0) {
        const expectedOps = (s.processors * 10) / 10; // 1 op per tick per processor
        setOps(currentOps => {
          let max = s.memory * 1000;
          let newOps = currentOps + expectedOps;
          if (newOps >= max) {
            setAlgorithms(a => a + (s.processors / 10)); 
            return max;
          }
          return newOps;
        });
      }

    }, 100);

    return () => clearInterval(loop);
  }, [academicInterest, predictionGrant, completedProjects, memory, processors, stocks]); 

  // Actions
  const handleMakePrediction = () => {
    if (trainingData > 0) {
      setTrainingData(m => m - 1);
      setPredictions(t => t + 1);
      setPendingPredictions(u => u + 1);
      playBeep(400, 'square', 0.05);
    } else {
      playBeep(150, 'square', 0.1); // Error
    }
  };

  const buyTrainingData = () => {
    if (budget >= dataPrice) {
      setBudget(f => f - dataPrice);
      setTrainingData(m => m + 1000);
      playBeep(600, 'sine', 0.1);
    }
  };

  const buyPublication = () => {
    if (budget >= publicationCost) {
      setBudget(f => f - publicationCost);
      setPublicationLevel(m => m + 1);
      playBeep(800, 'triangle', 0.1);
    }
  };

  const buyNeuralNetwork = () => {
    if (budget >= nnCost) {
      setBudget(f => f - nnCost);
      setNeuralNetworks(a => a + 1);
      playBeep(1000, 'sine', 0.1);
    }
  };

  const buyProcessor = () => {
    if (availableInfluence > 0) {
      setProcessors(p => p + 1);
      playBeep(700, 'square', 0.1);
    }
  }

  const buyMemory = () => {
    if (availableInfluence > 0) {
      setMemory(m => m + 1);
      playBeep(700, 'square', 0.1);
    }
  }

  const completeProject = (proj: Project) => {
    if (completedProjects.includes(proj.id)) return;
    if (proj.costOps && ops >= proj.costOps) {
      setOps(o => o - proj.costOps!);
      setCompletedProjects(p => [...p, proj.id]);
      addLog(`Project Complete: ${proj.name}`, 'good');
      playBeep(1200, 'triangle', 0.2);
    } else if (proj.costAlgo && algorithms >= proj.costAlgo) {
      setAlgorithms(a => a - proj.costAlgo!);
      setCompletedProjects(p => [...p, proj.id]);
      addLog(`Project Complete: ${proj.name}`, 'good');
      playBeep(1200, 'triangle', 0.2);
    }
  }

  const raiseGrant = () => setPredictionGrant(f => +(f + 0.01).toFixed(2));
  const lowerGrant = () => setPredictionGrant(f => Math.max(0.01, +(f - 0.01).toFixed(2)));

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(Math.floor(num));
  const formatMoney = (num: number) => '$' + num.toFixed(2);

  // Chart Rendering
  const renderChart = () => {
    if (!unlocks.chart || budgetHistory.length < 2) return null;
    const max = Math.max(...budgetHistory, 10);
    const min = Math.min(...budgetHistory, 0);
    const height = 100;
    
    const points = budgetHistory.map((val, i) => {
      const x = (i / 59) * 100; 
      const y = height - ((val - min) / (max - min)) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="border-t-2 border-black mt-8 pt-4">
        <h2 className="text-lg font-bold mb-2">Budget Performance (60s)</h2>
        <div className="w-full h-[100px] bg-neutral-50 relative border border-neutral-200">
          <svg width="100%" height="100%" preserveAspectRatio="none" className="overflow-visible">
            <polyline points={points} fill="none" stroke="black" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="absolute top-0 right-1 text-[10px] text-neutral-400">{formatMoney(max)}</div>
          <div className="absolute bottom-0 right-1 text-[10px] text-neutral-400">{formatMoney(min)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full relative overflow-y-auto bg-white text-black font-mono selection:bg-neutral-300 pb-20">
      <div className="max-w-6xl mx-auto p-6 md:p-12">
        
        {/* Terminal Header & Logs */}
        <div className="border-b-4 border-black pb-4 mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Adastra AI Research</h1>
          
          <div className="bg-black text-emerald-400 p-3 mt-4 h-32 overflow-hidden flex flex-col justify-end text-xs rounded-sm shadow-inner">
            {logs.slice().reverse().map((log: any) => (
              <div key={log.id} className={`${log.type === 'bad' ? 'text-red-400' : log.type === 'good' ? 'text-cyan-400' : 'text-emerald-400'} opacity-90`}>
                <span className="text-neutral-500 mr-2">[{log.time}]</span>
                {log.text}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          
          {/* LEFT COLUMN */}
          <div className="space-y-10">
            
            {/* Make Prediction */}
            <div>
              <p className="text-xl font-bold mb-4">Predictions: {formatNumber(predictions)}</p>
              <button 
                onClick={handleMakePrediction}
                disabled={trainingData <= 0}
                className="px-8 py-3 border-2 border-black font-bold text-lg hover:bg-black hover:text-white transition-colors active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                Run Prediction
              </button>
            </div>

            {/* Research Lab */}
            <div className={`space-y-4 transition-opacity duration-1000 ${unlocks.research ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <h2 className="text-xl font-bold border-b-2 border-neutral-300 pb-1">Research Lab</h2>
              <div className="grid grid-cols-2 gap-4 text-base">
                <span className="font-semibold">Research Budget:</span>
                <span className="font-black text-lg text-emerald-600">{formatMoney(budget)}</span>
                
                <span className="font-semibold">Pending Verif.:</span>
                <span>{formatNumber(pendingPredictions)}</span>
                
                <span className="font-semibold flex items-center">
                  Grant/Prediction:
                </span>
                <span className="flex items-center gap-3">
                  <span className="w-16">{formatMoney(predictionGrant)}</span>
                  <button onClick={lowerGrant} className="w-6 h-6 border border-black flex items-center justify-center hover:bg-black hover:text-white">-</button>
                  <button onClick={raiseGrant} className="w-6 h-6 border border-black flex items-center justify-center hover:bg-black hover:text-white">+</button>
                </span>
                
                <span className="font-semibold">Academic Interest:</span>
                <span>{(academicInterest * 10).toFixed(0)}%</span>
              </div>
            </div>

            {/* Publishing */}
            {unlocks.publish && (
              <div className="space-y-3 animate-in fade-in duration-1000">
                <div className="grid grid-cols-2 gap-4 text-base">
                  <span className="font-semibold">Publication Level:</span>
                  <span>{publicationLevel}</span>
                  
                  <span className="font-semibold">Cost:</span>
                  <span>{formatMoney(publicationCost)}</span>
                </div>
                <button 
                  onClick={buyPublication}
                  disabled={budget < publicationCost}
                  className="px-4 py-1.5 text-sm border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  Publish Paper
                </button>
              </div>
            )}
            
          </div>

          {/* MIDDLE COLUMN */}
          <div className="space-y-10">
            
            {/* Data Engineering */}
            <div className={`space-y-4 transition-opacity duration-1000 ${unlocks.data ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <h2 className="text-xl font-bold border-b-2 border-neutral-300 pb-1">Data Engineering</h2>
              <div className="grid grid-cols-2 gap-4 text-base">
                <span className="font-semibold">Training Data:</span>
                <span>{formatNumber(trainingData)} MB</span>
                
                <span className="font-semibold">Data Cost:</span>
                <span className="font-bold">{formatMoney(dataPrice)}</span>
              </div>
              <button 
                onClick={buyTrainingData}
                disabled={budget < dataPrice}
                className="px-4 py-1.5 text-sm border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Buy Training Data (1000 MB)
              </button>
            </div>

            {/* Neural Networks */}
            {unlocks.models && (
              <div className="space-y-3 animate-in fade-in duration-1000 border-t-2 border-neutral-100 pt-6">
                <div className="grid grid-cols-2 gap-4 text-base">
                  <span className="font-semibold">Neural Networks:</span>
                  <span>{neuralNetworks}</span>
                  
                  <span className="font-semibold">Cost:</span>
                  <span>{formatMoney(nnCost)}</span>
                </div>
                <button 
                  onClick={buyNeuralNetwork}
                  disabled={budget < nnCost}
                  className="px-4 py-1.5 text-sm border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  Train Neural Network
                </button>
              </div>
            )}

            {renderChart()}

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-10">
            {/* Computing Resources */}
            <div className={`space-y-4 transition-opacity duration-1000 ${unlocks.compute ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <h2 className="text-xl font-bold border-b-2 border-neutral-300 pb-1">Computing Resources</h2>
              <div className="grid grid-cols-2 gap-4 text-base">
                <span className="font-semibold">Influence:</span>
                <span>{influence}</span>

                <span className="font-semibold">Processors:</span>
                <span className="flex items-center gap-3">
                  {processors}
                  <button onClick={buyProcessor} disabled={availableInfluence <= 0} className="w-5 h-5 border border-black flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-50">+</button>
                </span>

                <span className="font-semibold">Memory:</span>
                <span className="flex items-center gap-3">
                  {memory}
                  <button onClick={buyMemory} disabled={availableInfluence <= 0} className="w-5 h-5 border border-black flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-50">+</button>
                </span>

                <span className="font-semibold">Operations:</span>
                <span>{formatNumber(ops)} / {formatNumber(maxOps)}</span>

                {algorithms > 0 && (
                  <>
                    <span className="font-semibold">Algorithms:</span>
                    <span>{formatNumber(algorithms)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Projects */}
            {unlocks.projects && (
              <div className="space-y-3 animate-in fade-in duration-1000">
                <h2 className="text-xl font-bold border-b-2 border-neutral-300 pb-1">Strategic AI Projects</h2>
                <div className="space-y-2">
                  {STRATEGIC_PROJECTS.filter(p => !completedProjects.includes(p.id)).map(proj => {
                    const canAfford = (proj.costOps && ops >= proj.costOps) || (proj.costAlgo && algorithms >= proj.costAlgo);
                    const costText = proj.costOps ? `${formatNumber(proj.costOps)} Ops` : `${formatNumber(proj.costAlgo!)} Algos`;
                    return (
                      <button 
                        key={proj.id}
                        onClick={() => completeProject(proj)}
                        disabled={!canAfford}
                        className="w-full text-left p-2 border border-black hover:bg-neutral-100 transition-colors disabled:opacity-50 flex flex-col"
                      >
                        <div className="flex justify-between font-bold">
                          <span>{proj.name}</span>
                          <span className="font-mono text-sm">{costText}</span>
                        </div>
                        <span className="text-xs text-neutral-600 mt-1">{proj.desc}</span>
                      </button>
                    );
                  })}
                  {STRATEGIC_PROJECTS.filter(p => !completedProjects.includes(p.id)).length === 0 && (
                    <div className="text-sm text-neutral-500 italic">No projects available.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Academic Disclaimer */}
        <div className="mt-24 pt-4 border-t border-dashed border-neutral-300 text-[10px] text-neutral-500 text-center uppercase tracking-widest">
          Academic Research Only. No real funds involved.
        </div>
      </div>
    </div>
  );
}
