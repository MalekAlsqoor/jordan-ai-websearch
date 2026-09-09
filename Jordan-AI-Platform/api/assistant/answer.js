const SEARX_INSTANCES = [
  "https://searx.tiekoetter.com",
  "https://search.yuri.llc",
  "https://search.catboy.house",
  "https://search.mectov.my.id",
  "https://search.luma.lol",
  "https://search.blitzw.in",
  "https://search.ethibox.fr",
  "https://search.im-in.space",
  "https://search.indst.eu",
  "https://search.inetol.net",
  "https://search.serpensin.com",
  "https://search.zina.dev"
];

const NEWS_WORDS = [
  "أخبار",
  "خبر",
  "آخر الأخبار",
  "اخر الاخبار",
  "الأخبار",
  "اخبار",
  "اليوم",
  "آخر المستجدات",
  "مستجدات",
  "news",
  "latest news",
  "breaking news",
  "today"
];

const JORDAN_WORDS = [
  "الأردن",
  "الاردن",
  "أردني",
  "اردني",
  "Jordan",
  "Amman",
  "عمّان"
];

function cleanText(text) {
  return String(text || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isNewsQuestion(question) {
  const q = question.toLowerCase();
  return NEWS_WORDS.some((word) => q.includes(word.toLowerCase()));
}

function isJordanQuestion(question) {
  const q = question.toLowerCase();
  return JORDAN_WORDS.some((word) => q.includes(word.toLowerCase()));
}

function scoreResult(item, question) {
  const text =
    `${item.title || ""} ${item.snippet || ""} ${item.url || ""}`.toLowerCase();

  let score = 0;

  if (isJordanQuestion(question)) {
    if (
      text.includes("jordan") ||
      text.includes("الأردن") ||
      text.includes("الاردن") ||
      text.includes("amman") ||
      text.includes("عمّان")
    ) {
      score += 10;
    }
  }

  if (isNewsQuestion(question)) {
    if (
      text.includes("news") ||
      text.includes("أخبار") ||
      text.includes("خبر") ||
      text.includes("today") ||
      text.includes("اليوم")
    ) {
      score += 5;
    }
  }

  const badSites = [
    "instagram.com",
    "facebook.com",
    "tiktok.com",
    "pinterest.com",
    "youtube.com",
    "play.google.com",
    "softonic.com"
  ];

  if (badSites.some((site) => text.includes(site))) {
    score -= 20;
  }

  if (
    text.includes("royanews.tv") ||
    text.includes("petra.gov.jo") ||
    text.includes("almamlaka.tv") ||
    text.includes("jordannews.jo") ||
    text.includes("addustour.com") ||
    text.includes("assawsana.com")
  ) {
    score += 15;
  }

  return score;
}

function sortResults(results, question) {
  return results
    .map((item) => ({
      ...item,
      score: scoreResult(item, question)
    }))
    .sort((a, b) => b.score - a.score);
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
        signal: AbortSignal.timeout(7000)
      });

      if (!response.ok) continue;

      const data = await response.json();

      if (!Array.isArray(data.results) || !data.results.length) {
        continue;
      }

      const results = data.results
        .filter((item) => item.url && (item.title || item.content))
        .map((item) => ({
          title: cleanText(item.title),
          url: item.url,
          snippet: cleanText(item.content || ""),
          engine: item.engine || "SearXNG"
        }));

      if (results.length) {
        return sortResults(results, question);
      }
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
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) return [];

    const html = await response.text();

    const results = [];

    const regex =
      /result__a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?result__snippet[^>]*>([\s\S]*?)<\/(?:a|div)>/gi;

    let match;

    while ((match = regex.exec(html)) && results.length < 12) {
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

    return sortResults(results, question);
  } catch {
    return [];
  }
}

function removeDuplicateResults(results) {
  const seen = new Set();

  return results.filter((item) => {
    const key = item.url;

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function buildAnswer(question, results) {
  if (!results.length) {
    return {
      answer:
        "لم أتمكن من الوصول إلى نتائج بحث موثوقة حاليًا. جرّب السؤال مرة أخرى بعد قليل.",
      status: "needs-current-source"
    };
  }

  const selected = results.slice(0, 5);

  if (isNewsQuestion(question)) {
    return {
      answer:
        `هذه أبرز النتائج التي وجدتها حاليًا حول «${question}»:\n\n` +
        selected
          .map((item, index) => {
            return `${index + 1}. ${item.title}\n${item.snippet || "لا يوجد وصف متاح للمصدر."}`;
          })
          .join("\n\n"),
      status: "verified"
    };
  }

  return {
    answer:
      `بحثت لك على الويب عن «${question}»:\n\n` +
      selected
        .map((item, index) => {
          return `${index + 1}. ${item.title}\n${item.snippet || "لا يوجد وصف متاح للمصدر."}`;
        })
        .join("\n\n"),
    status: "verified"
  };
}

function send(res, data, status = 200) {
  return res.status(status).json(data);
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return send(
      res,
      {
        error: "Method not allowed"
      },
      405
    );
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
    return send(
      res,
      {
        question: "",
        answer: "اكتب سؤالك أولًا.",
        status: "not-verified",
        searchedLive: false,
        sources: []
      },
      400
    );
  }

  let results = [];

  // البحث الرئيسي
  results = await searchSearXNG(question);

  // إزالة النتائج الضعيفة جدًا
  results = results.filter((item) => item.score > -10);

  // إذا فشل البحث الرئيسي
  if (!results.length) {
    results = await searchDuckDuckGo(question);
    results = results.filter((item) => item.score > -10);
  }

  results = removeDuplicateResults(results);

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
      ? "تم البحث مباشرة على الويب وترتيب النتائج حسب صلتها بالسؤال."
      : "تعذر الوصول إلى نتائج بحث حاليًا."
  });
}
