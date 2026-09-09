import { createHash } from "node:crypto";

export type WebSearchResult = {
  id: string;
  title: string;
  summary: string;
  url: string;
  domain: string;
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function cleanText(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function unwrapDuckDuckGoUrl(value: string) {
  const decoded = decodeHtml(value);
  try {
    const parsed = new URL(decoded, "https://duckduckgo.com");
    const target = parsed.searchParams.get("uddg");
    return target ? decodeURIComponent(target) : decoded;
  } catch {
    return decoded;
  }
}

export async function searchWeb(query: string, limit = 8): Promise<WebSearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=wt-wt`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; JordanAI/1.0; +https://jordan-ai.example)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(9000),
  });

  if (!response.ok) throw new Error(`Web search failed: ${response.status}`);
  const html = await response.text();
  const results: WebSearchResult[] = [];
  const pattern = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  for (const match of html.matchAll(pattern)) {
    const resultUrl = unwrapDuckDuckGoUrl(match[1]);
    if (!/^https?:\/\//i.test(resultUrl)) continue;
    const title = cleanText(match[2]);
    const summary = cleanText(match[3]);
    let domain = resultUrl;
    try { domain = new URL(resultUrl).hostname.replace(/^www\./, ""); } catch {}
    const id = `web-${createHash("sha1").update(resultUrl).digest("hex").slice(0, 16)}`;
    results.push({ id, title, summary, url: resultUrl, domain });
    if (results.length >= limit) break;
  }

  return results;
}
