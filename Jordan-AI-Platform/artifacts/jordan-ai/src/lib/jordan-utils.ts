import type { AssistantAnswerStatus, KnowledgeItemStatus, Source } from '@workspace/api-client-react';

export function formatDate(value?: string | null) {
  if (!value) return 'غير متوفر';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-JO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function statusLabel(status: KnowledgeItemStatus | AssistantAnswerStatus) {
  if (status === 'verified') return 'موثّق';
  if (status === 'review') return 'قيد المراجعة';
  if (status === 'needs-current-source') return 'يحتاج مصدرًا حديثًا';
  return 'غير موثّق';
}

export function statusClass(status: KnowledgeItemStatus | AssistantAnswerStatus) {
  if (status === 'verified') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (status === 'review') return 'bg-amber-50 text-amber-800 border-amber-200';
  if (status === 'needs-current-source') return 'bg-amber-50 text-amber-900 border-amber-200';
  return 'bg-rose-50 text-rose-800 border-rose-200';
}

export function sourceTypeLabel(type: Source['type']) {
  if (type === 'official') return 'مصدر رسمي';
  if (type === 'authoritative') return 'مرجع موثوق';
  if (type === 'reliable') return 'مصدر موثوق';
  return 'مصدر ثانوي';
}

export function sourceTypeClass(type: Source['type']) {
  if (type === 'official') return 'bg-[#102b36] text-[#f8f2e8]';
  if (type === 'authoritative') return 'bg-[#e8ba57] text-[#102b36]';
  if (type === 'reliable') return 'bg-[#d7e7df] text-[#205440]';
  return 'bg-[#ebe5da] text-[#6c5a45]';
}