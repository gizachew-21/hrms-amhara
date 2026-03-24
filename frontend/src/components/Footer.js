import React from 'react';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer = () => {
    const { t } = useTranslation();
    
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-section">
                    <h3>{t('footer.organizationName')}</h3>
                    <p>{t('footer.description')}</p>
                </div>

                <div className="footer-section">
                    <h3>{t('footer.quickLinks')}</h3>
                    <ul>
                        <li><a href="/#about">{t('footer.aboutUs')}</a></li>
                        <li><a href="/jobs">{t('footer.careers')}</a></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h3>{t('footer.contactUs')}</h3>
                    <ul>
                        <li><i className="fas fa-map-marker-alt"></i> {t('footer.location')}</li>
                        <li><i className="fas fa-phone"></i> {t('footer.phone')}</li>
                        <li><i className="fas fa-envelope"></i> {t('footer.email')}</li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} {t('footer.copyright')}</p>
            </div>
        </footer>
    );
};

export default Footer;
