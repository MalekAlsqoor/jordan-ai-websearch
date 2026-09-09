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
  "deepl.com",
  "wiktionary.org",
  "mo3jam.com",
  "meenmeen.com"
];

const TRUSTED_JORDAN_SITES = [
  "pm.gov.jo",
  "petra.gov.jo",
  "mop.gov.jo",
  "moi.gov.jo",
  "mfa.gov.jo",
  "almamlaka.tv",
  "royanews.tv",
  "jordannews.jo",
  "addustour.com",
  "assawsana.com"
];

const GENERAL_STOP_WORDS = new Set([
  "مين",
  "من",
  "ما",
  "ماذا",
  "شو",
  "ايش",
  "اي",
  "أي",
  "هل",
  "هو",
  "هي",
  "هم",
  "هن",
  "كم",
  "متى",
  "اين",
  "وين",
  "كيف",
  "ليش",
  "لماذا",
  "عن",
  "في",
  "من",
  "على",
  "الى",
  "إلى",
  "هذا",
  "هذه",
  "ذلك",
  "تلك",
  "هو",
  "هي",
  "كان",
  "كانت",
  "يكون",
  "تكون"
]);

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
    .replace(/[؟?!.,،؛:()[\]{}"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalizeArabic(text)
    .split(/[^a-z0-9\u0600-\u06ff]+/i)
    .filter((word) => {
      return word.length >= 2 && !GENERAL_STOP_WORDS.has(word);
    });
}

function domainOf(url) {
  try {
    return new URL(url).hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isTrustedJordanDomain(domain) {
  return TRUSTED_JORDAN_SITES.some(
    (trusted) =>
      domain === trusted ||
      domain.endsWith(`.${trusted}`)
  );
}

function isBadDomain(domain) {
  return BAD_SITES.some(
    (bad) =>
      domain === bad ||
      domain.endsWith(`.${bad}`)
  );
}

function isJordanQuestion(question) {
  const q = normalizeArabic(question);

  return [
    "الاردن",
    "اردن",
    "اردني",
    "اردنيه",
    "الاردنيه",
    "عمان",
    "jordan",
    "amman",
    "الحكومه الاردنيه",
    "الحكومة الاردنية",
    "رئيس الوزراء",
    "رئيس وزراء"
  ].some((term) => q.includes(normalizeArabic(term)));
}

function isPrimeMinisterQuestion(question) {
  const q = normalizeArabic(question);

  return (
    q.includes("رئيس الوزراء") ||
    q.includes("رئيس وزراء") ||
    q.includes("رئيس الحكومه") ||
    q.includes("رئيس الحكومة")
  );
}

function buildSearchQueries(question) {
  const q = normalizeArabic(question);
  const queries = [];

  // السؤال الأصلي فقط إذا كان فيه كلمات مهمة فعلًا
  const usefulWords = tokenize(question);

  if (usefulWords.length > 0) {
    queries.push(question);
  }

  // أسئلة رئيس وزراء الأردن لها مسار بحث خاص
  if (isPrimeMinisterQuestion(question)) {
    queries.push("رئيس وزراء الأردن");
    queries.push("رئيس الوزراء الأردني");
    queries.push("رئيس الحكومة الأردنية");
    queries.push("الحكومة الأردنية رئيس الوزراء");
    queries.push("رئيس الوزراء الأردن آخر تحديث");

    // مصادر حكومية مباشرة
    queries.push("site:pm.gov.jo رئيس الوزراء الأردني");
    queries.push("site:pm.gov.jo رئيس وزراء الأردن");
    queries.push("site:petra.gov.jo رئيس الوزراء الأردني");
    queries.push("site:petra.gov.jo رئيس وزراء الأردن");

    // إنجليزي يساعد محركات البحث أحيانًا
    queries.push("Prime Minister of Jordan");
    queries.push("Jordan Prime Minister current");
  } else if (isJordanQuestion(question)) {
    queries.push(`${question} الأردن`);
    queries.push(`${question} الأردن الحكومة`);
    queries.push(`${question} Jordan`);
  }

  // منع التكرار
  return [...new Set(queries)].filter(Boolean).slice(0, 12);
}

function scoreResult(item, question) {
  const title = normalizeArabic(item.title);
  const snippet = normalizeArabic(item.snippet);
  const domain = domainOf(item.url);

  const fullText = `${title} ${snippet}`;
  const questionWords = tokenize(question);

  let score = 0;

  // --------------------------------
  // 1. تطابق الكلمات المهمة
  // --------------------------------
  for (const word of questionWords) {
    if (title.includes(word)) {
      score += 12;
    } else if (snippet.includes(word)) {
      score += 5;
    }
  }

  // --------------------------------
  // 2. المصادر السيئة
  // --------------------------------
  if (isBadDomain(domain)) {
    score -= 100;
  }

  // --------------------------------
  // 3. أسئلة الأردن
  // --------------------------------
  if (isJordanQuestion(question)) {
    if (fullText.includes("الاردن")) {
      score += 15;
    }

    if (fullText.includes("الاردني")) {
      score += 10;
    }

    if (domain.endsWith("gov.jo")) {
      score += 50;
    }

    if (isTrustedJordanDomain(domain)) {
      score += 35;
    }
  }

  // --------------------------------
  // 4. رئيس الوزراء
  // --------------------------------
  if (isPrimeMinisterQuestion(question)) {
    if (
      title.includes("رئيس الوزراء") ||
      title.includes("رئيس وزراء")
    ) {
      score += 45;
    }

    if (
      snippet.includes("رئيس الوزراء") ||
      snippet.includes("رئيس وزراء")
    ) {
      score += 25;
    }

    if (fullText.includes("الحكومه الاردنيه")) {
      score += 20;
    }

    if (fullText.includes("الحكومة الاردنية")) {
      score += 20;
    }

    if (domain === "pm.gov.jo") {
      score += 100;
    }

    if (domain === "petra.gov.jo") {
      score += 85;
    }

    if (
      domain === "almamlaka.tv" ||
      domain === "royanews.tv"
    ) {
      score += 45;
    }
  }

  // --------------------------------
  // 5. صفحات ويكيبيديا العامة
  // --------------------------------
  if (
    domain === "wikipedia.org" ||
    domain.endsWith(".wikipedia.org")
  ) {
    score -= 25;
  }

  // --------------------------------
  // 6. الرابط نفسه فيه مؤشرات الأردن
  // --------------------------------
  const url = String(item.url || "").toLowerCase();

  if (url.includes("jordan")) {
    score += 10;
  }

  if (url.includes("gov.jo")) {
    score += 30;
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

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data.results)) {
      return [];
    }

    return data.results
      .filter(
        (item) =>
          item?.url &&
          (item?.title || item?.content)
      )
      .map((item) => ({
        title: cleanText(item.title),
        url: String(item.url),
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

  /*
   * نبحث بكل الاستعلامات المهمة.
   * نستخدم أول 8 نسخ بحث حتى لا نطيل زمن الطلب جدًا.
   */
  const instances = SEARX_INSTANCES.slice(0, 8);

  for (const query of queries) {
    const batches = await Promise.all(
      instances.map((instance) =>
        searchOneSearX(instance, query)
      )
    );

    for (const results of batches) {
      allResults.push(...results);
    }

    // إذا جمعنا نتائج كافية نكمل الترتيب بدل طلبات إضافية
    if (allResults.length >= 60) {
      break;
    }
  }

  // --------------------------------
  // حذف النتائج المكررة
  // --------------------------------
  const seen = new Set();

  const uniqueResults = allResults.filter((item) => {
    const key = String(item.url || "")
      .toLowerCase()
      .replace(/\/$/, "");

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  // --------------------------------
  // ترتيب النتائج
  // --------------------------------
  const scored = uniqueResults
    .map((item) => ({
      ...item,
      score: scoreResult(item, question)
    }))
    .sort((a, b) => b.score - a.score);

  /*
   * في أسئلة الأردن نحاول منع النتائج العشوائية تمامًا.
   */
  let filtered;

  if (isJordanQuestion(question)) {
    filtered = scored.filter(
      (item) => item.score >= 5
    );
  } else {
    filtered = scored.filter(
      (item) => item.score >= 0
    );
  }

  return filtered.slice(0, 12);
}

function sourceType(url) {
  const domain = domainOf(url);

  if (
    domain.endsWith("gov.jo") ||
    domain === "petra.gov.jo"
  ) {
    return "official";
  }

  if (isTrustedJordanDomain(domain)) {
    return "reliable";
  }

  return "secondary";
}

async function askHuggingFace(question, results) {
  const token = process.env.HF_TOKEN;

  if (!token) {
    throw new Error(
      "HF_TOKEN غير موجود في Environment Variables"
    );
  }

  /*
   * نرسل أفضل 8 مصادر فقط للـAI.
   * هذا يقلل التكلفة ويمنع تشويش النموذج.
   */
  const sourcesText = results
    .slice(0, 8)
    .map((item, index) => {
      return [
        `SOURCE ${index + 1}`,
        `العنوان: ${item.title}`,
        `الرابط: ${item.url}`,
        `الموقع: ${domainOf(item.url)}`,
        `المحتوى: ${item.snippet || "لا يوجد وصف"}`
      ].join("\n");
    })
    .join("\n\n");

  const systemPrompt = `
أنت Jordan AI، مساعد بحث عربي يعتمد على البحث المباشر في الويب.

مهمتك الأساسية:
1. افهم سؤال المستخدم.
2. اقرأ المصادر التي تم جمعها من الويب.
3. حدد المصادر الأكثر صلة بالسؤال.
4. أعطِ إجابة واحدة مباشرة.
5. لا تخترع أي معلومة غير مدعومة بالمصادر.
6. لا تعتمد على معرفتك القديمة إذا كانت المصادر الحالية مختلفة.
7. عند وجود مصدر حكومي أو رسمي، أعطه الأولوية.
8. عند الأسئلة عن الأردن، أعطِ الأولوية للمصادر الحكومية الأردنية والمصادر الإخبارية الأردنية الموثوقة.
9. إذا كانت المصادر متناقضة، اذكر وجود التعارض باختصار.
10. إذا لم تكن المصادر كافية، قل إن المعلومات غير كافية بدل التخمين.

قواعد مهمة جدًا:
- لا تجب من اسم صفحة البحث فقط.
- اقرأ العنوان والمحتوى والوصف.
- لا تعتبر كلمة واحدة مثل "مين" أو "من" موضوع السؤال.
- افهم السؤال كاملًا.
- لا تسرد المصادر داخل الإجابة.
- لا تضف روابط جديدة.
- إذا كان السؤال بالعربية، أجب بالعربية.
- كن مباشرًا ومختصرًا.
- لا تقل إنك ChatGPT.
- لا تشرح طريقة عملك.

إذا كان السؤال:
"مين رئيس وزراء الأردن؟"

فالمطلوب تحديد الشخص الذي يشغل منصب رئيس وزراء الأردن حاليًا اعتمادًا على المصادر الحالية، وليس البحث عن معنى كلمة "مين".

أعطِ الإجابة النهائية فقط.
`;

  const userPrompt = `
السؤال:
${question}

مصادر البحث الحالية:
${sourcesText}

حلل المصادر وأعطني إجابة مباشرة عن السؤال.
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
      `Hugging Face error ${response.status}: ${raw.slice(
        0,
        700
      )}`
    );
  }

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      "Hugging Face returned invalid JSON"
    );
  }

  const answer =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text ||
    "";

  if (!answer.trim()) {
    throw new Error(
      "Hugging Face returned an empty answer"
    );
  }

  return answer.trim();
}

function buildSources(results) {
  return results.slice(0, 8).map((item) => ({
    title: item.title,
    url: item.url,
    snippet: item.snippet,
    type: sourceType(item.url),
    retrievedAt: new Date().toISOString(),
    publicationDate: null
  }));
}

function send(res, data, status = 200) {
  return res.status(status).json(data);
}

export default async function handler(req, res) {
  if (
    req.method !== "GET" &&
    req.method !== "POST"
  ) {
    return send(
      res,
      {
        error: "Method not allowed"
      },
      405
    );
  }

  let question = "";

  // --------------------------------
  // POST
  // --------------------------------
  if (req.method === "POST") {
    try {
      if (
        req.body &&
        typeof req.body === "object"
      ) {
        question =
          req.body.question ||
          req.body.query ||
          "";
      } else if (
        typeof req.body === "string"
      ) {
        const parsed = JSON.parse(req.body);

        question =
          parsed.question ||
          parsed.query ||
          "";
      }
    } catch {
      // نكمل ونحاول GET params
    }
  }

  // --------------------------------
  // GET fallback
  // --------------------------------
  if (!question) {
    question =
      req.query?.q ||
      req.query?.question ||
      "";
  }

  question = String(question).trim();

  // --------------------------------
  // سؤال فارغ
  // --------------------------------
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
    // ==================================
    // المرحلة 1: البحث الحقيقي
    // ==================================
    const results = await searchWeb(question);

    if (!results.length) {
      return send(res, {
        question,

        answer:
          "لم أجد مصادر ويب موثوقة وكافية للإجابة عن هذا السؤال حاليًا.",

        status: "needs-current-source",

        searchedLive: true,

        sources: [],

        note:
          "لم يتم العثور على نتائج بحث مناسبة."
      });
    }

    // ==================================
    // المرحلة 2: الذكاء الاصطناعي
    // ==================================
    let answer;

    try {
      answer = await askHuggingFace(
        question,
        results
      );
    } catch (error) {
      console.error(
        "HF ERROR:",
        error
      );

      return send(res, {
        question,

        answer:
          "تم العثور على مصادر، لكن تعذر تشغيل طبقة الذكاء الاصطناعي حاليًا. حاول مرة أخرى.",

        status:
          "needs-current-source",

        searchedLive: true,

        sources: buildSources(results)
      });
    }

    // ==================================
    // النتيجة النهائية
    // ==================================
    return send(res, {
      question,

      answer,

      status: "verified",

      searchedLive: true,

      sources: buildSources(results),

      note:
        "تم البحث مباشرة على الويب، ثم تحليل المصادر بواسطة Jordan AI."
    });
  } catch (error) {
    console.error(
      "Jordan AI ERROR:",
      error
    );

    return send(res, {
      question,

      answer:
        "صار خطأ مؤقت أثناء البحث والتحليل. جرّب السؤال مرة ثانية.",

      status:
        "needs-current-source",

      searchedLive: true,

      sources: []
    });
  }
}
