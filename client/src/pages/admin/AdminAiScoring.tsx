import React, { useEffect, useState, useRef } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import PartyBadge from '../../components/PartyBadge';

interface Politician {
  id: string;
  name: string;
  title: string;
  party: string;
  state: string;
}

interface ScoreResult {
  politicianId: string;
  name: string;
  points: number;
  note: string;
}

const SCORING_RUBRIC = `
You are a Fantasy Politics scoring assistant. Given today's political news, assign point scores to politicians.

SCORING RUBRIC:
- Major legislative win (bill passed, signed into law): +4 to +6 points
- Key floor vote (voted on important legislation): +1 to +2 points
- Major speech, press conference, or policy announcement: +1 to +2 points
- Positive news coverage (praised, endorsed, major accomplishment): +1 to +3 points
- Scandal, ethics violation, or serious negative coverage: -3 to -6 points
- Minor controversy or criticism: -1 to -2 points
- Resignation, indictment, or criminal charges: -8 to -10 points
- Bipartisan cooperation or cross-aisle achievement: +3 points bonus
- Committee leadership action (hearing, subpoena, etc.): +1 to +2 points
- No notable news: 0 points

RULES:
- Only score politicians who appear in the news. Return 0 for others.
- Be fair and consistent across parties.
- Points should be integers or .5 increments.
- The "note" should be a brief (10 words max) reason.
`;

