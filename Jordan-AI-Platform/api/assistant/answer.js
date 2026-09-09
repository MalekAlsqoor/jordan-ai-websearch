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

const BAD_SITES = [
  "instagram.com",
  "facebook.com",
  "tiktok.com",
  "pinterest.com",
  "youtube.com",
  "play.google.com",
  "softonic.com",
  "translate.google.com",
  "deepl.com"
];

const TRUSTED_JORDAN_SITES = [
  "pm.gov.jo",
  "petra.gov.jo",
  "mop.gov.jo",
  "moi.gov.jo",
  "mfa.gov.jo",
  "royanews.tv",
  "almamlaka.tv",
  "jordannews.jo",
  "addustour.com",
  "assawsana.com"
];

function cleanText(text) {
  return String(text || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeArabic(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .trim();
}

function tokenize(text) {
  return normalizeArabic(text)
    .split(/[^a-z0-9\u0600-\u06ff]+/i)
    .filter((x) => x.length >= 2);
}

function isJordanQuestion(question) {
  const q = normalizeArabic(question);

  return [
    "الاردن",
    "اردن",
    "اردني",
    "عمان",
    "عمّان",
    "jordan",
    "amman",
    "رئيس الوزراء",
    "رئيس وزراء",
    "الحكومه الاردنيه",
    "الحكومة الاردنية"
  ].some((word) => q.includes(normalizeArabic(word)));
}

function buildSearchQueries(question) {
  const queries = [question];

  if (isJordanQuestion(question)) {
    queries.push(`${question} الأردن`);

    if (
      normalizeArabic(question).includes("رئيس الوزراء") ||
      normalizeArabic(question).includes("رئيس وزراء")
    ) {
      queries.push(`رئيس وزراء الأردن الحكومة الأردنية`);
      queries.push(`site:pm.gov.jo رئيس الوزراء الأردن`);
      queries.push(`site:petra.gov.jo رئيس الوزراء الأردن`);
    }
  }

  return [...new Set(queries)];
}

function scoreResult(item, question) {
  const title = normalizeArabic(item.title);
  const snippet = normalizeArabic(item.snippet);
  const url = String(item.url || "").toLowerCase();

  const fullText = `${title} ${snippet}`;
  const questionWords = tokenize(question);

  let score = 0;

  // تطابق كلمات السؤال
  for (const word of questionWords) {
    if (fullText.includes(word)) {
      score += 4;
    }
  }

  // مصدر أردني رسمي
  for (const domain of TRUSTED_JORDAN_SITES) {
    if (url.includes(domain)) {
      score += 30;
    }
  }

  // نتائج سيئة
  for (const domain of BAD_SITES) {
    if (url.includes(domain)) {
      score -= 40;
    }
  }

  // إذا السؤال عن الأردن
  if (isJordanQuestion(question)) {
    if (
      fullText.includes("الاردن") ||
      fullText.includes("الحكومه") ||
      fullText.includes("رئيس الوزراء") ||
      fullText.includes("رئيس وزراء") ||
      url.includes("jordan") ||
      url.includes("gov.jo")
    ) {
      score += 15;
    }
  }

  // العنوان أهم من الوصف
  for (const word of questionWords) {
    if (title.includes(word)) {
      score += 5;
    }
  }

  return score;
}

async function searchOneSearX(instance, query) {
  try {
    const url =
      `${instance}/search?` +
      `q=${encodeURIComponent(query)}` +
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

    if (!response.ok) return [];

    const data = await response.json();

    if (!Array.isArray(data.results)) return [];

    return data.results
      .filter((item) => item.url && (item.title || item.content))
      .map((item) => ({
        title: cleanText(item.title),
        url: item.url,
        snippet: cleanText(item.content || ""),
        engine: item.engine || "SearXNG"
      }));
  } catch {
    return [];
  }
}

async function searchWeb(question) {
  const queries = buildSearchQueries(question);
  const allResults = [];

  // نجرب أكثر من محرك/نسخة بحث
  for (const query of queries) {
    const batch = await Promise.all(
      SEARX_INSTANCES.slice(0, 6).map((instance) =>
        searchOneSearX(instance, query)
      )
    );

    for (const results of batch) {
      allResults.push(...results);
    }

    if (allResults.length >= 30) {
      break;
    }
  }

  // حذف التكرار
  const seen = new Set();

  const unique = allResults.filter((item) => {
    const key = String(item.url || "")
      .toLowerCase()
      .replace(/\/$/, "");

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });

  return unique
    .map((item) => ({
      ...item,
      score: scoreResult(item, question)
    }))
    .filter((item) => item.score > -10)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

async function askHuggingFace(question, results) {
  const token = process.env.HF_TOKEN;

  if (!token) {
    throw new Error("HF_TOKEN غير موجود في Environment Variables");
  }

  const sourcesText = results
    .slice(0, 8)
    .map((item, index) => {
      return [
        `SOURCE ${index + 1}`,
        `العنوان: ${item.title}`,
        `الرابط: ${item.url}`,
        `المحتوى: ${item.snippet || "لا يوجد وصف"}`
      ].join("\n");
    })
    .join("\n\n");

  const systemPrompt = `
أنت "Jordan AI"، مساعد بحث عربي يعتمد على المصادر.

مهمتك:
- اقرأ سؤال المستخدم.
- اقرأ نتائج البحث والمصادر المرفقة.
- أعطِ إجابة واحدة مباشرة ومختصرة.
- لا تسرد نتائج البحث كقائمة.
- لا تخترع معلومات غير موجودة في المصادر.
- إذا كانت المصادر متعارضة، وضّح ذلك.
- إذا لم تكن المصادر كافية للإجابة، قل بوضوح إن المعلومات غير كافية.
- أعطِ الأولوية للمصادر الرسمية والموثوقة.
- بالنسبة للأردن، أعطِ أولوية للمصادر الحكومية والرسمية ثم المصادر الإخبارية الموثوقة.
- أجب بالعربية إذا كان السؤال بالعربية.
- لا تذكر أنك نموذج ذكاء اصطناعي.
- لا تضع روابط جديدة من عندك.
- لا تستخدم معلوماتك القديمة إذا كانت المصادر الحالية تقول شيئًا مختلفًا.

أرجع فقط:
1. الإجابة النهائية.
2. جملة قصيرة جدًا عن درجة الثقة إذا كانت المصادر غير حاسمة.

لا تكتب قائمة بالمصادر داخل الإجابة.
`;

  const userPrompt = `
السؤال:
${question}

مصادر البحث:
${sourcesText}

أجب عن السؤال مباشرة اعتمادًا على المصادر أعلاه.
`;

  const response = await fetch(
    "https://router.huggingface.co/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:cheapest",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      }),
      signal: AbortSignal.timeout(30000)
    }
  );

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(
      `Hugging Face error ${response.status}: ${raw.slice(0, 500)}`
    );
  }

  const data = JSON.parse(raw);

  const answer =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text ||
    "";

  if (!answer.trim()) {
    throw new Error("Hugging Face returned an empty answer");
  }

  return answer.trim();
}

