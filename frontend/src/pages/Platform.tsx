import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AreaChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { 
  BarChart2, 
  Compass, 
  Activity, 
  Settings, 
  Search,
  Bell,
  LogOut,
  ChevronDown,
  Loader2,
  Menu,
  Sliders,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Info,
  TrendingUp,
  ArrowUpRight,
  Briefcase,
  MessageSquare,
  ArrowRight
} from "lucide-react";
import { fetchDates, fetchStocks, fetchStockDetail, fetchStats, fetchBacktest } from "../api";
import type { StockPoint, StockDetail, MarketStats, BacktestResponse, BacktestMonthSeries } from "../types";
const GameMode = lazy(() => import("../components/platform/GameMode"));
import RiskAssessmentModal from "../components/platform/RiskAssessmentModal";
import PortfolioRecommendationModal from "../components/platform/PortfolioRecommendationModal";
import AdviserChatDrawer from "../components/platform/AdviserChatDrawer";

interface PlatformProps {
  onNavigateHome: () => void;
  initialOpenAssessment?: boolean;
  initialProfile?: string;
}

export default function Platform({ 
  onNavigateHome,
  initialOpenAssessment = false,
  initialProfile
}: PlatformProps) {
  const [activeTab, setActiveTab] = useState("discover");
  const [isGameMode, setIsGameMode] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasCompletedKYC, setHasCompletedKYC] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("adastra_kyc_completed") === "true";
    }
    return false;
  });
  const [profile, setProfile] = useState<string>(() => {
    if (initialProfile) return initialProfile;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("adastra_investor_profile");
      if (saved) return saved;
    }
    return "R3";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const kycDone = localStorage.getItem("adastra_kyc_completed") === "true";
      if (!kycDone) return true;
    }
    return (
      initialOpenAssessment ||
      (typeof window !== "undefined" &&
        (window.location.hash.includes("kyc=true") ||
          window.location.hash.includes("assessment=true")))
    );
  });
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [_assessmentResult, setAssessmentResult] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [availableStocks, setAvailableStocks] = useState<StockPoint[]>([]);
  const [externalSelectedStkcd, setExternalSelectedStkcd] = useState<number | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSynthetic, setIsSynthetic] = useState<boolean>(false);
  const [chatTrigger, setChatTrigger] = useState(0);

  const searchMatches = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const q = searchQuery.trim().toLowerCase();
    return availableStocks
      .filter(s => {
        const code = s.stkcd.toString();
        const padded = code.padStart(6, '0');
        const sector = (s.sector || '').toLowerCase();
        return code.includes(q) || padded.includes(q) || sector.includes(q);
      })
      .slice(0, 6);
  }, [searchQuery, availableStocks]);

  const handleExitPlatform = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adastra_kyc_completed");
      localStorage.removeItem("adastra_session_token");
    }
    onNavigateHome();
  };

  useEffect(() => {
    async function loadDates() {
      try {
        const res = await fetchDates();
        setAvailableDates(res.dates);
        if (res.dates.length > 0) {
          setSelectedDate(res.dates[0]); // Default to first available date
        }
        if (res.is_synthetic !== undefined) {
          setIsSynthetic(res.is_synthetic);
        }
      } catch (err) {
        console.error("Failed to fetch dates", err);
      }
    }
    loadDates();
  }, []);

  useEffect(() => {
    if (initialOpenAssessment) {
      setIsAssessmentOpen(true);
    }
  }, [initialOpenAssessment]);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
    }
  }, [initialProfile]);

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-neutral-50 font-sans overflow-hidden selection:bg-emerald-500/30">
      {/* Sidebar Navigation */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            key="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40"
          />
        )}
        {isSidebarOpen && (
          <motion.aside 
            key="sidebar-panel"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-64 border-r border-neutral-800/50 bg-[#0a0a0a] flex flex-col z-50 shadow-2xl"
          >
            <div className="h-14 flex items-center px-6 border-b border-neutral-800/50 shrink-0">
              <div className="flex items-center gap-2 font-medium tracking-wide cursor-pointer" onClick={onNavigateHome}>
                <span className="font-semibold tracking-tighter text-neutral-50">Adastra</span>
                <span className="text-neutral-500 font-light">PRO</span>
              </div>
            </div>
            
            <div className="p-4 flex-1 flex flex-col gap-1">
              <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest px-2 py-2 mb-2 flex items-center justify-between">
                <span>Wealth Advisory Flow</span>
                <span className="text-[9px] text-emerald-400 font-mono">CSRC</span>
              </div>
              
              <NavItem 
                icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />} 
                label="1. Risk Profiling (KYC)" 
                isActive={isAssessmentOpen} 
                onClick={() => { setIsAssessmentOpen(true); setIsSidebarOpen(false); }} 
              />
              <NavItem 
                icon={<Compass className="w-4 h-4 text-cyan-400" />} 
                label="2. Market Topology" 
                isActive={activeTab === "discover" && !isAssessmentOpen && !isPortfolioOpen} 
                onClick={() => { setActiveTab("discover"); setIsPortfolioOpen(false); setIsSidebarOpen(false); }} 
              />
              <NavItem 
                icon={<Briefcase className="w-4 h-4 text-blue-400" />} 
                label="3. My Portfolio" 
                isActive={isPortfolioOpen} 
                onClick={() => { setIsPortfolioOpen(true); setIsSidebarOpen(false); }} 
              />
              <NavItem 
                icon={<BarChart2 className="w-4 h-4 text-purple-400" />} 
                label="4. Alpha Track Record" 
                isActive={activeTab === "alpha"} 
                onClick={() => { setActiveTab("alpha"); setIsPortfolioOpen(false); setIsSidebarOpen(false); }} 
              />
            </div>
            
            <div className="p-4 border-t border-neutral-800/50">
              <NavItem 
                icon={<Settings className="w-4 h-4" />} 
                label="Settings" 
                isActive={activeTab === "settings"} 
                onClick={() => { setActiveTab("settings"); setIsSidebarOpen(false); }} 
              />
              <button 
                onClick={handleExitPlatform}
                className="w-full flex items-center gap-3 px-2 py-2 text-sm text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/50 rounded-md transition-colors mt-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit Platform</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a] relative h-screen">
        {/* Top Header */}
        <header className="h-14 border-b border-neutral-800/50 flex items-center justify-between px-4 md:px-6 shrink-0 bg-[#0a0a0a] z-30 w-full relative">
          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-neutral-400 pr-2">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-neutral-400 hover:text-neutral-50 p-1.5 rounded-md hover:bg-neutral-800 transition-colors shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="font-medium text-neutral-200 md:hidden flex items-center shrink-0" onClick={onNavigateHome}>Adastra <span className="mx-1 md:mx-2 text-neutral-600">/</span></span>
            <span className="capitalize hidden md:inline shrink-0">{activeTab}</span>
            <span className="text-neutral-600 hidden md:inline shrink-0">/</span>
            <span className="text-neutral-50 truncate hidden sm:inline">Chinese Equities Topology</span>
            <span className="text-neutral-50 truncate sm:hidden">Topology</span>
            
            {availableDates.length > 0 && (
              <MonthYearPicker
                availableDates={availableDates}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            )}
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* Academic IP Compliance / Data Source Badge */}
            {availableDates.length > 0 && (
              <div 
                className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-help ${
                  isSynthetic 
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/15" 
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15"
                }`}
                title={
                  isSynthetic
                    ? "Academic IP Protection Notice: To strictly comply with FinTechathon IP rules and commercial database licensing, this public cloud sandbox operates on synthetic academic benchmark distributions. Production backtests and quantitative validation are documented in the official audit report."
                    : "Live Production Dataset: Running on official historical China A-Share market records."
                }
              >
                {isSynthetic ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Academic IP Benchmark (Synthetic)</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span>Live Market Data (Production A-Shares)</span>
                  </>
                )}
              </div>
            )}

            <button 
              onClick={() => setIsGameMode(!isGameMode)}
              className={`text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-full font-medium transition-colors border ${isGameMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-50 border-neutral-800'}`}
            >
              {isGameMode ? "Exit Game Mode" : "Game Mode"}
            </button>
            <div 
              className="relative hidden md:block"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setIsSearchFocused(false);
                }
              }}
            >
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchMatches.length > 0) {
                    setExternalSelectedStkcd(searchMatches[0].stkcd);
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }
                }}
                placeholder="Search assets (e.g. 300044)..." 
                className="w-48 lg:w-64 bg-neutral-900/50 border border-neutral-800 rounded-md py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-neutral-700 transition-all text-neutral-50 placeholder:text-neutral-600"
              />

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {isSearchFocused && searchMatches.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 top-full mt-2 w-80 bg-[#0d0d0d] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-neutral-800/40"
                  >
                    <div className="px-3 py-1.5 text-[9px] uppercase tracking-wider text-neutral-500 bg-neutral-950/80 flex justify-between">
                      <span>Matching Assets</span>
                      <span>{searchMatches.length} results</span>
                    </div>
                    {searchMatches.map(m => (
                      <button
                        key={m.stkcd}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setExternalSelectedStkcd(m.stkcd);
                          setSearchQuery('');
                          setIsSearchFocused(false);
                        }}
                        className="w-full text-left p-2.5 hover:bg-neutral-800/60 cursor-pointer flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-semibold text-neutral-200 group-hover:text-emerald-400 transition-colors">
                            {String(m.stkcd).padStart(6, '0')}
                          </span>
                          <span className="text-[10px] text-neutral-400 truncate max-w-[100px]">
                            {m.sector}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-mono ${m.return_y >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {m.return_y >= 0 ? '+' : ''}{(m.return_y * 100).toFixed(1)}%
                          </span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                            style={{
                              backgroundColor: `${m.risk_color}1a`,
                              color: m.risk_color,
                              border: `1px solid ${m.risk_color}33`
                            }}
                          >
                            {m.risk_label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-neutral-400 hover:text-neutral-50 transition-colors relative flex items-center justify-center p-1"
              >
                <Bell className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-md shadow-lg overflow-hidden z-50 p-4 text-center"
                  >
                    <p className="text-sm text-neutral-400">No new notifications.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* CSRC Suitability Assessment Trigger */}
            <button
              onClick={() => setIsAssessmentOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all border border-neutral-800 rounded-full px-2.5 py-1"
              title="Take CSRC Investor Suitability Assessment"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">CSRC Assessment</span>
            </button>

            {/* Personalized Portfolio Trigger */}
            <button
              onClick={() => setIsPortfolioOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all border border-neutral-800 rounded-full px-2.5 py-1"
              title="View Compliant Wealth Portfolio"
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">My Portfolio</span>
            </button>

            <div className="w-px h-4 bg-neutral-800 mx-1 hidden md:block" />
            
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 transition-colors border border-neutral-800 rounded-full pl-1 pr-1 md:pr-3 py-1"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-[9px]">
                  {profile}
                </div>
                <span className="hidden md:inline">Profile</span>
                <ChevronDown className="w-3 h-3 text-neutral-500 hidden md:inline" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-neutral-800/80"
                  >
                    <div className="p-1">
                      <button 
                        onClick={() => { setIsAssessmentOpen(true); setIsProfileOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>Take Assessment</span>
                      </button>
                      <button 
                        onClick={() => { setIsPortfolioOpen(true); setIsProfileOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-blue-400 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Briefcase className="w-3.5 h-3.5 shrink-0" />
                        <span>View Portfolio</span>
                      </button>
                    </div>
                    <div className="p-1">
                      <div className="text-[10px] text-neutral-500 uppercase px-3 py-1 font-mono">
                        Switch Profile
                      </div>
                      {["R1", "R2", "R3", "R4", "R5"].map((p) => (
                        <button 
                          key={p}
                          onClick={() => { 
                            setProfile(p); 
                            if (typeof window !== "undefined") {
                              localStorage.setItem("adastra_investor_profile", p);
                            }
                            setIsProfileOpen(false); 
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${
                            profile === p ? "text-emerald-400 font-semibold bg-neutral-800" : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                          }`}
                        >
                          <span>Profile {p}</span>
                          {profile === p && <span className="text-[10px] text-emerald-400 font-mono">Active</span>}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-hidden flex relative">
          {activeTab === "discover" && (
            <DiscoverView 
              selectedDate={selectedDate} 
              onSelectDate={setSelectedDate}
              profile={profile} 
              isGameMode={isGameMode}
              externalSelectedStkcd={externalSelectedStkcd}
              onResetExternalStkcd={() => setExternalSelectedStkcd(null)}
              onStocksLoaded={setAvailableStocks}
              onOpenChat={(stkcd) => {
                setExternalSelectedStkcd(stkcd);
                setChatTrigger((prev) => prev + 1);
              }}
            />
          )}
          {activeTab === "alpha" && (
            <AlphaView 
              selectedDate={selectedDate} 
              onSelectStock={(stkcd) => {
                setExternalSelectedStkcd(stkcd);
                setActiveTab("discover");
              }}
            />
          )}
          {activeTab === "settings" && <SettingsView />}
        </div>

        {/* Wealth Advisory Modals & Conversational Agent */}
        <RiskAssessmentModal
          isOpen={isAssessmentOpen}
          isMandatory={!hasCompletedKYC}
          onClose={() => {
            const isCompleted =
              hasCompletedKYC ||
              (typeof window !== "undefined" &&
                localStorage.getItem("adastra_kyc_completed") === "true");
            if (!isCompleted) {
              onNavigateHome();
            } else {
              setIsAssessmentOpen(false);
            }
          }}
          onCancel={onNavigateHome}
          currentProfile={profile}
          onProfileAssessed={(newP, res) => {
            setProfile(newP);
            setAssessmentResult(res);
            setHasCompletedKYC(true);
            if (typeof window !== "undefined") {
              localStorage.setItem("adastra_kyc_completed", "true");
              localStorage.setItem("adastra_investor_profile", newP);
            }
            setIsAssessmentOpen(false);
          }}
          onOpenPortfolio={() => setIsPortfolioOpen(true)}
        />

        <PortfolioRecommendationModal
          isOpen={isPortfolioOpen}
          onClose={() => setIsPortfolioOpen(false)}
          profile={profile}
          selectedDate={selectedDate}
          onSelectStock={(stkcd) => {
            setExternalSelectedStkcd(stkcd);
            setActiveTab("discover");
          }}
          onOpenAssessment={() => setIsAssessmentOpen(true)}
        />

        <AdviserChatDrawer
          profile={profile}
          selectedDate={selectedDate}
          selectedStkcd={externalSelectedStkcd}
          onSelectStock={(stkcd) => {
            setExternalSelectedStkcd(stkcd);
            setActiveTab("discover");
          }}
          onOpenPortfolio={() => setIsPortfolioOpen(true)}
          onOpenAssessment={() => setIsAssessmentOpen(true)}
          forceOpenTrigger={chatTrigger}
        />
      </main>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-2 py-2 text-sm rounded-md transition-all relative ${
        isActive ? "text-neutral-50 font-medium" : "text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/50"
      }`}
    >
      <span className="relative z-10">{icon}</span>
      <span className="relative z-10">{label}</span>
    </button>
  );
}


// ─────────────────────────────────────────────────────────
// Views
// ─────────────────────────────────────────────────────────

function DiscoverView({ 
  selectedDate, 
  onSelectDate, 
  profile, 
  isGameMode,
  externalSelectedStkcd,
  onResetExternalStkcd,
  onStocksLoaded,
  onOpenChat
}: { 
  selectedDate: string | null, 
  onSelectDate?: (date: string) => void,
  profile: string, 
  isGameMode?: boolean,
  externalSelectedStkcd?: number | null,
  onResetExternalStkcd?: () => void,
  onStocksLoaded?: (stocks: StockPoint[]) => void,
  onOpenChat?: (stkcd: number) => void
}) {
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState<StockPoint[]>([]);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [selectedStkcd, setSelectedStkcd] = useState<number | null>(null);
  const [selectedStockInfo, setSelectedStockInfo] = useState<StockDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [colorMode, setColorMode] = useState<"risk" | "sector">("risk");
  const monthDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target as Node)) {
        setIsMonthDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMonthDropdownOpen(false);
  }, [selectedStkcd]);

  // Helper for humanizing factor names
  const humanizeFactor = (factor: string) => {
    const normalized = factor.toLowerCase().replace(/[\s_-]+/g, '_');
    const map: Record<string, string> = {
      age: 'Years Publicly Traded (Listing Age)',
      at_me: 'Assets-to-Market Equity',
      be_me: 'Book-to-Market Equity',
      beta_dimson_21d: 'Dimson Beta (21d)',
      betadown_252d: 'Downside Beta (252d)',
      bev_mev: 'Book Enterprise Value / Market EV',
      bidaskhl_21d: 'High-Low Bid-Ask Spread (21d)',
      cop_atl1: 'Cash Operating Profit / Assets',
      coskew_21d: 'Coskewness (21d)',
      distance_to_sma: 'Distance to 200d Moving Average',
      dolvol_126d: 'Dollar Trading Volume (126d)',
      dolvol_var_126d: 'Dollar Volume Variance (126d)',
      drawdown_proxy: 'Drawdown Risk Proxy',
      eq_dur: 'Equity Cash Flow Duration',
      eqnpo_12m: 'Net Payout Yield (12m)',
      gp_at: 'Gross Profit / Assets',
      inv_gr1: 'Investment Growth (1 Yr)',
      iskew_hxz4_21d: 'Idiosyncratic Skewness (21d)',
      ivol_capm_21d: 'Short-Term Idiosyncratic Vol (21d)',
      ivol_capm_252d: 'Idiosyncratic Volatility (252d)',
      ivol_ff3_21d: 'FF3 Idiosyncratic Volatility (21d)',
      market_equity: 'Market Capitalization',
      mispricing_mgmt: 'Management Mispricing Score',
      mispricing_perf: 'Performance Mispricing Score',
      momentum_reversal: 'Momentum Reversal Factor',
      news_pca_2_shock: 'Macro Sentiment News Shock (PCA-2)',
      news_pca_6_shock: 'Sector Sentiment News Shock (PCA-6)',
      news_pca_7_shock: 'Liquidity News Shock (PCA-7)',
      news_pca_8_shock: 'Regulatory News Shock (PCA-8)',
      news_pca_9_shock: 'Policy Sentiment Shock (PCA-9)',
      niq_at_chg1: 'Quarterly ROA Change',
      niq_be_chg1: 'Quarterly ROE Change',
      ocf_me: 'Operating Cash Flow / Market Equity',
      opex_at: 'Operating Expenses / Assets',
      prc: 'Stock Price Level',
      prc_highprc_252d: '52-Week High Price Ratio',
      price_peer_reward_lag1: 'Peer Price Momentum Spillover (t-1)',
      qmj_safety: 'Quality-Minus-Junk Safety Factor',
      ret_12_1: '12-Month Momentum (12-1m)',
      ret_12_7: 'Intermediate Momentum (12-7m)',
      ret_1_0: '1-Month Short-Term Return',
      ret_3_1: '3-Month Momentum',
      ret_6_1: '6-Month Momentum',
      ret_9_1: '9-Month Momentum',
      rmax1_21d: 'Maximum Daily Return (21d)',
      rskew_21d: 'Realized Skewness (21d)',
      rvol_21d: 'Realized Volatility (21d)',
      sale_bev: 'Sales / Book Enterprise Value',
      sale_gr1: 'Sales Growth (1 Yr)',
      sale_gr3: 'Sales Growth (3 Yr)',
      seas_1_1an: 'Annual Seasonality Pattern',
      size_vol_ratio: 'Size-to-Volatility Ratio',
      sma_6m: '6-Month Simple Moving Average',
      tax_gr1a: 'Income Tax Growth (1 Yr)',
      tk_peer_reward_lag1: 'Prospect-Theory Peer Reward (t-1)',
      turnover_126d: 'Share Turnover (126d)',
      turnover_var_126d: 'Turnover Variance (126d)',
      vol_x_neg_momentum: 'Downside Vol × Negative Momentum',
      volatility_3m: '3-Month Realized Volatility',
      zero_trades_126d: 'Illiquidity (126d Zero Trades)',
      zero_trades_21d: 'Illiquidity (21d Zero Trades)',
    };
    if (map[normalized]) return map[normalized];
    return factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  // Use real 5-year history from backend if available, fallback to generation
  const historicalData = useMemo(() => {
    if (!selectedStockInfo) return [];
    if (selectedStockInfo.history_data && selectedStockInfo.history_data.length > 0) {
      return selectedStockInfo.history_data;
    }
    const target = selectedStockInfo.return_y * 100;
    
    // Simple seeded pseudo-random based on stkcd so it stays consistent
    const seed = selectedStockInfo.stkcd;
    const pseudoRandom = (i: number) => {
      const x = Math.sin(seed + i) * 10000;
      return x - Math.floor(x);
    };

    let currentVal = 0;
    const data = [{ month: "5Y Ago", value: currentVal }];
    
    for (let i = 1; i <= 60; i++) {
        const noise = (pseudoRandom(i) - 0.5) * (Math.abs(target) > 20 ? 15 : 5);
        const remainingSteps = 60 - i + 1;
        const requiredDrift = (target - currentVal) / remainingSteps;
        
        currentVal += requiredDrift + noise;
        if (i === 60) currentVal = target;
        
        // Format label
        let label = "";
        if (i === 12) label = "4Y Ago";
        else if (i === 24) label = "3Y Ago";
        else if (i === 36) label = "2Y Ago";
        else if (i === 48) label = "1Y Ago";
        else if (i === 60) label = "Today";
        else label = `Month -${60 - i}`;

        data.push({
            month: label,
            value: Number(currentVal.toFixed(2))
        });
    }
    return data;
  }, [selectedStockInfo]);

  // Calculate gradient offset for green (positive) / red (negative) split
  const gradientOffset = useMemo(() => {
    if (historicalData.length === 0) return 0;
    const dataMax = Math.max(...historicalData.map((i) => i.value));
    const dataMin = Math.min(...historicalData.map((i) => i.value));
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    return dataMax / (dataMax - dataMin);
  }, [historicalData]);
  
  const [showFrontier, setShowFrontier] = useState(true);
  const [showQuadrants, setShowQuadrants] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showImputed, setShowImputed] = useState(false);
  const [coreUniverseOnly, setCoreUniverseOnly] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Reset filter when color mode changes
  useEffect(() => {
    setActiveFilter(null);
  }, [colorMode]);

  const filteredStocks = useMemo(() => {
    let result = stocks;
    if (!showImputed) {
      result = result.filter(s => !s.is_imputed);
    }
    if (coreUniverseOnly) {
      result = [...result].sort((a, b) => (b.market_equity || 0) - (a.market_equity || 0)).slice(0, 1000);
    }
    
    if (activeFilter) {
      if (colorMode === "sector") {
        result = result.filter(s => (s.sector || "Unknown") === activeFilter);
      } else if (colorMode === "risk") {
        result = result.filter(s => {
          if (activeFilter === "Severe") return s.predicted_risk === 4;
          if (activeFilter === "High") return s.predicted_risk === 3;
          if (activeFilter === "Medium") return s.predicted_risk === 2;
          if (activeFilter === "Low") return s.predicted_risk === 1;
          if (activeFilter === "Alpha") return s.predicted_risk === 0;
          return true;
        });
      }
    }
    return result;
  }, [stocks, showImputed, coreUniverseOnly, activeFilter, colorMode]);

  // Generate distinct colors for sectors
  const sectorColors = useMemo(() => {
    const sectors = Array.from(new Set(filteredStocks.map(s => s.sector || "Unknown")));
    const colors: Record<string, string> = {};
    sectors.forEach((sector, i) => {
      const hue = (i * 137.508) % 360;
      colors[sector] = `hsl(${hue}, 70%, 60%)`;
    });
    return colors;
  }, [filteredStocks]);

  // Precompute gradient and shadow dictionaries for fast 60fps rendering
  const colorStyles = useMemo(() => {
    const styles: Record<string, { bg: string; shadow: string }> = {};
    const allColors = new Set<string>([
      "#34d399", "#3b82f6", "#f59e0b", "#f97316", "#ef4444", "#888"
    ]);
    Object.values(sectorColors).forEach(c => allColors.add(c));
    allColors.forEach(c => {
      styles[c] = {
        bg: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${c} 45%, ${c}dd 80%, rgba(0,0,0,0.85) 100%)`,
        shadow: `0 1px 4px rgba(0,0,0,0.7), 0 0 4px ${c}55`
      };
    });
    return styles;
  }, [sectorColors]);

  useEffect(() => {
    if (!selectedDate) return;
    
    async function loadData() {
      setLoading(true);
      try {
        const [stocksRes, statsRes] = await Promise.all([
          fetchStocks(selectedDate!),
          fetchStats(selectedDate!)
        ]);
        setStocks(stocksRes.stocks);
        if (onStocksLoaded) {
          onStocksLoaded(stocksRes.stocks);
        }
        setStats(statsRes);
      } catch (err) {
        console.error("Error fetching data", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [selectedDate, onStocksLoaded]);

  // Handle external stock selection from header search
  useEffect(() => {
    if (externalSelectedStkcd) {
      setSelectedStkcd(externalSelectedStkcd);
      setModalDate(selectedDate);
      if (onResetExternalStkcd) onResetExternalStkcd();
    }
  }, [externalSelectedStkcd, selectedDate, onResetExternalStkcd]);

  useEffect(() => {
    if (!selectedStkcd) {
      setSelectedStockInfo(null);
      return;
    }

    const queryDate = modalDate || selectedDate;
    if (!queryDate) return;

    async function loadDetail() {
      setLoadingDetail(true);
      try {
        const detail = await fetchStockDetail(selectedStkcd!, queryDate || undefined, profile);
        setSelectedStockInfo(detail);
      } catch (err) {
        console.error("Error fetching stock detail", err);
      } finally {
        setLoadingDetail(false);
      }
    }
    
    loadDetail();
  }, [selectedStkcd, modalDate, selectedDate, profile]);

  // Compute scales based on actual data limits
  const { minRisk, maxRisk, minReturn, maxReturn } = useMemo(() => {
    if (filteredStocks.length === 0) return { minRisk: 0, maxRisk: 1, minReturn: 0, maxReturn: 1 };
    
    let minRisk = Infinity, maxRisk = -Infinity;
    let minReturn = Infinity, maxReturn = -Infinity;
    
    filteredStocks.forEach(s => {
      if (s.risk_x < minRisk) minRisk = s.risk_x;
      if (s.risk_x > maxRisk) maxRisk = s.risk_x;
      if (s.return_y < minReturn) minReturn = s.return_y;
      if (s.return_y > maxReturn) maxReturn = s.return_y;
    });

    // Add some padding to max/min
    const riskPadding = (maxRisk - minRisk) * 0.05;
    const returnPadding = (maxReturn - minReturn) * 0.05;

    return { 
      minRisk: minRisk - riskPadding, 
      maxRisk: maxRisk + riskPadding, 
      minReturn: minReturn - returnPadding, 
      maxReturn: maxReturn + returnPadding 
    };
  }, [filteredStocks]);

  const zeroReturnPct = maxReturn > minReturn ? Math.max(0, Math.min(100, ((0 - minReturn) / (maxReturn - minReturn)) * 100)) : 50;

  const frontierPath = useMemo(() => {
    if (!filteredStocks || filteredStocks.length === 0) return "";
    
    // Create bins
    const numBins = 15;
    const rangeRisk = (maxRisk - minRisk) || 1;
    const rangeReturn = (maxReturn - minReturn) || 1;
    
    const bins = new Map<number, number>();
    filteredStocks.forEach(s => {
      const xPct = ((s.risk_x - minRisk) / rangeRisk) * 100;
      const yPct = ((s.return_y - minReturn) / rangeReturn) * 100;
      
      const bin = Math.floor(xPct / (100 / numBins));
      if (!bins.has(bin) || yPct > bins.get(bin)!) {
        bins.set(bin, yPct);
      }
    });

    const sortedBins = Array.from(bins.entries()).sort((a, b) => a[0] - b[0]);
    if (sortedBins.length === 0) return "";

    let path = "";
    sortedBins.forEach((entry, idx) => {
      const x = (entry[0] * (100 / numBins)) + (50 / numBins);
      const y = 100 - entry[1];
      const yOffset = -3;
      
      if (idx === 0) {
        path += `M ${x} ${y + yOffset}`;
      } else {
        const prevEntry = sortedBins[idx - 1];
        const prevX = (prevEntry[0] * (100 / numBins)) + (50 / numBins);
        const prevY = 100 - prevEntry[1] + yOffset;
        
        const cp1x = prevX + (x - prevX) / 2;
        const cp1y = prevY;
        const cp2x = prevX + (x - prevX) / 2;
        const cp2y = y + yOffset;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y + yOffset}`;
      }
    });
    
    return path;
  }, [filteredStocks, minRisk, maxRisk, minReturn, maxReturn]);

  const renderedDots = useMemo(() => {
    const rangeRisk = maxRisk - minRisk || 1;
    const rangeReturn = maxReturn - minReturn || 1;
    return filteredStocks.map((stock) => {
      const isSelected = selectedStkcd === stock.stkcd;
      const xPct = ((stock.risk_x - minRisk) / rangeRisk) * 100;
      const yPct = ((stock.return_y - minReturn) / rangeReturn) * 100;
      
      let color = stock.risk_color;
      let baseOpacity = 0.85;
      let baseSize = 5.5;
      
      if (colorMode === "sector") {
        color = sectorColors[stock.sector || "Unknown"] || "#888";
      } else {
        if (stock.predicted_risk === 0) {
          color = "#34d399";
          baseOpacity = 1;
          baseSize = 7.5;
        } else if (stock.predicted_risk === 1) {
          color = "#3b82f6";
          baseSize = 6;
        } else if (stock.predicted_risk === 2) {
          color = "#f59e0b";
          baseSize = 5.5;
        } else if (stock.predicted_risk === 3) {
          color = "#f97316";
          baseSize = 5.5;
        } else if (stock.predicted_risk >= 4) {
          color = "#ef4444";
          baseSize = 6;
        } else {
          color = stock.risk_color || "#3b82f6";
        }
      }
      
      const cached = colorStyles[color];
      const shinySphereBg = cached ? cached.bg : color;
      const ballShadow = isSelected
        ? `0 0 16px ${color}, 0 0 6px #ffffff, 0 2px 8px rgba(0,0,0,0.9)`
        : (stock.predicted_risk === 0 && colorMode === "risk")
          ? `0 0 10px ${color}bb, 0 0 4px #ffffff, 0 1px 4px rgba(0,0,0,0.6)`
          : (cached ? cached.shadow : `0 1px 4px rgba(0,0,0,0.7)`);
      
      return (
         <button 
           key={stock.stkcd} 
           onClick={() => {
             setSelectedStkcd(stock.stkcd);
             setModalDate(selectedDate);
           }}
           className={`absolute cursor-pointer rounded-full transform -translate-x-1/2 translate-y-1/2 hover:scale-175 hover:z-20 ${isSelected ? 'z-30 ring-2 ring-white scale-125' : 'z-10'} before:content-[''] before:absolute before:-inset-1.5 before:rounded-full`}
           style={{
             left: `${Math.min(Math.max(xPct, 0), 100)}%`,
             bottom: `${Math.min(Math.max(yPct, 0), 100)}%`,
             width: `${isSelected ? 13 : baseSize}px`,
             height: `${isSelected ? 13 : baseSize}px`,
             background: shinySphereBg,
             opacity: isSelected ? 1 : baseOpacity,
             boxShadow: ballShadow,
             border: isSelected ? "1.5px solid #fff" : "0.5px solid rgba(255,255,255,0.35)",
           }}
           title={`Stock ${stock.stkcd} | Risk: ${stock.risk_label} | Return: ${(stock.return_y * 100).toFixed(2)}%`}
         />
      );
    });
  }, [filteredStocks, selectedStkcd, colorMode, minRisk, maxRisk, minReturn, maxReturn, selectedDate, sectorColors]);

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full h-full min-w-0 relative overflow-y-auto md:overflow-hidden custom-scrollbar">
      {isGameMode ? (
        <div className="w-full h-full relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500">
              <Loader2 className="w-6 h-6 animate-spin mb-4" />
              <p className="text-sm">Loading Game Mode...</p>
            </div>
          ) : (
            <Suspense fallback={
              <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500">
                <Loader2 className="w-6 h-6 animate-spin mb-4 text-emerald-400" />
                <p className="text-sm">Initializing physics sandbox...</p>
              </div>
            }>
              <GameMode stocks={filteredStocks} />
            </Suspense>
          )}
        </div>
      ) : (
      <>
      {/* Topology Map */}
      <div className="w-full md:flex-1 h-[60vh] md:h-full flex flex-col min-w-0 relative shrink-0">
        <div className="p-4 md:p-6 border-b border-neutral-800/50 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base md:text-lg font-medium text-neutral-50">Market Topology</h2>
              <div className="group relative">
                <Info className="w-4 h-4 text-neutral-500 cursor-help" />
                <div className="absolute left-0 top-full mt-2 hidden group-hover:block w-80 p-3 bg-neutral-900 text-neutral-300 text-[10px] md:text-xs normal-case tracking-normal rounded-lg border border-neutral-700 shadow-xl z-50">
                  <p className="mb-2"><strong className="text-emerald-400">Y-Axis — Expected Return (Z-Score):</strong> Peer-based prospect expected return. Peers are identified via Tversky-Kahneman (TK) behavioral similarity over 5-year return distributions, then cross-sectionally standardized each month as a Z-score (μ = 0, σ = 1).</p>
                  <p className="mb-2"><strong className="text-red-400">X-Axis — Risk (Z-Score):</strong> Standardized risk score (volatility & news shock residual), cross-sectionally standardized each month: <code>Z = (risk − μ) / σ</code>.</p>
                  <p><strong>Quadrants:</strong> Top-Left (Opportunity), Top-Right (Speculative), Bottom-Left (Defensive), Bottom-Right (Avoid).</p>
                  <div className="mt-3 p-2 bg-[#050505] rounded border border-neutral-800">
                    <p className="text-[9px] uppercase tracking-widest text-neutral-500 mb-1">2023 Backtest (Mean Realized Return)</p>
                    <table className="w-full text-[10px]">
                      <tbody>
                        <tr className="text-emerald-400"><td>Opportunity (Top-Left)</td><td className="text-right">+0.358%</td></tr>
                        <tr className="text-neutral-300"><td>Defensive (Bottom-Left)</td><td className="text-right">+0.025%</td></tr>
                        <tr className="text-neutral-400"><td>Speculative (Top-Right)</td><td className="text-right">+0.013%</td></tr>
                        <tr className="text-red-400"><td>Avoid (Bottom-Right)</td><td className="text-right">-0.948%</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[10px] md:text-xs text-neutral-500">Visualizing Expected Return (Z-Score) vs Risk (Z-Score).</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-6">
            {stats && (
              <div className="flex gap-2 md:gap-4 md:mr-6">
                <div className="flex flex-col items-end hidden md:flex">
                  <span className="text-[9px] uppercase tracking-widest text-neutral-500">Assets</span>
                  <span className="font-mono text-xs md:text-sm">{stats.total_stocks.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] uppercase tracking-widest text-neutral-500">Avg Return</span>
                  <span className={`font-mono text-xs md:text-sm ${stats.avg_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {(stats.avg_return * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 md:gap-3 md:pl-6 md:border-l border-neutral-800">
              <div className="flex gap-1 bg-neutral-900 rounded-md p-1 border border-neutral-800 mr-2">
                <button 
                  onClick={() => setColorMode("risk")}
                  className={`text-[9px] px-2 py-1 rounded transition-colors ${colorMode === 'risk' ? 'bg-neutral-800 text-neutral-50' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  Risk
                </button>
                <button 
                  onClick={() => setColorMode("sector")}
                  className={`text-[9px] px-2 py-1 rounded transition-colors ${colorMode === 'sector' ? 'bg-neutral-800 text-neutral-50' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  Sector
                </button>
              </div>

              {colorMode === "risk" && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <button onClick={() => setActiveFilter(activeFilter === "Alpha" ? null : "Alpha")} className={`flex items-center gap-1 text-[9px] md:text-[10px] uppercase tracking-widest transition-colors ${activeFilter === "Alpha" ? "text-neutral-50 font-medium" : (activeFilter ? "text-neutral-600" : "text-neutral-400 hover:text-neutral-300")}`}>
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full" style={{ backgroundColor: "#34d399", boxShadow: "0 0 8px rgba(52,211,153,0.5)" }}></span>
                    <span className="hidden sm:inline">Alpha</span>
                  </button>
                  <button onClick={() => setActiveFilter(activeFilter === "Low" ? null : "Low")} className={`flex items-center gap-1 text-[9px] md:text-[10px] uppercase tracking-widest transition-colors ${activeFilter === "Low" ? "text-neutral-50 font-medium" : (activeFilter ? "text-neutral-600" : "text-neutral-400 hover:text-neutral-300")}`}>
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full" style={{ backgroundColor: "#3b82f6" }}></span>
                    <span className="hidden sm:inline">Low</span>
                  </button>
                  <button onClick={() => setActiveFilter(activeFilter === "Medium" ? null : "Medium")} className={`flex items-center gap-1 text-[9px] md:text-[10px] uppercase tracking-widest transition-colors ${activeFilter === "Medium" ? "text-neutral-50 font-medium" : (activeFilter ? "text-neutral-600" : "text-neutral-400 hover:text-neutral-300")}`}>
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full" style={{ backgroundColor: "#f59e0b" }}></span>
                    <span className="hidden sm:inline">Med</span>
                  </button>
                  <button onClick={() => setActiveFilter(activeFilter === "High" ? null : "High")} className={`flex items-center gap-1 text-[9px] md:text-[10px] uppercase tracking-widest transition-colors ${activeFilter === "High" ? "text-neutral-50 font-medium" : (activeFilter ? "text-neutral-600" : "text-neutral-400 hover:text-neutral-300")}`}>
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full" style={{ backgroundColor: "#f97316" }}></span>
                    <span className="hidden sm:inline">High</span>
                  </button>
                  <button onClick={() => setActiveFilter(activeFilter === "Severe" ? null : "Severe")} className={`flex items-center gap-1 text-[9px] md:text-[10px] uppercase tracking-widest transition-colors ${activeFilter === "Severe" ? "text-neutral-50 font-medium" : (activeFilter ? "text-neutral-600" : "text-neutral-400 hover:text-neutral-300")}`}>
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full" style={{ backgroundColor: "#ef4444" }}></span>
                    <span className="hidden sm:inline">Severe</span>
                  </button>
                </div>
              )}

              {colorMode === "sector" && (
                <div className="flex items-center gap-2 md:gap-3 flex-wrap max-w-[150px] md:max-w-xs">
                  {Object.entries(sectorColors).slice(0, 3).map(([sector, color]) => (
                    <button key={sector} onClick={() => setActiveFilter(activeFilter === sector ? null : sector)} className={`flex items-center gap-1 text-[9px] md:text-[10px] uppercase tracking-widest transition-colors ${activeFilter === sector ? "text-neutral-50 font-medium" : (activeFilter ? "text-neutral-600" : "text-neutral-400 hover:text-neutral-300")}`}>
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                      <span className="hidden sm:inline truncate max-w-[50px] md:max-w-[80px]" title={sector}>{sector}</span>
                    </button>
                  ))}
                  {Object.keys(sectorColors).length > 3 && (
                    <div className="text-[9px] text-neutral-500 relative group cursor-help py-1">
                      +{Object.keys(sectorColors).length - 3}
                      <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col gap-1 w-32 p-2 bg-neutral-800 text-neutral-300 text-[10px] normal-case tracking-normal rounded border border-neutral-700 shadow-xl z-50">
                        {Object.entries(sectorColors).slice(3).map(([sector, color]) => (
                          <button 
                            key={sector} 
                            onClick={() => setActiveFilter(activeFilter === sector ? null : sector)} 
                            className={`flex items-center gap-1.5 hover:bg-neutral-700/50 p-1 rounded text-left transition-colors ${activeFilter === sector ? "text-neutral-50 font-medium" : ""}`}
                          >
                             <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                             <span className="truncate" title={sector}>{sector}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Options dropdown */}
              <div className="relative ml-1 md:ml-2 pl-2 md:pl-3 border-l border-neutral-800">
                <button 
                  onClick={() => setShowOptions(!showOptions)}
                  className={`text-neutral-400 hover:text-neutral-50 p-1.5 rounded-md transition-colors ${showOptions ? 'bg-neutral-800 text-neutral-50' : 'hover:bg-neutral-800/50'}`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
                <AnimatePresence>
                  {showOptions && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-md shadow-xl z-50 p-3 flex flex-col gap-3"
                    >
                      <label className="flex items-center gap-2 text-[10px] md:text-xs text-neutral-300 cursor-pointer hover:text-neutral-50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={showFrontier} 
                          onChange={e => setShowFrontier(e.target.checked)} 
                          className="w-3 h-3 accent-emerald-500 rounded bg-neutral-800 border-neutral-700" 
                        />
                        Opportunity Frontier
                      </label>
                      <label className="flex items-center gap-2 text-[10px] md:text-xs text-neutral-300 cursor-pointer hover:text-neutral-50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={showImputed} 
                          onChange={e => setShowImputed(e.target.checked)} 
                          className="w-3 h-3 accent-emerald-500 rounded bg-neutral-800 border-neutral-700" 
                        />
                        Show Imputed Data
                      </label>
                      <label className="flex items-center gap-2 text-[10px] md:text-xs text-neutral-300 cursor-pointer hover:text-neutral-50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={coreUniverseOnly} 
                          onChange={e => setCoreUniverseOnly(e.target.checked)} 
                          className="w-3 h-3 accent-emerald-500 rounded bg-neutral-800 border-neutral-700" 
                        />
                        Core Universe (Top 1,000 Liquid)
                      </label>
                      <label className="flex items-center gap-2 text-[10px] md:text-xs text-neutral-300 cursor-pointer hover:text-neutral-50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={showQuadrants} 
                          onChange={e => setShowQuadrants(e.target.checked)} 
                          className="w-3 h-3 accent-emerald-500 rounded bg-neutral-800 border-neutral-700" 
                        />
                        Risk Quadrants
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 relative overflow-hidden bg-[#0a0a0a]">
           {loading ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500">
               <Loader2 className="w-6 h-6 animate-spin mb-4" />
               <p className="text-sm">Mapping market topology...</p>
             </div>
           ) : (
             <div className="absolute inset-0 overflow-hidden">
                 <div className="absolute bottom-1 md:bottom-4 left-1/2 -translate-x-1/2 text-[8px] md:text-[9px] uppercase tracking-widest text-neutral-400 font-mono z-10 pointer-events-none">Risk (Z-Score)</div>
                 <div className="absolute left-1 md:left-2 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-[8px] md:text-[9px] uppercase tracking-widest text-neutral-400 font-mono whitespace-nowrap z-10 pointer-events-none">Expected Return (Z-Score)</div>

                 <TransformWrapper
                    initialScale={1}
                    minScale={1}
                    maxScale={50}
                    limitToBounds={true}
                    disablePadding={true}
                    wheel={{ step: 0.1 }}
                    pinch={{ step: 5 }}
                 >
                    <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%' }}>
                       <div className="relative w-full h-full p-4 md:p-8">
                        {/* Axes */}
                        <div className="absolute bottom-6 md:bottom-12 left-6 md:left-12 right-6 md:right-12 h-px bg-neutral-800"></div>
                        <div className="absolute left-6 md:left-12 top-6 md:top-12 bottom-6 md:bottom-12 w-px bg-neutral-800"></div>
                
                {/* Zero line for return if zero is within bounds */}
                {minReturn < 0 && maxReturn > 0 && (
                  <div 
                    className="absolute left-6 md:left-12 right-6 md:right-12 h-px bg-neutral-800/40 border-t border-dashed border-neutral-700/50 z-0"
                    style={{ bottom: `${zeroReturnPct}%` }}
                  />
                )}
                
                {/* Quadrants */}
                {showQuadrants && (
                  <div className="absolute inset-8 md:inset-12 pointer-events-none z-0">
                    {/* Top Left - Alpha Zone */}
                    <div 
                      className="absolute left-0 top-0 border-b border-r border-emerald-500/20 bg-emerald-500/[0.03]"
                      style={{
                        height: `${100 - zeroReturnPct}%`, 
                        width: '50%'
                      }}
                    >
                      <span className="absolute top-2 left-2 text-[10px] text-emerald-500/40 font-medium uppercase tracking-wider">Alpha Zone</span>
                    </div>
                    {/* Bottom Right - Severe Risk Zone */}
                    <div 
                      className="absolute right-0 bottom-0 border-t border-l border-red-500/20 bg-red-500/[0.03]"
                      style={{
                        height: `${zeroReturnPct}%`, 
                        width: '50%'
                      }}
                    >
                      <span className="absolute bottom-2 right-2 text-[10px] text-red-500/40 font-medium uppercase tracking-wider">Severe Risk</span>
                    </div>
                  </div>
                )}

                {/* Opportunity Frontier */}
                {showFrontier && frontierPath && (
                  <svg 
                    className="absolute inset-8 md:inset-12 w-[calc(100%-4rem)] h-[calc(100%-4rem)] md:w-[calc(100%-6rem)] md:h-[calc(100%-6rem)] pointer-events-none z-0" 
                    viewBox="0 0 100 100" 
                    preserveAspectRatio="none"
                    style={{ overflow: 'visible' }}
                  >
                    <path 
                      d={frontierPath} 
                      fill="none" 
                      stroke="#34d399" 
                      strokeWidth="0.5" 
                      strokeDasharray="1, 1" 
                      className="opacity-60"
                    />
                  </svg>
                )}

                {/* Dots */}
                <div className="absolute inset-8 md:inset-12 [contain:layout_style_paint]">
                  {renderedDots}
                </div>
                     </div>
                    </TransformComponent>
                 </TransformWrapper>
             </div>
           )}
        </div>
      </div>
      </>
      )}
      
      {/* Foldable Stock Modal (Compact Single-Screen with Month Dropdown) */}
      <AnimatePresence>
        {(selectedStockInfo || loadingDetail) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6" 
            onClick={() => { setSelectedStkcd(null); setModalDate(null); setIsMonthDropdownOpen(false); }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="w-full max-h-[95vh] max-w-5xl lg:max-w-6xl bg-[#0a0a0a] rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.8)] border border-neutral-800 grid grid-cols-1 md:grid-cols-2 relative overflow-y-auto md:overflow-hidden custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              {loadingDetail && !selectedStockInfo ? (
                <div className="col-span-full flex flex-col items-center justify-center text-neutral-500 w-full min-h-[460px]">
                  <Loader2 className="w-6 h-6 animate-spin mb-4" />
                  <p className="text-sm">Loading asset profile...</p>
                </div>
              ) : selectedStockInfo ? (
                <>
                  {/* LEFT PANE: Quantitative & Historical */}
                  <div className={`w-full min-w-0 p-4 md:p-5 lg:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-800/80 bg-gradient-to-br from-[#111] to-[#0a0a0a] relative transition-opacity duration-200 ${loadingDetail ? 'opacity-70' : 'opacity-100'}`}>
                    <div>
                      {/* Header with Title + Sector + Risk Badge + Month Dropdown Menu Déroulant */}
                      <div className="flex justify-between items-start mb-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1 pr-2">
                            <div className="text-[10px] uppercase tracking-widest text-neutral-400">Asset Profile</div>
                            <div className="text-[11px] text-neutral-400 font-light truncate" title={selectedStockInfo.sector}>
                              Sector: <span className="text-neutral-200 font-normal">{selectedStockInfo.sector}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-2xl lg:text-3xl font-light text-neutral-50 tracking-tight">{String(selectedStockInfo.stkcd).padStart(6, '0')}</h3>
                            <div 
                              className="px-2 py-0.5 border rounded text-xs font-mono whitespace-nowrap"
                              style={{ 
                                backgroundColor: `${selectedStockInfo.risk_color}1a`, 
                                color: selectedStockInfo.risk_color,
                                borderColor: `${selectedStockInfo.risk_color}33`
                              }}
                            >
                              {selectedStockInfo.risk_label}
                            </div>

                            {/* Month Dropdown Menu Déroulant */}
                            {selectedStockInfo.timeline_2023 && selectedStockInfo.timeline_2023.length > 0 && (
                              <div className="relative" ref={monthDropdownRef}>
                                <button
                                  type="button"
                                  onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-700/80 hover:border-neutral-500 text-xs font-mono text-neutral-200 transition-all shadow-sm cursor-pointer hover:bg-neutral-800"
                                  title="Change observation month"
                                >
                                  <CalendarDays className="w-3.5 h-3.5 text-neutral-400" />
                                  <span>{(modalDate || selectedDate || selectedStockInfo.date).substring(0, 7)}</span>
                                  <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isMonthDropdownOpen && (
                                  <div className="absolute left-0 top-full mt-2 w-64 bg-[#0d0d0d] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-neutral-800/40 max-h-60 overflow-y-auto custom-scrollbar">
                                    <div className="px-3 py-2 text-[9px] uppercase tracking-wider text-neutral-400 bg-neutral-950 flex justify-between items-center">
                                      <span>Select 2023 Month</span>
                                      {modalDate && modalDate !== selectedDate && onSelectDate && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectDate(modalDate);
                                          }}
                                          className="text-[9px] text-emerald-400 hover:text-emerald-300 cursor-pointer font-medium"
                                          title="Sync market topology map to this month"
                                        >
                                          Sync Market
                                        </button>
                                      )}
                                    </div>
                                    {selectedStockInfo.timeline_2023.map((tm) => {
                                      const isSelected = tm.date === (modalDate || selectedDate);
                                      return (
                                        <button
                                          key={tm.date}
                                          onClick={() => {
                                            setModalDate(tm.date);
                                            setIsMonthDropdownOpen(false);
                                          }}
                                          className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                                            isSelected ? 'bg-neutral-800/90 font-semibold text-neutral-100' : 'hover:bg-neutral-800/50 text-neutral-300'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tm.risk_color }} />
                                            <span className="font-mono">{tm.month_label}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className={`font-mono text-xs ${tm.return_y >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                              {tm.return_y >= 0 ? '+' : ''}{tm.return_y.toFixed(1)}%
                                            </span>
                                            <span 
                                              className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                                              style={{
                                                backgroundColor: `${tm.risk_color}1a`,
                                                color: tm.risk_color,
                                                border: `1px solid ${tm.risk_color}33`
                                              }}
                                            >
                                              {tm.risk_label.replace(' Risk', '')}
                                            </span>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <button onClick={() => { setSelectedStkcd(null); setModalDate(null); setIsMonthDropdownOpen(false); }} className="md:hidden text-neutral-500 hover:text-neutral-300 transition-colors w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-900 cursor-pointer text-xs">✕</button>
                      </div>

                      {/* 4 Key Metrics in a clean, compact 2x2 Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {/* 1. AI Prediction Band */}
                        <div className="bg-neutral-900/60 rounded-xl p-2.5 border border-neutral-800/80 flex flex-col justify-between min-w-0">
                          <div className="text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="font-medium whitespace-nowrap">AI Prediction</span>
                          </div>
                          <div className={`text-sm sm:text-base md:text-lg font-mono font-bold whitespace-nowrap ${
                            selectedStockInfo.predicted_risk <= 1 ? 'text-emerald-400' : 
                            selectedStockInfo.predicted_risk === 2 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {selectedStockInfo.predicted_risk === 0 && '≥ +5.0%'}
                            {selectedStockInfo.predicted_risk === 1 && '0% to +5.0%'}
                            {selectedStockInfo.predicted_risk === 2 && '-5.0% to 0%'}
                            {selectedStockInfo.predicted_risk === 3 && '-10% to -5%'}
                            {selectedStockInfo.predicted_risk === 4 && '< -10.0%'}
                          </div>
                          <div className="text-[9px] text-neutral-400 mt-0.5 whitespace-nowrap font-mono">
                            {selectedStockInfo.risk_label} Band
                          </div>
                        </div>

                        {/* 2. Realized 1-Mo Return */}
                        <div className="bg-neutral-900/60 rounded-xl p-2.5 border border-neutral-800/80 flex flex-col justify-between min-w-0">
                          <div className="text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5 font-medium whitespace-nowrap">
                            Realized Return
                          </div>
                          <div className={`text-sm sm:text-base md:text-lg font-mono font-bold whitespace-nowrap ${
                            typeof selectedStockInfo.return_y === 'number' && selectedStockInfo.return_y >= 0 
                              ? 'text-emerald-400' 
                              : typeof selectedStockInfo.return_y === 'number' 
                              ? 'text-red-400' 
                              : 'text-neutral-400'
                          }`}>
                            {typeof selectedStockInfo.return_y === 'number' 
                              ? `${selectedStockInfo.return_y >= 0 ? '+' : ''}${(selectedStockInfo.return_y * 100).toFixed(2)}%` 
                              : 'N/A'}
                          </div>
                          <div className="text-[9px] text-neutral-400 mt-0.5 whitespace-nowrap font-mono">
                            Market Actual (1-Mo)
                          </div>
                        </div>

                        {/* 3. Idiosyncratic Volatility */}
                        <div className="bg-neutral-900/60 rounded-xl p-2.5 border border-neutral-800/80 flex flex-col justify-between min-w-0">
                          <div className="text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5 flex items-center gap-1 font-medium whitespace-nowrap">
                            <span>Idio. Volatility</span>
                            <Info className="w-2.5 h-2.5 text-neutral-500 cursor-help shrink-0" />
                          </div>
                          <div className="text-sm sm:text-base md:text-lg text-neutral-100 font-mono font-bold whitespace-nowrap">
                            {typeof selectedStockInfo.risk_x === 'number' ? `${(selectedStockInfo.risk_x * 100).toFixed(1)}%` : 'N/A'}
                          </div>
                          <div className="text-[9px] text-neutral-400 mt-0.5 whitespace-nowrap font-mono">
                            Annualized Risk
                          </div>
                        </div>

                        {/* 4. Market Cap */}
                        <div className="bg-neutral-900/60 rounded-xl p-2.5 border border-neutral-800/80 flex flex-col justify-between min-w-0">
                          <div className="text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5 font-medium whitespace-nowrap">
                            Market Cap
                          </div>
                          <div className="text-sm sm:text-base md:text-lg text-neutral-100 font-mono font-bold whitespace-nowrap">
                            {selectedStockInfo.market_equity ? `¥${(selectedStockInfo.market_equity / 1e3).toFixed(2)}B` : 'N/A'}
                          </div>
                          <div className="text-[9px] text-neutral-400 mt-0.5 whitespace-nowrap font-mono">
                            A-Share Float
                          </div>
                        </div>
                      </div>

                      {/* CSRC Regulatory Suitability & Risk Classification Verification */}
                      <div className="mb-2 p-2.5 bg-neutral-900/60 rounded-xl border border-neutral-800/80">
                        <div className="flex flex-wrap items-center justify-between gap-y-1 gap-x-2 mb-1.5">
                          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-neutral-400">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="font-medium whitespace-nowrap">CSRC Suitability Verification</span>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap ml-auto">
                            {selectedStockInfo.prob_severe_risk && selectedStockInfo.prob_severe_risk >= 0.15 && selectedStockInfo.accuracy_status === "UNDERESTIMATED_RISK" && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1 font-medium whitespace-nowrap" title="Asset displays elevated downside tail-risk (>15%). Conservative allocations restricted to preserve capital.">
                                <span>🛡️</span> Crash Guardrail
                              </span>
                            )}
                            {selectedStockInfo.accuracy_status === "EXACT_MATCH" && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-medium whitespace-nowrap">
                                <span>✓</span> Exact Match
                              </span>
                            )}
                            {selectedStockInfo.accuracy_status === "CONSERVATIVE_PROTECTION" && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1 font-medium whitespace-nowrap">
                                <span>🛡️</span> Protected (Safe)
                              </span>
                            )}
                            {selectedStockInfo.accuracy_status === "UNDERESTIMATED_RISK" && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-medium whitespace-nowrap">
                                <span>⚠️</span> Underestimated Risk
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-1.5 border-t border-neutral-800/60 text-xs">
                          <div>
                            <div className="text-[9px] text-neutral-500 mb-0.5 uppercase tracking-wide">Predicted Risk Category</div>
                            <div className="font-medium text-neutral-200 text-xs">
                              {selectedStockInfo.risk_label || 'N/A'}
                            </div>
                            <div className="text-[9px] text-neutral-400 mt-0.5 font-light">
                              {selectedStockInfo.predicted_risk === 0 && 'Target return: ≥ +5% (Class 0: No Risk)'}
                              {selectedStockInfo.predicted_risk === 1 && 'Target return: 0% to +5% (Class 1: Low Risk)'}
                              {selectedStockInfo.predicted_risk === 2 && 'Target return: -5% to 0% (Class 2: Medium Risk)'}
                              {selectedStockInfo.predicted_risk === 3 && 'Target return: -10% to -5% (Class 3: High Risk)'}
                              {selectedStockInfo.predicted_risk === 4 && 'Target return: < -10% (Class 4: Severe Risk)'}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-neutral-500 mb-0.5 uppercase tracking-wide">Realized Risk Category</div>
                            <div className="font-medium text-neutral-200 text-xs">
                              {selectedStockInfo.actual_risk_label || selectedStockInfo.risk_label || 'N/A'}
                            </div>
                            <div className="text-[9px] text-neutral-400 mt-0.5 font-light">
                              {selectedStockInfo.actual_risk === 0 && 'Actual return: ≥ +5% (Class 0: No Risk)'}
                              {selectedStockInfo.actual_risk === 1 && 'Actual return: 0% to +5% (Class 1: Low Risk)'}
                              {selectedStockInfo.actual_risk === 2 && 'Actual return: -5% to 0% (Class 2: Medium Risk)'}
                              {selectedStockInfo.actual_risk === 3 && 'Actual return: -10% to -5% (Class 3: High Risk)'}
                              {selectedStockInfo.actual_risk === 4 && 'Actual return: < -10% (Class 4: Severe Risk)'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5-Year Return Chart */}
                    <div className="mt-1">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-400 mb-1.5">
                        <span>
                          {historicalData && historicalData.length > 0 && historicalData.length < 55
                            ? `${(historicalData.length / 12).toFixed(1)}Y Historical Performance (Since Listing)`
                            : "5-Year Historical Performance"}
                        </span>
                        {historicalData && historicalData.length > 0 && (
                          <span className="font-mono text-neutral-500 normal-case tracking-normal text-[9px]">
                            ({historicalData[0].month} → {historicalData[historicalData.length - 1].month})
                          </span>
                        )}
                      </div>
                      <div className="h-32 sm:h-36 md:h-38 w-full bg-[#050505] rounded-xl border border-neutral-800/80 relative overflow-hidden flex items-end">
                        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:10px_10px]" />
                        <div className="w-full h-full relative z-10 pt-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historicalData} margin={{ top: 4, right: 4, left: 4, bottom: 2 }}>
                              <defs>
                                <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset={gradientOffset} stopColor="#10b981" stopOpacity={0.4}/>
                                  <stop offset={gradientOffset} stopColor="#ef4444" stopOpacity={0.4}/>
                                </linearGradient>
                                <linearGradient id="splitStroke" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset={gradientOffset} stopColor="#10b981" stopOpacity={1}/>
                                  <stop offset={gradientOffset} stopColor="#ef4444" stopOpacity={1}/>
                                </linearGradient>
                              </defs>
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#111', borderColor: '#333', fontSize: '11px', borderRadius: '6px', padding: '6px 10px' }}
                                itemStyle={{ color: '#fff', fontSize: '11px', padding: 0 }}
                                formatter={(val: any) => [`${Number(val) > 0 ? '+' : ''}${val}%`, 'Return']}
                                labelStyle={{ color: '#888', marginBottom: '2px', fontSize: '11px' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="url(#splitStroke)" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#splitColor)" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT PANE: XAI & Attribution */}
                  <div className={`w-full min-w-0 p-4 md:p-5 lg:p-6 flex flex-col justify-between bg-gradient-to-bl from-[#111] to-[#0a0a0a] relative transition-opacity duration-200 ${loadingDetail ? 'opacity-70' : 'opacity-100'}`}>
                    {/* Desktop Close button */}
                    <div className="hidden md:flex justify-end absolute top-4 right-4 z-30">
                      <button 
                        onClick={() => { setSelectedStkcd(null); setModalDate(null); setIsMonthDropdownOpen(false); }} 
                        className="text-neutral-500 hover:text-neutral-200 transition-colors w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-900 border border-transparent hover:border-neutral-800 cursor-pointer text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    <div>
                      {/* Explainability - SHAP */}
                      <div className="mb-2 mt-1 md:mt-0">
                        <div className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1.5 flex items-center justify-between pr-8">
                          <div className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-red-500" />
                            <span>Risk Factor Attribution</span>
                            <span className="text-[9px] font-mono text-emerald-400/90 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.2 rounded normal-case tracking-normal ml-1">
                              Local TreeSHAP
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {(() => {
                            const topFeatures = selectedStockInfo.shap_features?.slice(0, 5) || [];
                            const maxShap = Math.max(...topFeatures.map(f => Math.abs(f.value)), 0.001);
                            const totalShapSum = topFeatures.reduce((acc, f) => acc + Math.abs(f.value), 0) || 1;

                            return topFeatures.map((factor, i) => {
                              const sharePct = (Math.abs(factor.value) / totalShapSum) * 100;
                              const barWidthPct = Math.max((Math.sqrt(Math.abs(factor.value)) / Math.sqrt(maxShap)) * 100, 6);
                              const barColor = selectedStockInfo.risk_color || '#3b82f6';
                              const humanizedName = humanizeFactor(factor.feature);
                              
                              return (
                                <div key={i} className="flex flex-col gap-0.5 group/factor">
                                  <div className="flex justify-between items-baseline text-[11px]">
                                    <span className="text-neutral-300 truncate pr-2 font-light group-hover/factor:text-white transition-colors" title={`${humanizedName} (raw: ${factor.feature})`}>
                                      {humanizedName}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                                      <span className="text-neutral-300">
                                        {typeof factor.value === 'number' ? (factor.value >= 0 ? `+${factor.value.toFixed(4)}` : factor.value.toFixed(4)) : 'N/A'}
                                      </span>
                                      <span className="text-neutral-500 text-[9px]">
                                        ({sharePct.toFixed(1)}%)
                                      </span>
                                    </div>
                                  </div>
                                  <div className="h-1 bg-neutral-900 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full transition-all duration-300 group-hover/factor:brightness-125"
                                      style={{ width: `${barWidthPct}%`, backgroundColor: barColor, opacity: 0.85 }}
                                    />
                                  </div>
                                </div>
                              );
                            });
                          })()}
                          {(!selectedStockInfo.shap_features || selectedStockInfo.shap_features.length === 0) && (
                            <div className="text-xs text-neutral-600 italic">No attribution data available.</div>
                          )}
                        </div>
                        <div className="mt-1.5 text-[9px] text-neutral-500 font-mono border-t border-neutral-800/60 pt-1 flex items-center justify-between">
                          <span>Stock #{selectedStockInfo.stkcd} TreeSHAP</span>
                          <span className="text-neutral-600">61 Features Cross-Section</span>
                        </div>
                      </div>
                      
                      {/* Risk Distribution */}
                      <div className="mb-2">
                        <div className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Model Risk Classification</div>
                        <div className="flex items-end h-10 md:h-11 gap-1.5 bg-[#050505] p-2 rounded-xl border border-neutral-800/80">
                          {[
                            { label: "0", name: "No Risk (≥+5%)", val: selectedStockInfo.prob_no_risk || 0, color: "#34d399" },
                            { label: "1", name: "Low Risk (0 to +5%)", val: selectedStockInfo.prob_low_risk || 0, color: "#3b82f6" },
                            { label: "2", name: "Medium Risk (-5% to 0)", val: selectedStockInfo.prob_medium_risk || 0, color: "#f59e0b" },
                            { label: "3", name: "High Risk (-10% to -5%)", val: selectedStockInfo.prob_high_risk || 0, color: "#f97316" },
                            { label: "4", name: "Severe Risk (<-10%)", val: selectedStockInfo.prob_severe_risk || 0, color: "#ef4444" },
                          ].map((bucket, i) => (
                            <div 
                              key={i} 
                              className="flex-1 flex flex-col justify-end items-center gap-0.5 group relative h-full cursor-pointer"
                              title={`Class ${bucket.label}: ${bucket.name} : ${(bucket.val * 100).toFixed(1)}% probability`}
                            >
                              <span className="text-[9px] font-mono text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4 pointer-events-none whitespace-nowrap z-10 bg-black/90 px-1 rounded border border-neutral-800">
                                {(bucket.val * 100).toFixed(1)}%
                              </span>
                              <div 
                                className="w-full rounded transition-all opacity-85 group-hover:opacity-100" 
                                style={{ 
                                  height: `${Math.max(bucket.val * 100, 6)}%`,
                                  backgroundColor: bucket.color 
                                }} 
                              />
                              <div className="text-[9px] font-mono text-neutral-400 leading-none group-hover:text-white transition-colors">{bucket.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Regulatory Compliance & Audit */}
                      {selectedStockInfo.compliance && (
                        <div className="mb-2">
                          <div className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                            <span>Regulatory Compliance (CSRC)</span>
                          </div>
                          <div className={`p-2 rounded-xl border ${selectedStockInfo.compliance.is_compliant ? (selectedStockInfo.compliance.reason.includes("Warning") ? "bg-amber-900/10 border-amber-500/20" : "bg-emerald-900/10 border-emerald-500/20") : "bg-red-900/10 border-red-500/20"}`}>
                            <div className="flex items-start gap-2">
                              {selectedStockInfo.compliance.is_compliant ? (
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5 ${selectedStockInfo.compliance.reason.includes("Warning") ? "bg-amber-500/20 text-amber-500" : "bg-emerald-500/20 text-emerald-500"}`}>✓</div>
                              ) : (
                                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold bg-red-500/20 text-red-500 mt-0.5">✕</div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className={`text-[11px] leading-snug break-words font-medium ${selectedStockInfo.compliance.is_compliant ? "text-neutral-200" : "text-red-300"}`}>{selectedStockInfo.compliance.reason}</div>
                                <div className="text-[9px] font-mono text-neutral-500 flex items-center gap-1 mt-1">
                                  <span className="shrink-0 text-neutral-500 font-semibold">AUDIT HASH:</span>
                                  <span className="truncate block opacity-80 text-[8px] text-neutral-400 select-all" title={selectedStockInfo.compliance.audit_hash}>{selectedStockInfo.compliance.audit_hash}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AI Synthesis */}
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>AI Synthesis</span>
                        </div>
                        <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-900/30 p-2.5 rounded-xl border border-neutral-800 shadow-inner max-h-36 overflow-y-auto">
                          <p className="text-[11px] leading-relaxed text-neutral-300 font-light italic">
                            "{selectedStockInfo.xai_explanation || "Our AI model predicts the risk profile based on local SHAP attributions and macroeconomic news shock embeddings."}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Robo-Advisor CTA */}
                    {onOpenChat && (
                      <div className="mt-2 pt-2 border-t border-neutral-800/80">
                        <button
                          onClick={() => {
                            onOpenChat(selectedStockInfo.stkcd);
                            setSelectedStkcd(null);
                          }}
                          className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/10 hover:from-emerald-500/30 hover:to-teal-500/20 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 font-semibold text-xs tracking-wide shadow-md shadow-emerald-950/30 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                            <span>Chat with our robo advisor to explore more</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Additional Views
// ─────────────────────────────────────────────────────────

function AlphaView({ selectedDate, onSelectStock }: { selectedDate: string | null; onSelectStock: (stkcd: number) => void }) {
  const [data, setData] = useState<BacktestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "quadrants" | "picks">("overview");
  const [picksMode, setPicksMode] = useState<"month" | "all_time">("month");

  useEffect(() => {
    let isMounted = true;
    async function loadBacktest() {
      setLoading(true);
      try {
        const res = await fetchBacktest(selectedDate || undefined);
        if (isMounted) setData(res);
      } catch (err) {
        console.error("Failed to load backtest data", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBacktest();
    return () => { isMounted = false; };
  }, [selectedDate]);

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <span className="text-sm font-light">Loading institutional backtest track record...</span>
      </div>
    );
  }

  const { summary, monthly_series, quadrants, top_picks_all_time, month_picks, selected_month } = data;
  const currentPicks = picksMode === "month" ? (month_picks && month_picks.length > 0 ? month_picks : top_picks_all_time.slice(0, 6)) : top_picks_all_time;

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                2023 Out-of-Sample Backtest
              </span>
              <span className="text-xs text-neutral-500 font-mono">28,423 Point-in-Time Observations</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-light text-neutral-50 tracking-tight flex items-center gap-2.5">
              <span>Institutional Alpha Track Record</span>
            </h1>
            <p className="text-xs md:text-sm text-neutral-400 mt-1 max-w-2xl font-light">
              Empirical out-of-sample validation comparing the <span className="text-neutral-200 font-medium">Adastra Strategy</span> (Opportunity Quadrant) against the equal-weighted China A-Share market benchmark.
            </p>
          </div>

          {/* Subtab navigation pills */}
          <div className="flex items-center gap-1 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800 shrink-0">
            <button
              onClick={() => setActiveSubTab("overview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeSubTab === "overview" ? "bg-neutral-800 text-neutral-100 shadow" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setActiveSubTab("quadrants")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeSubTab === "quadrants" ? "bg-neutral-800 text-neutral-100 shadow" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              4-Quadrant Separation
            </button>
            <button
              onClick={() => setActiveSubTab("picks")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeSubTab === "picks" ? "bg-neutral-800 text-neutral-100 shadow" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <span>Alpha Conviction Picks</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-400">
                {currentPicks.length}
              </span>
            </button>
          </div>
        </div>

        {/* 4 Hero KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Return & Alpha */}
          <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-4.5 relative overflow-hidden group hover:border-neutral-700/80 transition-all">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500">Cumulative Return</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                +{summary.net_alpha}% Alpha
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-mono font-medium text-emerald-400 mb-1">
              +{summary.strategy_cum_return}%
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center justify-between">
              <span>Benchmark: <span className="font-mono text-neutral-300">+{summary.benchmark_cum_return}%</span></span>
              <span className="text-neutral-500 font-mono text-[10px]">{summary.monthly_win_rate}% Win Rate</span>
            </div>
          </div>

          {/* Card 2: Sharpe Ratio */}
          <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-4.5 relative overflow-hidden group hover:border-neutral-700/80 transition-all">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500">Sharpe Ratio</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-500/15 text-blue-400 border border-blue-500/20">
                3.6x Efficiency
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-mono font-medium text-neutral-100 mb-1">
              {summary.strategy_sharpe}
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center justify-between">
              <span>Benchmark: <span className="font-mono text-neutral-300">{summary.benchmark_sharpe}</span></span>
              <span className="text-neutral-500 text-[10px]">PBOC Rf 1.5%</span>
            </div>
          </div>

          {/* Card 3: Max Drawdown */}
          <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-4.5 relative overflow-hidden group hover:border-neutral-700/80 transition-all">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500">Max Drawdown</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                +2.39% Protected
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-mono font-medium text-amber-400 mb-1">
              {summary.strategy_max_dd}%
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center justify-between">
              <span>Benchmark: <span className="font-mono text-neutral-300">{summary.benchmark_max_dd}%</span></span>
              <span className="text-neutral-500 text-[10px]">Capital Preserved</span>
            </div>
          </div>

          {/* Card 4: Total Signals */}
          <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-4.5 relative overflow-hidden group hover:border-neutral-700/80 transition-all">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500">Alpha Opportunities</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/15 text-purple-400 border border-purple-500/20">
                {summary.win_months_count}/12 Mos Won
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-mono font-medium text-neutral-100 mb-1">
              {summary.total_signals.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center justify-between">
              <span>Coverage: <span className="font-mono text-neutral-300">All A-Shares</span></span>
              <span className="text-neutral-500 text-[10px]">Top-Left Quad</span>
            </div>
          </div>
        </div>

        {/* View 1: Performance Overview */}
        {activeSubTab === "overview" && (
          <div className="space-y-6">
            {/* Main Interactive Chart */}
            <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base font-medium text-neutral-100 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>2023 Cumulative Equity Curve</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 font-light">
                    Adastra Alpha Strategy (Opportunity Quadrant) vs Equal-Weighted ML Benchmark vs Avoid Filter
                  </p>
                </div>

                {/* Legend pills */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-emerald-400 rounded-full" />
                    <span className="text-neutral-300 font-mono text-[11px]">Adastra (+9.42%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-slate-400 rounded-full" />
                    <span className="text-neutral-400 font-mono text-[11px]">Market (+3.09%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-red-400 rounded-full" />
                    <span className="text-neutral-400 font-mono text-[11px]">Avoid Filter (-9.80%)</span>
                  </div>
                </div>
              </div>

              {/* Chart container */}
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly_series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="stratGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis 
                      dataKey="month_label" 
                      stroke="#737373" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={{ stroke: '#262626' }}
                    />
                    <YAxis 
                      stroke="#737373" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const pt = payload[0].payload as BacktestMonthSeries;
                        return (
                          <div className="bg-[#121212] border border-neutral-700/80 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[200px]">
                            <div className="font-semibold text-neutral-200 border-b border-neutral-800 pb-1 flex justify-between items-center">
                              <span>{pt.month_label}</span>
                              <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${pt.outperformed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400'}`}>
                                {pt.outperformed ? 'Outperformed' : 'Underperformed'}
                              </span>
                            </div>
                            <div className="flex justify-between text-neutral-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span>AI Strategy:</span>
                              </span>
                              <span className="font-mono text-emerald-400 font-medium">+{pt.strategy_cum}% ({pt.strategy_ret >= 0 ? '+' : ''}{pt.strategy_ret}%)</span>
                            </div>
                            <div className="flex justify-between text-neutral-400">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-slate-400" />
                                <span>Market:</span>
                              </span>
                              <span className="font-mono text-neutral-300">+{pt.benchmark_cum}% ({pt.benchmark_ret >= 0 ? '+' : ''}{pt.benchmark_ret}%)</span>
                            </div>
                            <div className="flex justify-between text-neutral-400">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-400" />
                                <span>Avoid Filter:</span>
                              </span>
                              <span className="font-mono text-red-400">{pt.avoid_cum}%</span>
                            </div>
                            <div className="pt-1 border-t border-neutral-800/80 flex justify-between font-medium">
                              <span className="text-neutral-400">Net Month Alpha:</span>
                              <span className={`font-mono ${pt.alpha_ret >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {pt.alpha_ret >= 0 ? '+' : ''}{pt.alpha_ret}%
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="strategy_cum" 
                      stroke="#10b981" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#stratGrad)" 
                      name="Adastra Strategy"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="benchmark_cum" 
                      stroke="#94a3b8" 
                      strokeWidth={2} 
                      strokeDasharray="4 4" 
                      dot={false}
                      name="Equal-Weighted Benchmark"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avoid_cum" 
                      stroke="#ef4444" 
                      strokeWidth={1.5} 
                      dot={false}
                      name="Avoid Filter"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Month-by-Month Track Record Table */}
            <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-5 overflow-hidden">
              <h3 className="text-sm font-medium text-neutral-200 mb-3 flex items-center justify-between">
                <span>Monthly Alpha Breakdown (2023)</span>
                <span className="text-xs text-neutral-500 font-mono font-normal">9 of 12 Months Beat Benchmark</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-500 font-mono uppercase text-[10px]">
                      <th className="py-2.5 px-3">Month</th>
                      <th className="py-2.5 px-3">AI Return</th>
                      <th className="py-2.5 px-3">Benchmark</th>
                      <th className="py-2.5 px-3">Alpha</th>
                      <th className="py-2.5 px-3">Cum. Return</th>
                      <th className="py-2.5 px-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono">
                    {monthly_series.map((m) => (
                      <tr key={m.month} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="py-2 px-3 text-neutral-300 font-sans font-medium">{m.month_label}</td>
                        <td className={`py-2 px-3 font-semibold ${m.strategy_ret >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {m.strategy_ret >= 0 ? '+' : ''}{m.strategy_ret}%
                        </td>
                        <td className={`py-2 px-3 ${m.benchmark_ret >= 0 ? 'text-neutral-300' : 'text-red-300'}`}>
                          {m.benchmark_ret >= 0 ? '+' : ''}{m.benchmark_ret}%
                        </td>
                        <td className={`py-2 px-3 font-semibold ${m.alpha_ret >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {m.alpha_ret >= 0 ? '+' : ''}{m.alpha_ret}%
                        </td>
                        <td className="py-2 px-3 text-neutral-300">
                          +{m.strategy_cum}%
                        </td>
                        <td className="py-2 px-3 text-right font-sans">
                          {m.outperformed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              ✓ Alpha
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-400">
                              - Lag
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* View 2: 4-Quadrant Separation Matrix */}
        {activeSubTab === "quadrants" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950/20 via-neutral-900 to-red-950/20 border border-neutral-800 rounded-2xl p-5 md:p-6">
              <h3 className="text-base font-medium text-neutral-100 mb-1">Empirical Quadrant Monotonicity</h3>
              <p className="text-xs text-neutral-400 max-w-3xl font-light">
                Our model segments the market into 4 distinct quadrants based on expected multi-factor return and idiosyncratic news volatility. 
                The realized performance strictly respects the expected risk-return ordering, demonstrating that signal quality is statistically significant.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quadrants.map((q) => (
                <div 
                  key={q.key}
                  className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 space-y-3 relative overflow-hidden"
                  style={{ borderLeftColor: q.color, borderLeftWidth: 4 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-100">{q.label}</h4>
                      <p className="text-xs text-neutral-400 font-light mt-0.5">{q.role}</p>
                    </div>
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-medium"
                      style={{ backgroundColor: `${q.color}20`, color: q.color, border: `1px solid ${q.color}40` }}
                    >
                      {q.count.toLocaleString()} stocks
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-800/80">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">2023 Cum. Return</div>
                      <div className={`text-xl font-mono font-semibold ${q.cum_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {q.cum_return >= 0 ? '+' : ''}{q.cum_return}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">Avg. Monthly Return</div>
                      <div className={`text-xl font-mono font-semibold ${q.avg_monthly_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {q.avg_monthly_return >= 0 ? '+' : ''}{q.avg_monthly_return}%
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-neutral-500 font-light pt-1">
                    {q.key === "Opportunity" && "Highest returning bucket. Provides the institutional long core of the portfolio."}
                    {q.key === "Speculative" && "High volatility momentum assets. Lucrative in bull runs, sensitive to sentiment shocks."}
                    {q.key === "Defensive" && "Low volatility conservative assets. Suitable for wealth preservation mandates (R1-R2)."}
                    {q.key === "Avoid" && "Strict exclusion filter. Dropped -9.80%, proving our AI successfully guards against portfolio decay."}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View 3: Conviction Alpha Picks */}
        {activeSubTab === "picks" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800">
              <div>
                <h3 className="text-sm font-medium text-neutral-100">Top Alpha Conviction Recommendations</h3>
                <p className="text-xs text-neutral-400 font-light mt-0.5">
                  High-conviction Opportunity Quadrant assets that delivered exceptional point-in-time returns. Click any stock to inspect its full neural profile.
                </p>
              </div>

              {/* Mode switch */}
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 shrink-0">
                <button
                  onClick={() => setPicksMode("month")}
                  className={`px-3 py-1 text-xs font-mono rounded-lg transition-all ${
                    picksMode === "month" ? "bg-neutral-800 text-neutral-100" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Month ({selected_month})
                </button>
                <button
                  onClick={() => setPicksMode("all_time")}
                  className={`px-3 py-1 text-xs font-mono rounded-lg transition-all ${
                    picksMode === "all_time" ? "bg-neutral-800 text-neutral-100" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  All-Time Best 2023
                </button>
              </div>
            </div>

            {/* Stocks grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {currentPicks.map((pick) => (
                <div 
                  key={`${pick.stkcd}-${pick.date}`}
                  className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 hover:border-emerald-500/40 hover:bg-neutral-900/90 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-semibold text-neutral-100 group-hover:text-emerald-400 transition-colors">
                            {String(pick.stkcd).padStart(6, '0')}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {pick.month_label}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 font-light mt-0.5">
                          Sector: <span className="text-neutral-200 font-normal">{pick.sector}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono text-lg font-bold text-emerald-400">
                          +{pick.return_y.toFixed(2)}%
                        </div>
                        <div className="text-[9px] uppercase tracking-wider text-neutral-500">1-Mo Realized</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-3 p-2 bg-neutral-950/60 rounded-xl border border-neutral-800/60 text-[11px] font-mono">
                      <div>
                        <span className="text-neutral-500 text-[9px] uppercase block">Vol / Risk (X)</span>
                        <span className="text-neutral-300">{pick.risk_x.toFixed(2)}%</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[9px] uppercase block">Market Cap</span>
                        <span className="text-neutral-300">¥{(pick.market_equity / 1e3).toFixed(1)}B</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectStock(pick.stkcd)}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-neutral-800/60 hover:bg-emerald-500/20 text-neutral-300 hover:text-emerald-300 border border-neutral-700/60 hover:border-emerald-500/40 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Inspect Neural Profile</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


function SettingsView() {
  return (
    <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-light text-neutral-50 mb-8">Platform Settings</h2>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-medium text-neutral-300 mb-4 border-b border-neutral-800 pb-2">Profile Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1 block">Full Name</label>
                <input type="text" defaultValue="John Doe" className="w-full bg-neutral-900/80 border border-neutral-800 rounded-md p-2.5 text-sm text-neutral-200 focus:outline-none focus:border-neutral-700" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1 block">Email Address</label>
                <input type="email" defaultValue="john@adastra.pro" className="w-full bg-neutral-900/80 border border-neutral-800 rounded-md p-2.5 text-sm text-neutral-200 focus:outline-none focus:border-neutral-700" />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-neutral-300 mb-4 border-b border-neutral-800 pb-2">Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded bg-neutral-900 border-neutral-800" />
                <span className="text-sm text-neutral-400">Receive daily alpha reports</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded bg-neutral-900 border-neutral-800" />
                <span className="text-sm text-neutral-400">Enable high-contrast mode</span>
              </label>
            </div>
          </div>
          
          <button className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors px-6 py-2 rounded-md text-sm font-medium">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Custom Date Picker (Apple-like Month/Year)
// ─────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function MonthYearPicker({ availableDates, selectedDate, onSelectDate }: { availableDates: string[], selectedDate: string | null, onSelectDate: (date: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Group dates by year and month
  const grouped = useMemo(() => {
    const map = new Map<number, { month: number, fullDate: string }[]>();
    availableDates.forEach(d => {
      const parts = d.split('-');
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        if (!map.has(year)) map.set(year, []);
        map.get(year)!.push({ month, fullDate: d });
      }
    });
    return map;
  }, [availableDates]);

  const years = Array.from(grouped.keys()).sort((a, b) => b - a);
  const selectedYear = selectedDate ? parseInt(selectedDate.split('-')[0], 10) : (years[0] || new Date().getFullYear());
  const [viewYear, setViewYear] = useState<number>(selectedYear);

  // Sync viewYear when selectedDate changes from outside (or initial mount)
  useEffect(() => {
    if (selectedDate) {
      setViewYear(parseInt(selectedDate.split('-')[0], 10));
    }
  }, [selectedDate]);
  
  const currentYearData = grouped.get(viewYear) || [];
  
  // Close popover when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.month-picker-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen]);

  const handlePrevYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = years.indexOf(viewYear);
    if (idx < years.length - 1) setViewYear(years[idx + 1]);
  };

  const handleNextYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = years.indexOf(viewYear);
    if (idx > 0) setViewYear(years[idx - 1]);
  };
  
  // Format selected date display (e.g. "Jan 2023")
  const displayDate = useMemo(() => {
    if (!selectedDate) return "Select date";
    const parts = selectedDate.split('-');
    const mIdx = parseInt(parts[1], 10) - 1;
    return `${MONTH_NAMES[mIdx]} ${parts[0]}`;
  }, [selectedDate]);

  return (
    <div className="relative month-picker-container ml-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[10px] md:text-xs bg-neutral-900 hover:bg-neutral-800 transition-colors px-2.5 py-1.5 rounded-md text-neutral-300 border border-neutral-800 focus:outline-none"
      >
        <CalendarDays className="w-3.5 h-3.5 text-neutral-500" />
        <span className="font-medium whitespace-nowrap">{displayDate}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 w-64 bg-[#121212] border border-neutral-800/80 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between p-3 border-b border-neutral-800/50 bg-[#0a0a0a]">
              <button 
                onClick={handlePrevYear}
                disabled={years.indexOf(viewYear) === years.length - 1}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-400 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-neutral-200">{viewYear}</span>
              <button 
                onClick={handleNextYear}
                disabled={years.indexOf(viewYear) === 0}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-400 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2 p-3">
              {MONTH_NAMES.map((m, idx) => {
                const monthNum = idx + 1;
                const match = currentYearData.find(d => d.month === monthNum);
                const isAvailable = !!match;
                const isSelected = selectedDate === match?.fullDate;

                return (
                  <button
                    key={m}
                    disabled={!isAvailable}
                    onClick={() => {
                      if (isAvailable && match) {
                        onSelectDate(match.fullDate);
                        setIsOpen(false);
                      }
                    }}
                    className={`
                      py-2 rounded-lg text-xs font-medium transition-all
                      ${isSelected 
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                        : isAvailable 
                          ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white cursor-pointer' 
                          : 'text-neutral-700 cursor-not-allowed'}
                    `}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
