import { ArrowLeft, ArrowUpLeft, BookOpen, Check, ChevronLeft, ExternalLink, Loader2, Menu, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useEffect, useState, type ReactNode } from 'react';
import type { Category, KnowledgeItem, Source } from '@workspace/api-client-react';
import { formatDate, sourceTypeClass, sourceTypeLabel, statusClass, statusLabel } from '@/lib/jordan-utils';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" data-testid="link-logo">
      <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-[#e8ba57] text-[#102b36] shadow-[0_7px_0_#c8993d] transition-transform duration-300 group-hover:-translate-y-0.5">
        <span className="font-display text-2xl font-bold leading-none">أ</span>
        <span className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-[#d66b4d]" />
      </span>
      <span className={compact ? 'hidden sm:block' : ''}>
        <span className="block text-[17px] font-bold leading-tight text-[#f7f1e7]">الأردن AI</span>
        <span className="block text-[10px] font-medium tracking-[.18em] text-[#b9c9ca]">JORDAN KNOWLEDGE</span>
      </span>
    </Link>
  );
}

const navItems = [
  { href: '/knowledge', label: 'المعرفة', icon: BookOpen },
  { href: '/education', label: 'التعليم' },
  { href: '/government', label: 'الحكومة والخدمات' },
  { href: '/tourism', label: 'السياحة' },
  { href: '/about', label: 'عن الأردن AI' },
];

