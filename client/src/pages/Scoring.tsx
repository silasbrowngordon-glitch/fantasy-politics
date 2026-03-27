import React, { useState } from 'react';
import { SCORING_TYPES } from '../lib/scoringTypes';

const STANDARD_POINTS = [
  { pts: '+5',   label: 'Major floor vote or key legislation passed' },
  { pts: '+3',   label: 'Speech, press conference, or policy announcement' },
  { pts: '+3',   label: 'Bipartisan cooperation or cross-aisle action' },
  { pts: '+2',   label: 'Committee action (hearing, subpoena, markup)' },
  { pts: '+1–3', label: 'Positive news coverage or notable accomplishment' },
  { pts: '+2',   label: 'Breaking with your own party on a vote or issue' },
];

const CHAOS_BONUS = [
  { pts: '+3',  label: 'Fact-check loss (major claim rated false/misleading)' },
  { pts: '+5',  label: 'Major gaffe or public embarrassment' },
  { pts: '+8',  label: 'Ethics controversy or investigation launched' },
  { pts: '+10', label: 'Indictment or resignation' },
];

function ScoreTable({ rows, accent }: { rows: { pts: string; label: string }[]; accent: string }) {
  return (
    <table className="w-full">
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="border-b border-ink-700 last:border-0">
            <td className={`py-3 pr-4 font-bold text-lg font-mono whitespace-nowrap ${accent}`}>
              {r.pts}
            </td>
            <td className="py-3 text-cream-300 text-sm">{r.label}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const STANDARD_SECTIONS = [
  {
    key: 'standard',
    label: 'Standard Points',
    badge: null,
    description: 'Applies to all leagues. Earned through legislative activity and media presence.',
    rows: STANDARD_POINTS,
    accent: 'text-green-400',
  },
  {
    key: 'chaos',
    label: 'Chaos Bonus',
    badge: 'All Leagues',
    description: 'Controversy pays. Drama, gaffes, and scandals all score — chaos is rewarded.',
    rows: CHAOS_BONUS,
    accent: 'text-gold-400',
  },
];

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-cream-500 shrink-0 ml-4 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function Scoring() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  function toggle(key: string) {
    setOpenKey((prev) => (prev === key ? null : key));
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-10">
        <div className="overline mb-2">Game Rules</div>
        <h1 className="font-display font-extrabold uppercase text-5xl text-cream-100 leading-none mb-3"
            style={{ letterSpacing: '-0.01em' }}>
          Scoring Rules
        </h1>
        <p className="text-cream-400 text-sm max-w-xl">
          Points are assigned daily by the game administrator based on each politician's news coverage.
          Scores are final once published. League-specific scoring types add bonus rules on top of the standard ruleset.
        </p>
      </div>

      {/* Standard + Chaos (collapsible) */}
      <div className="space-y-3 mb-8">
        {STANDARD_SECTIONS.map((s) => {
          const isOpen = openKey === s.key;
          return (
            <div key={s.key} className="card overflow-hidden">
              <button
                className="w-full flex items-center justify-between text-left"
                onClick={() => toggle(s.key)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold uppercase text-xl text-cream-100 tracking-wide">
                    {s.label}
                  </span>
                  {s.badge && (
                    <span className="text-xs bg-gold-400 text-ink-900 px-2 py-0.5 rounded-sm font-display font-bold uppercase tracking-wide">
                      {s.badge}
                    </span>
                  )}
                </div>
                <Chevron open={isOpen} />
              </button>
              {!isOpen && (
                <p className="text-sm text-cream-500 mt-1">{s.description}</p>
              )}
              {isOpen && (
                <div className="mt-4 pt-4 border-t border-ink-700">
                  <p className="text-sm text-cream-500 mb-4">{s.description}</p>
                  <ScoreTable rows={s.rows} accent={s.accent} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* League-Specific Scoring Types */}
      <div className="mb-6">
        <div className="overline mb-3">Optional Scoring Types</div>
        <h2 className="font-display font-bold uppercase text-2xl text-cream-100 mb-2" style={{ letterSpacing: '-0.01em' }}>
          League Scoring Types
        </h2>
        <p className="text-cream-400 text-sm mb-6">
          When creating a league, commissioners can add scoring types that layer bonus rules on top of the standard ruleset.
        </p>
        <div className="space-y-3">
          {SCORING_TYPES.map((t) => {
            const isOpen = openKey === t.value;
            return (
              <div key={t.value} className="card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between text-left"
                  onClick={() => toggle(t.value)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-sm font-display font-bold uppercase tracking-wide border ${t.badgeColor}`}>
                      {t.label}
                    </span>
                    <span className="text-cream-300 text-sm">{t.description}</span>
                  </div>
                  <Chevron open={isOpen} />
                </button>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-ink-700">
                    <ScoreTable rows={t.rows} accent="text-gold-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="card bg-ink-800/50">
        <h2 className="font-display font-bold uppercase text-sm tracking-widest text-cream-300 mb-3">Notes</h2>
        <ul className="text-sm text-cream-400 space-y-2 list-disc list-inside">
          <li>A politician must appear in the news to receive any points that day.</li>
          <li>Points can stack — a politician can earn a gaffe bonus and a vote bonus on the same day.</li>
          <li>Breaking with your party only scores if the vote or action is newsworthy.</li>
          <li>League scoring type bonuses stack with standard points.</li>
          <li>The administrator's score decisions are final.</li>
        </ul>
      </div>
    </div>
  );
}
