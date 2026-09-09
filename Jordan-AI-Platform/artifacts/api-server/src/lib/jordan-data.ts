import { eq } from "drizzle-orm";
import {
  categoriesTable,
  db,
  knowledgeTable,
  sourcesTable,
} from "@workspace/db";

const sources = [
  {
    id: "source-gov-portal",
    title: "البوابة الرسمية للحكومة الإلكترونية",
    publisher: "الحكومة الأردنية",
    domain: "portal.jordan.gov.jo",
    url: "https://portal.jordan.gov.jo/",
    sourceType: "official",
  },
  {
    id: "source-education",
    title: "وزارة التربية والتعليم الأردنية",
    publisher: "وزارة التربية والتعليم",
    domain: "moe.gov.jo",
    url: "https://moe.gov.jo/",
    sourceType: "official",
  },
  {
    id: "source-tourism",
    title: "وزارة السياحة والآثار",
    publisher: "وزارة السياحة والآثار",
    domain: "mota.gov.jo",
    url: "https://mota.gov.jo/",
    sourceType: "official",
  },
  {
    id: "source-dos",
    title: "دائرة الإحصاءات العامة",
    publisher: "دائرة الإحصاءات العامة",
    domain: "dosweb.dos.gov.jo",
    url: "https://dosweb.dos.gov.jo/",
    sourceType: "official",
  },
  {
    id: "source-digital-economy",
    title: "وزارة الاقتصاد الرقمي والريادة",
    publisher: "وزارة الاقتصاد الرقمي والريادة",
    domain: "modee.gov.jo",
    url: "https://modee.gov.jo/",
    sourceType: "official",
  },
  {
    id: "source-cspd",
    title: "دائرة الأحوال المدنية والجوازات",
    publisher: "دائرة الأحوال المدنية والجوازات",
    domain: "cspd.gov.jo",
    url: "https://cspd.gov.jo/Default/Ar",
    sourceType: "official",
  },
  {
    id: "source-health",
    title: "وزارة الصحة الأردنية",
    publisher: "وزارة الصحة الأردنية",
    domain: "moh.gov.jo",
    url: "https://www.moh.gov.jo/Default/Ar",
    sourceType: "official",
  },
  {
    id: "source-higher-education",
    title: "وزارة التعليم العالي والبحث العلمي",
    publisher: "وزارة التعليم العالي والبحث العلمي",
    domain: "mohe.gov.jo",
    url: "https://mohe.gov.jo/",
    sourceType: "official",
  },
] as const;

const categories = [
  {
    id: "education",
    label: "التعليم",
    labelEn: "Education",
    description: "معلومات تعليمية مرتبطة بالمصادر الرسمية",
    accent: "saffron",
  },
  {
    id: "government",
    label: "الحكومة والخدمات",
    labelEn: "Government & services",
    description: "المؤسسات والخدمات الحكومية وروابطها الرسمية",
    accent: "teal",
  },
  {
    id: "tourism",
    label: "السياحة والآثار",
    labelEn: "Tourism & heritage",
    description: "اكتشف الأردن من خلال مصادره السياحية الرسمية",
    accent: "coral",
  },
  {
    id: "economy",
    label: "الاقتصاد والبيانات",
    labelEn: "Economy & data",
    description: "بيانات ومؤشرات مع تاريخ المصدر والجهة الناشرة",
    accent: "blue",
  },
  {
    id: "technology",
    label: "التقنية والريادة",
    labelEn: "Technology & entrepreneurship",
    description: "موارد التحول الرقمي والريادة في الأردن",
    accent: "violet",
  },
  {
    id: "history",
    label: "التاريخ والثقافة",
    labelEn: "History & culture",
    description: "مساحة لفهم الأردن عبر مصادر موثوقة",
    accent: "sand",
  },
] as const;

