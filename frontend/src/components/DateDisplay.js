import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateByLanguage, formatDateShort, formatDateNumeric } from '../utils/ethiopianCalendar';

/**
 * DateDisplay Component
 * Automatically displays dates in Gregorian (English) or Ethiopian (Amharic) calendar
 * based on the current language setting
 * 
 * @param {Date|string} date - The date to display
 * @param {string} format - Format type: 'full', 'short', 'numeric' (default: 'short')
 * @param {string} className - Optional CSS class
 */
const DateDisplay = ({ date, format = 'short', className = '' }) => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  if (!date) return <span className={className}>N/A</span>;

  let formattedDate;
  
  switch (format) {
    case 'full':
      formattedDate = formatDateByLanguage(date, currentLanguage, 'full');
      break;
    case 'numeric':
      formattedDate = formatDateNumeric(date, currentLanguage);
      break;
    case 'short':
    default:
      formattedDate = formatDateShort(date, currentLanguage);
      break;
  }

  return <span className={className}>{formattedDate}</span>;
};

export default DateDisplay;
