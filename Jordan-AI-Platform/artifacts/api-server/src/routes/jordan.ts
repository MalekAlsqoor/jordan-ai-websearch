import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  AnswerQuestionBody,
  AnswerQuestionResponse,
  CreateFeedbackBody,
  CreateFeedbackResponse,
  GetHomeResponse,
  GetKnowledgeParams,
  GetKnowledgeResponse,
  ListCategoriesResponse,
  ListKnowledgeQueryParams,
  ListKnowledgeResponse,
  SearchJordanQueryParams,
  SearchJordanResponse,
} from "@workspace/api-zod";
import {
  categoriesTable,
  db,
  feedbackTable,
  knowledgeTable,
  sourcesTable,
} from "@workspace/db";
import { ensureJordanSeedData } from "../lib/jordan-data";
import { searchWeb } from "../lib/web-search";

const router: IRouter = Router();

const popularQuestions = [
  "ما هو نظام التوجيهي؟",
  "وين أجد الخدمات الحكومية الرسمية؟",
  "شو المصادر الرسمية للمعلومات السياحية؟",
  "وين ألاقي الإحصاءات الرسمية عن الأردن؟",
];

function normalizeArabic(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKC")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[؟?!،؛:()[\]{}"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const stopWords = new Set([
  "ما", "ماذا", "شو", "ايش", "وين", "اين", "كيف", "هل", "هو", "هي",
  "عن", "في", "من", "الى", "على", "مع", "هذا", "هذه", "ذلك", "تلك",
  "اريد", "بدي", "ممكن", "لو", "لي", "لل", "the", "what", "where",
  "how", "is", "are", "in", "of", "to", "for", "and",
]);

const synonyms: Record<string, string[]> = {
  "توجيهي": ["الثانويه", "الثانوي", "امتحان", "وزارة التربية"],
  "حكومه": ["حكومة", "خدمات", "خدمات حكومية", "الكترونية"],
  "سياحه": ["سياحة", "اثار", "وجهات", "السياحة والآثار"],
  "احصاءات": ["احصاء", "بيانات", "مؤشرات", "دائرة الإحصاءات"],
  "تقنيه": ["تقنية", "رقمية", "الاقتصاد الرقمي", "ريادة"],
};

function tokens(value: string) {
  return normalizeArabic(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

function scoreKnowledge(question: string, item: ReturnType<typeof serializeKnowledge>) {
  const q = normalizeArabic(question);
  const qTokens = tokens(question);
  const haystack = normalizeArabic([
    item.title,
    item.titleEn,
    item.summary,
    item.categoryLabel,
    ...item.tags,
  ].join(" "));
  let score = haystack.includes(q) && q.length > 2 ? 8 : 0;

  for (const token of qTokens) {
    if (haystack.includes(token)) score += 2;
    for (const synonym of synonyms[token] || []) {
      if (haystack.includes(normalizeArabic(synonym))) score += 1;
    }
  }

  return score;
}

type SourceRow = typeof sourcesTable.$inferSelect;
type CategoryRow = typeof categoriesTable.$inferSelect;
type KnowledgeRow = typeof knowledgeTable.$inferSelect;

function serializeSource(source: SourceRow) {
  return {
    id: source.id,
    title: source.title,
    publisher: source.publisher,
    domain: source.domain,
    url: source.url,
    type: source.sourceType,
    retrievedAt: source.retrievedAt.toISOString(),
    publicationDate: source.publicationDate,
  };
}

function serializeKnowledge(
  item: KnowledgeRow,
  category: CategoryRow,
  source: SourceRow,
) {
  return {
    id: item.id,
    title: item.title,
    titleEn: item.titleEn,
    summary: item.summary,
    category: category.id,
    categoryLabel: category.label,
    status: item.status as "verified" | "review",
    lastVerified: item.lastVerified?.toISOString() ?? null,
    source: serializeSource(source),
    tags: item.tags,
  };
}

async function getKnowledgeRows(categoryId?: string) {
  const conditions = categoryId
    ? eq(knowledgeTable.categoryId, categoryId)
    : undefined;
  const items = await db
    .select()
    .from(knowledgeTable)
    .where(conditions);
  const categoryRows = await db.select().from(categoriesTable);
  const sourceRows = await db.select().from(sourcesTable);
  const categoryMap = new Map(categoryRows.map((row) => [row.id, row]));
  const sourceMap = new Map(sourceRows.map((row) => [row.id, row]));

  return items.flatMap((item) => {
    const category = categoryMap.get(item.categoryId);
    const source = sourceMap.get(item.sourceId);
    return category && source ? [serializeKnowledge(item, category, source)] : [];
  });
}

router.get("/home", async (_req, res): Promise<void> => {
  await ensureJordanSeedData();
  const [categories, knowledge, sources] = await Promise.all([
    db.select().from(categoriesTable),
    getKnowledgeRows(),
    db.select().from(sourcesTable),
  ]);

  const payload = {
    verifiedCount: knowledge.filter((item) => item.status === "verified")
      .length,
    categoryCount: categories.length,
    sourceCount: sources.length,
    lastUpdated: new Date().toISOString(),
    categories,
    featured: knowledge.slice(0, 4),
    popularQuestions,
  };
  res.json(GetHomeResponse.parse(payload));
});

router.get("/categories", async (_req, res): Promise<void> => {
  await ensureJordanSeedData();
  const categories = await db.select().from(categoriesTable);
  res.json(ListCategoriesResponse.parse(categories));
});

router.get("/knowledge", async (req, res): Promise<void> => {
  await ensureJordanSeedData();
  const parsed = ListKnowledgeQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rows = await getKnowledgeRows(parsed.data.category);
  res.json(ListKnowledgeResponse.parse(rows.slice(0, parsed.data.limit)));
});

router.get("/knowledge/:id", async (req, res): Promise<void> => {
  await ensureJordanSeedData();
  const parsed = GetKnowledgeParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rows = await getKnowledgeRows();
  const item = rows.find((row) => row.id === parsed.data.id);
  if (!item) {
    res.status(404).json({ error: "Knowledge record not found" });
    return;
  }
  res.json(GetKnowledgeResponse.parse(item));
});

router.get("/search", async (req, res): Promise<void> => {
  await ensureJordanSeedData();
  const parsed = SearchJordanQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const query = parsed.data.q.trim();
  const rows = await getKnowledgeRows(parsed.data.category);
  const localResults = rows
    .map((item) => ({ item, score: scoreKnowledge(query, item) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, parsed.data.limit)
    .map(({ item }) => item);

  // Live web search is the fallback that lets Jordan AI answer broad searches
  // instead of being limited to the small local knowledge base. No AI provider
  // or paid Replit integration is required for the search itself.
  try {
    const webResults = await searchWeb(query, parsed.data.limit);
    const liveItems = webResults.map((result) => ({
      id: result.id,
      title: result.title,
      titleEn: result.title,
      summary: result.summary || "نتيجة من البحث المباشر على الويب.",
      category: parsed.data.category || "web",
      categoryLabel: "بحث مباشر",
      status: "review" as const,
      lastVerified: null,
      source: {
        id: `${result.id}-source`,
        title: result.title,
        publisher: result.domain,
        domain: result.domain,
        url: result.url,
        type: result.domain.endsWith(".gov.jo") ? "official" as const : "reliable" as const,
        retrievedAt: new Date().toISOString(),
        publicationDate: null,
      },
      tags: ["بحث مباشر", result.domain],
    }));

    const payload = {
      query: parsed.data.q,
      searchedLive: true,
      message: liveItems.length > 0
        ? "هذه نتائج بحث مباشر على الويب. النتائج الموسومة كمصدر رسمي تستحق أولوية أعلى، وتحقق من المصدر قبل الاعتماد على المعلومات الحساسة أو المتغيرة."
        : localResults.length > 0
          ? "لم يظهر بحث الويب نتائج الآن؛ عرضنا النتائج الموجودة في قاعدة المعرفة المحلية."
          : "لم نجد نتائج. جرّب صياغة أخرى.",
      results: liveItems.length > 0 ? liveItems : localResults,
    };
    res.json(SearchJordanResponse.parse(payload));
    return;
  } catch (error) {
    req.log?.warn?.({ err: error }, "Live web search unavailable; using local knowledge");
  }

  const payload = {
    query: parsed.data.q,
    searchedLive: false,
    message: localResults.length > 0
      ? "تعذر الوصول إلى البحث المباشر حاليًا، لذلك عرضنا نتائج قاعدة المعرفة المحلية."
      : "لم نجد نتيجة موثقة مطابقة. جرّب صياغة أخرى.",
    results: localResults,
  };
  res.json(SearchJordanResponse.parse(payload));
});

router.post("/assistant/answer", async (req, res): Promise<void> => {
  await ensureJordanSeedData();
  const parsed = AnswerQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const question = parsed.data.question.trim();
  const rows = await getKnowledgeRows();

  // Retrieval-first answering. This remains useful on the free plan and
  // refuses to invent facts that are not represented in the source set.
  const ranked = rows
    .map((item) => ({ item, score: scoreKnowledge(question, item) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  const matched = ranked.slice(0, 3).map(({ item }) => item);
  const sources = matched.map((item) => item.source);

  const answer =
    matched.length > 0
      ? `بحسب السجلات المرتبطة بالمصادر الرسمية: ${matched
          .slice(0, 2)
          .map((item) => item.summary)
          .join(" ")}`
      : "لم أجد في قاعدة المعرفة الحالية معلومة موثقة تكفي للإجابة عن هذا السؤال. لم أخمّن. جرّب صياغة أدق، أو ابحث في مكتبة المعرفة.";

  const payload = {
    question,
    answer,
    status: matched.length > 0 ? "verified" : "not-verified",
    searchedLive: false,
    sources,
    note:
      matched.length > 0
        ? "هذه إجابة من قاعدة معرفة مرتبطة بالمصادر الظاهرة أدناه. المعلومات المتغيرة تحتاج مراجعة المصدر الرسمي مباشرة."
        : "وضع المعرفة المحلي لا يستخدم بحث الويب ولا يختلق إجابات عند غياب سجل موثوق.",
  };
  res.json(AnswerQuestionResponse.parse(payload));
});

router.post("/feedback", async (req, res): Promise<void> => {
  const parsed = CreateFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const id = `feedback-${randomUUID()}`;
  await db.insert(feedbackTable).values({ id, ...parsed.data });
  res.status(201).json(
    CreateFeedbackResponse.parse({
      id,
      received: true,
      message: "تم استلام ملاحظتك، شكراً لمساعدتنا على تحسين الأردن AI.",
    }),
  );
});

export default router;