const sources = [
  {
    id: "gov",
    title: "البوابة الرسمية للحكومة الإلكترونية",
    publisher: "الحكومة الأردنية",
    domain: "jordan.gov.jo",
    url: "https://jordan.gov.jo/",
    type: "official",
  },
  {
    id: "cspd",
    title: "دائرة الأحوال المدنية والجوازات",
    publisher: "دائرة الأحوال المدنية والجوازات",
    domain: "cspd.gov.jo",
    url: "https://cspd.gov.jo/",
    type: "official",
  },
  {
    id: "health",
    title: "وزارة الصحة الأردنية",
    publisher: "وزارة الصحة",
    domain: "moh.gov.jo",
    url: "https://www.moh.gov.jo/",
    type: "official",
  },
  {
    id: "higher",
    title: "وزارة التعليم العالي والبحث العلمي",
    publisher: "وزارة التعليم العالي",
    domain: "mohe.gov.jo",
    url: "https://mohe.gov.jo/",
    type: "official",
  },
];

const categories = [
  {
    id: "government",
    label: "الحكومة والخدمات",
    labelEn: "Government & services",
    description: "الخدمات والمعلومات الحكومية الرسمية",
  },
  {
    id: "education",
    label: "التعليم",
    labelEn: "Education",
    description: "المعلومات التعليمية والجامعات",
  },
  {
    id: "health",
    label: "الصحة",
    labelEn: "Health",
    description: "المعلومات والخدمات الصحية",
  },
];

const knowledge = [
  {
    id: "king-abdullah",
    title: "الملك عبدالله الثاني ابن الحسين",
    titleEn: "King Abdullah II of Jordan",
    summary:
      "الملك عبدالله الثاني ابن الحسين هو ملك المملكة الأردنية الهاشمية.",
    category: "government",
    categoryId: "government",
    categoryLabel: "الحكومة والخدمات",
    status: "verified",
    source: {
      id: "royal",
      title: "الموقع الرسمي لجلالة الملك عبدالله الثاني",
      publisher: "الديوان الملكي الهاشمي",
      domain: "kingabdullah.jo",
      url: "https://kingabdullah.jo/",
      type: "official",
    },
    tags: [
      "الملك عبدالله الثاني",
      "ملك الأردن",
      "الأردن",
      "الملك",
    ],
  },
  {
    id: "gov-portal",
    title: "البوابة الرسمية للحكومة الإلكترونية",
    titleEn: "Jordan e-Government portal",
    summary:
      "الوصول إلى الخدمات والمعلومات الحكومية الرسمية في الأردن.",
    category: "government",
    categoryId: "government",
    categoryLabel: "الحكومة والخدمات",
    status: "verified",
    source: sources[0],
    tags: ["خدمات حكومية", "حكومة إلكترونية"],
  },
  {
    id: "cspd",
    title: "دائرة الأحوال المدنية والجوازات",
    titleEn: "Civil Status and Passports Department",
    summary:
      "المصدر الرسمي لخدمات الأحوال المدنية والجوازات في الأردن.",
    category: "government",
    categoryId: "government",
    categoryLabel: "الحكومة والخدمات",
    status: "verified",
    source: sources[1],
    tags: ["أحوال مدنية", "جوازات"],
  },
  {
    id: "health",
    title: "وزارة الصحة الأردنية",
    titleEn: "Jordanian Ministry of Health",
    summary: "الموقع الرسمي لوزارة الصحة الأردنية.",
    category: "health",
    categoryId: "health",
    categoryLabel: "الصحة",
    status: "verified",
    source: sources[2],
    tags: ["الصحة", "وزارة الصحة"],
  },
  {
    id: "higher-education",
    title: "وزارة التعليم العالي والبحث العلمي",
    titleEn: "Ministry of Higher Education",
    summary:
      "المصدر الرسمي للتعليم العالي والبحث العلمي في الأردن.",
    category: "education",
    categoryId: "education",
    categoryLabel: "التعليم",
    status: "verified",
    source: sources[3],
    tags: ["جامعات", "تعليم عالي"],
  },
];

function send(res, data, status = 200) {
  res.status(status);

  res.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );

  res.setHeader("Cache-Control", "no-store");

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  res.end(JSON.stringify(data));
}

/* -----------------------------
   Arabic normalization
----------------------------- */

