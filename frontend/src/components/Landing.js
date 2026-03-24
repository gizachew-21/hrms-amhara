import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import Footer from './Footer';
import AnnouncementTicker from './AnnouncementTicker';
import './Landing.css';

// Import the background image
const heroBackground = '/images/image_324fa1.jpg';

const Landing = () => {
    const { t } = useTranslation();

    return (
        <div className="landing-page">
            <Navbar />
            <AnnouncementTicker />

            {/* Hero Section */}
            <div className="hero-section" style={{ backgroundImage: `url(${heroBackground})` }}>
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1 className="hero-title">{t('landing.joinAITBTeam')}</h1>
                    <p className="hero-subtitle">{t('hero.subtitle')}</p>
                    <div className="hero-actions">
                        <Link to="/jobs" className="hero-btn primary">{t('hero.exploreOpportunities')}</Link>
                        <Link to="/status" className="hero-btn secondary">{t('hero.trackApplication')}</Link>
                    </div>
                </div>
            </div>

            {/* Job Application Card */}
            <div className="landing-content">
                <h2>{t('hero.startYourJourney')}</h2>
                <p>{t('hero.welcomeMessage')}</p>
                <div className="action-cards">
                    <Link to="/jobs" className="action-card">
                        <div className="card-icon">💼</div>
                        <h3>{t('landing.viewAllJobs')}</h3>
                        <p>{t('hero.browsePositions')}</p>
                    </Link>
                    <Link to="/status" className="action-card">
                        <div className="card-icon">📋</div>
                        <h3>{t('hero.checkApplicationStatus')}</h3>
                        <p>{t('hero.trackProgress')}</p>
                    </Link>
                </div>
                <p className="staff-note">{t('hero.staffNote')}</p>
            </div>

            {/* Initiatives Section */}
            <div className="initiatives-section">
                <div className="container">
                    <h2>{t('landing.initiatives')}</h2>
                    <div className="initiatives-grid">
                        <div className="initiative-card">
                            <div className="initiative-icon">📡</div>
                            <h3>{t('landing.digitalAmhara')}</h3>
                            <p>{t('landing.digitalAmharaDesc')}</p>
                        </div>
                        <div className="initiative-card">
                            <div className="initiative-icon">💻</div>
                            <h3>{t('landing.codeInitiative')}</h3>
                            <p>{t('landing.codeInitiativeDesc')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div id="about" className="about-section">
                <h2>{t('landing.aboutUs')}</h2>
                <div className="about-grid">
                    <div className="about-card">
                        <h3>{t('landing.ourMission')}</h3>
                        <p>{t('landing.missionDescription')}</p>
                    </div>
                    <div className="about-card">
                        <h3>{t('landing.whyJoinUs')}</h3>
                        <p>{t('landing.whyJoinDescription')}</p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Landing;
