import { useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, Check, Clock3, ExternalLink, FileSearch, Globe2, Info, MessageCircleQuestion, Quote, Search, ShieldCheck, Sparkles, Waypoints } from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';
import {
  getGetKnowledgeQueryKey,
  getSearchJordanQueryKey,
  useAnswerQuestion,
  useCreateFeedback,
  useGetHome,
  useGetKnowledge,
  useListCategories,
  useListKnowledge,
  useSearchJordan,
} from '@workspace/api-client-react';
import type { AssistantAnswer, Category } from '@workspace/api-client-react';
import {
  CategoryTile,
  EmptyState,
  ErrorState,
  KnowledgeCard,
  LoadingCards,
  PageIntro,
  SearchBar,
  SiteShell,
  SourceBadge,
  SourceLine,
  StatusBadge,
  TrustStrip,
} from '@/components/jordan-ui';
import { formatDate } from '@/lib/jordan-utils';

function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <div className="mb-7 flex items-end justify-between gap-4"><div>{eyebrow && <p className="mb-2 text-xs font-bold tracking-[.16em] text-[#b47e24]">{eyebrow}</p>}<h2 className="text-2xl font-bold tracking-[-.03em] text-[#102b36] sm:text-3xl">{title}</h2></div>{action}</div>;
}

function HomeSkeleton() {
  return <div className="mx-auto max-w-[1260px] px-5 py-12 lg:px-8"><div className="h-16 w-3/4 animate-pulse rounded-2xl bg-[#e8dfcf]" /><div className="mt-5 h-28 w-full animate-pulse rounded-2xl bg-[#e8dfcf]" /><div className="mt-12 grid gap-4 md:grid-cols-3"><div className="h-32 animate-pulse rounded-2xl bg-[#e8dfcf]" /><div className="h-32 animate-pulse rounded-2xl bg-[#e8dfcf]" /><div className="h-32 animate-pulse rounded-2xl bg-[#e8dfcf]" /></div></div>;
}

function AssistantPanel({ popularQuestions = [] }: { popularQuestions?: string[] }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);
  const { mutate, isPending, isError, reset } = useAnswerQuestion();
  const submit = (value: string) => {
    setQuestion(value);
    setAnswer(null);
    reset();
    mutate({ data: { question: value, language: 'ar' } }, { onSuccess: setAnswer });
  };
  return <section id="assistant" className="relative overflow-hidden bg-[#102b36] text-[#f8f2e8]">
    <div className="absolute -left-24 top-0 h-72 w-72 rounded-full border-[50px] border-[#e8ba57]/15 animate-breathe" />
    <div className="absolute -right-28 bottom-[-140px] h-80 w-80 rounded-full border-[1px] border-[#b8d1d0]/20" />
    <div className="relative mx-auto grid max-w-[1260px] gap-10 px-5 py-14 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-8 lg:py-20">
      <div className="animate-rise-in">
        <p className="mb-4 inline-flex items-center gap-2 text-xs font-bold tracking-[.16em] text-[#e8ba57]"><Sparkles size={14} /> المساعد المعرفي الأردني</p>
        <h1 className="max-w-xl text-4xl font-bold leading-[1.25] tracking-[-.04em] sm:text-5xl lg:text-[4.25rem]">اسأل، وسنريك <span className="text-[#e8ba57]">المصدر.</span></h1>
        <p className="mt-6 max-w-lg text-[15px] leading-8 text-[#c0cfcc]">إجابات عن الأردن تبدأ من المعرفة الموثقة، لا من التخمين. اقرأ الإجابة وتتبّع المرجع الذي جاءت منه.</p>
        <div className="mt-8 flex flex-wrap gap-2">{popularQuestions.slice(0, 3).map((item, index) => <button key={`${item}-${index}`} onClick={() => submit(item)} className="rounded-full border border-[#59727a] px-3.5 py-2 text-xs text-[#d5e0dc] transition-colors hover:border-[#e8ba57] hover:text-[#e8ba57]" data-testid={`button-popular-question-${index}`}>{item}</button>)}</div>
      </div>
      <div className="animate-rise-in delay-2">
        <div className="rounded-[1.75rem] border border-[#71868a]/35 bg-[#173b47]/80 p-3 shadow-[0_22px_60px_rgba(0,0,0,.18)] backdrop-blur-sm">
          <div className="rounded-[1.25rem] bg-[#f8f2e8] p-4 text-[#102b36] sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><span className="flex items-center gap-2 text-sm font-bold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e8ba57]"><MessageCircleQuestion size={17} /></span> اسأل الأردن AI</span><span className="inline-flex items-center gap-2 text-[11px] text-[#74837e]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />وضع المعرفة المجاني · عربي / English</span></div>
            <SearchBar defaultValue={question} onSubmit={submit} busy={isPending} />
            <TrustStrip />
            {isError && <div className="mt-5 rounded-xl bg-[#fbe8df] p-4 text-sm leading-7 text-[#824337]" data-testid="status-assistant-error">تعذّر الحصول على إجابة الآن. جرّب مرة أخرى.</div>}
            {answer && <AnswerCard answer={answer} question={question} />}
          </div>
        </div>
      </div>
    </div>
  </section>;
}

