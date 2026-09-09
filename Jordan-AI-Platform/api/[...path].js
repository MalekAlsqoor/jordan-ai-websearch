const now = () => new Date().toISOString();

/* =========================
   OFFICIAL SOURCES
========================= */

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
  {
    id: "royal",
    title: "الديوان الملكي الهاشمي",
    publisher: "الديوان الملكي الهاشمي",
    domain: "rhc.jo",
    url: "https://rhc.jo/",
    type: "official",
  },
];

/* =========================
   CATEGORIES
========================= */

const categories = [
  {
    id: "government",
    label: "الحكومة والخدمات",
    labelEn: "Government & services",
    description: "الخدمات والمعلومات الحكومية الرسمية",
    count: 2,
    accent: "gold",
  },
  {
    id: "education",
    label: "التعليم",
    labelEn: "Education",
    description: "المعلومات التعليمية والجامعات",
    count: 1,
    accent: "blue",
  },
  {
    id: "health",
    label: "الصحة",
    labelEn: "Health",
    description: "المعلومات والخدمات الصحية",
    count: 1,
    accent: "green",
  },
];

/* =========================
   LOCAL KNOWLEDGE
========================= */

const knowledge = [
  {
    id: "gov-portal",
    title: "البوابة الرسمية للحكومة الإلكترونية",
    titleEn: "Jordan e-Government portal",
    summary: "الوصول إلى الخدمات والمعلومات الحكومية الرسمية في الأردن.",
    category: "government",
    categoryLabel: "الحكومة والخدمات",
    status: "verified",
    lastVerified: now(),
    source: sources[0],
    tags: ["خدمات حكومية", "حكومة إلكترونية"],
  },
  {
    id: "cspd",
    title: "دائرة الأحوال المدنية والجوازات",
    titleEn: "Civil Status and Passports Department",
    summary: "المصدر الرسمي لخدمات الأحوال المدنية والجوازات في الأردن.",
    category: "government",
    categoryLabel: "الحكومة والخدمات",
    status: "verified",
    lastVerified: now(),
    source: sources[1],
    tags: ["أحوال مدنية", "جوازات"],
  },
  {
    id: "health",
    title: "وزارة الصحة الأردنية",
    titleEn: "Jordanian Ministry of Health",
    summary: "الموقع الرسمي لوزارة الصحة الأردنية.",
    category: "health",
    categoryLabel: "الصحة",
    status: "verified",
    lastVerified: now(),
    source: sources[2],
    tags: ["الصحة", "وزارة الصحة"],
  },
  {
    id: "higher-education",
    title: "وزارة التعليم العالي والبحث العلمي",
    titleEn: "Ministry of Higher Education",
    summary: "المصدر الرسمي للتعليم العالي والبحث العلمي في الأردن.",
    category: "education",
    categoryLabel: "التعليم",
    status: "verified",
    lastVerified: now(),
    source: sources[3],
    tags: ["جامعات", "تعليم عالي"],
  },
  {
    id: "king-jordan",
    title: "الملك عبدالله الثاني",
    titleEn: "King Abdullah II",
    summary:
      "الملك عبدالله الثاني ابن الحسين هو ملك المملكة الأردنية الهاشمية.",
    category: "government",
    categoryLabel: "الحكومة والخدمات",
    status: "verified",
    lastVerified: now(),
    source: sources[4],
    tags: ["ملك الأردن", "الملك عبدالله الثاني", "الأردن"],
  },
];

/* =========================
   HELPERS
========================= */

function sourceWithMeta(source) {
  if (!source) return null;

  return {
    ...source,
    retrievedAt: source.retrievedAt || now(),
    publicationDate: source.publicationDate ?? null,
  };
}

function itemWithMeta(item) {
  return {
    id: String(item.id),
    title: String(item.title),
    titleEn: String(item.titleEn || item.title),
    summary: String(item.summary || ""),
    category: String(item.category || "government"),
    categoryLabel: String(item.categoryLabel || ""),
    status: item.status === "review" ? "review" : "verified",
    lastVerified: item.lastVerified ?? null,
    source: sourceWithMeta(item.source),
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
  };
}

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

  return res.end(JSON.stringify(data));
}

function pathOf(value) {
  if (Array.isArray(value)) {
    return value.join("/");
  }

  return String(value || "")
    .replace(/^\/+|\/+$/g, "");
}

function bodyOf(req) {
  if (!req.body) return {};

  if (typeof req.body === "object") {
    return req.body;
  }

  try {
    return JSON.parse(req.body);
  } catch {
    return {};
  }
}

/* =========================
   ARABIC NORMALIZATION
========================= */

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

/* =========================
   LOCAL SEARCH
========================= */

const aliases = {
  ملك: [
    "الملك",
    "ملك الأردن",
    "عبدالله الثاني",
    "عبد الله الثاني",
    "هاشمي",
  ],

  الاردن: [
    "الأردن",
    "اردن",
    "الاردني",
    "الاردنية",
    "المملكة الأردنية",
  ],

  حكومه: [
    "حكومة",
    "الحكومة",
    "حكومي",
    "الخدمات الحكومية",
  ],

  جواز: [
    "جوازات",
    "جواز السفر",
    "الأحوال المدنية",
  ],

  صحه: [
    "الصحة",
    "وزارة الصحة",
    "صحي",
  ],

  جامعه: [
    "جامعة",
    "جامعات",
    "التعليم العالي",
    "وزارة التعليم العالي",
  ],
};

