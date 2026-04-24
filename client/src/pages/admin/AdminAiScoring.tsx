import React, { useEffect, useState, useRef } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import PartyBadge from '../../components/PartyBadge';
import { buildScoringRubric, type ScoringType } from '../../lib/scoringTypes';

interface Politician {
  id: string;
  name: string;
  title: string;
  party: string;
  state: string;
}

interface League {
  id: string;
  name: string;
  scoringTypes: ScoringType[];
}

interface ScoreResult {
  politicianId: string;
  name: string;
  points: number;
  note: string;
}

export default function AdminAiScoring() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [newsText, setNewsText] = useState('');
  const [results, setResults] = useState<ScoreResult[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingPols, setLoadingPols] = useState(true);
  const [fetchingNews, setFetchingNews] = useState(false);
  const streamBuffer = useRef('');

  useEffect(() => {
    Promise.all([
      api.get('/politicians', { params: { limit: 500 } }),
      api.get('/admin/leagues'),
    ]).then(([polRes, leagueRes]) => {
      setPoliticians(polRes.data.politicians ?? polRes.data);
      setLeagues(leagueRes.data.leagues ?? []);
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoadingPols(false));
  }, []);

  const selectedLeague = leagues.find((l) => l.id === selectedLeagueId);
  const activeScoringTypes: ScoringType[] = selectedLeague?.scoringTypes ?? [];

  async function handleFetchNews() {
    setFetchingNews(true);
    try {
      const r = await api.get('/news/fetch');
      const articles: Array<{ title: string; description: string }> = r.data.articles ?? [];
      if (articles.length === 0) {
        toast.error('No articles returned');
        return;
      }
      const lines = articles.map((a) =>
        a.description ? `${a.title} — ${a.description}` : a.title
      );
      setNewsText(lines.join('\n'));
      toast.success(`Fetched ${articles.length} unique articles`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to fetch news');
    } finally {
      setFetchingNews(false);
    }
  }

  async function handleGenerate() {
    if (!newsText.trim()) {
      toast.error('Paste some news headlines first');
      return;
    }
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      toast.error('VITE_ANTHROPIC_API_KEY is not set');
      return;
    }

    setStreaming(true);
    setResults([]);
    setStreamProgress('');
    streamBuffer.current = '';

    // Fetch last 7 days of score history to prevent double-counting ongoing stories
    let recentHistorySection = '';
    try {
      const endDate = new Date(date + 'T00:00:00.000Z');
      endDate.setUTCDate(endDate.getUTCDate() - 1); // exclude the scoring date itself
      const startDate = new Date(endDate);
      startDate.setUTCDate(startDate.getUTCDate() - 6); // 7 days total

      const endDateStr = endDate.toISOString().split('T')[0];
      const startDateStr = startDate.toISOString().split('T')[0];

      const historyRes = await api.get('/admin/scores/history', {
        params: {
          startDate: startDateStr,
          endDate: endDateStr,
          leagueId: selectedLeagueId || undefined,
        },
      });

      const historyScores: Array<{
        date: string;
        points: number;
        note?: string;
        politician: { id: string; name: string };
      }> = historyRes.data.scores ?? [];

      if (historyScores.length > 0) {
        // Group by politician
        const byPolitician = new Map<string, { name: string; entries: string[] }>();
        for (const s of historyScores) {
          const dateLabel = new Date(s.date).toISOString().split('T')[0];
          const line = `  ${dateLabel}: ${s.points > 0 ? '+' : ''}${s.points} pts${s.note ? ` — ${s.note}` : ''}`;
          if (!byPolitician.has(s.politician.id)) {
            byPolitician.set(s.politician.id, { name: s.politician.name, entries: [] });
          }
          byPolitician.get(s.politician.id)!.entries.push(line);
        }

        const historyLines = Array.from(byPolitician.values())
          .map(({ name, entries }) => `${name}:\n${entries.join('\n')}`)
          .join('\n\n');

        recentHistorySection = `
RECENT SCORING HISTORY (last 7 days — use this to prevent double-counting):
${historyLines}

CRITICAL RULE — NO DOUBLE-COUNTING: Do not award points for ongoing situations that have already been scored in the past 7 days unless there is a genuinely NEW development. For example, if a politician already received points for Iran war threats on previous days, do not score them again for the same Iran situation unless something materially new happened today (ceasefire announced, new ultimatum issued, escalation to actual conflict, etc.). Recurring mentions of the same story in the news do not count as new events. Check the history above before awarding any points.
`;
      }
    } catch {
      // Non-fatal — proceed without history if fetch fails
    }

    const rubric = buildScoringRubric(activeScoringTypes);

    const polList = politicians
      .map((p) => `- ${p.name} (${p.id}) — ${p.title}, ${p.state}, ${p.party}`)
      .join('\n');

    const leagueNote = selectedLeague
      ? `\nThis scoring is for league: "${selectedLeague.name}" with scoring types: ${activeScoringTypes.join(', ') || 'standard only'}.`
      : '\nThis is a global score (no specific league).';

    const prompt = `${rubric}
${leagueNote}
${recentHistorySection}
ACTIVE POLITICIANS LIST (use the exact IDs provided):
${polList}

TODAY'S NEWS:
${newsText}

Return ONLY a JSON array. No markdown, no explanation. Each entry must have:
- "politicianId": exact ID from the list above
- "name": politician's full name
- "points": numeric score (whole number, 0 or positive only)
- "note": brief reason (10 words max)

Only include politicians who appear in the news with non-zero scores. Omit politicians with 0 points who are completely absent from the news.`;

    try {
      const client = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true,
      });

      const stream = client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          streamBuffer.current += event.delta.text;
          const preview = streamBuffer.current.slice(-80).replace(/\n/g, ' ');
          setStreamProgress(preview);
        }
      }

      const raw = streamBuffer.current.trim();
      const jsonStart = raw.indexOf('[');
      const jsonEnd = raw.lastIndexOf(']');
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No JSON array found in response');
      }
      const parsed: ScoreResult[] = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
      setResults(parsed.filter((r) => r.politicianId && r.name));
      toast.success(`Generated scores for ${parsed.length} politicians`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate scores');
    } finally {
      setStreaming(false);
      setStreamProgress('');
    }
  }

  const polMap = new Map(politicians.map((p) => [p.id, p]));

  function updatePoints(idx: number, value: string) {
    setResults((prev) => prev.map((r, i) => i === idx ? { ...r, points: parseFloat(value) || 0 } : r));
  }

  function updateNote(idx: number, value: string) {
    setResults((prev) => prev.map((r, i) => i === idx ? { ...r, note: value } : r));
  }

  function removeRow(idx: number) {
    setResults((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (results.length === 0) {
      toast.error('No scores to submit');
      return;
    }

    const valid = results.filter((r) => polMap.has(r.politicianId));
    const skipped = results.length - valid.length;

    if (valid.length === 0) {
      toast.error('No valid politician IDs to submit — check for unmatched rows');
      return;
    }

    setSaving(true);
    try {
      const scores = valid.map((r) => ({
        politicianId: r.politicianId,
        points: r.points,
        note: r.note || undefined,
      }));
      await api.post('/admin/scores', {
        date,
        scores,
        leagueId: selectedLeagueId || undefined,
      });
      const msg = skipped > 0
        ? `Saved ${scores.length} scores${selectedLeague ? ` for ${selectedLeague.name}` : ''} (${skipped} unmatched skipped)`
        : `Saved ${scores.length} scores${selectedLeague ? ` for ${selectedLeague.name}` : ''}!`;
      toast.success(msg);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save scores');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="inline-block bg-crimson-500/20 border border-crimson-500/40 text-crimson-400 text-xs font-display font-bold uppercase tracking-widest px-3 py-1 rounded-sm mb-2">
            Admin · AI
          </div>
          <h1 className="font-display font-extrabold uppercase text-5xl text-cream-100 leading-none" style={{ letterSpacing: '-0.01em' }}>
            AI Score Generator
          </h1>
          <p className="text-cream-400 mt-1 text-sm">
            Paste today's news headlines and let Claude assign scores automatically.
          </p>
        </div>
        {results.length > 0 && (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary text-base px-8 py-3"
          >
            {saving ? 'Saving...' : `Submit ${results.length} Scores`}
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end mb-5">
          <div>
            <label className="label">Score Date</label>
            <input
              type="date"
              className="input w-44"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-48">
            <label className="label">Target League <span className="text-cream-500 font-normal normal-case tracking-normal text-xs ml-1">(optional)</span></label>
            <select
              className="input"
              value={selectedLeagueId}
              onChange={(e) => setSelectedLeagueId(e.target.value)}
            >
              <option value="">Global (all leagues)</option>
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}{l.scoringTypes?.length ? ` · ${l.scoringTypes.map((t) => t.replace('_', ' ')).join(', ')}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-cream-500">
            {loadingPols ? 'Loading...' : `${politicians.length} politicians`}
          </div>
        </div>

        {activeScoringTypes.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-cream-500 font-display uppercase tracking-widest">Active rubrics:</span>
            {activeScoringTypes.map((t) => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-sm font-display font-bold uppercase tracking-wide bg-gold-400/15 text-gold-300 border border-gold-400/30">
                {t.replace('_', ' ')}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-1">
          <label className="label !mb-0">Today's News Headlines / Summary</label>
          <button
            onClick={handleFetchNews}
            disabled={fetchingNews || streaming}
            className="btn-secondary text-sm px-4 py-1.5 flex items-center gap-2"
          >
            {fetchingNews ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Fetching...</span>
              </>
            ) : (
              'Fetch Today\'s News'
            )}
          </button>
        </div>
        <textarea
          className="input w-full h-48 resize-y font-mono text-sm"
          placeholder={`Paste today's political news here...\n\n- Senate passed the infrastructure bill 67-32 with bipartisan support...\n- Rep. Nancy Pelosi announced she will not seek re-election...\n- Gov. Ron DeSantis signed new education bill into law...`}
          value={newsText}
          onChange={(e) => setNewsText(e.target.value)}
        />

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={streaming || loadingPols}
            className="btn-primary px-8 py-2.5"
          >
            {streaming ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Generating...
              </span>
            ) : (
              'Generate Scores'
            )}
          </button>
          {streaming && streamProgress && (
            <div className="text-xs text-cream-500 font-mono truncate max-w-lg">
              {streamProgress}
            </div>
          )}
        </div>
      </div>

      {/* Results table */}
      {results.length > 0 && (
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold uppercase text-xl text-cream-100 tracking-wide">
                Generated Scores
              </h2>
              {selectedLeague && (
                <p className="text-sm text-cream-400 mt-0.5">
                  For: <span className="text-gold-400">{selectedLeague.name}</span>
                </p>
              )}
            </div>
            <span className="text-sm text-cream-400">{results.length} politicians scored</span>
          </div>
          <table className="w-full">
            <thead className="border-b border-ink-600">
              <tr>
                <th className="table-th">Politician</th>
                <th className="table-th">Party</th>
                <th className="table-th w-28 text-center">Points</th>
                <th className="table-th">Reason</th>
                <th className="table-th w-12"></th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, idx) => {
                const pol = polMap.get(row.politicianId);
                const pointsColor = row.points > 0 ? 'text-green-400' : row.points < 0 ? 'text-red-400' : 'text-cream-400';
                return (
                  <tr key={idx} className="table-row">
                    <td className="table-td">
                      <div className="font-semibold text-cream-100">{row.name}</div>
                      {pol && (
                        <div className="text-xs text-cream-500">{pol.title} · {pol.state}</div>
                      )}
                      {!pol && (
                        <div className="text-xs text-red-400">ID not matched in DB</div>
                      )}
                    </td>
                    <td className="table-td">
                      {pol ? <PartyBadge party={pol.party} /> : <span className="text-cream-500">—</span>}
                    </td>
                    <td className="table-td">
                      <input
                        type="number"
                        step="0.5"
                        className={`input w-20 text-center font-bold ${pointsColor}`}
                        value={row.points}
                        onChange={(e) => updatePoints(idx, e.target.value)}
                      />
                    </td>
                    <td className="table-td">
                      <input
                        type="text"
                        className="input text-sm w-full"
                        value={row.note}
                        onChange={(e) => updateNote(idx, e.target.value)}
                      />
                    </td>
                    <td className="table-td text-center">
                      <button
                        onClick={() => removeRow(idx)}
                        className="text-cream-500 hover:text-red-400 transition-colors text-lg leading-none"
                        title="Remove row"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-4 pt-4 border-t border-ink-600 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary px-10 py-3 text-base"
            >
              {saving ? 'Saving...' : `Submit ${results.length} Scores for ${date}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