function AnswerCard({ answer, question }: { answer: AssistantAnswer; question?: string }) {
  const [showFeedback, setShowFeedback] = useState(false);
  return <div className="mt-6 border-t border-[#102b36]/10 pt-6" data-testid="panel-assistant-answer">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-bold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#dcebe3] text-[#286047]"><Check size={16} /></span> إجابة الأردن AI</div><div className="flex items-center gap-2"><StatusBadge status={answer.status} />{answer.searchedLive && <span className="rounded-full bg-[#e8dfcf] px-2.5 py-1 text-[11px] font-bold text-[#725b3e]">بحث مباشر</span>}</div></div>
    <p className="whitespace-pre-line text-[15px] leading-8 text-[#27434b]">{answer.answer}</p>
    {answer.note && <p className="mt-4 rounded-xl bg-[#f2eadc] p-3 text-xs leading-6 text-[#76674f]"><Info size={14} className="ml-1 inline-block align-[-2px]" />{answer.note}</p>}
    {answer.sources?.length > 0 && <div className="mt-5 space-y-2"><p className="text-xs font-bold text-[#7a6850]">المصادر المستخدمة</p>{answer.sources.map((source) => <SourceLine key={source.id} source={source} />)}</div>}
    <div className="mt-5 flex justify-end"><button onClick={() => setShowFeedback((value) => !value)} className="text-xs font-bold text-[#9a6b23] hover:text-[#102b36]" data-testid="button-report-answer">هل وجدت مشكلة في الإجابة؟</button></div>
    {showFeedback && <FeedbackPanel question={question || answer.question} onDone={() => setShowFeedback(false)} />}
  </div>;
}

