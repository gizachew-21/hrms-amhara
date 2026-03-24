// Ethiopian Calendar Utility
// Converts Gregorian dates to Ethiopian calendar dates

const ETHIOPIAN_MONTHS = [
  'መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን'
];

const ETHIOPIAN_MONTHS_SHORT = [
  'መስከ', 'ጥቅም', 'ኅዳር', 'ታኅሣ', 'ጥር', 'የካቲ',
  'መጋቢ', 'ሚያዝ', 'ግንቦ', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
];

/**
 * Convert Gregorian date to Ethiopian calendar
 * @param {Date|string} gregorianDate - Gregorian date
 * @returns {Object} Ethiopian date {year, month, day, monthName}
 */
export function toEthiopianDate(gregorianDate) {
  const date = typeof gregorianDate === 'string' ? new Date(gregorianDate) : gregorianDate;
  
  if (!(date instanceof Date) || isNaN(date)) {
    return null;
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Ethiopian calendar is 7-8 years behind Gregorian
  let ethYear = year - 8;
  let ethMonth = month + 4;
  let ethDay = day;

  // Adjust for Ethiopian New Year (September 11 or 12)
  if (month < 9 || (month === 9 && day < 11)) {
    ethYear = year - 8;
  } else {
    ethYear = year - 7;
  }

  // Calculate Ethiopian month and day
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const newYearDay = isLeapYear ? 12 : 11;

  // Days from Ethiopian New Year
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (isLeapYear) daysInMonth[1] = 29;

  let dayOfYear = 0;
  for (let i = 0; i < month - 1; i++) {
    dayOfYear += daysInMonth[i];
  }
  dayOfYear += day;

  // Ethiopian New Year starts on Sept 11 (or 12 in leap year)
  let ethNewYearDay = 0;
  for (let i = 0; i < 8; i++) {
    ethNewYearDay += daysInMonth[i];
  }
  ethNewYearDay += newYearDay;

  let ethDayOfYear;
  if (dayOfYear >= ethNewYearDay) {
    ethDayOfYear = dayOfYear - ethNewYearDay + 1;
    ethYear = year - 7;
  } else {
    const prevYearDays = (year - 1) % 4 === 0 ? 366 : 365;
    ethDayOfYear = prevYearDays - ethNewYearDay + dayOfYear + 1;
    ethYear = year - 8;
  }

  // Calculate Ethiopian month and day
  ethMonth = Math.floor((ethDayOfYear - 1) / 30) + 1;
  ethDay = ((ethDayOfYear - 1) % 30) + 1;

  // Handle 13th month (Pagume)
  if (ethMonth > 13) {
    ethMonth = 1;
    ethYear++;
  }

  return {
    year: ethYear,
    month: ethMonth,
    day: ethDay,
    monthName: ETHIOPIAN_MONTHS[ethMonth - 1] || ETHIOPIAN_MONTHS[12]
  };
}

/**
 * Format Ethiopian date as string
 * @param {Date|string} gregorianDate - Gregorian date
 * @param {string} format - Format type: 'full', 'short', 'numeric'
 * @returns {string} Formatted Ethiopian date
 */
export function formatEthiopianDate(gregorianDate, format = 'full') {
  const ethDate = toEthiopianDate(gregorianDate);
  
  if (!ethDate) return '';

  switch (format) {
    case 'full':
      return `${ethDate.day} ${ethDate.monthName} ${ethDate.year}`;
    case 'short':
      return `${ethDate.day} ${ETHIOPIAN_MONTHS_SHORT[ethDate.month - 1]} ${ethDate.year}`;
    case 'numeric':
      return `${String(ethDate.day).padStart(2, '0')}/${String(ethDate.month).padStart(2, '0')}/${ethDate.year}`;
    default:
      return `${ethDate.day} ${ethDate.monthName} ${ethDate.year}`;
  }
}

/**
 * Get Ethiopian month name
 * @param {number} monthNumber - Month number (1-13)
 * @returns {string} Ethiopian month name
 */
export function getEthiopianMonthName(monthNumber) {
  return ETHIOPIAN_MONTHS[monthNumber - 1] || '';
}

/**
 * Get all Ethiopian month names
 * @returns {Array} Array of Ethiopian month names
 */
export function getEthiopianMonths() {
  return ETHIOPIAN_MONTHS;
}

/**
 * Format date based on current language
 * @param {Date|string} date - Date to format
 * @param {string} language - Current language ('en' or 'am')
 * @param {string} format - Format type for Ethiopian calendar
 * @returns {string} Formatted date
 */
export function formatDateByLanguage(date, language, format = 'full') {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (language === 'am') {
    return formatEthiopianDate(dateObj, format);
  } else {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

/**
 * Format date for display in tables (shorter format)
 * @param {Date|string} date - Date to format
 * @param {string} language - Current language ('en' or 'am')
 * @returns {string} Formatted date
 */
export function formatDateShort(date, language) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (language === 'am') {
    return formatEthiopianDate(dateObj, 'short');
  } else {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

/**
 * Format date numerically
 * @param {Date|string} date - Date to format
 * @param {string} language - Current language ('en' or 'am')
 * @returns {string} Formatted date
 */
export function formatDateNumeric(date, language) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (language === 'am') {
    return formatEthiopianDate(dateObj, 'numeric');
  } else {
    return dateObj.toLocaleDateString('en-US');
  }
}

export default {
  toEthiopianDate,
  formatEthiopianDate,
  getEthiopianMonthName,
  getEthiopianMonths,
  formatDateByLanguage,
  formatDateShort,
  formatDateNumeric
};
