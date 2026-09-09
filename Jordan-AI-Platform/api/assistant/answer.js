const SEARX_INSTANCES = [
  "https://searx.tiekoetter.com",
  "https://search.yuri.llc",
  "https://search.catboy.house",
  "https://search.mectov.my.id",
  "https://search.lumy.live",
  "https://search.bladerunn.in",
  "https://search.ethibox.fr",
  "https://search.im-in.space",
  "https://search.indst.eu",
  "https://search.inetol.net",
  "https://search.serpensin.com",
  "https://search.zina.dev",
  "https://search.2b9t.xyz",
  "https://search.anoni.net"
];

function cleanText(text) {
  return String(text || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function send(res, data, status = 200) {
  res.status(status).json(data);
}

async function searchSearXNG(question) {
  for (const instance of SEARX_INSTANCES) {
    try {
      const url =
        `${instance}/search?` +
        `q=${encodeURIComponent(question)}` +
        `&format=json` +
        `&language=ar` +
        `&categories=general`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Jordan-AI/1.0"
        },
        signal: AbortSignal.timeout(6000)
      });

      if (!response.ok) continue;

      const data = await response.json();

      if (!Array.isArray(data.results) || !data.results.length) {
        continue;
      }

      return data.results
        .filter((item) => item.url && (item.title || item.content))
        .slice(0, 8)
        .map((item) => ({
          title: cleanText(item.title),
          url: item.url,
          snippet: cleanText(item.content || item.title),
          engine: item.engine || "SearXNG"
        }));
    } catch {
      continue;
    }
  }

  return [];
}

async function searchDuckDuckGo(question) {
  try {
    const url =
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(question)}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36"
      },
      signal: AbortSignal.timeout(7000)
    });

    if (!response.ok) return [];

    const html = await response.text();

    const results = [];

    const regex =
      /result__a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?result__snippet[^>]*>([\s\S]*?)<\/a>/gi;

    let match;

    while ((match = regex.exec(html)) && results.length < 8) {
      const url = match[1];
      const title = cleanText(match[2]);
      const snippet = cleanText(match[3]);

      if (!url || !title) continue;

      results.push({
        title,
        url,
        snippet,
        engine: "DuckDuckGo"
      });
    }

    return results;
  } catch {
    return [];
  }
}

function buildAnswer(question, results) {
  if (!results.length) {
    return {
      answer:
        "لم أتمكن من الوصول إلى نتائج بحث حاليًا. جرّب السؤال مرة أخرى بعد قليل.",
      status: "needs-current-source"
    };
  }

  const useful = results.slice(0, 5);

  const answer =
    `بحثت لك على الويب عن: «${question}»\n\n` +
    useful
      .map((item, index) => {
        return `${index + 1}. ${item.title}\n${item.snippet}`;
      })
      .join("\n\n");

  return {
    answer,
    status: "verified"
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return send(res, {
      error: "Method not allowed"
    }, 405);
  }

  let question = "";

  if (req.method === "POST") {
    try {
      if (req.body && typeof req.body === "object") {
        question = req.body.question || req.body.query || "";
      } else if (typeof req.body === "string") {
        const parsed = JSON.parse(req.body);
        question = parsed.question || parsed.query || "";
      }
    } catch {}
  }

  if (!question) {
    question = req.query?.q || req.query?.question || "";
  }

  question = String(question).trim();

  if (!question) {
    return send(res, {
      question: "",
      answer: "اكتب سؤالك أولًا.",
      status: "not-verified",
      searchedLive: false,
      sources: []
    }, 400);
  }

  // البحث الحقيقي
  let results = await searchSearXNG(question);

  // احتياط إذا كل SearXNG فشل
  if (!results.length) {
    results = await searchDuckDuckGo(question);
  }

  const result = buildAnswer(question, results);

  const sources = results.slice(0, 8).map((item) => ({
    title: item.title,
    url: item.url,
    snippet: item.snippet,
    type: "reliable",
    retrievedAt: new Date().toISOString(),
    publicationDate: null
  }));

  return send(res, {
    question,
    answer: result.answer,
    status: result.status,
    searchedLive: true,
    sources,
    note: results.length
      ? "تم البحث مباشرة على الويب وعرض المصادر المستخدمة."
      : "تعذر الوصول إلى محركات البحث حاليًا."
  });
}