export function Header({ onMenu }: { onMenu?: () => void }) {
  const [location] = useLocation();
  return (
    <header className="relative z-20 bg-[#102b36] text-[#f8f2e8]">
      <div className="mx-auto flex max-w-[1260px] items-center justify-between gap-5 px-5 py-5 lg:px-8">
        <Logo compact />
        <nav className="hidden items-center gap-1 xl:flex" aria-label="التنقل الرئيسي">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={`group flex items-center gap-2 rounded-full px-4 py-2 text-[13px] transition-colors ${active ? 'bg-[#234551] text-[#e8ba57]' : 'text-[#c1cecc] hover:bg-[#1b3a45] hover:text-[#f8f2e8]'}`} data-testid={`link-nav-${item.href.slice(1)}`}>
                {Icon && <Icon size={15} strokeWidth={1.8} />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/search" className="hidden rounded-full border border-[#537078] px-4 py-2 text-[13px] text-[#e5eeeb] transition-colors hover:border-[#e8ba57] hover:text-[#e8ba57] sm:inline-flex" data-testid="link-header-search">
            ابحث في الأردن
          </Link>
          <button onClick={onMenu} className="grid h-10 w-10 place-items-center rounded-full border border-[#537078] text-[#e5eeeb] transition-colors hover:border-[#e8ba57] hover:text-[#e8ba57] xl:hidden" aria-label="فتح القائمة" data-testid="button-open-menu">
            <Menu size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-[#102b36]/70 backdrop-blur-sm xl:hidden" onClick={onClose}>
      <div className="absolute right-0 top-0 h-full w-[min(88vw,350px)] bg-[#f3eee4] p-6 text-[#102b36] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-12 flex items-center justify-between">
          <span className="font-bold">القائمة</span>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-[#e6dece]" aria-label="إغلاق القائمة" data-testid="button-close-menu"><X size={17} /></button>
        </div>
        <div className="space-y-2">
          {navItems.map((item) => <Link key={item.href} href={item.href} onClick={onClose} className="block rounded-xl px-4 py-3 font-medium transition-colors hover:bg-[#e8ba57]/20" data-testid={`link-mobile-${item.href.slice(1)}`}>{item.label}</Link>)}
        </div>
        <div className="mt-12 rounded-2xl bg-[#102b36] p-5 text-[#f8f2e8]">
          <Sparkles size={18} className="mb-3 text-[#e8ba57]" />
          <p className="text-sm leading-7 text-[#d2dfdc]">اسأل عن الأردن، وسنوضح لك المصدر وحالة التحقق.</p>
        </div>
      </div>
    </div>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div dir="rtl" className="min-h-[100dvh] bg-[#f3eee4] text-[#102b36]">
      <Header onMenu={() => setMenuOpen(true)} />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
      {children}
      <footer className="border-t border-[#102b36]/10 bg-[#eae3d7]">
        <div className="mx-auto flex max-w-[1260px] flex-col gap-4 px-5 py-8 text-sm text-[#63716e] sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>الأردن AI — معرفة أوضح، بمصادرها.</p>
          <div className="flex gap-5"><Link href="/about" className="hover:text-[#102b36]" data-testid="link-footer-about">سياسة التحقق</Link><Link href="/knowledge" className="hover:text-[#102b36]" data-testid="link-footer-knowledge">تصفح المعرفة</Link></div>
        </div>
      </footer>
    </div>
  );
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <section className="mx-auto max-w-[1260px] px-5 pb-8 pt-14 lg:px-8 lg:pb-12 lg:pt-20"><p className="mb-4 text-xs font-bold tracking-[.16em] text-[#b47e24]">{eyebrow}</p><h1 className="max-w-3xl text-4xl font-bold leading-[1.2] tracking-[-.04em] text-[#102b36] sm:text-5xl">{title}</h1><p className="mt-5 max-w-2xl text-base leading-8 text-[#63716e]">{description}</p></section>;
}

export function SearchBar({ defaultValue = '', onSubmit, compact = false, busy = false }: { defaultValue?: string; onSubmit: (value: string) => void; compact?: boolean; busy?: boolean }) {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => setValue(defaultValue), [defaultValue]);
  return <form className={`flex w-full items-center gap-2 rounded-2xl border border-[#102b36]/15 bg-[#fbf8f1] p-2 shadow-[0_14px_40px_rgba(16,43,54,.08)] ${compact ? 'max-w-xl' : ''}`} onSubmit={(event) => { event.preventDefault(); if (value.trim()) onSubmit(value.trim()); }} data-testid="form-search">
    <Search className="mr-2 shrink-0 text-[#b47e24]" size={20} />
    <input value={value} onChange={(event) => setValue(event.target.value)} className="min-w-0 flex-1 bg-transparent px-2 py-3 text-[15px] outline-none placeholder:text-[#8e9994]" placeholder="اسأل عن الأردن أو ابحث في مصادره..." aria-label="البحث في الأردن" data-testid="input-search" />
    <button type="submit" disabled={busy || !value.trim()} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#e8ba57] px-4 py-3 text-sm font-bold text-[#102b36] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" data-testid="button-submit-search">{busy ? <Loader2 className="animate-spin" size={16} /> : <ArrowLeft size={16} />}<span className="hidden sm:inline">بحث</span></button>
  </form>;
}

export function StatusBadge({ status }: { status: KnowledgeItem['status'] | 'needs-current-source' | 'not-verified' }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass(status)}`} data-testid={`status-${status}`}><span className={`h-1.5 w-1.5 rounded-full ${status === 'verified' ? 'bg-emerald-600' : status === 'review' || status === 'needs-current-source' ? 'bg-amber-600' : 'bg-rose-600'}`} />{statusLabel(status)}</span>;
}

export function SourceBadge({ source }: { source: Source }) {
  return <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${sourceTypeClass(source.type)}`}><ShieldCheck size={12} />{sourceTypeLabel(source.type)}</span>;
}

export function SourceLine({ source }: { source: Source }) {
  return <a href={source.url} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-xl border border-[#102b36]/10 bg-[#fbf8f1] p-3 transition-all hover:-translate-y-0.5 hover:border-[#e8ba57] hover:shadow-[0_8px_22px_rgba(16,43,54,.06)]" data-testid={`link-source-${source.id}`}>
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#e8ba57]/25 text-[#9e6b1f]"><ExternalLink size={15} /></span>
    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-[#263f46]">{source.title}</span><span className="mt-0.5 block truncate text-xs text-[#7b8781]">{source.publisher} · {source.domain}</span></span>
    <ChevronLeft size={16} className="shrink-0 text-[#a4aaa2] transition-transform group-hover:-translate-x-1" />
  </a>;
}

export function KnowledgeCard({ item }: { item: KnowledgeItem }) {
  const isLive = item.id.startsWith("web-");
  const content = <><div className="mb-6 flex items-start justify-between gap-3"><span className="rounded-full bg-[#e9dfcc] px-3 py-1 text-[11px] font-bold text-[#715a38]">{item.categoryLabel}</span><StatusBadge status={item.status} /></div>
    <h3 className="text-lg font-bold leading-8 text-[#173640] transition-colors group-hover:text-[#9b6a22]">{item.title}</h3>
    <p className="mt-2 line-clamp-3 text-sm leading-7 text-[#6b7771]">{item.summary}</p>
    <div className="mt-5 flex items-center justify-between border-t border-[#102b36]/10 pt-4 text-xs text-[#84908a]"><span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#b47e24]" />{item.source.domain}</span><span className="inline-flex items-center gap-1 font-bold text-[#9b6a22]">{isLive ? "فتح النتيجة" : "اقرأ السجل"} <ArrowLeft size={13} /></span></div></>;
  return isLive ? <a href={item.source.url} target="_blank" rel="noreferrer" className="group block rounded-[1.35rem] border border-[#102b36]/10 bg-[#fbf8f1] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#e8ba57] hover:shadow-[0_16px_35px_rgba(16,43,54,.08)]" data-testid={`card-knowledge-${item.id}`}>{content}</a> : <Link href={`/knowledge/${item.id}`} className="group block rounded-[1.35rem] border border-[#102b36]/10 bg-[#fbf8f1] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#e8ba57] hover:shadow-[0_16px_35px_rgba(16,43,54,.08)]" data-testid={`card-knowledge-${item.id}`}>{content}</Link>;
}

export function CategoryTile({ category, featured = false }: { category: Category; featured?: boolean }) {
  return <Link href={`/knowledge?category=${category.id}`} className={`group relative overflow-hidden rounded-[1.35rem] border border-[#102b36]/10 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(16,43,54,.1)] ${featured ? 'min-h-[170px] bg-[#102b36] text-[#f8f2e8]' : 'min-h-[145px] bg-[#e8dfcf] text-[#173640]'}`} data-testid={`card-category-${category.id}`}>
    <span className="absolute -left-4 -top-6 h-24 w-24 rounded-full border-[14px] opacity-40" style={{ borderColor: category.accent || '#e8ba57' }} />
    <span className="relative flex h-full flex-col justify-between"><span><span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8ba57] font-display text-lg font-bold text-[#102b36]">أ</span><span className="block text-lg font-bold">{category.label}</span></span><span className={`mt-5 flex items-center justify-between text-xs ${featured ? 'text-[#b9c9ca]' : 'text-[#6c7972]'}`}><span>{category.count} سجل</span><ArrowUpLeft size={15} className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></span></span>
  </Link>;
}

export function LoadingCards({ count = 3 }: { count?: number }) {
  return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: count }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-[1.35rem] bg-[#e8dfcf]" />)}</div>;
}

export function EmptyState({ title = 'لا توجد نتائج بعد', description = 'جرّب سؤالًا أو بحثًا مختلفًا.' }: { title?: string; description?: string }) {
  return <div className="rounded-[1.5rem] border border-dashed border-[#102b36]/20 bg-[#ece5d9] px-6 py-14 text-center"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#e8ba57] text-[#102b36]"><Search size={21} /></div><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm text-[#708079]">{description}</p></div>;
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return <div className="rounded-[1.5rem] border border-[#d66b4d]/30 bg-[#fbebe5] px-6 py-12 text-center"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#d66b4d] text-[#fff7ef]"><X size={21} /></div><h3 className="font-bold text-[#73392f]">تعذر تحميل هذه الصفحة</h3><p className="mt-2 text-sm text-[#965a4e]">تحقق من الاتصال ثم حاول مرة أخرى.</p>{onRetry && <button onClick={onRetry} className="mt-5 rounded-xl bg-[#102b36] px-5 py-2.5 text-sm font-bold text-[#f8f2e8] transition-transform hover:-translate-y-0.5" data-testid="button-retry">إعادة المحاولة</button>}</div>;
}

export function TrustStrip() {
  return <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#102b36]/10 pt-5 text-xs text-[#64736d]"><span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#b47e24]" />المصادر ظاهرة دائمًا</span><span className="inline-flex items-center gap-1.5"><Check size={14} className="text-[#4e8369]" />حالة التحقق واضحة</span><span>لا ادعاءات بلا سند</span></div>;
}