import React from 'react';

const POSITIVE = [
  { pts: '+5',  label: 'Major floor vote or key legislation passed' },
  { pts: '+3',  label: 'Speech, press conference, or policy announcement' },
  { pts: '+3',  label: 'Bipartisan cooperation or cross-aisle action' },
  { pts: '+2',  label: 'Committee action (hearing, subpoena, markup)' },
  { pts: '+1–3', label: 'Positive news coverage or notable accomplishment' },
  { pts: '+2',  label: 'Breaking with your own party on a vote or issue' },
];

const CHAOS = [
  { pts: '+3',  label: 'Fact-check loss (major claim rated false/misleading)' },
  { pts: '+5',  label: 'Major gaffe or public embarrassment' },
  { pts: '+8',  label: 'Ethics controversy or investigation launched' },
  { pts: '+10', label: 'Indictment or resignation' },
];

function Table({ rows, accent }: { rows: { pts: string; label: string }[]; accent: string }) {
  return (
    <table className="w-full">
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="border-b border-navy-700 last:border-0">
            <td className={`py-3 pr-4 font-bold text-lg font-mono whitespace-nowrap ${accent}`}>
              {r.pts}
            </td>
            <td className="py-3 text-gray-300 text-sm">{r.label}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Scoring() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-white">Scoring Rules</h1>
        <p className="text-gray-400 mt-2">
          Points are assigned daily by the game administrator based on each politician's news coverage.
          Scores are final once published.
        </p>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Standard Points</h2>
        <p className="text-sm text-gray-500 mb-4">Earned through legislative activity and media presence.</p>
        <Table rows={POSITIVE} accent="text-green-400" />
      </div>

      <div className="card mb-6" style={{ borderColor: 'rgba(204,41,54,0.4)' }}>
        <h2 className="text-xl font-bold text-white mb-1">
          Chaos Bonus <span className="ml-2 text-xs bg-gold-500 text-navy-900 px-2 py-0.5 rounded font-bold">NEW</span>
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Controversy pays. Drama, gaffes, and scandals all score — chaos is rewarded.
        </p>
        <Table rows={CHAOS} accent="text-gold-400" />
      </div>

      <div className="card bg-navy-800/50">
        <h2 className="text-lg font-bold text-white mb-3">Notes</h2>
        <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
          <li>A politician must appear in the news to receive any points that day.</li>
          <li>Points can stack — a politician can earn both a gaffe bonus and a vote bonus on the same day.</li>
          <li>Breaking with your party only scores if the vote or action is newsworthy.</li>
          <li>The administrator's score decisions are final.</li>
        </ul>
      </div>
    </div>
  );
}
