const now = () => new Date().toISOString();

const sources = [
  { id: "gov", title: "البوابة الرسمية للحكومة الإلكترونية", publisher: "الحكومة الأردنية", domain: "jordan.gov.jo", url: "https://jordan.gov.jo/", type: "official" },
  { id: "cspd", title: "دائرة الأحوال المدنية والجوازات", publisher: "دائرة الأحوال المدنية والجوازات", domain: "cspd.gov.jo", url: "https://cspd.gov.jo/", type: "official" },
  { id: "health", title: "وزارة الصحة الأردنية", publisher: "وزارة الصحة", domain: "moh.gov.jo", url: "https://www.moh.gov.jo/", type: "official" },
  { id: "higher", title: "وزارة التعليم العالي والبحث العلمي", publisher: "وزارة التعليم العالي", domain: "mohe.gov.jo", url: "https://mohe.gov.jo/", type: "official" },
  { id: "royal", title: "الديوان الملكي الهاشمي", publisher: "الديوان الملكي الهاشمي", domain: "rhc.jo", url: "https://rhc.jo/", type: "official" },
];

const categories = [
  { id: "government", label: "الحكومة والخدمات", labelEn: "Government & services", description: "الخدمات والمعلومات الحكومية الرسمية", count: 2, accent: "gold" },
  { id: "education", label: "التعليم", labelEn: "Education", description: "المعلومات التعليمية والجامعات", count: 1, accent: "blue" },
  { id: "health", label: "الصحة", labelEn: "Health", description: "المعلومات والخدمات الصحية", count: 1, accent: "green" },
];

const knowledge = [
  { id: "gov-portal", title: "البوابة الرسمية للحكومة الإلكترونية", titleEn: "Jordan e-Government portal", summary: "الوصول إلى الخدمات والمعلومات الحكومية الرسمية في الأردن.", category: "government", categoryLabel: "الحكومة والخدمات", status: "verified", lastVerified: now(), source: sources[0], tags: ["خدمات حكومية", "حكومة إلكترونية"] },
  { id: "cspd", title: "دائرة الأحوال المدنية والجوازات", titleEn: "Civil Status and Passports Department", summary: "المصدر الرسمي لخدمات الأحوال المدنية والجوازات في الأردن.", category: "government", categoryLabel: "الحكومة والخدمات", status: "verified", lastVerified: now(), source: sources[1], tags: ["أحوال مدنية", "جوازات"] },
  { id: "health", title: "وزارة الصحة الأردنية", titleEn: "Jordanian Ministry of Health", summary: "الموقع الرسمي لوزارة الصحة الأردنية.", category: "health", categoryLabel: "الصحة", status: "verified", lastVerified: now(), source: sources[2], tags: ["الصحة", "وزارة الصحة"] },
  { id: "higher-education", title: "وزارة التعليم العالي والبحث العلمي", titleEn: "Ministry of Higher Education", summary: "المصدر الرسمي للتعليم العالي والبحث العلمي في الأردن.", category: "education", categoryLabel: "التعليم", status: "verified", lastVerified: now(), source: sources[3], tags: ["جامعات", "تعليم عالي"] },
  { id: "king-jordan", title: "الملك عبدالله الثاني", titleEn: "King Abdullah II", summary: "الملك عبدالله الثاني ابن الحسين هو ملك المملكة الأردنية الهاشمية.", category: "government", categoryLabel: "الحكومة والخدمات", status: "verified", lastVerified: now(), source: sources[4], tags: ["ملك الأردن", "الملك عبدالله الثاني", "الأردن"] },
];


function sourceWithMeta(source) {
  if (!source) return null;
  return { ...source, retrievedAt: source.retrievedAt || now(), publicationDate: source.publicationDate ?? null };
}

function itemWithMeta(item) {
  return {
    id: String(item.id), title: String(item.title), titleEn: String(item.titleEn || item.title),
    summary: String(item.summary || ""), category: String(item.category || "government"),
    categoryLabel: String(item.categoryLabel || ""), status: item.status === "review" ? "review" : "verified",
    lastVerified: item.lastVerified ?? null, source: sourceWithMeta(item.source), tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
  };
}

