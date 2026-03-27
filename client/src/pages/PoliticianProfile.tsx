import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PartyBadge from '../components/PartyBadge';

interface DailyScore {
  id: string;
  date: string;
  points: number;
  note?: string;
}

interface DraftPick {
  id: string;
  leagueMember: {
    user: { username: string };
    league: { id: string; name: string };
  };
}

interface Politician {
  id: string;
  name: string;
  title: string;
  party: string;
  state: string;
  imageUrl?: string;
  bio?: string;
  isActive: boolean;
  seasonTotal?: number;
  dailyScores: DailyScore[];
  draftPicks: DraftPick[];
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function fmtShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { date: string; note?: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pts = payload[0].value;
  return (
    <div className="bg-ink-800 border border-ink-600 rounded p-3 shadow-xl max-w-xs">
      <div className="text-sm text-cream-400 mb-1">{fmt(d.date)}</div>
      <div className={`text-2xl font-bold ${pts > 0 ? 'text-green-400' : pts < 0 ? 'text-red-400' : 'text-cream-400'}`}>
        {pts > 0 ? '+' : ''}{pts} pts
      </div>
      {d.note && <div className="text-xs text-cream-400 mt-1 leading-snug">{d.note}</div>}
    </div>
  );
}

export default function PoliticianProfile() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ politician: Politician } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/politicians/${id}`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!data) return <div className="text-cream-400">Politician not found.</div>;

  const { politician } = data;

  // Sort scores oldest → newest for chart
  const scores = [...politician.dailyScores].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Stats
  const allTime = scores.reduce((sum, s) => sum + s.points, 0);
  const avg = scores.length > 0 ? allTime / scores.length : 0;
  const best = scores.length > 0 ? scores.reduce((a, b) => (b.points > a.points ? b : a)) : null;
  const worst = scores.length > 0 ? scores.reduce((a, b) => (b.points < a.points ? b : a)) : null;

  const chartData = scores.map((s) => ({ date: s.date, points: s.points, note: s.note }));
  const hasNegative = scores.some((s) => s.points < 0);

  return (
    <div>
      <div className="mb-2 text-sm text-cream-500">
        <Link to="/politicians" className="hover:text-cream-300">Politicians</Link> / {politician.name}
      </div>

      {/* Profile header */}
      <div className="card mb-6 flex items-start gap-6">
        {politician.imageUrl ? (
          <img
            src={politician.imageUrl}
            alt={politician.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-ink-600"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-ink-700 border-2 border-ink-600 flex items-center justify-center text-3xl font-bold text-gold-500">
            {politician.name.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-4xl font-bold text-white">{politician.name}</h1>
            <PartyBadge party={politician.party} />
            {!politician.isActive && (
              <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded">INACTIVE</span>
            )}
          </div>
          <p className="text-cream-400 mt-1">{politician.title} · {politician.state}</p>
          {politician.bio && <p className="text-cream-300 mt-3 max-w-2xl">{politician.bio}</p>}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-gold-400">{allTime.toFixed(1)}</div>
          <div className="text-xs text-cream-500 mt-1 uppercase tracking-wide">All-Time Points</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-gold-400">{avg.toFixed(2)}</div>
          <div className="text-xs text-cream-500 mt-1 uppercase tracking-wide">Avg / Day</div>
        </div>
        <div className="card text-center py-4">
          {best ? (
            <>
              <div className="text-3xl font-bold text-green-400">
                {best.points > 0 ? '+' : ''}{best.points}
              </div>
              <div className="text-xs text-cream-500 mt-1 uppercase tracking-wide">Best Day</div>
              <div className="text-xs text-cream-500 mt-0.5">{fmtShort(best.date)}</div>
            </>
          ) : (
            <div className="text-cream-500 text-sm">No data</div>
          )}
        </div>
        <div className="card text-center py-4">
          {worst ? (
            <>
              <div className="text-3xl font-bold text-red-400">
                {worst.points > 0 ? '+' : ''}{worst.points}
              </div>
              <div className="text-xs text-cream-500 mt-1 uppercase tracking-wide">Worst Day</div>
              <div className="text-xs text-cream-500 mt-0.5">{fmtShort(worst.date)}</div>
            </>
          ) : (
            <div className="text-cream-500 text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Chart */}
      {scores.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-white mb-1">Daily Points</h2>
          <p className="text-xs text-cream-500 mb-5">{scores.length} scoring day{scores.length !== 1 ? 's' : ''} on record</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#111e44" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={fmtShort}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              {hasNegative && <ReferenceLine y={0} stroke="#374151" strokeDasharray="4 4" />}
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="points"
                stroke="#cc2936"
                strokeWidth={2}
                fill="url(#posGrad)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const color = payload.points > 0 ? '#22c55e' : payload.points < 0 ? '#ef4444' : '#6b7280';
                  return <circle key={`dot-${payload.date}`} cx={cx} cy={cy} r={3} fill={color} stroke="none" />;
                }}
                activeDot={{ r: 5, fill: '#cc2936', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Score history table */}
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-bold text-white mb-4">Score History</h2>
          {scores.length === 0 ? (
            <p className="text-cream-500">No scores recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-ink-600">
                  <tr>
                    <th className="table-th">Date</th>
                    <th className="table-th text-right">Points</th>
                    <th className="table-th">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Most recent first in the table */}
                  {[...scores].reverse().map((s) => (
                    <tr key={s.id} className="table-row">
                      <td className="table-td text-sm text-cream-300 whitespace-nowrap">
                        {fmt(s.date)}
                      </td>
                      <td className="table-td text-right">
                        <span className={`font-bold text-lg ${s.points > 0 ? 'text-green-400' : s.points < 0 ? 'text-red-400' : 'text-cream-500'}`}>
                          {s.points > 0 ? '+' : ''}{s.points}
                        </span>
                      </td>
                      <td className="table-td text-sm text-cream-400">
                        {s.note || <span className="text-cream-500">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* On rosters */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">On Rosters</h2>
          {politician.draftPicks.length === 0 ? (
            <p className="text-cream-500 text-sm">Not drafted in any league.</p>
          ) : (
            <div className="space-y-3">
              {politician.draftPicks.map((dp) => (
                <Link
                  key={dp.id}
                  to={`/leagues/${dp.leagueMember.league.id}`}
                  className="block p-3 bg-ink-700 rounded hover:bg-ink-600 transition-colors"
                >
                  <div className="font-semibold text-white text-sm">{dp.leagueMember.league.name}</div>
                  <div className="text-xs text-cream-400 mt-0.5">
                    {dp.leagueMember.user.username}'s team
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
