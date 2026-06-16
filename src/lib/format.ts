// Small formatting helpers shared across screens.
import i18n from '@/i18n';

export function formatAed(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function feeRangeLabel(
  min: number | null | undefined,
  max: number | null | undefined
): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${formatAed(min)}–${formatAed(max)}`;
  return formatAed((min ?? max) as number);
}

export function relativeDate(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return i18n.t('common.today');
  if (days === 1) return i18n.t('common.yesterday');
  if (days < 30) return i18n.t('common.daysAgo', { n: days });
  if (days < 365) return i18n.t('common.monthsAgo', { n: Math.floor(days / 30) });
  return i18n.t('common.yearsAgo', { n: Math.floor(days / 365) });
}
