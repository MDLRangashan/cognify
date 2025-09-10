import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './LanguageSelector.css';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as 'en' | 'si');
  };

  return (
    <div className="language-selector">
      <select 
        value={language} 
        onChange={handleLanguageChange}
        className="language-select"
        aria-label={t('language.selectLanguage')}
      >
        <option value="en">{t('language.english')}</option>
        <option value="si">{t('language.sinhala')}</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
