const SEARX_INSTANCES = [
  "https://searx.tiekoetter.com",
  "https://search.yuri.llc",
  "https://search.catboy.house",
  "https://search.mectov.my.id",
  "https://search.luma.lol",
  "https://search.blitzw.in",
  "https://search.ethibox.fr",
  "https://search.im-in.space"
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

const TRUSTED_SITES = [
  "rhc.jo",
  "pm.gov.jo",
  "petra.gov.jo",
  "moi.gov.jo",
  "mfa.gov.jo",
  "mop.gov.jo",
  "almamlaka.tv",
  "royanews.tv",
  "jordannews.jo",
  "addustour.com",
  "assawsana.com"
];

const STOP_WORDS = new Set([
  "مين", "من", "ما", "ماذا", "شو", "ايش", "اي", "أي",
  "هل", "هو", "هي", "هم", "هن", "كم", "متى", "اين",
  "وين", "كيف", "ليش", "لماذا", "عن", "في", "على",
  "الى", "إلى", "هذا", "هذه", "ذلك", "تلك", "كان",
  "كانت", "يكون", "تكون", "مع", "او", "أو", "و"
]);

function cleanText(text) {
  return String(text || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
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
    .filter(
      (word) =>
        word.length >= 2 &&
        !STOP_WORDS.has(word)
    );
}

function domainOf(url) {
  try {
    return new URL(url)
      .hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isBadDomain(domain) {
  return BAD_SITES.some(
    (site) =>
      domain === site ||
      domain.endsWith("." + site)
  );
}

function isTrustedDomain(domain) {
  return TRUSTED_SITES.some(
    (site) =>
      domain === site ||
      domain.endsWith("." + site)
  );
}

function hasAny(q, words) {
  return words.some((word) =>
    q.includes(normalizeArabic(word))
  );
}

/*
 * أهم تغيير:
 * نفهم السؤال أولاً ونحدد موضوعه.
 */
function understandQuestion(question) {
  const q = normalizeArabic(question);

  const royalFamily = hasAny(q, [
    "اخوان الملك",
    "إخوان الملك",
    "اخوة الملك",
    "إخوة الملك",
    "عائلة الملك",
    "اسرة الملك",
    "الاسرة الهاشمية",
    "الأسرة الهاشمية",
    "الهاشميين",
    "ابناء الملك",
    "ابن الملك",
    "ابنة الملك",
    "زوجة الملك",
    "الملكة رانيا",
    "الامراء الاردنيين",
    "الأمراء الأردنيين",
    "امراء الاردن",
    "أمراء الأردن",
    "الامير الحسين",
    "ولي العهد",
    "الامير حمزة",
    "الامير علي",
    "الامير فيصل",
    "الامير هاشم",
    "الاميرة ايمان",
    "الاميرة سلمى"
  ]);

  const king = hasAny(q, [
    "ملك الاردن",
    "ملك الأردن",
    "عبدالله الثاني",
    "عبد الله الثاني",
    "الملك عبدالله",
    "الملك عبد الله",
    "الملك حسين",
    "الحسين بن طلال"
  ]);

  const government = hasAny(q, [
    "رئيس الوزراء",
    "رئيس وزراء",
    "رئيس الحكومه",
    "رئيس الحكومة",
    "الحكومه الاردنيه",
    "الحكومة الأردنية",
    "مجلس الوزراء",
    "وزير",
    "وزراء",
    "وزارة",
    "وزاره"
  ]);

  const jordan = hasAny(q, [
    "الاردن",
    "اردن",
    "اردني",
    "اردنيه",
    "jordan",
    "amman",
    "عمان",
    "العقبه",
    "العقبة",
    "اربد",
    "الزرقاء"
  ]);

  if (royalFamily || king) {
    return {
      topic: "royal_family",
      label: "الملك والأسرة الهاشمية",
      words: tokenize(question)
    };
  }

  if (government) {
    return {
      topic: "government",
      label: "الحكومة الأردنية",
      words: tokenize(question)
    };
  }

  if (jordan) {
    return {
      topic: "jordan",
      label: "الأردن",
      words: tokenize(question)
    };
  }

  return {
    topic: "general",
    label: "عام",
    words: tokenize(question)
  };
}

/*
 * نبني البحث حسب الموضوع،
 * وليس حسب السؤال الخام فقط.
 */
function buildQueries(question, intent) {
  const q = normalizeArabic(question);
  const queries = [];

  if (intent.topic === "royal_family") {
    queries.push(
      `site:rhc.jo ${question}`,
      `site:rhc.jo "الملك عبدالله الثاني" "الأسرة الهاشمية"`,
      `site:rhc.jo "الملك عبدالله الثاني" "إخوان"`,
      `site:rhc.jo "الملك عبدالله الثاني" "الأمراء"`,
      `"عبدالله الثاني" "إخوانه" الأردن`,
      `"عبدالله الثاني" "إخوته" الأردن`,
      `"الأسرة الهاشمية" الأردن ${q}`
    );
  }

  else if (intent.topic === "government") {
    queries.push(
      `site:pm.gov.jo ${question}`,
      `site:petra.gov.jo ${question}`,
      `${question} الأردن الحكومة`,
      `${question} الأردن 2026`
    );

    if (
      q.includes("رئيس الوزراء") ||
      q.includes("رئيس وزراء") ||
      q.includes("رئيس الحكومه") ||
      q.includes("رئيس الحكومة")
    ) {
      queries.push(
        `site:pm.gov.jo "رئيس الوزراء" الأردن`,
        `site:pm.gov.jo "جعفر حسان"`
      );
    }
  }

  else if (intent.topic === "jordan") {
    queries.push(
      `${question} الأردن`,
      `${question} الأردن 2026`,
      `site:gov.jo ${question}`,
      `site:petra.gov.jo ${question}`,
      `${question} Jordan`
    );
  }

  else {
    queries.push(question);
  }

  return [
    ...new Set(queries)
  ]
    .filter(Boolean)
    .slice(0, 8);
}

function scoreResult(item, intent) {
  const title = normalizeArabic(item.title);
  const snippet = normalizeArabic(item.snippet);
  const text = `${title} ${snippet}`;
  const domain = domainOf(item.url);

  let score = 0;

  for (const word of intent.words) {
    if (title.includes(word)) score += 25;
    if (snippet.includes(word)) score += 8;
  }

  if (isBadDomain(domain)) {
    score -= 1000;
  }

  if (intent.topic === "royal_family") {
    if (domain === "rhc.jo") score += 500;
    if (domain.endsWith("gov.jo")) score += 180;

    if (
      text.includes("الملك عبدالله") ||
      text.includes("الملك عبد الله")
    ) {
      score += 100;
    }

    if (
      text.includes("الاسرة الهاشمية") ||
      text.includes("الأسرة الهاشمية")
    ) {
      score += 90;
    }

    if (text.includes("الهاشمي")) score += 50;

    if (
      text.includes("اخوان") ||
      text.includes("اخوة")
    ) {
      score += 120;
    }

    if (
      text.includes("ابناء") ||
      text.includes("ابن")
    ) {
      score += 50;
    }
  }

  if (intent.topic === "government") {
    if (domain === "pm.gov.jo") score += 500;
    if (domain === "petra.gov.jo") score += 220;
    if (domain.endsWith("gov.jo")) score += 150;

    if (text.includes("رئيس الوزراء")) {
      score += 120;
    }

    if (text.includes("الحكومة")) {
      score += 70;
    }
  }

  if (intent.topic === "jordan") {
    if (domain.endsWith("gov.jo")) score += 180;
    if (domain === "petra.gov.jo") score += 200;
    if (isTrustedDomain(domain)) score += 60;

    if (text.includes("الاردن")) score += 40;
    if (text.includes("الاردني")) score += 30;
  }

  if (
    domain === "wikipedia.org" ||
    domain.endsWith(".wikipedia.org")
  ) {
    score -= 120;
  }

  return score;
}

async function fetchJson(url) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Jordan-AI/1.0"
      },
      signal: AbortSignal.timeout(7000)
    });

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}

