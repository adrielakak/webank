import React from "react";
import { X, ShieldCheck, CheckCircle2, Lock, Copy, Download } from "lucide-react";
import { ComplianceAuditRecord } from "../types";

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: ComplianceAuditRecord[];
}

export const AuditModal: React.FC<AuditModalProps> = ({
  isOpen,
  onClose,
  records,
}) => {
  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownloadLedger = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "weadvisory_csrc_audit_ledger.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>CSRC Immutable Audit Ledger</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                  {records.length} Verified Entries
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Cryptographic Non-Repudiation · WeBank Compliance Evidence
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadLedger}
              title="Download Audit JSON Ledger"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {records.map((rec) => (
            <div
              key={rec.audit_id}
              className="bg-black/30 rounded-xl p-3 border border-white/[0.06] hover:border-cyan-500/30 transition-all text-xs font-mono space-y-2"
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-2">
                  <span className="text-cyan-400 font-bold">{rec.audit_id}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-300">{rec.client_id}</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">
                    {rec.risk_level}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-emerald-400 text-[10px]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{rec.compliance_status}</span>
                </div>
              </div>

              {/* Weights row */}
              <div className="bg-black/40 p-2 rounded-lg text-[10px] text-slate-300 flex flex-wrap gap-2">
                {Object.entries(rec.weights).map(([k, w]) => (
                  <span key={k} className="px-1.5 py-0.5 rounded bg-white/[0.05]">
                    {k}: <strong className="text-white">{(w * 100).toFixed(1)}%</strong>
                  </span>
                ))}
              </div>

              {/* Fingerprint */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/[0.04]">
                <div className="flex items-center space-x-1 truncate max-w-sm">
                  <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{rec.sha256_fingerprint}</span>
                </div>
                <button
                  onClick={() => handleCopy(rec.sha256_fingerprint)}
                  className="flex items-center space-x-1 text-slate-400 hover:text-cyan-300 transition-colors ml-2 shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-black/40 flex items-center justify-between text-[11px] text-slate-400">
          <span>Standard: CSRC 《证券期货投资者适当性管理办法》</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-semibold transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
