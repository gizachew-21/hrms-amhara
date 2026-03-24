import React from 'react';
import { useTranslation } from 'react-i18next';
import './AnnouncementTicker.css';

const AnnouncementTicker = () => {
    const { t } = useTranslation();
    const tickerItems = t('landing.tickerItems', { returnObjects: true }) || [];

    if (!Array.isArray(tickerItems) || tickerItems.length === 0) return null;

    return (
        <div className="announcement-ticker">
            <div className="ticker-label">{t('landing.announcements')}</div>
            <div className="ticker-content">
                <div className="ticker-track">
                    {tickerItems.map((item, index) => (
                        <span key={index} className="ticker-item">{item}</span>
                    ))}
                    {/* Duplicate items for seamless loop */}
                    {tickerItems.map((item, index) => (
                        <span key={`dup-${index}`} className="ticker-item">{item}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnnouncementTicker;