async function searchSearX(instance, query) {
  const encoded = encodeURIComponent(query);

  const urls = [
    `${instance}/search?q=${encoded}&format=json&language=all&categories=general`,
    `${instance}/search?q=${encoded}&format=json&language=ar&categories=general`
  ];

  for (const url of urls) {
    const data = await fetchJson(url);

    if (
      data &&
      Array.isArray(data.results) &&
      data.results.length
    ) {
      return data.results
        .filter(
          (item) =>
            item &&
            item.url &&
            (item.title || item.content)
        )
        .map((item) => ({
          title: cleanText(item.title || ""),
          url: String(item.url),
          snippet: cleanText(item.content || ""),
          engine: item.engine || "SearXNG"
        }));
    }
  }

  return [];
}

async function searchWeb(question, intent) {
  const allResults = [];

  for (const query of buildQueries(question, intent)) {
    const batches = await Promise.all(
      SEARX_INSTANCES.map((instance) =>
        searchSearX(instance, query)
      )
    );

    for (const batch of batches) {
      allResults.push(...batch);
    }

    if (allResults.length >= 120) {
      break;
    }
  }

  const seen = new Set();

  return allResults
    .filter((item) => {
      const key = String(item.url || "")
        .toLowerCase()
        .replace(/\/$/, "");

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .map((item) => ({
      ...item,
      score: scoreResult(item, intent)
    }))
    .filter(
      (item) =>
        !isBadDomain(domainOf(item.url))
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);
}

async function fetchOfficialPage(url, title) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html",
        "User-Agent": "Jordan-AI/1.0"
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) return null;

    const text = cleanText(
      await response.text()
    );

    if (!text) return null;

    return {
      title,
      url,
      snippet: text.slice(0, 9000),
      engine: "Official Jordan source"
    };
  } catch {
    return null;
  }
}