function send(res, data, status = 200) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return res.end(JSON.stringify(data));
}

function pathOf(value) {
  return Array.isArray(value) ? value.join("/") : String(value || "").replace(/^\/+|\/+$/g, "");
}

function normalizeArabic(text) {
  return String(text || "")
    .toLowerCase().normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآا]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/ؤ/g, "و").replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

const aliases = {
  "ملك": ["الملك", "ملك الأردن", "عبدالله الثاني", "عبد الله الثاني", "هاشمي"],
  "الاردن": ["اردن", "الاردني", "الاردنية", "المملكة الأردنية"],
  "حكومه": ["حكومة", "الحكومة", "حكومي", "الخدمات الحكومية"],
  "جواز": ["جوازات", "جواز السفر", "الأحوال المدنية"],
  "صحه": ["الصحة", "وزارة الصحة", "صحي"],
  "جامعه": ["جامعة", "جامعات", "التعليم العالي", "وزارة التعليم العالي"],
};

function localSearch(query) {
  const q = normalizeArabic(query);
  if (!q) return knowledge.map(itemWithMeta);
  const terms = q.split(/\s+/).filter(Boolean);
  const expanded = new Set(terms);
  for (const term of terms) for (const alias of aliases[term] || []) expanded.add(normalizeArabic(alias));

  return knowledge.map(item => {
    const text = normalizeArabic([item.title, item.titleEn, item.summary, item.categoryLabel, ...(item.tags || [])].join(" "));
    let score = 0;
    if (text.includes(q)) score += 100;
    for (const term of expanded) if (term && text.includes(term)) score += 12;
    if (normalizeArabic(item.title).includes(q)) score += 50;
    return { item, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).map(x => itemWithMeta(x.item));
}

function htmlDecode(value) {
  return String(value || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function cleanHtml(value) {
  return htmlDecode(String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

async function liveSearch(query, limit = 8) {
  try {
    const url = "https://html.duckduckgo.com/html/?" + new URLSearchParams({ q: String(query), kl: "jo-en" }).toString();
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 JordanAI/1.0", Accept: "text/html" } });
    if (!response.ok) return [];
    const html = await response.text();
    const results = [];
    const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = re.exec(html)) && results.length < limit) {
      let url = htmlDecode(match[1]);
      const title = cleanHtml(match[2]);
      if (!title) continue;
      try {
        const u = new URL(url);
        const redirected = u.searchParams.get("uddg");
        if (redirected) url = decodeURIComponent(redirected);
      } catch {}
      let domain = "web";
      try { domain = new URL(url).hostname.replace(/^www\./, ""); } catch {}
      const source = { id: `web-source-${results.length}-${Date.now()}`, title: domain, publisher: domain, domain, url, type: "reliable", retrievedAt: now(), publicationDate: null };
      results.push({ id: `web-${results.length}-${Date.now()}`, title, titleEn: title, summary: "نتيجة من البحث المباشر على الويب.", category: "government", categoryLabel: "بحث مباشر", status: "review", lastVerified: null, source, tags: ["بحث مباشر", domain] });
    }
    return results.map(itemWithMeta);
  } catch (error) {
    console.error("liveSearch", error);
    return [];
  }
}

async function combinedSearch(query) {
  const local = localSearch(query);
  if (local.length >= 3) return { results: local, searchedLive: false };
  const web = await liveSearch(query, 8);
  return { results: [...local, ...web], searchedLive: web.length > 0 };
}

function categoriesResponse() {
  return categories.map(c => ({ ...c, count: Number(c.count), accent: String(c.accent) }));
}

function bodyOf(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch {} }
  return {};
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return send(res, { ok: true });
  const path = pathOf(req.query?.path);

  if (path === "health") return send(res, { status: "ok" });

  if (path === "home" || path === "") {
    const featured = knowledge.map(itemWithMeta);
    return send(res, {
      verifiedCount: featured.filter(x => x.status === "verified").length,
      categoryCount: categories.length,
      sourceCount: sources.length,
      lastUpdated: now(),
      categories: categoriesResponse(),
      featured,
      popularQuestions: [
        "من هو ملك الأردن؟",
        "ما هي الخدمات الحكومية في الأردن؟",
        "وين أجد خدمات الأحوال المدنية والجوازات؟",
        "وين أجد معلومات وزارة الصحة؟",
      ],
    });
  }

  if (path === "categories") return send(res, categoriesResponse());

  if (path === "knowledge") {
    const category = String(req.query?.category || "");
    let result = knowledge.map(itemWithMeta);
    if (category) result = result.filter(x => x.category === category);
    const limit = Math.min(Math.max(Number(req.query?.limit || 12), 1), 50);
    return send(res, result.slice(0, limit));
  }

  if (path.startsWith("knowledge/")) {
    const id = decodeURIComponent(path.slice("knowledge/".length));
    const item = knowledge.find(x => x.id === id);
    if (!item) return send(res, { error: "Knowledge item not found", id }, 404);
    return send(res, itemWithMeta(item));
  }

  if (path === "search") {
    const query = String(req.query?.q || req.query?.query || "").trim();
    const limit = Math.min(Math.max(Number(req.query?.limit || 8), 1), 20);
    if (!query) return send(res, { query: "", searchedLive: false, message: "اكتب كلمة أو سؤال للبحث.", results: [] });
    const found = await combinedSearch(query);
    const results = found.results.slice(0, limit);
    return send(res, {
      query,
      searchedLive: found.searchedLive,
      message: results.length ? (found.searchedLive ? "تم البحث في المعرفة المحلية والويب مباشرة." : "تم العثور على نتائج من المعرفة المتاحة.") : "ما لقيت نتيجة مناسبة. جرّب صياغة السؤال بطريقة ثانية.",
      results,
    });
  }

  if (path === "assistant/answer") {
    const body = bodyOf(req);
    const question = String(body.question || req.query?.q || "").trim();
    if (!question) return send(res, { question: "", answer: "اكتب سؤالك وأنا ببحثلك عنه.", status: "not-verified", searchedLive: false, sources: [], note: "اكتب سؤالاً من كلمتين أو أكثر." });

    const normalized = normalizeArabic(question);
    const directKing = normalized.includes("ملك الاردن") || normalized.includes("من هو ملك الاردن") || normalized.includes("ملك الاردني");
    const found = await combinedSearch(question);

    if (directKing) {
      return send(res, {
        question,
        answer: "ملك الأردن هو الملك عبدالله الثاني ابن الحسين.",
        status: "verified",
        searchedLive: found.searchedLive,
        sources: [sourceWithMeta(sources[4])],
        note: "المعلومة مرتبطة بمصدر رسمي، ويمكنك فتح المصدر للتحقق من التفاصيل.",
      });
    }

    const sourcesUsed = found.results.map(x => x.source).filter(Boolean).slice(0, 8).map(sourceWithMeta);
    if (found.results.length) {
      return send(res, {
        question,
        answer: "لقيت معلومات مرتبطة بسؤالك من المصادر المتاحة. راجع النتائج والمصادر المرفقة للتأكد من التفاصيل.",
        status: found.searchedLive ? "needs-current-source" : "verified",
        searchedLive: found.searchedLive,
        sources: sourcesUsed,
        note: found.searchedLive ? "تم دعم البحث بنتائج مباشرة من الويب." : "الإجابة مبنية على المعرفة المتاحة في الأردن AI.",
      });
    }

    return send(res, {
      question,
      answer: "ما قدرت ألاقي معلومة مناسبة حالياً. جرّب صياغة السؤال بطريقة ثانية.",
      status: "not-verified",
      searchedLive: false,
      sources: [],
      note: "جرّب إضافة اسم الجهة أو الخدمة أو المدينة إلى السؤال.",
    });
  }

  if (path === "feedback") {
    return send(res, { id: `feedback-${Date.now()}`, received: true, message: "تم استلام الملاحظة، شكرًا لك." });
  }

  return send(res, { error: "API route not found", path }, 404);
}