function FeedbackPanel({ question, knowledgeId, onDone }: { question?: string; knowledgeId?: string; onDone: () => void }) {
  const [message, setMessage] = useState('');
  const { mutate, isPending, isSuccess } = useCreateFeedback();
  if (isSuccess) return <div className="mt-4 rounded-xl bg-[#dcebe3] p-4 text-sm font-medium text-[#286047]" data-testid="status-feedback-success">وصلت ملاحظتك، شكرًا لمساعدتنا على تحسين المعرفة.</div>;
  return <form className="mt-4 rounded-xl border border-[#102b36]/10 bg-[#f2eadc] p-4" onSubmit={(event) => { event.preventDefault(); if (message.trim().length >= 3) mutate({ data: { kind: 'answer-problem', message: message.trim(), question: question || null, knowledgeId: knowledgeId || null } }); }}><label className="mb-2 block text-xs font-bold text-[#5d6e68]">صف المشكلة باختصار</label><textarea value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-20 w-full resize-none rounded-lg border border-[#102b36]/10 bg-[#fbf8f1] p-3 text-sm outline-none focus:border-[#e8ba57]" placeholder="ما الذي يحتاج إلى تصحيح؟" data-testid="textarea-feedback" /><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={onDone} className="rounded-lg px-3 py-2 text-xs font-bold text-[#66746e]" data-testid="button-cancel-feedback">إلغاء</button><button disabled={isPending || message.trim().length < 3} className="rounded-lg bg-[#102b36] px-3 py-2 text-xs font-bold text-[#f8f2e8] disabled:opacity-50" data-testid="button-submit-feedback">{isPending ? 'جارٍ الإرسال...' : 'إرسال الملاحظة'}</button></div></form>;
}

export function HomePage() {
  const { data, isLoading, isError, refetch } = useGetHome();
  if (isLoading) return <SiteShell><HomeSkeleton /></SiteShell>;
  if (isError || !data) return <SiteShell><main className="mx-auto max-w-[760px] px-5 py-24"><ErrorState onRetry={() => refetch()} /></main></SiteShell>;
  return <SiteShell>
    <AssistantPanel popularQuestions={data.popularQuestions} />
    <main>
      <section className="mx-auto max-w-[1260px] px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-4 sm:grid-cols-3">{[{ value: data.verifiedCount, label: 'سجل موثّق', icon: ShieldCheck }, { value: data.categoryCount, label: 'مجالات معرفة', icon: Waypoints }, { value: data.sourceCount, label: 'مصدرًا متاحًا', icon: FileSearch }].map(({ value, label, icon: Icon }, index) => <div key={label} className={`animate-rise-in rounded-[1.35rem] p-5 ${index === 1 ? 'bg-[#e8ba57]' : 'bg-[#e8dfcf]'}`} data-testid={`stat-${index}`}><Icon size={19} className="mb-7 text-[#9b6a22]" /><strong className="block text-3xl font-bold tracking-[-.05em]">{value}</strong><span className="mt-1 block text-sm text-[#63716e]">{label}</span></div>)}</div>
      </section>
      <section className="mx-auto max-w-[1260px] px-5 pb-16 lg:px-8"><SectionHeading eyebrow="مختارات اليوم" title="ابدأ من المعرفة الموثقة" action={<Link href="/knowledge" className="inline-flex items-center gap-2 text-sm font-bold text-[#9b6a22] hover:text-[#102b36]" data-testid="link-see-all-featured">كل السجلات <ArrowLeft size={15} /></Link>} /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{(data.featured ?? []).slice(0, 3).map((item) => <KnowledgeCard key={item.id} item={item} />)}</div></section>
      <section className="bg-[#eae3d7]"><div className="mx-auto max-w-[1260px] px-5 py-16 lg:px-8"><SectionHeading eyebrow="المشهد الكامل" title="تصفّح الأردن حسب المجال" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{(data.categories ?? []).slice(0, 4).map((category, index) => <CategoryTile key={category.id} category={category} featured={index === 0} />)}</div></div></section>
      <section className="mx-auto max-w-[1260px] px-5 py-16 lg:px-8"><div className="grid gap-10 lg:grid-cols-[1fr_.8fr] lg:items-center"><div><p className="mb-3 text-xs font-bold tracking-[.16em] text-[#b47e24]">مصمم للثقة</p><h2 className="max-w-xl text-3xl font-bold leading-[1.35] tracking-[-.04em]">المعلومة الجيدة لا تكتفي بأن تكون مفيدة؛ بل توضّح من أين جاءت.</h2><p className="mt-5 max-w-lg text-sm leading-8 text-[#687771]">تظهر حالة التحقق وتاريخ آخر مراجعة والمصدر الأصلي بجوار كل معرفة، لتقرأ بطمأنينة وتتحقق بنفسك.</p><Link href="/about" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#102b36] px-5 py-3 text-sm font-bold text-[#f8f2e8] transition-transform hover:-translate-y-0.5" data-testid="link-learn-trust">كيف نتحقق؟ <ArrowLeft size={15} /></Link></div><div className="relative min-h-64 overflow-hidden rounded-[2rem] bg-[#102b36] p-8 text-[#f8f2e8]"><Quote className="absolute left-5 top-5 text-[#e8ba57]/40" size={65} /><div className="relative mt-16"><p className="text-xl font-bold leading-9">"اقرأ الإجابة. افتح المصدر. كوّن رأيك."</p><div className="mt-7 h-px w-16 bg-[#e8ba57]" /></div></div></div></section>
    </main>
  </SiteShell>;
}

export function SearchPage() {
  const [location, setLocation] = useLocation();
  const query = new URLSearchParams(location.split('?')[1] || '').get('q') || '';
  const params = useMemo(() => ({ q: query, language: 'ar' as const, limit: 20 }), [query]);
  const { data, isLoading, isError, refetch } = useSearchJordan(params, { query: { enabled: query.length > 0, queryKey: getSearchJordanQueryKey(params) } });
  const submit = (value: string) => setLocation(`/search?q=${encodeURIComponent(value)}`);
  return <SiteShell><main className="mx-auto max-w-[1260px] px-5 pb-20 lg:px-8"><PageIntro eyebrow="بحث في الأردن" title="نتائج تعرف مصدرها." description="ابحث في المعرفة المرتبطة بمصادرها، أو اكتب سؤالًا واضحًا لنصل بك إلى السجل الأقرب." /><div className="mb-10"><SearchBar defaultValue={query} onSubmit={submit} compact busy={isLoading} /></div>{!query ? <EmptyState title="اكتب ما تريد معرفته عن الأردن" description="مثلًا: ابحث عن موضوع أو جهة أو خدمة، ثم راجع المصادر المرتبطة بالنتيجة." /> : isLoading ? <LoadingCards count={6} /> : isError ? <ErrorState onRetry={() => refetch()} /> : data && data.results.length > 0 ? <div><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[#6b7771]">نتائج البحث عن <strong className="text-[#102b36]">"{data.query}"</strong></p><span className="rounded-full bg-[#e8dfcf] px-3 py-1 text-xs font-bold text-[#715a38]">{data.results.length} نتيجة {data.searchedLive ? 'من بحث مباشر' : ''}</span></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{data.results.map((item) => <KnowledgeCard key={item.id} item={item} />)}</div>{data.message && <p className="mt-8 rounded-xl bg-[#ece5d9] p-4 text-sm leading-7 text-[#6b7771]" data-testid="text-search-message">{data.message}</p>}</div> : <EmptyState title="لم نجد سجلًا مطابقًا" description={data?.message || 'جرّب كلمات أخرى أو تصفّح مجالات المعرفة.'} />}</main></SiteShell>;
}

export function KnowledgePage() {
  const [location] = useLocation();
  const category = new URLSearchParams(location.split('?')[1] || '').get('category') || undefined;
  const { data: categories, isLoading: categoriesLoading } = useListCategories();
  const { data: records, isLoading, isError, refetch } = useListKnowledge({ category, limit: 50 });
  const activeCategory = categories?.find((item) => item.id === category);
  return <SiteShell><main className="mx-auto max-w-[1260px] px-5 pb-20 lg:px-8"><PageIntro eyebrow="مكتبة الأردن" title={activeCategory?.label || 'المعرفة، مرتبة لتجدها'} description={activeCategory?.description || 'سجلات مرتبطة بمصادر، تجمع ما يحتاجه الفضول اليومي في مكان واحد واضح.'} /><div className="mb-10 flex gap-2 overflow-x-auto pb-2">{categoriesLoading ? <div className="h-10 w-56 animate-pulse rounded-full bg-[#e8dfcf]" /> : <><Link href="/knowledge" className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${!category ? 'bg-[#102b36] text-[#f8f2e8]' : 'bg-[#e8dfcf] text-[#63716e]'}`} data-testid="filter-category-all">كل المجالات</Link>{(categories || []).map((item) => <Link key={item.id} href={`/knowledge?category=${item.id}`} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${item.id === category ? 'bg-[#e8ba57] text-[#102b36]' : 'bg-[#e8dfcf] text-[#63716e]'}`} data-testid={`filter-category-${item.id}`}>{item.label}</Link>)}</>}</div>{isLoading ? <LoadingCards count={6} /> : isError ? <ErrorState onRetry={() => refetch()} /> : records && records.length > 0 ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{records.map((item) => <KnowledgeCard key={item.id} item={item} />)}</div> : <EmptyState title="لا توجد سجلات في هذا المجال" description="جرّب مجالًا آخر من القائمة أعلاه." />}</main></SiteShell>;
}