function send(res, data, status = 200) {
  return res.status(status).json(data);
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return send(res, { error: "Method not allowed" }, 405);
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

  try {
    // 1. بحث مباشر
    const results = await searchWeb(question);

    if (!results.length) {
      return send(res, {
        question,
        answer:
          "لم أجد مصادر ويب موثوقة كافية للإجابة عن هذا السؤال حاليًا.",
        status: "needs-current-source",
        searchedLive: true,
        sources: [],
        note: "تعذر العثور على نتائج بحث كافية."
      });
    }

    // 2. AI يقرأ النتائج ويصنع إجابة واحدة
    let answer;

    try {
      answer = await askHuggingFace(question, results);
    } catch (error) {
      console.error("HF ERROR:", error);

      return send(res, {
        question,
        answer:
          "تم العثور على مصادر، لكن تعذر تشغيل طبقة الذكاء الاصطناعي حاليًا. حاول مرة أخرى.",
        status: "needs-current-source",
        searchedLive: true,
        sources: results.slice(0, 8).map((item) => ({
          title: item.title,
          url: item.url,
          snippet: item.snippet,
          type: "reliable",
          retrievedAt: new Date().toISOString(),
          publicationDate: null
        }))
      });
    }

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
      answer,
      status: "verified",
      searchedLive: true,
      sources,
      note: "تم البحث مباشرة على الويب، ثم تحليل المصادر بواسطة Jordan AI."
    });
  } catch (error) {
    console.error("Jordan AI ERROR:", error);

    return send(
      res,
      {
        question,
        answer:
          "صار خطأ مؤقت أثناء البحث والتحليل. جرّب السؤال مرة ثانية.",
        status: "needs-current-source",
        searchedLive: true,
        sources: []
      },
      200
    );
  }
}