async function getOfficialSources(intent) {
  const urls = [];

  if (intent.topic === "royal_family") {
    urls.push(
      [
        "https://rhc.jo/ar",
        "الديوان الملكي الهاشمي"
      ],
      [
        "https://rhc.jo/ar/king-abdullah",
        "سيرة جلالة الملك عبدالله الثاني"
      ],
      [
        "https://rhc.jo/ar/crown-prince-biography",
        "السيرة الذاتية لولي العهد"
      ]
    );
  }

  if (intent.topic === "government") {
    urls.push(
      [
        "https://pm.gov.jo/AR/CustomPages/Government",
        "رئاسة الوزراء - الحكومة الحالية"
      ],
      [
        "https://pm.gov.jo/AR/CustomPages/SearchHeadMinister",
        "رئاسة الوزراء - بيانات رؤساء الوزراء"
      ],
      [
        "https://pm.gov.jo/AR/Pages/%D8%A3%D8%B9%D8%B6%D8%A7%D8%A1_%D9%85%D8%AC%D9%84%D8%B3_%D8%A7%D9%84%D9%88%D8%B2%D8%B1%D8%A7%D8%A1",
        "أعضاء مجلس الوزراء"
      ]
    );
  }

  const results = await Promise.all(
    urls.map(([url, title]) =>
      fetchOfficialPage(url, title)
    )
  );

  return results.filter(Boolean);
}

function makeSources(results) {
  const retrievedAt =
    new Date().toISOString();

  return results
    .slice(0, 8)
    .map((item, index) => {
      const domain = domainOf(item.url);

      return {
        id: `source-${index + 1}`,
        title: item.title || "مصدر ويب",
        publisher: domain,
        domain,
        url: item.url,

        type:
          domain.endsWith("gov.jo") ||
          domain === "rhc.jo"
            ? "official"
            : isTrustedDomain(domain)
            ? "reliable"
            : "secondary",

        retrievedAt,
        publicationDate: null
      };
    });
}

function directAnswer(
  question,
  results,
  intent
) {
  const q = normalizeArabic(question);

  /*
   * إجابة مؤكدة لرئيس الوزراء
   * من المصدر الرسمي.
   */
  if (
    intent.topic === "government" &&
    (
      q.includes("رئيس الوزراء") ||
      q.includes("رئيس وزراء") ||
      q.includes("رئيس الحكومه") ||
      q.includes("رئيس الحكومة")
    )
  ) {
    const official = results.some(
      (item) =>
        domainOf(item.url) === "pm.gov.jo"
    );

    if (official) {
      return "رئيس وزراء الأردن حاليًا هو الدكتور جعفر عبد عبدالفتاح حسان، وهو أيضًا وزير الدفاع.";
    }
  }

  return "";
}

async function askAI(
  question,
  results,
  intent
) {
  const token = process.env.HF_TOKEN;

  if (!token) {
    throw new Error(
      "HF_TOKEN غير موجود في Vercel"
    );
  }

  const sourceText = results
    .slice(0, 8)
    .map(
      (item, index) =>
        `المصدر ${index + 1}
العنوان: ${item.title}
الرابط: ${item.url}
الموقع: ${domainOf(item.url)}
المحتوى: ${item.snippet}`
    )
    .join("\n\n");

  const response = await fetch(
    "https://router.huggingface.co/v1/chat/completions",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        model:
          "openai/gpt-oss-20b:cheapest",

        messages: [
          {
            role: "system",

            content:
              `أنت Jordan AI.

تم تصنيف السؤال مسبقًا على أنه:
${intent.label}

أجب اعتمادًا على المصادر المرفقة فقط.

قواعد مهمة:
- تجاهل أي مصدر غير متعلق بالسؤال.
- أعطِ الإجابة المباشرة أولًا.
- أجب بالعربية.
- كن مختصرًا وواضحًا.
- لا تخترع أسماء أو أرقام أو أحداث.
- إذا لم تكفِ المصادر، قل بوضوح إن المصادر الحالية لا تكفي.`
          },

          {
            role: "user",

            content:
              `السؤال:
${question}

المصادر:
${sourceText}`
          }
        ],

        temperature: 0.1,
        max_tokens: 500
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `HF HTTP ${response.status}`
    );
  }

  const data =
    await response.json();

  const answer =
    data?.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    throw new Error(
      "HF returned empty answer"
    );
  }

  return answer;
}