function categoryForRoute(route: string, categories?: Category[]) {
  const byId = categories?.find((item) => item.id === route);
  return byId || categories?.find((item) => item.labelEn.toLowerCase().includes(route)) || undefined;
}

export function CategoryPage({ kind, eyebrow, title, description }: { kind: string; eyebrow: string; title: string; description: string }) {
  const { data: categories, isLoading: categoriesLoading } = useListCategories();
  const category = categoryForRoute(kind, categories);
  const { data: records, isLoading, isError, refetch } = useListKnowledge({ category: category?.id || kind, limit: 20 });
  return <SiteShell><main className="mx-auto max-w-[1260px] px-5 pb-20 lg:px-8"><PageIntro eyebrow={eyebrow} title={category?.label || title} description={category?.description || description} /><div className="mb-10 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-[#102b36] p-5 text-[#f8f2e8]"><BookOpen size={18} className="mb-8 text-[#e8ba57]" /><p className="text-2xl font-bold">{category?.count ?? '—'}</p><p className="mt-1 text-xs text-[#bdccca]">سجل في هذا المجال</p></div><div className="rounded-2xl bg-[#e8ba57] p-5"><ShieldCheck size={18} className="mb-8 text-[#9b6a22]" /><p className="text-2xl font-bold">مصادر</p><p className="mt-1 text-xs text-[#695735]">مرئية مع كل سجل</p></div><Link href="/about" className="rounded-2xl bg-[#e8dfcf] p-5 transition-colors hover:bg-[#ded2bf]" data-testid={`link-category-policy-${kind}`}><Info size={18} className="mb-8 text-[#9b6a22]" /><p className="text-lg font-bold">كيف نتحقق؟</p><p className="mt-1 text-xs text-[#687771]">معايير بسيطة، معلنة</p></Link></div>{categoriesLoading || isLoading ? <LoadingCards count={3} /> : isError ? <ErrorState onRetry={() => refetch()} /> : records && records.length > 0 ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{records.map((item) => <KnowledgeCard key={item.id} item={item} />)}</div> : <EmptyState title="لا توجد سجلات لهذا المجال بعد" description="يمكنك العودة إلى مكتبة المعرفة لاستكشاف بقية المجالات." />}</main></SiteShell>;
}

