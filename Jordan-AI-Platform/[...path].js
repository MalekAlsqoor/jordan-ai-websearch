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
    id: "gov-portal",
    title: "البوابة الرسمية للحكومة الإلكترونية",
    titleEn: "Jordan e-Government portal",
    summary: "الوصول إلى الخدمات والمعلومات الحكومية الرسمية في الأردن.",
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
    summary: "المصدر الرسمي لخدمات الأحوال المدنية والجوازات في الأردن.",
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
    summary: "المصدر الرسمي للتعليم العالي والبحث العلمي في الأردن.",
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
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

function searchLocal(query) {
  const q = String(query || "").toLowerCase().trim();

  if (!q) return knowledge;

  return knowledge.filter((item) => {
    const text = [
      item.title,
      item.titleEn,
      item.summary,
      item.categoryLabel,
      ...(item.tags || []),
    ]
      .join(" ")
      .toLowerCase();

    return text.includes(q);
  });
}

export default async function handler(req, res) {
  const path = String(req.query?.path || "");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return send(res, { ok: true });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  if (path === "home" || path === "") {
    return send(res, {
      featured: knowledge,
      popular: knowledge,
      latest: knowledge,
      categories,
      sources,
      popularQuestions: [
        "ما هي الخدمات الحكومية في الأردن؟",
        "وين أجد خدمات الأحوال المدنية والجوازات؟",
        "وين أجد معلومات وزارة الصحة؟",
        "وين أجد معلومات التعليم العالي في الأردن؟",
      ],
    });
  }

  if (path === "categories") {
    return send(res, categories);
  }

  if (path === "knowledge") {
    return send(res, knowledge);
  }

  if (path.startsWith("knowledge/")) {
    const id = path.split("/")[1];
    const item = knowledge.find((x) => x.id === id);

    if (!item) {
      return send(res, { error: "Knowledge item not found" }, 404);
    }

    return send(res, item);
  }

  if (path === "search") {
    const query =
      req.query?.q ||
      req.query?.query ||
      req.query?.search ||
      "";

    const results = searchLocal(query);

    return send(res, {
      query,
      results,
      items: results,
      searchedLive: false,
      total: results.length,
    });
  }

  if (path === "assistant/answer") {
    const body = req.body || {};
    const question =
      body.question ||
      body.query ||
      req.query?.q ||
      "";

    const results = searchLocal(question);

    return send(res, {
      answer: results.length
        ? `لقيتلك معلومات مرتبطة بسؤالك من المصادر الرسمية المتاحة في الأردن.`
        : `ما لقيت معلومة مطابقة حالياً. جرّب صياغة السؤال بطريقة ثانية.`,
      sources: results,
      results,
      searchedLive: false,
    });
  }

  if (path === "feedback") {
    return send(res, { ok: true });
  }

  return send(
    res,
    {
      error: "API route not found",
      path,
    },
    404
  );
}
