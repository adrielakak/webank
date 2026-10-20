import { ArrowLeft } from "lucide-react";

interface LegalProps {
  onNavigateHome: () => void;
}

export default function Legal({ onNavigateHome }: LegalProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-50 flex flex-col items-center py-24 px-6 md:px-12">
      <div className="max-w-4xl w-full">
        <button 
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-neutral-400 hover:text-neutral-50 transition-colors mb-12"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">Back to Home</span>
        </button>

        <h1 className="text-4xl font-light tracking-tight mb-12">Legal & <span className="font-semibold">Terms</span></h1>
        
        <div className="space-y-12 text-neutral-400">
          <section>
            <h2 className="text-2xl font-medium text-neutral-200 mb-4">Terms of Service</h2>
            <p className="mb-4">
              By accessing Adastra PRO, you agree to be bound by these terms of service and all applicable laws and regulations.
            </p>
            <p>
              The materials contained in this platform are protected by applicable copyright and trademark law. Adastra PRO is designed for informational purposes and quantitative analysis.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-medium text-neutral-200 mb-4">Privacy Policy</h2>
            <p className="mb-4">
              Your privacy is important to us. It is Adastra PRO's policy to respect your privacy regarding any information we may collect from you across our website.
            </p>
            <p>
              We only retain collected information for as long as necessary to provide you with your requested service. We don't share any personally identifying information publicly or with third-parties, except when required to by law.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
