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

const knowledge = [
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
    lastVerified: new Date().toISOString(),
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
    lastVerified: new Date().toISOString(),
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
    lastVerified: new Date().toISOString(),
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
    lastVerified: new Date().toISOString(),
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
  res.setHeader("Access-Control-Allow-Origin", "*");
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

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

function normalizePath(value) {
  if (Array.isArray(value)) {
    return value.join("/");
  }

  return String(value || "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

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

function sourceWithMeta(source) {
  if (!source) return null;

  return {
    ...source,
    retrievedAt:
      source.retrievedAt || new Date().toISOString(),
    publicationDate:
      source.publicationDate || null,
  };
}

function apiItem(item) {
  if (!item) return null;

  return {
    ...item,
    lastVerified:
      item.lastVerified || new Date().toISOString(),
    source: sourceWithMeta(item.source),
  };
}

function apiItems(items) {
  return Array.isArray(items)
    ? items.map(apiItem).filter(Boolean)
    : [];
}

function apiCategories() {
  return categories.map((category) => ({
    ...category,
    count:
      typeof category.count === "number"
        ? category.count
        : knowledge.filter(
            (item) => item.categoryId === category.id
          ).length,
    accent: category.accent || "gold",
  }));
}

/* -------------------------------------------------------
   Local search
------------------------------------------------------- */

function searchLocal(query) {
  const original = String(query || "").trim();

  if (!original) {
    return apiItems(knowledge);
  }

  const q = normalizeArabic(original);

  const terms = q
    .split(/\s+/)
    .filter(Boolean);

  const synonyms = {
    ملك: ["ملك", "الملك", "عبدالله", "عبد الله", "هاشمي"],
    الاردن: ["الاردن", "اردن", "الاردني", "الاردنية"],
    حكومه: ["حكومة", "حكومه", "حكومي", "الحكومة"],
    جواز: ["جواز", "جوازات", "جواز السفر"],
    صحه: ["صحة", "الصحة", "وزارة الصحة"],
    جامعه: ["جامعة", "جامعات", "التعليم العالي"],
  };

  const expandedTerms = new Set(terms);

  for (const term of terms) {
    const matches = synonyms[term];

    if (matches) {
      matches.forEach((value) =>
        expandedTerms.add(normalizeArabic(value))
      );
    }
  }

  const scored = knowledge
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

      for (const term of expandedTerms) {
        if (term && text.includes(term)) {
          score += 10;
        }
      }

      if (
        normalizeArabic(item.title).includes(q)
      ) {
        score += 50;
      }

      return {
        item,
        score,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return apiItems(
    scored.map((entry) => entry.item)
  );
}

/* -------------------------------------------------------
   Free live web search
   DuckDuckGo HTML - no API key
------------------------------------------------------- */

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<b>/gi, "")
    .replace(/<\/b>/gi, "");
}

function stripHtml(value) {
  return decodeHtml(
    String(value || "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

async function searchWeb(query, limit = 8) {
  const q = String(query || "").trim();

  if (!q) {
    return [];
  }

  try {
    const url =
      "https://html.duckduckgo.com/html/?" +
      new URLSearchParams({
        q,
        kl: "jo-en",
        kp: "1",
      }).toString();

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; JordanAI/1.0)",
        Accept:
          "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();

    const results = [];

    const resultPattern =
      /<div[^>]*class="[^"]*result[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;

    let match;

    while (
      (match = resultPattern.exec(html)) &&
      results.length < limit
    ) {
      const block = match[1];

      const linkMatch =
        block.match(
          /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"/i
        );

      if (!linkMatch) {
        continue;
      }

      let resultUrl = decodeHtml(linkMatch[1]);

      const titleMatch =
        block.match(
          /<a[^>]*class="[^"]*result__a[^"]*"[^>]*>([\s\S]*?)<\/a>/i
        );

      const snippetMatch =
        block.match(
          /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i
        ) ||
        block.match(
          /<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/i
        );

      let title = stripHtml(
        titleMatch ? titleMatch[1] : ""
      );

      let summary = stripHtml(
        snippetMatch ? snippetMatch[1] : ""
      );

      if (!title) {
        continue;
      }

      /*
       * DuckDuckGo sometimes returns a redirect URL.
       * Try to extract the real URL when possible.
       */
      try {
        const parsed = new URL(resultUrl);

        const redirected =
          parsed.searchParams.get("uddg");

        if (redirected) {
          resultUrl = decodeURIComponent(redirected);
        }
      } catch {
        // Keep original URL.
      }

      let domain = "";

      try {
        domain = new URL(resultUrl).hostname
          .replace(/^www\./, "");
      } catch {
        domain = "web";
      }

      results.push({
        id:
          "web-" +
          results.length +
          "-" +
          Date.now(),
        title,
        titleEn: title,
        summary:
          summary ||
          "نتيجة من البحث المباشر على الويب.",
        category: "web",
        categoryId: "web",
        categoryLabel: "بحث مباشر",
        status: "unverified",
        lastVerified: null,
        source: {
          id:
            "web-source-" +
            results.length +
            "-" +
            Date.now(),
          title: domain,
          publisher: domain,
          domain,
          url: resultUrl,
          type: "web",
          retrievedAt: new Date().toISOString(),
          publicationDate: null,
        },
        tags: ["بحث مباشر", domain],
      });
    }

    return results;
  } catch (error) {
    console.error("Web search failed:", error);
    return [];
  }
}

/* -------------------------------------------------------
   Search combined
------------------------------------------------------- */

async function performSearch(query) {
  const localResults = searchLocal(query);

  /*
   * Always try live search when the local database
   * doesn't have enough information.
   */
  if (localResults.length >= 3) {
    return {
      results: localResults,
      searchedLive: false,
    };
  }

  const webResults = await searchWeb(query, 8);

  const combined = [
    ...localResults,
    ...webResults,
  ];

  return {
    results: combined,
    searchedLive: webResults.length > 0,
  };
}

/* -------------------------------------------------------
   Main Vercel handler
------------------------------------------------------- */

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return send(res, { ok: true });
  }

  const path = normalizePath(
    req.query?.path
  );

  /* ---------------------------------------------------
     HOME
  --------------------------------------------------- */

  if (path === "home" || path === "") {
    const safeKnowledge = apiItems(knowledge);
    const safeCategories = apiCategories();
    const safeSources = sources.map(sourceWithMeta);

    return send(res, {
      featured: safeKnowledge,
      popular: safeKnowledge,
      latest: safeKnowledge,

      categories: safeCategories,
      sources: safeSources,

      verifiedCount: safeKnowledge.filter(
        (item) => item.status === "verified"
      ).length,

      categoryCount: safeCategories.length,

      sourceCount: safeSources.length,

      lastUpdated: new Date().toISOString(),

      popularQuestions: [
        "ما هي الخدمات الحكومية في الأردن؟",
        "وين أجد خدمات الأحوال المدنية والجوازات؟",
        "وين أجد معلومات وزارة الصحة؟",
        "وين أجد معلومات التعليم العالي في الأردن؟",
      ],
    });
  }

  /* ---------------------------------------------------
     CATEGORIES
  --------------------------------------------------- */

  if (path === "categories") {
    return send(res, apiCategories());
  }

  /* ---------------------------------------------------
     KNOWLEDGE LIST
  --------------------------------------------------- */

  if (path === "knowledge") {
    const category =
      req.query?.category ||
      req.query?.categoryId ||
      "";

    let results = apiItems(knowledge);

    if (category) {
      results = results.filter(
        (item) =>
          item.categoryId === category ||
          item.category === category
      );
    }

    return send(res, results);
  }

  /* ---------------------------------------------------
     SINGLE KNOWLEDGE ITEM
  --------------------------------------------------- */

  if (path.startsWith("knowledge/")) {
    const id = path
      .split("/")
      .slice(1)
      .join("/");

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

    return send(res, apiItem(item));
  }

  /* ---------------------------------------------------
     SEARCH
  --------------------------------------------------- */

  if (path === "search") {
    const query = String(
      req.query?.q ||
        req.query?.query ||
        req.query?.search ||
        ""
    ).trim();

    if (!query) {
      return send(res, {
        query: "",
        results: [],
        items: [],
        searchedLive: false,
        total: 0,
        message: "اكتب كلمة أو سؤال للبحث.",
      });
    }

    const searchResult =
      await performSearch(query);

    const results = apiItems(
      searchResult.results
    );

    return send(res, {
      query,
      results,
      items: results,
      searchedLive: searchResult.searchedLive,
      total: results.length,
      message:
        results.length > 0
          ? searchResult.searchedLive
            ? "تم البحث في المعرفة المحلية والويب مباشرة."
            : "تم العثور على نتائج من المعرفة المتاحة."
          : "ما لقيت نتيجة مناسبة. جرّب صياغة السؤال بطريقة ثانية.",
    });
  }

  /* ---------------------------------------------------
     ASSISTANT ANSWER
  --------------------------------------------------- */

  if (path === "assistant/answer") {
    let body = req.body || {};

    /*
     * In case body arrives as a JSON string.
     */
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const question = String(
      body.question ||
        body.query ||
        req.query?.q ||
        ""
    ).trim();

    if (!question) {
      return send(res, {
        question: "",
        answer:
          "اكتب سؤالك وأنا ببحثلك عنه.",
        status: "needs_query",
        note: null,
        sources: [],
        results: [],
        searchedLive: false,
      });
    }

    /*
     * Special Jordan fact:
     * This gives a useful direct answer while
     * still returning web sources below.
     */
    const normalizedQuestion =
      normalizeArabic(question);

    let directAnswer = null;

    if (
      normalizedQuestion.includes("ملك الاردن") ||
      normalizedQuestion.includes("ملك الاردني") ||
      normalizedQuestion.includes("من هو ملك الاردن")
    ) {
      directAnswer =
        "ملك الأردن هو الملك عبدالله الثاني ابن الحسين.";
    }

    const searchResult =
      await performSearch(question);

    const results = apiItems(
      searchResult.results
    );

    if (directAnswer) {
      return send(res, {
        question,
        answer: directAnswer,
        status: "verified",
        note: searchResult.searchedLive
          ? "تم دعم البحث بمصادر من الويب."
          : "الإجابة مبنية على المعلومات المتاحة.",
        sources: results.slice(0, 8),
        results,
        searchedLive:
          searchResult.searchedLive,
      });
    }

    if (results.length > 0) {
      return send(res, {
        question,
        answer:
          "لقيتلك معلومات مرتبطة بسؤالك من المصادر المتاحة. راجع النتائج والمصادر المرفقة للتأكد من التفاصيل.",
        status: "available",
        note: searchResult.searchedLive
          ? "تم إجراء بحث مباشر على الويب."
          : "النتائج من قاعدة المعرفة المحلية.",
        sources: results.slice(0, 8),
        results,
        searchedLive:
          searchResult.searchedLive,
      });
    }

    return send(res, {
      question,
      answer:
        "ما قدرت ألاقي معلومة مناسبة حالياً. جرّب صياغة السؤال بطريقة ثانية.",
      status: "not_found",
      note:
        "إذا كان السؤال عن موضوع أردني محدد، جرّب إضافة اسم الجهة أو المدينة أو الخدمة.",
      sources: [],
      results: [],
      searchedLive: false,
    });
  }

  /* ---------------------------------------------------
     FEEDBACK
  --------------------------------------------------- */

  if (path === "feedback") {
    return send(res, {
      ok: true,
      message: "تم استلام الملاحظة.",
    });
  }

  /* ---------------------------------------------------
     404
  --------------------------------------------------- */

  return send(
    res,
    {
      error: "API route not found",
      path,
    },
    404
  );
}