function normalizeArabic(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* -----------------------------
   Search helpers
----------------------------- */

const stopWords = new Set([
  "ما",
  "ماذا",
  "مين",
  "من",
  "وين",
  "اين",
  "كيف",
  "هل",
  "هو",
  "هي",
  "في",
  "عن",
  "على",
  "الى",
  "منه",
  "هذا",
  "هذه",
  "هناك",
  "اريد",
  "بدي",
  "ابغى",
  "ممكن",
  "لو",
  "سمحت",
]);

function getSearchTerms(query) {
  return normalizeArabic(query)
    .split(" ")
    .filter((word) => word.length > 1 && !stopWords.has(word));
}

function scoreKnowledge(item, query) {
  const normalizedQuery = normalizeArabic(query);
  const terms = getSearchTerms(query);

  const title = normalizeArabic(item.title);
  const titleEn = normalizeArabic(item.titleEn);
  const summary = normalizeArabic(item.summary);
  const category = normalizeArabic(item.categoryLabel);
  const tags = normalizeArabic(
    (item.tags || []).join(" ")
  );

  let score = 0;

  if (!normalizedQuery) {
    return 1;
  }

  if (title.includes(normalizedQuery)) {
    score += 100;
  }

  if (titleEn.includes(normalizedQuery)) {
    score += 80;
  }

  if (summary.includes(normalizedQuery)) {
    score += 40;
  }

  if (category.includes(normalizedQuery)) {
    score += 30;
  }

  if (tags.includes(normalizedQuery)) {
    score += 60;
  }

  for (const term of terms) {
    if (title.includes(term)) {
      score += 25;
    }

    if (titleEn.includes(term)) {
      score += 20;
    }

    if (summary.includes(term)) {
      score += 10;
    }

    if (tags.includes(term)) {
      score += 15;
    }
  }

  return score;
}

function searchLocal(query) {
  const q = String(query || "").trim();

  if (!q) {
    return knowledge;
  }

  return knowledge
    .map((item) => ({
      item,
      score: scoreKnowledge(item, q),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}

/* -----------------------------
   Free live web search
----------------------------- */

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function searchWeb(query, limit = 5) {
  try {
    const url =
      "https://html.duckduckgo.com/html/?q=" +
      encodeURIComponent(query);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 Jordan-AI-WebSearch/1.0",
        Accept:
          "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();

    const results = [];

    const blocks = html.match(
      /<div[^>]*class="result"[\s\S]*?<\/div>\s*<\/div>/gi
    ) || [];

    for (const block of blocks) {
      if (results.length >= limit) {
        break;
      }

      const titleMatch = block.match(
        /class="result__a"[^>]*>([\s\S]*?)<\/a>/i
      );

      const urlMatch = block.match(
        /class="result__a"[^>]*href="([^"]+)"/i
      );

      const snippetMatch = block.match(
        /class="result__snippet"[^>]*>([\s\S]*?)<\/a?>/i
      );

      if (!titleMatch || !urlMatch) {
        continue;
      }

      const title = decodeHtml(
        titleMatch[1].replace(/<[^>]+>/g, "")
      ).trim();

      const resultUrl = decodeHtml(urlMatch[1]).trim();

      const summary = snippetMatch
        ? decodeHtml(
            snippetMatch[1].replace(/<[^>]+>/g, "")
          ).trim()
        : "";

      let domain = "";

      try {
        domain = new URL(resultUrl).hostname;
      } catch {
        domain = "";
      }

      if (!title || !resultUrl) {
        continue;
      }

      results.push({
        id: "web-" + results.length + "-" + Date.now(),
        title,
        titleEn: title,
        summary:
          summary ||
          "نتيجة من البحث على الويب.",
        category: "web",
        categoryId: "web",
        categoryLabel: "بحث الويب",
        status: "web",
        source: {
          id: "web-source-" + results.length,
          title: domain || "Web",
          publisher: domain || "Web",
          domain,
          url: resultUrl,
          type: "web",
        },
        tags: ["بحث ويب"],
      });
    }

    return results;
  } catch {
    return [];
  }
}

/* -----------------------------
   Extract request path
----------------------------- */

function getPath(req) {
  const rawPath = req.query?.path;

  if (Array.isArray(rawPath)) {
    return rawPath.join("/");
  }

  return String(rawPath || "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

/* -----------------------------
   API handler
----------------------------- */

export default async function handler(req, res) {
  const path = getPath(req);

  if (req.method === "OPTIONS") {
    return send(res, { ok: true });
  }

  /* HOME */

  if (path === "home" || path === "") {
    return send(res, {
      featured: knowledge,
      popular: knowledge,
      latest: knowledge,
      categories,
      sources,

      verifiedCount: knowledge.filter(
        (item) => item.status === "verified"
      ).length,

      categoryCount: categories.length,

      sourceCount: sources.length,

      lastUpdated: new Date().toISOString(),

      popularQuestions: [
        "مين ملك الأردن؟",
        "ما هي الخدمات الحكومية في الأردن؟",
        "وين أجد خدمات الأحوال المدنية والجوازات؟",
        "وين أجد معلومات وزارة الصحة؟",
        "وين أجد معلومات التعليم العالي في الأردن؟",
      ],
    });
  }

  /* CATEGORIES */

  if (path === "categories") {
    return send(res, categories);
  }

  /* KNOWLEDGE */

  if (path === "knowledge") {
    return send(res, knowledge);
  }

  /* SINGLE KNOWLEDGE ITEM */

  if (path.startsWith("knowledge/")) {
    const id = path
      .slice("knowledge/".length)
      .split("/")[0];

    const item = knowledge.find(
      (entry) => entry.id === id
    );

    if (!item) {
      return send(
        res,
        {
          error: "Knowledge item not found",
          id,
        },
        404
      );
    }

    return send(res, item);
  }

  /* SEARCH */

  if (path === "search") {
    const query =
      req.query?.q ||
      req.query?.query ||
      req.query?.search ||
      "";

    const localResults = searchLocal(query);

    let results = localResults;
    let searchedLive = false;

    /*
      إذا ما لقينا نتيجة محلية،
      نعمل بحث ويب مجاني.
    */

    if (localResults.length === 0 && String(query).trim()) {
      const webResults = await searchWeb(
        String(query),
        5
      );

      if (webResults.length > 0) {
        results = webResults;
        searchedLive = true;
      }
    }

    return send(res, {
      query,
      results,
      items: results,
      searchedLive,
      total: results.length,

      message:
        results.length > 0
          ? "تم العثور على نتائج."
          : "ما لقيت نتائج مطابقة حالياً.",
    });
  }

  /* ASSISTANT */

  if (path === "assistant/answer") {
    const body =
      req.body &&
      typeof req.body === "object"
        ? req.body
        : {};

    const question =
      body.question ||
      body.query ||
      req.query?.q ||
      "";

    const cleanQuestion = String(question).trim();

    if (!cleanQuestion) {
      return send(res, {
        question: "",
        answer:
          "اكتبلي سؤالك وأنا ببحثلك عنه.",
        sources: [],
        results: [],
        searchedLive: false,
        status: "empty",
      });
    }

    let results = searchLocal(cleanQuestion);
    let searchedLive = false;

    /*
      إذا السؤال عن شيء موجود محلياً،
      نستخدم المصدر المحلي الموثوق.
    */

    if (results.length > 0) {
      return send(res, {
        question: cleanQuestion,

        answer:
          results.length === 1
            ? results[0].summary
            : "لقيتلك معلومات مرتبطة بسؤالك من المصادر المتاحة.",

        sources: results,
        results,

        searchedLive: false,
        status: "success",
      });
    }

    /*
      إذا ما وجدنا محلياً،
      نحاول البحث على الويب مجاناً.
    */

    const webResults = await searchWeb(
      cleanQuestion,
      5
    );

    if (webResults.length > 0) {
      results = webResults;
      searchedLive = true;

      return send(res, {
        question: cleanQuestion,

        answer:
          "بحثت على الويب وهاي أبرز النتائج المرتبطة بسؤالك.",

        sources: results,
        results,

        searchedLive,
        status: "success",
      });
    }

    return send(res, {
      question: cleanQuestion,

      answer:
        "ما لقيت معلومة مطابقة حالياً. جرّب صياغة السؤال بطريقة ثانية.",

      sources: [],
      results: [],

      searchedLive: false,
      status: "not_found",

      note:
        "لم يتم العثور على نتيجة محلية أو نتيجة من بحث الويب.",
    });
  }

  /* FEEDBACK */

  if (path === "feedback") {
    return send(res, {
      ok: true,
      message: "تم استلام الملاحظات.",
    });
  }

  /* UNKNOWN ROUTE */

  return send(
    res,
    {
      error: "API route not found",
      path,
    },
    404
  );
}
