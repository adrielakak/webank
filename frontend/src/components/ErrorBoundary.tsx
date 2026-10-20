import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-neutral-100">
          <div className="max-w-md w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div>
              <h2 className="text-lg font-medium text-neutral-100">
                {this.props.fallbackTitle || "Something went wrong"}
              </h2>
              <p className="text-xs text-neutral-400 mt-1 font-mono">
                {this.state.error?.message || "An unexpected error occurred while rendering the cockpit."}
              </p>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onReset) this.props.onReset();
                  window.location.reload();
                }}
                className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Cockpit</span>
              </button>

              <button
                onClick={() => {
                  window.location.hash = "#/";
                  window.location.reload();
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
