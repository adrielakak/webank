import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import type { StockPoint } from '../../types';
import AIResearchLab from './AIResearchLab';

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

// Web Audio API for satisfying "pop" collisions using singleton AudioContext
const playBounce = (velocity: number) => {
  if (velocity < 1.5) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Pitch based on velocity (higher velocity = slightly higher pitch)
    osc.frequency.setValueAtTime(300 + velocity * 15, ctx.currentTime);
    osc.type = 'sine';
    
    // Volume based on velocity
    const vol = Math.min(0.3, velocity * 0.02);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch(e) {}
};

const getSectorEmoji = (sector: string) => {
  const s = sector.toLowerCase();
  if (s.includes('tech') || s.includes('it') || s.includes('inform')) return '💻';
  if (s.includes('finan') || s.includes('bank')) return '🏦';
  if (s.includes('health') || s.includes('med')) return '🏥';
  if (s.includes('energy') || s.includes('oil')) return '⚡';
  if (s.includes('consum') || s.includes('retail')) return '🛒';
  if (s.includes('indus') || s.includes('manufact')) return '🏭';
  if (s.includes('real est')) return '🏢';
  return '📦'; 
}

export default function GameMode({ stocks }: { stocks: StockPoint[] }) {
  const [easterEggClicks, setEasterEggClicks] = useState(0);
  const [selectedStock, setSelectedStock] = useState<StockPoint | null>(null);
  const selectedStockRef = useRef<StockPoint | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (easterEggClicks >= 5 || !canvasRef.current || !containerRef.current || stocks.length === 0) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const engine = Matter.Engine.create();
    engine.gravity.y = 0; 
    
    // 1. Group sectors and create attractors
    const sectors = Array.from(new Set(stocks.map(s => s.sector || 'Unknown')));
    const attractors: Record<string, {x: number, y: number, color: string}> = {};
    const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
    
    sectors.forEach((sec, i) => {
      const angle = (i / sectors.length) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.4;
      attractors[sec] = {
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        color: colors[i % colors.length]
      };
    });

    // 2. Create Stock Bodies
    const bodyMap = new Map<Matter.Body, { stock: StockPoint, color: string }>();
    const renderStocks = stocks.slice(0, 200);

    const bodies = renderStocks.map(stock => {
      const size = Math.max(15, Math.min(45, (stock.market_equity || 1000) / 100));
      const sec = stock.sector || 'Unknown';
      const body = Matter.Bodies.circle(
        Math.random() * width,
        Math.random() * height,
        size,
        {
          restitution: 0.9,
          frictionAir: 0.02,
          density: size * 0.001
        }
      );
      bodyMap.set(body, { stock, color: attractors[sec]?.color || '#999' });
      return body;
    });

    Matter.Composite.add(engine.world, bodies);

    // 3. Mouse Interaction
    const mouse = Matter.Mouse.create(canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    Matter.Composite.add(engine.world, mouseConstraint);

    // Click Detection for Tooltip
    Matter.Events.on(mouseConstraint, 'mousedown', () => {
      if (mouseConstraint.body) {
        const data = bodyMap.get(mouseConstraint.body);
        if (data) {
          setSelectedStock(data.stock);
          selectedStockRef.current = data.stock;
        }
      } else {
        setSelectedStock(null);
        selectedStockRef.current = null;
      }
    });

    // 4. Attractor Forces
    Matter.Events.on(engine, 'beforeUpdate', () => {
      bodies.forEach(body => {
        if (mouseConstraint.body === body) return; 
        
        const data = bodyMap.get(body);
        if (!data) return;
        const target = attractors[data.stock.sector || 'Unknown'];
        if (!target) return;
        
        const dx = target.x - body.position.x;
        const dy = target.y - body.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 20) {
          const forceMag = 0.000003 * body.mass;
          Matter.Body.applyForce(body, body.position, {
            x: (dx / dist) * forceMag,
            y: (dy / dist) * forceMag
          });
        }
      });
    });

    // 5. Collision sounds
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach(pair => {
        const vA = pair.bodyA.velocity;
        const vB = pair.bodyB.velocity;
        const relVel = Math.sqrt(Math.pow(vA.x - vB.x, 2) + Math.pow(vA.y - vB.y, 2));
        playBounce(relVel);
      });
    });

    // 6. Obstacles & Walls
    const titleObstacle = Matter.Bodies.rectangle(200, 100, 400, 200, { 
      isStatic: true, 
      restitution: 0.8
    });

    const wallOptions = { isStatic: true, restitution: 1 };
    Matter.Composite.add(engine.world, [
      titleObstacle, // Prevents balls from hiding under the title text
      Matter.Bodies.rectangle(width/2, -50, width, 100, wallOptions),
      Matter.Bodies.rectangle(width/2, height+50, width, 100, wallOptions),
      Matter.Bodies.rectangle(-50, height/2, 100, height, wallOptions),
      Matter.Bodies.rectangle(width+50, height/2, 100, height, wallOptions),
    ]);

    // Run Engine
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    // Custom Canvas Render Loop
    let reqId: number;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Sector Areas
      Object.entries(attractors).forEach(([sec, attr]) => {
        ctx.fillStyle = attr.color;
        ctx.globalAlpha = 0.03; 
        ctx.beginPath();
        ctx.arc(attr.x, attr.y, 140, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 0.15;
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sec, attr.x, attr.y);
      });

      // Draw Stock Balls
      ctx.globalAlpha = 1;
      bodies.forEach(body => {
        const data = bodyMap.get(body);
        if (!data) return;

        const r = body.circleRadius!;
        const isHovered = mouseConstraint.body === body;
        const isSelected = selectedStockRef.current?.stkcd === data.stock.stkcd;

        // 3D Shiny Sphere Gradient
        const grad = ctx.createRadialGradient(
          body.position.x - r * 0.3,
          body.position.y - r * 0.35,
          r * 0.05,
          body.position.x,
          body.position.y,
          r
        );
        if (isHovered || isSelected) {
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.4, '#f1f5f9');
          grad.addColorStop(0.9, data.color);
          grad.addColorStop(1, '#0f172a');
        } else {
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, data.color);
          grad.addColorStop(0.85, data.color);
          grad.addColorStop(1, 'rgba(0,0,0,0.7)');
        }

        ctx.beginPath();
        ctx.arc(body.position.x, body.position.y, r, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.shadowColor = data.color;
        ctx.shadowBlur = (isHovered || isSelected) ? 18 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Specular highlight gleam
        ctx.beginPath();
        ctx.ellipse(
          body.position.x - r * 0.32,
          body.position.y - r * 0.35,
          r * 0.32,
          r * 0.16,
          -Math.PI / 4,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.fill();

        // Border ring
        ctx.beginPath();
        ctx.arc(body.position.x, body.position.y, r, 0, 2 * Math.PI);
        ctx.lineWidth = (isHovered || isSelected) ? 3 : 1;
        ctx.strokeStyle = (isHovered || isSelected) ? '#ffffff' : 'rgba(255,255,255,0.4)';
        ctx.stroke();

        // Industry Emoji
        ctx.font = `${Math.max(12, r * 0.7)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(getSectorEmoji(data.stock.sector || ''), body.position.x, body.position.y - r * 0.15);

        // Ticker Text
        const ticker = String(data.stock.stkcd).padStart(6, '0').slice(-4);
        ctx.fillStyle = (isHovered || isSelected) ? '#000' : '#fff';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.strokeStyle = (isHovered || isSelected) ? '#fff' : '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(ticker, body.position.x, body.position.y + r * 0.5);
        ctx.fillText(ticker, body.position.x, body.position.y + r * 0.5);
      });

      reqId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(reqId);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    };
  }, [stocks, easterEggClicks]); // Removed selectedStock to prevent physics restart

  // Secret Easter Egg Trigger
  if (easterEggClicks >= 5) {
    return <AIResearchLab stocks={stocks} />;
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] text-white relative">
      
      {/* Title Header */}
      <div className="absolute top-6 left-6 z-10 p-5 bg-black/60 backdrop-blur-md border border-neutral-800 rounded-xl pointer-events-none">
        <h2 className="text-3xl font-black font-mono tracking-tighter">Market Physics</h2>
        <p className="text-neutral-300 max-w-sm mt-2 text-sm leading-relaxed">
          Interactive stock network. Grab and throw nodes to test resilience. Stocks naturally cluster into crowded industry hubs. Listen to market collisions.
        </p>
      </div>

      {/* Selected Stock Info Panel */}
      {selectedStock && (
        <div className="absolute top-6 right-6 z-10 p-6 w-80 bg-black/80 backdrop-blur-xl border border-neutral-700 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-right-8 duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-3xl font-black tracking-tight">{String(selectedStock.stkcd).padStart(6, '0')}</h3>
              <p className="text-neutral-400 text-sm font-medium">{selectedStock.sector || 'Unknown'}</p>
            </div>
            <span className="text-4xl bg-white/10 p-3 rounded-full">{getSectorEmoji(selectedStock.sector || '')}</span>
          </div>
          
          <div className="space-y-4 text-sm font-mono">
            <div className="flex justify-between border-b border-neutral-800 pb-2">
              <span className="text-neutral-500">Market Equity</span>
              <span className="font-bold text-emerald-400">${(selectedStock.market_equity || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-800 pb-2">
              <span className="text-neutral-500">Predicted Risk</span>
              <span className="font-bold text-orange-400">{selectedStock.risk_label || `Level ${selectedStock.predicted_risk}`}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-800 pb-2">
              <span className="text-neutral-500">Idiosyncratic Vol.</span>
              <span className="font-bold">{(selectedStock.risk_x || 0).toFixed(4)}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-neutral-500">Monthly Return</span>
              <span className={`font-bold ${selectedStock.return_y > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(selectedStock.return_y || 0).toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Physics Canvas */}
      <div ref={containerRef} className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Secret Easter Egg Button */}
      <button 
        onClick={() => setEasterEggClicks(c => c + 1)}
        className="absolute bottom-4 right-4 text-[10px] font-mono text-neutral-800 hover:text-neutral-500 transition-colors bg-transparent border-none outline-none select-none"
      >
        [INIT_LAB_{easterEggClicks}/5]
      </button>
    </div>
  );
}