module.exports = async function handler(
  req,
  res
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({
        message: "Method Not Allowed"
      });
  }

  try {
    const question = String(
      req.body?.question || ""
    ).trim();

    if (!question) {
      return res
        .status(400)
        .json({
          question: "",
          answer: "اكتب سؤالك أولًا.",
          status: "not-verified",
          searchedLive: false,
          sources: [],
          note: "لم يتم إدخال سؤال."
        });
    }

    /*
     * 1️⃣ فهم السؤال
     */
    const intent =
      understandQuestion(question);

    /*
     * 2️⃣ جلب المصادر الرسمية
     */
    const officialResults =
      await getOfficialSources(intent);

    /*
     * 3️⃣ البحث حسب الموضوع
     */
    const webResults =
      await searchWeb(
        question,
        intent
      );

    /*
     * 4️⃣ دمج المصادر
     * الرسمية لها أولوية.
     */
    const combined = [
      ...officialResults,
      ...webResults
    ];

    const seen = new Set();

    const results = combined
      .filter((item) => {
        const key = String(item.url || "")
          .toLowerCase()
          .replace(/\/$/, "");

        if (!key || seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .map((item) => ({
        ...item,

        score:
          scoreResult(item, intent) +
          (
            officialResults.includes(item)
              ? 1000
              : 0
          )
      }))
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, 15);

    const sources =
      makeSources(results);

    /*
     * 5️⃣ إجابات مؤكدة لبعض الأسئلة
     */
    const direct =
      directAnswer(
        question,
        results,
        intent
      );

    if (direct) {
      return res
        .status(200)
        .json({
          question,
          answer: direct,
          status: "verified",
          searchedLive: true,
          sources,

          note:
            `تم فهم السؤال كموضوع: ${intent.label}، ثم البحث في المصادر المناسبة.`
        });
    }

    /*
     * 6️⃣ إذا النتائج سيئة،
     * لا نخلي AI يخمّن.
     */
    if (
      !results.length ||
      results[0].score < 20
    ) {
      return res
        .status(200)
        .json({
          question,

          answer:
            "لم أعثر على مصادر موثوقة ومرتبطة بما يكفي بهذا السؤال حتى الآن، لذلك لن أخمّن الإجابة.",

          status:
            "needs-current-source",

          searchedLive: true,

          sources: [],

          note:
            `تم تصنيف السؤال كموضوع: ${intent.label}، لكن نتائج البحث لم تكن مرتبطة بما يكفي.`
        });
    }

    /*
     * 7️⃣ إرسال المصادر إلى AI
     */
    let answer;

    try {
      answer =
        await askAI(
          question,
          results,
          intent
        );
    } catch (error) {
      console.error(
        "AI error:",
        error
      );

      answer =
        "تم العثور على مصادر مرتبطة بالسؤال، لكن تعذر تشغيل طبقة الذكاء الاصطناعي حاليًا. حاول مرة أخرى.";
    }

    return res
      .status(200)
      .json({
        question,
        answer,

        status:
          answer.startsWith(
            "تم العثور على مصادر"
          )
            ? "needs-current-source"
            : "verified",

        searchedLive: true,

        sources,

        note:
          `تم فهم السؤال كموضوع: ${intent.label}، ثم البحث حسب الموضوع وترتيب المصادر قبل إرسالها إلى AI.`
      });

  } catch (error) {
    console.error(
      "Jordan AI error:",
      error
    );

    return res
      .status(500)
      .json({
        question: String(
          req.body?.question || ""
        ),

        answer:
          "صار خطأ مؤقت أثناء البحث. جرّب السؤال مرة ثانية.",

        status:
          "not-verified",

        searchedLive: false,

        sources: [],

        note:
          "حدث خطأ غير متوقع في الخادم."
      });
  }
};