export function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading, isError, refetch } = useGetKnowledge(id || '', { query: { enabled: Boolean(id), queryKey: getGetKnowledgeQueryKey(id || '') } });
  if (isLoading) return <SiteShell><main className="mx-auto max-w-[900px] px-5 py-16 lg:px-8"><div className="h-10 w-2/3 animate-pulse rounded-xl bg-[#e8dfcf]" /><div className="mt-5 h-44 animate-pulse rounded-2xl bg-[#e8dfcf]" /></main></SiteShell>;
  if (isError || !item) return <SiteShell><main className="mx-auto max-w-[760px] px-5 py-24"><ErrorState onRetry={() => refetch()} /></main></SiteShell>;
  return <SiteShell><main className="mx-auto max-w-[1100px] px-5 pb-20 pt-10 lg:px-8 lg:pt-16"><Link href="/knowledge" className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-[#8f6729] hover:text-[#102b36]" data-testid="link-back-knowledge"><ArrowLeft size={16} /> العودة إلى المعرفة</Link><article className="grid gap-10 lg:grid-cols-[1fr_330px]"><div><div className="mb-6 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#e8dfcf] px-3 py-1 text-xs font-bold text-[#715a38]">{item.categoryLabel}</span><StatusBadge status={item.status} /></div><h1 className="max-w-3xl text-4xl font-bold leading-[1.3] tracking-[-.04em] sm:text-5xl" data-testid={`text-knowledge-title-${item.id}`}>{item.title}</h1><p className="mt-3 text-sm text-[#7a8781]">{item.titleEn}</p><div className="mt-9 border-y border-[#102b36]/10 py-8"><p className="text-lg leading-10 text-[#29434b]" data-testid={`text-knowledge-summary-${item.id}`}>{item.summary}</p></div><div className="mt-8 flex flex-wrap gap-2">{item.tags.map((tag) => <span key={tag} className="rounded-full bg-[#ece5d9] px-3 py-1.5 text-xs text-[#66736e]">#{tag}</span>)}</div><div className="mt-12"><div className="mb-4 flex items-center gap-2 text-sm font-bold"><ExternalLink size={16} className="text-[#b47e24]" /> المصدر المرتبط</div><SourceLine source={item.source} /></div><div className="mt-8"><FeedbackPanel knowledgeId={item.id} onDone={() => undefined} /></div></div><aside className="h-fit space-y-4 lg:sticky lg:top-6"><div className="rounded-[1.35rem] bg-[#102b36] p-6 text-[#f8f2e8]"><ShieldCheck size={22} className="mb-5 text-[#e8ba57]" /><p className="text-xs text-[#b7c8c4]">حالة التحقق</p><p className="mt-2 text-xl font-bold">{item.status === 'verified' ? 'تم التحقق من السجل' : 'هذا السجل قيد المراجعة'}</p><p className="mt-4 text-xs leading-6 text-[#bbcac7]">آخر تحقق: {formatDate(item.lastVerified)}</p></div><div className="rounded-[1.35rem] border border-[#102b36]/10 bg-[#e8dfcf] p-6"><Clock3 size={19} className="mb-5 text-[#9b6a22]" /><p className="text-xs text-[#69766f]">الناشر</p><p className="mt-1 font-bold">{item.source.publisher}</p><p className="mt-4 text-xs leading-6 text-[#69766f]">تاريخ الاسترجاع: {formatDate(item.source.retrievedAt)}</p></div></aside></article></main></SiteShell>;
}

