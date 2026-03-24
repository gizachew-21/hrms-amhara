import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LoginModal from './LoginModal';
import LanguageSwitcher from './LanguageSwitcher';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [justLoggedOut, setJustLoggedOut] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close modal whenever user state changes (login/logout)
    React.useEffect(() => {
        setIsLoginModalOpen(false);
        if (!user) {
            setJustLoggedOut(true);
            // Clear the flag after 1 second
            setTimeout(() => setJustLoggedOut(false), 1000);
        }
    }, [user]);

    // Close modal on any navigation
    React.useEffect(() => {
        setIsLoginModalOpen(false);
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogoClick = () => {
        setIsLoginModalOpen(false);
        setIsMobileMenuOpen(false);
        if (window.location.pathname === '/') {
            // If already on home page, scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            navigate('/');
        }
    };

    const handleHomeClick = () => {
        setIsLoginModalOpen(false);
        setIsMobileMenuOpen(false);
        if (window.location.pathname === '/') {
            // If already on home page, scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            navigate('/');
        }
    };

    const handleJobsClick = () => {
        setIsLoginModalOpen(false);
        setIsMobileMenuOpen(false);
        navigate('/jobs');
    };

    const onLogout = () => {
        setIsLoginModalOpen(false); // Close modal before logout
        setIsMobileMenuOpen(false);
        logout();
        // Use setTimeout to ensure state is cleared before navigation
        setTimeout(() => {
            navigate('/', { replace: true });
        }, 0);
    };

    const handleAboutClick = (e) => {
        e.preventDefault();
        
        // Close login modal if it's open
        setIsLoginModalOpen(false);
        setIsMobileMenuOpen(false);

        if (window.location.pathname !== '/') {
            navigate('/', { replace: true });
            // Wait for navigation to complete before scrolling
            setTimeout(() => {
                const aboutSection = document.getElementById('about');
                if (aboutSection) {
                    aboutSection.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        } else {
            const aboutSection = document.getElementById('about');
            if (aboutSection) {
                aboutSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-container">
                    <div className="navbar-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
                        <img src="/images/aitb-logo.png" alt="AITB" className="navbar-logo-img" />
                    </div>

                    {/* Hamburger Menu Button */}
                    <button 
                        className="hamburger-menu" 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
                        <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
                        <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
                    </button>

                    {/* Desktop Navigation */}
                    <div className="nav-menu">
                        <span onClick={handleHomeClick} className="nav-item" style={{ cursor: 'pointer' }}>{t('nav.home')}</span>
                        <a href="#about" onClick={handleAboutClick} className="nav-item">{t('nav.about')}</a>
                        <span onClick={handleJobsClick} className="nav-item" style={{ cursor: 'pointer' }}>{t('nav.jobs')}</span>
                    </div>
                    <div className="nav-right">
                        <LanguageSwitcher />
                        {user ? (
                            <>
                                <Link to="/dashboard" className="nav-item">{t('sidebar.dashboard')}</Link>
                                <span className="nav-item" onClick={onLogout} style={{ cursor: 'pointer' }}>{t('nav.logout')}</span>
                            </>
                        ) : (
                            <span
                                className="nav-item"
                                onClick={() => {
                                    if (!justLoggedOut) {
                                        setIsLoginModalOpen(true);
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                {t('nav.login')}
                            </span>
                        )}
                    </div>

                    {/* Mobile Menu */}
                    <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                        <span onClick={handleHomeClick} className="mobile-menu-item">{t('nav.home')}</span>
                        <a href="#about" onClick={handleAboutClick} className="mobile-menu-item">{t('nav.about')}</a>
                        <span onClick={handleJobsClick} className="mobile-menu-item">{t('nav.jobs')}</span>
                        <div className="mobile-menu-divider"></div>
                        <div className="mobile-menu-lang">
                            <LanguageSwitcher />
                        </div>
                        {user ? (
                            <>
                                <Link to="/dashboard" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>{t('sidebar.dashboard')}</Link>
                                <span className="mobile-menu-item" onClick={onLogout}>{t('nav.logout')}</span>
                            </>
                        ) : (
                            <span
                                className="mobile-menu-item"
                                onClick={() => {
                                    if (!justLoggedOut) {
                                        setIsLoginModalOpen(true);
                                        setIsMobileMenuOpen(false);
                                    }
                                }}
                            >
                                {t('nav.login')}
                            </span>
                        )}
                    </div>
                </div>
            </nav>
            {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />
        </>
    );
};

export default Navbar;
