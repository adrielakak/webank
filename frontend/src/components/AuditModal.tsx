import React from "react";
import { X, ShieldCheck, CheckCircle2, Lock, Copy, Download } from "lucide-react";
import { ComplianceAuditRecord } from "../types";

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: ComplianceAuditRecord[];
}

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  APPROVED: {
    color: "#4ade80",     /* green-400 — compliant = controlled = CN loss-green */
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.22)",
  },
  EXECUTED_SANDBOX: {
    color: "#60a5fa",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.22)",
  },
  REJECTED: {
    color: "#f87171",    /* red-400 — alert = CN gain-red */
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.22)",
  },
};

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose, records }) => {
  if (!isOpen) return null;

  const handleCopy = (text: string) => navigator.clipboard.writeText(text);

  const handleDownload = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "weadvisory_csrc_audit_ledger.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    /* Overlay — dark, no blur art */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
    >
      <div
        className="w-full max-w-2xl rounded-xl border flex flex-col overflow-hidden"
        style={{
          background: "var(--surface-1)",
          borderColor: "var(--border-raised)",
          maxHeight: "85vh",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: "var(--border-default)", background: "var(--surface-2)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center border"
              style={{
                background: "var(--cn-loss-bg)",
                borderColor: "var(--cn-loss-border)",
                color: "var(--cn-loss)",
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-[13px] font-semibold text-zinc-100 flex items-center gap-2">
                CSRC Immutable Audit Ledger
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
                  style={{
                    background: "var(--surface-0)",
                    borderColor: "var(--border-raised)",
                    color: "var(--text-muted)",
                    letterSpacing: "0.06em",
                  }}
                >
                  {records.length} ENTRIES
                </span>
              </h2>
              <p className="text-[10px] mt-0.5 font-mono" style={{ color: "var(--text-muted)" }}>
                Cryptographic Non-Repudiation · SHA-256 Fingerprints
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="audit-download-btn"
              onClick={handleDownload}
              title="Download JSON ledger"
              className="p-1.5 rounded-md transition-default border border-transparent"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.background = "var(--surface-3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              id="audit-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-md transition-default border border-transparent"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.background = "var(--surface-3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Records list ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {records.length === 0 && (
            <p
              className="text-center py-8 text-[11px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              No audit records yet — trigger a rebalance to generate a proof.
            </p>
          )}

          {records.map((rec) => {
            const status = STATUS_STYLE[rec.compliance_status] ?? STATUS_STYLE.APPROVED;

            return (
              <div
                key={rec.audit_id}
                className="rounded-lg p-3 border space-y-2"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                {/* Row 1: audit ID + client + tier + status */}
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-300 font-semibold">{rec.audit_id}</span>
                    <span style={{ color: "var(--text-muted)" }}>·</span>
                    <span style={{ color: "var(--text-secondary)" }}>{rec.client_id}</span>
                    <span
                      className="px-1.5 py-0.5 rounded border"
                      style={{
                        background: "var(--surface-0)",
                        borderColor: "var(--border-raised)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {rec.risk_level}
                    </span>
                  </div>
                  {/* Status badge */}
                  <div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] uppercase font-semibold"
                    style={{
                      background: status.bg,
                      borderColor: status.border,
                      color: status.color,
                      letterSpacing: "0.07em",
                    }}
                  >
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {rec.compliance_status.replace(/_/g, " ")}
                  </div>
                </div>

                {/* Row 2: Weight breakdown */}
                <div
                  className="rounded-md p-2 flex flex-wrap gap-1.5"
                  style={{ background: "var(--surface-0)" }}
                >
                  {Object.entries(rec.weights).map(([k, w]) => (
                    <span
                      key={k}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
                      style={{
                        background: "var(--surface-2)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {k}{" "}
                      <strong className="text-zinc-200">{(w * 100).toFixed(1)}%</strong>
                    </span>
                  ))}
                </div>

                {/* Row 3: Fingerprint */}
                <div
                  className="flex items-center justify-between text-[9px] font-mono pt-1 border-t"
                  style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Lock className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{rec.sha256_fingerprint}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(rec.sha256_fingerprint)}
                    className="flex items-center gap-1 ml-2 shrink-0 transition-default"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  >
                    <Copy className="w-2.5 h-2.5" />
                    Copy
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div
          className="px-5 py-3 border-t flex items-center justify-between shrink-0"
          style={{ borderColor: "var(--border-default)", background: "var(--surface-2)" }}
        >
          <span
            className="text-[10px] font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            Standard: CSRC《证券期货投资者适当性管理办法》· Non-repudiation ledger
          </span>
          <button
            id="audit-footer-close-btn"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md text-[11px] font-medium transition-default"
            style={{
              background: "var(--surface-3)",
              border: "1px solid var(--border-raised)",
              color: "var(--text-primary)",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
