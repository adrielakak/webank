import { Menu, X, Atom } from "lucide-react";
import { useState, useEffect } from "react";
import { animate, AnimatePresence, motion } from "framer-motion";

export default function Navbar({ onLaunch }: { onLaunch: () => void }) {
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== "undefined") {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          // if scrolling down and past the threshold, hide
          setShow(false);
          setIsMobileMenuOpen(false);
        } else {
          // if scrolling up, show
          setShow(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    window.addEventListener("scroll", controlNavbar);
    return () => {
      window.removeEventListener("scroll", controlNavbar);
    };
  }, [lastScrollY]);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      animate(window.scrollY, y, {
        duration: 1,
        ease: [0.16, 1, 0.3, 1], // premium expo-out easing
        onUpdate: (latest) => window.scrollTo(0, latest)
      });
    }
  };

  return (
    <>
      <header 
        className={`fixed top-6 left-0 right-0 z-50 flex justify-center transition-transform duration-300 ease-in-out px-4 ${show ? "translate-y-0" : "-translate-y-[150%]"}`}
      >
        <div className="w-full max-w-5xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-4 md:px-6 py-3 flex items-center justify-between shadow-2xl">
          
          {/* Left: Logo */}
          <div className="flex items-center gap-2 font-medium tracking-wide text-white">
            <Atom className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-base">Adastra PRO</span>
          </div>

          {/* Right: Links & CTA */}
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <a href="#architecture" onClick={(e) => scrollToSection(e, 'architecture')} className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                Architecture
              </a>
              <a href="#showcase" onClick={(e) => scrollToSection(e, 'showcase')} className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                Model Showcase
              </a>
              <a href="#alpha" onClick={(e) => scrollToSection(e, 'alpha')} className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                Empirical Alpha
              </a>
            </nav>
            
            <button
              onClick={onLaunch}
              className="hidden md:block text-sm font-semibold bg-white text-black hover:bg-neutral-200 transition-colors px-5 py-2 rounded-full cursor-pointer"
            >
              Launch Cockpit
            </button>

            {/* Mobile Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-neutral-300 hover:text-white transition-colors p-1"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl pt-28 px-6 flex flex-col gap-6 md:hidden"
          >
            <nav className="flex flex-col gap-6 text-lg">
              <a href="#architecture" onClick={(e) => scrollToSection(e, 'architecture')} className="font-medium text-neutral-300 hover:text-white transition-colors">
                Architecture
              </a>
              <a href="#showcase" onClick={(e) => scrollToSection(e, 'showcase')} className="font-medium text-neutral-300 hover:text-white transition-colors">
                Model Showcase
              </a>
              <a href="#alpha" onClick={(e) => scrollToSection(e, 'alpha')} className="font-medium text-neutral-300 hover:text-white transition-colors">
                Empirical Alpha
              </a>
            </nav>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onLaunch();
              }}
              className="w-full text-base font-semibold bg-white text-black hover:bg-neutral-200 transition-colors px-5 py-3 rounded-xl mt-4"
            >
              Launch Cockpit
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