export default function AdminAiScoring() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [newsText, setNewsText] = useState('');
  const [results, setResults] = useState<ScoreResult[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingPols, setLoadingPols] = useState(true);
  const [fetchingNews, setFetchingNews] = useState(false);
  const [fetchStatus, setFetchStatus] = useState('');
  const streamBuffer = useRef('');

  useEffect(() => {
    api.get('/politicians', { params: { limit: 500 } })
      .then((r) => setPoliticians(r.data.politicians ?? r.data))
      .catch(() => toast.error('Failed to load politicians'))
      .finally(() => setLoadingPols(false));
  }, []);

  async function handleFetchNews() {
    const newsApiKey = import.meta.env.VITE_NEWS_API_KEY;
    if (!newsApiKey) {
      toast.error('VITE_NEWS_API_KEY is not set');
      return;
    }

    setFetchingNews(true);
    setFetchStatus('Fetching top politics headlines...');

    const queries = [
      {
        label: 'top US politics headlines',
        url: `https://newsapi.org/v2/top-headlines?country=us&category=politics&pageSize=100&apiKey=${newsApiKey}`,
      },
      {
        label: 'Congress / Senate / House coverage',
        url: `https://newsapi.org/v2/everything?q=congress+senator+representative&language=en&sortBy=publishedAt&pageSize=100&apiKey=${newsApiKey}`,
      },
      {
        label: 'scandals and investigations',
        url: `https://newsapi.org/v2/everything?q=politician+investigation+indicted+resign+scandal&language=en&sortBy=publishedAt&pageSize=100&apiKey=${newsApiKey}`,
      },
    ];

    try {
      const seenUrls = new Set<string>();
      const lines: string[] = [];

      for (const q of queries) {
        setFetchStatus(`Fetching ${q.label}...`);
        const res = await fetch(q.url);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `NewsAPI error ${res.status} on "${q.label}"`);
        }
        const json = await res.json();
        const articles: Array<{ url: string; title?: string; description?: string }> =
          json.articles ?? [];

        for (const article of articles) {
          if (!article.url || seenUrls.has(article.url)) continue;
          seenUrls.add(article.url);
          const title = article.title?.trim() ?? '';
          const desc = article.description?.trim() ?? '';
          if (!title && !desc) continue;
          lines.push(desc ? `${title} — ${desc}` : title);
        }
      }

      if (lines.length === 0) {
        toast.error('No articles returned from NewsAPI');
        return;
      }

      setNewsText(lines.join('\n'));
      toast.success(`Fetched ${lines.length} unique articles from NewsAPI`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch news');
    } finally {
      setFetchingNews(false);
      setFetchStatus('');
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

    const polList = politicians
      .map((p) => `- ${p.name} (${p.id}) — ${p.title}, ${p.state}, ${p.party}`)
      .join('\n');

    const prompt = `${SCORING_RUBRIC}

ACTIVE POLITICIANS LIST (use the exact IDs provided):
${polList}

TODAY'S NEWS:
${newsText}

Return ONLY a JSON array. No markdown, no explanation. Each entry must have:
- "politicianId": exact ID from the list above
- "name": politician's full name
- "points": numeric score (0 if not in the news)
- "note": brief reason (or "No notable news" if 0)

Only include politicians who appear in the news with non-zero scores, plus any with notable mentions. Omit politicians with 0 points who are completely absent from the news.`;

    try {
      const client = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true,
      });

      const stream = client.messages.stream({
        model: 'claude-sonnet-4-20250514',
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

      // Parse the JSON response
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
    setSaving(true);
    try {
      const scores = results.map((r) => ({
        politicianId: r.politicianId,
        points: r.points,
        note: r.note || undefined,
      }));
      await api.post('/admin/scores', { date, scores });
      toast.success(`Saved ${scores.length} scores for ${date}!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save scores');
    } finally {
      setSaving(false);
    }
  }

  const polMap = new Map(politicians.map((p) => [p.id, p]));

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="inline-block bg-crimson-600/20 border border-crimson-600/40 text-crimson-400 text-xs font-bold px-3 py-1 rounded-full mb-2">
            ADMIN · AI
          </div>
          <h1 className="font-display text-4xl font-bold text-white">AI Score Generator</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Paste today's news headlines and let Claude assign scores automatically.
          </p>
        </div>
        {results.length > 0 && (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary text-lg px-8 py-3"
          >
            {saving ? 'Saving...' : `Submit ${results.length} Scores`}
          </button>
        )}
      </div>

      {/* Date + news input */}
      <div className="card mb-6">
        <div className="flex gap-4 items-end mb-4">
          <div>
            <label className="label">Score Date</label>
            <input
              type="date"
              className="input w-44"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-500">
            {loadingPols ? 'Loading politicians...' : `${politicians.length} politicians loaded`}
          </div>
        </div>

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
                <span>{fetchStatus || 'Fetching...'}</span>
              </>
            ) : (
              <>
                <span>📰</span>
                <span>Fetch Today's News</span>
              </>
            )}
          </button>
        </div>
        <textarea
          className="input w-full h-48 resize-y font-mono text-sm"
          placeholder={`Paste today's political news here. For example:\n\n- Senate passed the infrastructure bill 67-32 with bipartisan support. Key vote by Sen. Joe Manchin.\n- Rep. Nancy Pelosi announced she will not seek re-election.\n- Gov. Ron DeSantis signed new education bill into law.\n- Rep. George Santos faces new ethics investigation...`}
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
              '✨ Generate Scores'
            )}
          </button>
          {streaming && streamProgress && (
            <div className="text-xs text-gray-500 font-mono truncate max-w-lg">
              {streamProgress}
            </div>
          )}
        </div>
      </div>

      {/* Results table */}
      {results.length > 0 && (
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white text-lg">
              Generated Scores
              <span className="ml-2 text-sm text-gray-400 font-normal">— edit before submitting</span>
            </h2>
            <span className="text-sm text-gray-400">{results.length} politicians scored</span>
          </div>
          <table className="w-full">
            <thead className="border-b border-navy-600">
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
                const pointsNum = row.points;
                const pointsColor =
                  pointsNum > 0
                    ? 'text-green-400'
                    : pointsNum < 0
                    ? 'text-red-400'
                    : 'text-gray-400';
                return (
                  <tr key={idx} className="table-row">
                    <td className="table-td">
                      <div className="font-semibold text-white">{row.name}</div>
                      {pol && (
                        <div className="text-xs text-gray-500">{pol.title} · {pol.state}</div>
                      )}
                      {!pol && (
                        <div className="text-xs text-red-400">⚠ ID not matched in DB</div>
                      )}
                    </td>
                    <td className="table-td">
                      {pol ? <PartyBadge party={pol.party} /> : <span className="text-gray-500">—</span>}
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
                        className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none"
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

          <div className="mt-4 pt-4 border-t border-navy-600 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary px-10 py-3 text-lg"
            >
              {saving ? 'Saving...' : `Submit ${results.length} Scores for ${date}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
