import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'am' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <button 
      className="language-switcher" 
      onClick={toggleLanguage}
      title={i18n.language === 'en' ? 'Switch to Amharic' : 'ወደ እንግሊዝኛ ቀይር'}
    >
      <span className="lang-icon">🌐</span>
      <span className="lang-text">
        {i18n.language === 'en' ? 'አማ' : 'EN'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
