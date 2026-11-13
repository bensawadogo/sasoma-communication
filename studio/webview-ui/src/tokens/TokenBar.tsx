import '../quests/sims.css';
import './tokens.css';

import { useEffect, useState } from 'react';

import { Modal } from '../components/ui/Modal.js';
import type { ProviderReport, TokenReport } from './tokensApi.js';
import { fetchTokens, formatTokens, hasTokenAccess } from './tokensApi.js';

const POLL_MS = 15_000;

/** The report, refreshed every 15 s while the page is visible. */
function useTokenReport(): TokenReport | null {
  const [report, setReport] = useState<TokenReport | null>(null);
  useEffect(() => {
    if (!hasTokenAccess) return;
    const controller = new AbortController();
    let timer = 0;
    const tick = async () => {
      if (!document.hidden) {
        try {
          const next = await fetchTokens(controller.signal);
          if (next && !controller.signal.aborted) setReport(next);
        } catch {
          // Offline or aborted: the next tick tries again.
        }
      }
      if (!controller.signal.aborted) timer = window.setTimeout(() => void tick(), POLL_MS);
    };
    void tick();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);
  return report;
}

/** Share of the daily cap used, or null when the provider has no cap (then no percentage is invented). */
function dailyShare(p: ProviderReport): number | null {
  const cap = p.budget?.dailyTokens;
  return cap ? Math.min(1, p.today.total / cap) : null;
}

function toneOf(share: number | null): 'ok' | 'warn' | 'high' | 'none' {
  if (share === null) return 'none';
  return share >= 0.9 ? 'high' : share >= 0.6 ? 'warn' : 'ok';
}

/**
 * Top-of-office bar: one chip per AI provider with the tokens used today, and a fill against its daily cap when
 * one is set. Press it for the 5-hour / today / 7-day detail. Providers nothing has reported for read "non connecté".
 */
export function TokenBar() {
  const report = useTokenReport();
  const [open, setOpen] = useState(false);
  if (!hasTokenAccess || !report) return null;

  return (
    <>
      <button type="button" className="token-bar" onClick={() => setOpen(true)} aria-label="Consommation de tokens par fournisseur : ouvrir le détail">
        {report.providers.map((p) => {
          const share = dailyShare(p);
          return (
            <span key={p.id} className="token-chip" data-connected={p.connected ? 'true' : 'false'} data-tone={toneOf(share)}>
              <span className="token-chip-name">{p.label}</span>
              <span className="token-chip-value">{p.connected ? formatTokens(p.today.total) : 'non connecté'}</span>
              {p.connected && share !== null && (
                <span className="token-chip-meter" aria-hidden="true">
                  <span style={{ width: `${Math.round(share * 100)}%` }} />
                </span>
              )}
            </span>
          );
        })}
      </button>
      <TokenDetail open={open} onClose={() => setOpen(false)} report={report} />
    </>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="sims-row" style={{ justifyContent: 'space-between' }}>
      <span className="sims-muted">{label}</span>
      <span>
        <strong>{value}</strong>
        {sub && <span className="sims-muted sims-small"> {sub}</span>}
      </span>
    </div>
  );
}

function TokenDetail({ open, onClose, report }: { open: boolean; onClose: () => void; report: TokenReport }) {
  return (
    <Modal isOpen={open} onClose={onClose} title="Tokens" className="w-[560px]">
      <div className="sims-root sims-stack">
        {report.providers.map((p) => {
          const share = dailyShare(p);
          return (
            <section key={p.id} className="sims-card sims-stack" style={{ gap: 6 }}>
              <h3 className="sims-title">
                {p.label} {!p.connected && <span className="sims-muted sims-small">· non connecté</span>}
              </h3>
              {p.connected ? (
                <>
                  <Row label="Dernières 5 heures" value={formatTokens(p.fiveHour.total)} sub={`${p.fiveHour.messages} message${p.fiveHour.messages > 1 ? 's' : ''}`} />
                  <Row
                    label="Aujourd'hui"
                    value={formatTokens(p.today.total)}
                    sub={p.budget?.dailyTokens ? `sur ${formatTokens(p.budget.dailyTokens)} (${Math.round((share ?? 0) * 100)} %)` : 'aucun plafond fixé'}
                  />
                  <Row label="7 jours" value={formatTokens(p.week.total)} />
                  {p.today.cacheRead > 0 && (
                    <Row label="Lus depuis le cache (hors total)" value={formatTokens(p.today.cacheRead)} />
                  )}
                  {p.byModel.length > 0 && (
                    <div className="sims-muted sims-small">
                      {p.byModel.map((m) => `${m.model} : ${formatTokens(m.today.total)}`).join(' · ')}
                    </div>
                  )}
                </>
              ) : (
                <p className="sims-muted sims-small" style={{ margin: 0 }}>
                  {p.id === 'claude'
                    ? 'Aucune conversation Claude trouvée pour ce projet.'
                    : "Aucune utilisation enregistrée. Ce fournisseur n'est pas relié au Studio : il s'affichera ici quand le serveur de délégation lui enverra son usage."}
                </p>
              )}
            </section>
          );
        })}
        <p className="sims-muted sims-small" style={{ margin: 0 }}>
          Total = entrée + écriture du cache + sortie. Pour Claude, c'est une estimation lue dans les transcripts de Claude Code, pas une
          facture. Plafonds : fichier production/budgets.json (par exemple {'{"claude":{"dailyTokens":500000}}'}).
        </p>
      </div>
    </Modal>
  );
}
