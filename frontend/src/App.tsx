import { useState, useEffect, lazy, Suspense } from "react";
import { ThemeProvider } from "./components/theme-provider";
import { ErrorBoundary } from "./components/ErrorBoundary";

const LandingPage = lazy(() => import("./pages/Landing"));
const Platform = lazy(() => import("./pages/Platform"));
const Team = lazy(() => import("./pages/Team"));
const Legal = lazy(() => import("./pages/Legal"));

function PageFallback() {
  return (
    <div className="min-h-screen w-full bg-[#06070A] flex flex-col items-center justify-center text-neutral-400">
      <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-4" />
      <span className="text-xs font-mono tracking-widest text-neutral-500 uppercase">Adastra Intelligence</span>
    </div>
  );
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.hash || "#/");
  const [autoOpenAssessment, setAutoOpenAssessment] = useState(false);
  const [initialProfile, setInitialProfile] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || "#/";
      setCurrentPath(hash);
      if (hash.includes("kyc=true") || hash.includes("assessment=true")) {
        setAutoOpenAssessment(true);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
  };

  const handleLaunchCockpit = (options?: { openAssessment?: boolean; targetProfile?: string }) => {
    // When clicking Launch Cockpit, always trigger the CSRC Suitability Assessment
    setAutoOpenAssessment(options?.openAssessment ?? true);
    if (options?.targetProfile) {
      setInitialProfile(options.targetProfile);
    }
    navigate("#app");
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-zinc-950 text-white selection:bg-white/20 font-sans antialiased overflow-x-hidden">
        <ErrorBoundary fallbackTitle="Cockpit Error Encountered">
          <Suspense fallback={<PageFallback />}>
            {currentPath.startsWith("#app") ? (
              <Platform 
                onNavigateHome={() => navigate("#/")} 
                initialOpenAssessment={autoOpenAssessment}
                initialProfile={initialProfile}
              />
            ) : currentPath === "#team" ? (
              <Team onNavigateHome={() => navigate("#/")} />
            ) : currentPath === "#legal" ? (
              <Legal onNavigateHome={() => navigate("#/")} />
            ) : (
              <LandingPage onNavigateApp={handleLaunchCockpit} />
            )}
          </Suspense>
        </ErrorBoundary>
      </div>
    </ThemeProvider>
  );
}
