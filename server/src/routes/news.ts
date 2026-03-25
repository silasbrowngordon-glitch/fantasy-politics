import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();

interface NewsArticle {
  url: string;
  title?: string;
  description?: string;
}

interface NewsApiResponse {
  status: string;
  message?: string;
  articles?: NewsArticle[];
}

// GET /api/news/fetch
// Proxies three NewsAPI queries server-side and returns combined deduplicated articles.
// Requires admin auth so random users can't burn the API quota.
router.get('/fetch', requireAuth, async (req: Request, res: Response) => {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'NEWS_API_KEY is not configured on the server' });
  }

  const queries = [
    `https://newsapi.org/v2/top-headlines?country=us&category=politics&pageSize=100&apiKey=${apiKey}`,
    `https://newsapi.org/v2/everything?q=congress+senator+representative&language=en&sortBy=publishedAt&pageSize=100&apiKey=${apiKey}`,
    `https://newsapi.org/v2/everything?q=politician+investigation+indicted+resign+scandal&language=en&sortBy=publishedAt&pageSize=100&apiKey=${apiKey}`,
  ];

  try {
    const seenUrls = new Set<string>();
    const articles: Array<{ title: string; description: string }> = [];

    for (const url of queries) {
      const newsRes = await fetch(url);
      const json = await newsRes.json() as NewsApiResponse;

      if (json.status !== 'ok') {
        return res.status(502).json({ error: json.message || 'NewsAPI returned an error' });
      }

      for (const article of json.articles ?? []) {
        if (!article.url || seenUrls.has(article.url)) continue;
        seenUrls.add(article.url);
        const title = article.title?.trim() ?? '';
        const description = article.description?.trim() ?? '';
        if (!title && !description) continue;
        articles.push({ title, description });
      }
    }

    return res.json({ articles, total: articles.length });
  } catch (err: any) {
    return res.status(502).json({ error: err.message || 'Failed to fetch from NewsAPI' });
  }
});

export default router;
