/**
 * Telefon raqamni formatlash uchun utility funksiyalar
 * Format: +998 XX XXX XX XX
 */

/**
 * Telefon raqamni formatlaydi
 * Input: "773109828" yoki "77 310 98 28" yoki "+998773109828"
 * Output: "+998 77 310 98 28"
 */
export const formatPhoneNumber = (value: string): string => {
  // Faqat raqamlarni qoldirish
  const numbers = value.replace(/\D/g, '');
  
  // Agar 998 bilan boshlanmasa, qo'shish
  let phoneNumbers = numbers;
  if (numbers.startsWith('998')) {
    phoneNumbers = numbers.slice(3);
  }
  
  // Maksimal 9 ta raqam (998 dan keyin)
  phoneNumbers = phoneNumbers.slice(0, 9);
  
  // Formatlash: XX XXX XX XX
  let formatted = '+998';
  
  if (phoneNumbers.length > 0) {
    formatted += ' ' + phoneNumbers.slice(0, 2);
  }
  if (phoneNumbers.length > 2) {
    formatted += ' ' + phoneNumbers.slice(2, 5);
  }
  if (phoneNumbers.length > 5) {
    formatted += ' ' + phoneNumbers.slice(5, 7);
  }
  if (phoneNumbers.length > 7) {
    formatted += ' ' + phoneNumbers.slice(7, 9);
  }
  
  return formatted;
};

/**
 * Telefon raqamni tozalaydi (faqat raqamlar)
 * Input: "+998 77 310 98 28"
 * Output: "998773109828"
 */
export const cleanPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Telefon raqam to'liq kiritilganligini tekshiradi
 */
export const isPhoneNumberComplete = (value: string): boolean => {
  const cleaned = cleanPhoneNumber(value);
  return cleaned.length === 12 && cleaned.startsWith('998');
};

/**
 * Telefon input uchun onChange handler
 * React Hook Form bilan ishlash uchun
 */
export const handlePhoneInput = (
  e: React.ChangeEvent<HTMLInputElement>,
  onChange: (value: string) => void
) => {
  const formatted = formatPhoneNumber(e.target.value);
  onChange(formatted);
};

/**
 * Telefon raqamni database formatiga o'tkazish
 * Input: "+998 77 310 98 28"
 * Output: "+998773109828"
 */
export const toDbFormat = (value: string): string => {
  const cleaned = cleanPhoneNumber(value);
  return cleaned.startsWith('998') ? '+' + cleaned : '+998' + cleaned;
};

/**
 * Database formatidan display formatiga o'tkazish
 * Input: "+998773109828"
 * Output: "+998 77 310 98 28"
 */
export const toDisplayFormat = (value: string): string => {
  if (!value) return '+998 ';
  return formatPhoneNumber(value);
};