const knowledge = [
  {
    id: "knowledge-gov-portal",
    title: "البوابة الرسمية للحكومة الإلكترونية",
    titleEn: "Jordan e-Government portal",
    summary:
      "رابط المصدر الرسمي للخدمات والمعلومات الحكومية الإلكترونية في الأردن.",
    categoryId: "government",
    status: "verified",
    sourceId: "source-gov-portal",
    tags: ["خدمات حكومية", "حكومة إلكترونية"],
  },
  {
    id: "knowledge-education-ministry",
    title: "وزارة التربية والتعليم الأردنية",
    titleEn: "Jordanian Ministry of Education",
    summary:
      "الموقع الرسمي للوزارة، ويُستخدم للوصول إلى الإعلانات والأنظمة والمعلومات التعليمية المنشورة من الجهة المختصة.",
    categoryId: "education",
    status: "verified",
    sourceId: "source-education",
    tags: ["التعليم", "وزارة التربية", "التوجيهي"],
  },
  {
    id: "knowledge-tourism-ministry",
    title: "وزارة السياحة والآثار",
    titleEn: "Ministry of Tourism and Antiquities",
    summary:
      "المصدر الرسمي للوزارة فيما يتعلق بالسياحة والآثار والوجهات والبيانات المنشورة عنها.",
    categoryId: "tourism",
    status: "verified",
    sourceId: "source-tourism",
    tags: ["السياحة", "الآثار", "وجهات"],
  },
  {
    id: "knowledge-statistics-department",
    title: "دائرة الإحصاءات العامة",
    titleEn: "Department of Statistics",
    summary:
      "المصدر الرسمي للبيانات والإحصاءات المنشورة عن الأردن. راجع تاريخ كل جدول أو نشرة قبل استخدامه.",
    categoryId: "economy",
    status: "verified",
    sourceId: "source-dos",
    tags: ["إحصاءات", "بيانات", "اقتصاد"],
  },
  {
    id: "knowledge-digital-economy",
    title: "وزارة الاقتصاد الرقمي والريادة",
    titleEn: "Ministry of Digital Economy and Entrepreneurship",
    summary:
      "المصدر الرسمي لمبادرات الاقتصاد الرقمي والريادة والخدمات الرقمية المنشورة من الوزارة.",
    categoryId: "technology",
    status: "verified",
    sourceId: "source-digital-economy",
    tags: ["تقنية", "ريادة", "تحول رقمي"],
  },
  {
    id: "knowledge-cspd",
    title: "دائرة الأحوال المدنية والجوازات",
    titleEn: "Civil Status and Passports Department",
    summary:
      "المصدر الرسمي لخدمات الأحوال المدنية والجوازات، ويضم معلومات وخدمات إلكترونية مثل بعض معاملات الجوازات والوثائق المسجلة.",
    categoryId: "government",
    status: "verified",
    sourceId: "source-cspd",
    tags: ["احوال مدنية", "جوازات", "خدمات حكومية", "وثائق"],
  },
  {
    id: "knowledge-health-ministry",
    title: "وزارة الصحة الأردنية",
    titleEn: "Jordanian Ministry of Health",
    summary:
      "الموقع الرسمي لوزارة الصحة الأردنية، ويعرض الأخبار والخدمات الإلكترونية والمعلومات الصحية المنشورة من الجهة المختصة.",
    categoryId: "government",
    status: "verified",
    sourceId: "source-health",
    tags: ["الصحة", "وزارة الصحة", "خدمات صحية"],
  },
  {
    id: "knowledge-higher-education",
    title: "وزارة التعليم العالي والبحث العلمي",
    titleEn: "Ministry of Higher Education and Scientific Research",
    summary:
      "المصدر الرسمي للمعلومات المنشورة عن التعليم العالي والبحث العلمي والجهات والأنظمة ذات الصلة.",
    categoryId: "education",
    status: "verified",
    sourceId: "source-higher-education",
    tags: ["التعليم العالي", "جامعات", "بحث علمي"],
  },
] as const;

let seedPromise: Promise<void> | undefined;

export function ensureJordanSeedData(): Promise<void> {
  seedPromise ??= (async () => {
    const [existingSources, existingCategories, existingKnowledge] =
      await Promise.all([
        db.select({ id: sourcesTable.id }).from(sourcesTable),
        db.select({ id: categoriesTable.id }).from(categoriesTable),
        db.select({ id: knowledgeTable.id }).from(knowledgeTable),
      ]);

    const sourceIds = new Set(existingSources.map((row) => row.id));
    const categoryIds = new Set(existingCategories.map((row) => row.id));
    const knowledgeIds = new Set(existingKnowledge.map((row) => row.id));

    const missingSources = sources
      .filter((source) => !sourceIds.has(source.id))
      .map((source) => ({ ...source }));
    if (missingSources.length > 0) {
      await db.insert(sourcesTable).values(missingSources);
    }

    const missingCategories = categories
      .filter((category) => !categoryIds.has(category.id))
      .map((category) => ({
        ...category,
        count: knowledge.filter((item) => item.categoryId === category.id)
          .length,
      }));
    if (missingCategories.length > 0) {
      await db.insert(categoriesTable).values(missingCategories);
    }

    const missingKnowledge = knowledge
      .filter((item) => !knowledgeIds.has(item.id))
      .map((item) => ({
        ...item,
        lastVerified: new Date(),
        tags: [...item.tags],
      }));
    if (missingKnowledge.length > 0) {
      await db.insert(knowledgeTable).values(missingKnowledge);
    }

    // Keep the displayed category counts correct for existing databases too.
    const allKnowledge = await db
      .select({ categoryId: knowledgeTable.categoryId })
      .from(knowledgeTable);
    for (const category of categories) {
      const count = allKnowledge.filter(
        (item) => item.categoryId === category.id,
      ).length;
      await db
        .update(categoriesTable)
        .set({ count })
        .where(eq(categoriesTable.id, category.id));
    }
  })();

  return seedPromise;
}

export async function getSource(sourceId: string) {
  const [source] = await db
    .select()
    .from(sourcesTable)
    .where(eq(sourcesTable.id, sourceId))
    .limit(1);
  return source;
}