function localSearch(query) {
  const q = normalizeArabic(query);

  if (!q) {
    return knowledge.map(itemWithMeta);
  }

  const terms = q.split(/\s+/).filter(Boolean);
  const expanded = new Set(terms);

  for (const term of terms) {
    for (const alias of aliases[term] || []) {
      expanded.add(normalizeArabic(alias));
    }
  }

  return knowledge
    .map((item) => {
      const text = normalizeArabic(
        [
          item.title,
          item.titleEn,
          item.summary,
          item.categoryLabel,
          ...(item.tags || []),
        ].join(" ")
      );

      let score = 0;

      if (text.includes(q)) {
        score += 100;
      }

      for (const term of expanded) {
        if (term && text.includes(term)) {
          score += 12;
        }
      }

      if (normalizeArabic(item.title).includes(q)) {
        score += 50;
      }

      return {
        item,
        score,
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => itemWithMeta(x.item));
}

/* =========================
   HTML HELPERS
========================= */

function htmlDecode(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanHtml(value) {
  return htmlDecode(
    String(value || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/* =========================
   TIMEOUT FETCH
========================= */

async function fetchWithTimeout(
  url,
  options = {},
  timeout = 8000
) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/* =========================
   WEB RESULT BUILDER
========================= */

function makeWebItem(
  title,
  url,
  summary,
  index
) {
  if (!url) return null;

  let domain = "web";

  try {
    domain = new URL(url)
      .hostname
      .replace(/^www\./, "");
  } catch {
    return null;
  }

  const cleanTitle =
    cleanHtml(title) || domain;

  const source = {
    id: `web-source-${index}-${Date.now()}`,
    title: domain,
    publisher: domain,
    domain,
    url,
    type: "reliable",
    retrievedAt: now(),
    publicationDate: null,
  };

  return {
    id: `web-${index}-${Date.now()}`,
    title: cleanTitle,
    titleEn: cleanTitle,
    summary:
      cleanHtml(summary) ||
      "نتيجة من البحث المباشر على الإنترنت.",
    category: "government",
    categoryLabel: "بحث مباشر",
    status: "review",
    lastVerified: null,
    source,
    tags: [
      "بحث مباشر",
      domain,
    ],
  };
}

/* =========================================================
   REAL WEB SEARCH
   SearXNG أولاً
   DuckDuckGo كاحتياط
========================================================= */

async function searchSearXNG(
  query,
  limit = 8
) {
  const instances = [
    "https://searx.tiekoetter.com",
    "https://searxng.site",
  ];

  for (const instance of instances) {
    try {
      const params = new URLSearchParams({
        q: String(query),
        language: "ar",
        categories: "general",
        pageno: "1",
        format: "json",
      });

      const response =
        await fetchWithTimeout(
          `${instance}/search?${params.toString()}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 JordanAI/1.0",
              Accept: "application/json",
            },
          },
          8000
        );

      if (!response.ok) {
        continue;
      }

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        !contentType.includes(
          "application/json"
        )
      ) {
        continue;
      }

      const data =
        await response.json();

      const results =
        Array.isArray(data.results)
          ? data.results
          : [];

      const mapped = [];

      for (
        let i = 0;
        i < results.length &&
        mapped.length < limit;
        i++
      ) {
        const result = results[i];

        const item = makeWebItem(
          result.title,
          result.url,
          result.content ||
            result.description ||
            "",
          mapped.length
        );

        if (item) {
          mapped.push(item);
        }
      }

      if (mapped.length) {
        return mapped.map(itemWithMeta);
      }
    } catch (error) {
      console.error(
        "SearXNG error:",
        error?.message || error
      );
    }
  }

  return [];
}

/* =========================
   DUCKDUCKGO FALLBACK
========================= */

async function searchDuckDuckGo(
  query,
  limit = 8
) {
  try {
    const params = new URLSearchParams({
      q: String(query),
      kl: "jo-en",
    });

    const response =
      await fetchWithTimeout(
        `https://html.duckduckgo.com/html/?${params.toString()}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 JordanAI/1.0",
            Accept: "text/html",
          },
        },
        8000
      );

    if (!response.ok) {
      return [];
    }

    const html =
      await response.text();

    const results = [];

    const regex =
      /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

    let match;

    while (
      (match = regex.exec(html)) &&
      results.length < limit
    ) {
      let url =
        htmlDecode(match[1]);

      const title =
        cleanHtml(match[2]);

      if (!title) continue;

      try {
        const parsed =
          new URL(url);

        const redirected =
          parsed.searchParams.get(
            "uddg"
          );

        if (redirected) {
          url = decodeURIComponent(
            redirected
          );
        }
      } catch {}

      const item = makeWebItem(
        title,
        url,
        "نتيجة من بحث الويب المباشر.",
        results.length
      );

      if (item) {
        results.push(item);
      }
    }

    return results.map(itemWithMeta);
  } catch (error) {
    console.error(
      "DuckDuckGo error:",
      error?.message || error
    );

    return [];
  }
}

/* =========================
   COMBINED SEARCH
========================= */

async function liveSearch(
  query,
  limit = 8
) {
  const webResults =
    await searchSearXNG(
      query,
      limit
    );

  if (webResults.length) {
    return webResults;
  }

  return searchDuckDuckGo(
    query,
    limit
  );
}

async function combinedSearch(
  query
) {
  const local =
    localSearch(query);

  const web =
    await liveSearch(query, 8);

  const combined = [];
  const seen = new Set();

  for (const item of [
    ...web,
    ...local,
  ]) {
    const key =
      item?.source?.url ||
      item?.id;

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    combined.push(item);
  }

  return {
    results: combined,
    searchedLive:
      web.length > 0,
  };
}

/* =========================
   MAIN HANDLER
========================= */

export default async function handler(
  req,
  res
) {
  const path =
    pathOf(req.query?.path);

  if (req.method === "OPTIONS") {
    return send(res, {});
  }

  /* =======================
     HEALTH
  ======================= */

  if (
    path === "health" ||
    path === "healthz"
  ) {
    return send(res, {
      status: "ok",
      webSearch: "SearXNG + DuckDuckGo",
    });
  }

  /* =======================
     SOURCES
  ======================= */

  if (path === "sources") {
    return send(res, {
      sources: sources.map(
        sourceWithMeta
      ),
    });
  }

  /* =======================
     CATEGORIES
  ======================= */

  if (path === "categories") {
    return send(res, {
      categories,
    });
  }

  /* =======================
     KNOWLEDGE
  ======================= */

  if (path === "knowledge") {
    return send(res, {
      items: knowledge.map(
        itemWithMeta
      ),
    });
  }

  /* =======================
     SEARCH
  ======================= */

  if (path === "search") {
    const body =
      bodyOf(req);

    const query =
      String(
        body.query ||
        req.query?.q ||
        ""
      ).trim();

    if (!query) {
      return send(
        res,
        {
          results: [],
          searchedLive: false,
        },
        400
      );
    }

    const result =
      await combinedSearch(
        query
      );

    return send(res, {
      query,
      results: result.results,
      searchedLive:
        result.searchedLive,
    });
  }

  /* =======================
     ASSISTANT
  ======================= */

  if (
    path === "assistant/answer"
  ) {
    const body =
      bodyOf(req);

    const question =
      String(
        body.question ||
        body.query ||
        req.query?.q ||
        ""
      ).trim();

    if (!question) {
      return send(
        res,
        {
          answer:
            "اكتب سؤالك أولاً.",
          status:
            "needs-current-source",
          searchedLive: false,
          sources: [],
        },
        400
      );
    }

    const normalized =
      normalizeArabic(
        question
      );

    /* =====================
       KNOWN FACT
    ===================== */

    const directKing =
      normalized.includes(
        "ملك الاردن"
      ) ||
      normalized.includes(
        "من هو ملك الاردن"
      ) ||
      normalized.includes(
        "ملك الاردني"
      ) ||
      normalized.includes(
        "الملك عبدالله الثاني"
      );

    if (directKing) {
      return send(res, {
        question,
        answer:
          "ملك الأردن هو الملك عبدالله الثاني ابن الحسين.",
        status: "verified",
        searchedLive: false,
        sources: [
          sourceWithMeta(
            sources[4]
          ),
        ],
        note:
          "المعلومة مرتبطة بمصدر رسمي ويمكنك فتح المصدر للتحقق من التفاصيل.",
      });
    }

    /* =====================
       REAL WEB SEARCH
    ===================== */

    const result =
      await combinedSearch(
        question
      );

    const results =
      Array.isArray(
        result.results
      )
        ? result.results
        : [];

    if (!results.length) {
      return send(res, {
        question,
        answer:
          "ما قدرت أوصل لنتيجة موثوقة حالياً. جرّب صياغة السؤال بطريقة ثانية.",
        status:
          "needs-current-source",
        searchedLive:
          result.searchedLive,
        sources: [],
      });
    }

    const first =
      results[0];

    const answer =
      `${first.title}\n\n${first.summary}`;

    const answerSources =
      results
        .slice(0, 5)
        .map((item) =>
          sourceWithMeta(
            item.source
          )
        )
        .filter(Boolean);

    return send(res, {
      question,
      answer,
      status:
        result.searchedLive
          ? "needs-current-source"
          : "verified",
      searchedLive:
        result.searchedLive,
      sources:
        answerSources,
      results:
        results.slice(0, 8),
      note:
        result.searchedLive
          ? "تم البحث مباشرة على الويب وإرجاع المصادر."
          : "تمت الاستعانة بالمعرفة المحلية.",
    });
  }

  /* =======================
     UNKNOWN ROUTE
  ======================= */

  return send(
    res,
    {
      error: "Not found",
      path,
    },
    404
  );
}