export function AboutPage() {
  return <SiteShell><main><PageIntro eyebrow="عن الأردن AI" title="رفيق معرفة وطني، لا بوابة حكومية ولا صندوق إجابات غامض." description="نرتّب المعرفة المتعلقة بالأردن ونقرّبها منك مع مصدرها وحالة التحقق الخاصة بها. هدفنا أن يكون الوصول إلى المعلومة الموثوقة أسهل، وأن تكون حدودها واضحة." /><section className="mx-auto max-w-[1260px] px-5 pb-20 lg:px-8"><div className="grid gap-4 lg:grid-cols-3"><div className="rounded-[1.5rem] bg-[#102b36] p-7 text-[#f8f2e8] lg:col-span-2"><Sparkles className="mb-14 text-[#e8ba57]" size={22} /><h2 className="max-w-xl text-3xl font-bold leading-[1.4]">كل سجل له أثر يمكن الرجوع إليه.</h2><p className="mt-5 max-w-lg text-sm leading-8 text-[#bdccca]">لا نعرض المعلومة كحقيقة معلّقة في الهواء. نربطها بالمصدر، ونُظهر نوعه، وتاريخ جلبه، وتاريخ آخر تحقق إن توفر.</p></div><div className="rounded-[1.5rem] bg-[#e8ba57] p-7"><ShieldCheck className="mb-14 text-[#8e6521]" size={22} /><h2 className="text-2xl font-bold leading-[1.4]">الوضوح قبل اليقين.</h2><p className="mt-5 text-sm leading-8 text-[#665735]">عندما لا يكفي المصدر أو يحتاج الأمر إلى تحديث، نقول ذلك صراحة.</p></div></div><div className="mt-16 grid gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-xs font-bold tracking-[.16em] text-[#b47e24]">سياسة التحقق</p><h2 className="mt-3 text-3xl font-bold">كيف نقرر ما يظهر؟</h2></div><div className="space-y-7">{[{ title: 'المصدر أولًا', copy: 'كل سجل معرفي مرتبط بمصدر منشور، مع رابط مباشر عندما يكون ذلك متاحًا.', icon: ExternalLink }, { title: 'الحالة ليست تفصيلًا', copy: 'تميّز واضح بين موثّق، قيد المراجعة، ويحتاج إلى مصدر حديث.', icon: ShieldCheck }, { title: 'المراجعة قابلة للتتبع', copy: 'نعرض تاريخ آخر تحقق وتاريخ استرجاع المصدر حتى تعرف حداثة السياق.', icon: Clock3 }].map(({ title, copy, icon: Icon }, index) => <div key={title} className="flex gap-4 border-b border-[#102b36]/10 pb-7"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8dfcf] text-[#9b6a22]">{index + 1}</span><div><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-7 text-[#6b7771]">{copy}</p></div><Icon className="mr-auto hidden text-[#b47e24] sm:block" size={18} /></div>)}</div></div><div className="mt-16 rounded-[1.5rem] border border-[#102b36]/10 bg-[#ece5d9] p-7"><div className="flex items-start gap-4"><Globe2 className="mt-1 text-[#b47e24]" size={21} /><div><h2 className="font-bold">مصادرنا ليست متشابهة</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-[#6b7771]">نوضح نوع المصدر: رسمي، مرجعي موثوق، موثوق، أو ثانوي. هذا التصنيف يساعدك على قراءة الإجابة ضمن سياقها، لا كبديل عن حكمك.</p></div></div></div></section></main></SiteShell>;
}

export function NotFoundPage() {
  return <SiteShell><main className="mx-auto max-w-[720px] px-5 py-24 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e8ba57] text-[#102b36]"><Search size={26} /></div><p className="mt-7 text-xs font-bold tracking-[.16em] text-[#b47e24]">404</p><h1 className="mt-3 text-4xl font-bold">هذه الصفحة ليست في الخريطة.</h1><p className="mt-4 text-sm leading-7 text-[#6b7771]">يمكنك العودة إلى مساحة البحث أو استكشاف سجلات المعرفة.</p><Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#102b36] px-5 py-3 text-sm font-bold text-[#f8f2e8]" data-testid="link-not-found-home">العودة إلى البداية <ArrowLeft size={15} /></Link></main></SiteShell>;
}
