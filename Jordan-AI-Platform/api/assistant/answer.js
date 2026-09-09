const SEARCH_ENGINES = [
  "https://search.bus-hit.me",
  "https://searx.be",
  "https://search.sapti.me",
];

function normalizeArabic(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function sourceType(domain) {
  if (
    domain.endsWith(".gov.jo") ||
    domain === "rhc.jo" ||
    domain.endsWith(".edu.jo")
  ) {
    return "official";
  }

  return "reliable";
}

async function searchSearXNG(question) {
  for (const base of SEARCH_ENGINES) {
    try {
      const url =
        `${base}/search?q=${encodeURIComponent(question)}` +
        `&format=json&language=ar&categories=general`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Jordan-AI/1.0",
        },
        signal: AbortSignal.timeout(7000),
      });

      if (!response.ok) continue;

      const data = await response.json();

      if (!Array.isArray(data.results)) continue;

      const results = data.results
        .filter((item) => item && item.url && item.title)
        .slice(0, 8)
        .map((item) => ({
          title: String(item.title || "").replace(/<[^>]*>/g, ""),
          url: String(item.url),
          content: String(item.content || ""),
          domain: getDomain(item.url),
        }));

      if (results.length > 0) {
        return results;
      }
    } catch {
      // جرّب محرك SearXNG التالي
    }
  }

  return [];
}

async function searchDuckDuckGo(question) {
  try {
    const url =
      `https://api.duckduckgo.com/?q=${encodeURIComponent(question)}` +
      `&format=json&no_html=1&skip_disambig=1`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Jordan-AI/1.0",
      },
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const results = [];

    if (data.AbstractURL && data.AbstractText) {
      results.push({
        title: data.Heading || "DuckDuckGo",
        url: data.AbstractURL,
        content: data.AbstractText,
        domain: getDomain(data.AbstractURL),
      });
    }

    function collect(items) {
      if (!Array.isArray(items)) return;

      for (const item of items) {
        if (item.FirstURL && item.Text) {
          results.push({
            title: item.Text,
            url: item.FirstURL,
            content: item.Text,
            domain: getDomain(item.FirstURL),
          });
        }

        if (Array.isArray(item.Topics)) {
          collect(item.Topics);
        }
      }
    }

    collect(data.RelatedTopics);

    return results.slice(0, 8);
  } catch {
    return [];
  }
}

function buildAnswer(question, results) {
  if (!results.length) {
    return {
      answer:
        "لم أتمكن من الوصول إلى نتائج بحث حاليًا. جرّب السؤال مرة أخرى بعد قليل.",
      status: "needs-current-source",
    };
  }

  const useful = results.slice(0, 5);

  const lines = useful.map((item) => {
    const text = item.content
      .replace(/\s+/g, " ")
      .trim();

    return text
      ? `${item.title}: ${text}`
      : item.title;
  });

  return {
    answer:
      `بحثت لك في الويب عن «${question}».\n\n` +
      lines.join("\n\n"),
    status: "verified",
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const body =
    typeof req.body === "object" && req.body !== null
      ? req.body
      : {};

  const question = String(
    body.question || body.query || ""
  ).trim();

  if (!question) {
    return res.status(400).json({
      error: "السؤال مطلوب",
    });
  }

  const normalized = normalizeArabic(question);

  // بحث عام حقيقي
  let results = await searchSearXNG(question);

  // إذا SearXNG ما اشتغل، جرّب DuckDuckGo
  if (!results.length) {
    results = await searchDuckDuckGo(question);
  }

  // ترتيب المصادر الرسمية والأردنية أولًا
  results.sort((a, b) => {
    const aOfficial =
      a.domain.endsWith(".gov.jo") ||
      a.domain === "rhc.jo";

    const bOfficial =
      b.domain.endsWith(".gov.jo") ||
      b.domain === "rhc.jo";

    return Number(bOfficial) - Number(aOfficial);
  });

  const result = buildAnswer(question, results);

  const sources = results.map((item, index) => ({
    id: `web-${index + 1}`,
    title: item.title,
    publisher: item.domain,
    domain: item.domain,
    url: item.url,
    type: sourceType(item.domain),
    retrievedAt: new Date().toISOString(),
    publicationDate: null,
  }));

  return res.status(200).json({
    question,
    answer: result.answer,
    status: result.status,
    searchedLive: true,
    sources,
    note:
      normalized.includes("الاردن") ||
      normalized.includes("اردن")
        ? "تم إعطاء أولوية للمصادر الأردنية الرسمية عندما ظهرت في نتائج البحث."
        : "تم البحث في الويب وعرض المصادر المستخدمة.",
  });
}
