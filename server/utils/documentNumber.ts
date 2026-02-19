import Counter from '../models/Counter';

/**
 * Markazlashtirilgan hujjat raqam generatori.
 *
 * Har bir prefix + yil kombinatsiyasi uchun alohida ketma-ket raqam generatsiya qiladi.
 * MongoDB findOneAndUpdate ($inc) orqali atomik va concurrent-safe.
 *
 * Misollar:
 *   generateDocNumber('CF', { padWidth: 3 })    -> "CF-2026-001"
 *   generateDocNumber('IN', { padWidth: 4 })    -> "IN-2026-0001"
 *   generateDocNumber('P', { withYear: false, padWidth: 6 })  -> "P000001"
 *   generateDocNumber('INV', { withYear: false, padWidth: 6 }) -> "INV-000001"
 */

interface DocNumberOptions {
  /** Yilni raqamga kiritish (default: true) */
  withYear?: boolean;
  /** Raqam uzunligi (default: 3) */
  padWidth?: number;
  /** Separator belgisi (default: '-') */
  separator?: string;
}

export async function generateDocNumber(
  prefix: string,
  options: DocNumberOptions = {}
): Promise<string> {
  const { withYear = true, padWidth = 3, separator = '-' } = options;

  const year = new Date().getFullYear();
  const counterKey = withYear ? `${prefix}${separator}${year}` : prefix;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterKey },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seq = String(counter.seq).padStart(padWidth, '0');

  if (withYear) {
    return `${prefix}${separator}${year}${separator}${seq}`;
  }
  return `${prefix}${seq}`;
}

/**
 * Mavjud hujjatlar sonidan counter ni sinxronlash.
 * Birinchi ishlatishda yoki migratsiya uchun.
 */
export async function syncCounter(
  prefix: string,
  currentCount: number,
  options: { withYear?: boolean; separator?: string } = {}
): Promise<void> {
  const { withYear = true, separator = '-' } = options;
  const year = new Date().getFullYear();
  const counterKey = withYear ? `${prefix}${separator}${year}` : prefix;

  await Counter.findOneAndUpdate(
    { _id: counterKey },
    { $max: { seq: currentCount } },
    { upsert: true }
  );
}
