import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import DateDisplay from './DateDisplay';
import './PublicJobs.css';

const PublicJobs = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);

    // Email verification modal state
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [emailInput, setEmailInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState('');

    useEffect(() => {
        fetchVacancies();
    }, []);

    const fetchVacancies = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/vacancies?status=published');
            const activeVacancies = (res.data.data || []).filter(vacancy => {
                const deadlineDate = new Date(vacancy.applicationDeadline).toISOString().split('T')[0];
                const todayDate = new Date().toISOString().split('T')[0];
                return deadlineDate >= todayDate;
            });
            setVacancies(activeVacancies);
        } catch (error) {
            console.error('Error fetching vacancies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyClick = (job) => {
        if (job.vacancyType === 'internal') {
            // Show email verification modal
            setSelectedJob(job);
            setEmailInput('');
            setPasswordInput('');
            setVerifyError('');
            setShowEmailModal(true);
        } else {
            navigate(`/apply/${job._id}`);
        }
    };

    const handleEmailVerify = async (e) => {
        e.preventDefault();
        setVerifying(true);
        setVerifyError('');
        try {
            const res = await axios.post('/api/employees/verify-member', { email: emailInput, password: passwordInput });
            if (res.data.isMember) {
                setShowEmailModal(false);
                navigate(`/apply/${selectedJob._id}`, { state: { verifiedEmployee: true } });
            } else if (res.data.wrongPassword) {
                setVerifyError(t('jobs.wrongPassword'));
            } else {
                setVerifyError(t('jobs.notAITBMember'));
            }
        } catch (error) {
            setVerifyError(t('jobs.notAITBMember'));
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="public-jobs-page">
            <Navbar />
            <div className="jobs-container">
                <header className="jobs-header">
                    <h1>{t('jobs.title')}</h1>
                    <p>{t('jobs.subtitle')}</p>
                    <div style={{ marginTop: '20px' }}>
                        <Link to="/status" style={{ color: '#667eea', fontWeight: 'bold', textDecoration: 'none' }}>
                            {t('jobs.alreadyApplied')}
                        </Link>
                    </div>
                </header>

                {loading ? (
                    <div className="loading">{t('jobs.loadingPositions')}</div>
                ) : (
                    <div className="jobs-list">
                        {vacancies.length === 0 ? (
                            <div className="no-jobs"><p>{t('jobs.noVacancies')}</p></div>
                        ) : (
                            vacancies.map(job => (
                                <div key={job._id} className="job-card">
                                    <div className="job-card-header">
                                        <h2>{job.title}</h2>
                                        <span className={`vacancy-type type-${job.vacancyType}`}>
                                            {t(`jobs.${job.vacancyType}`, job.vacancyType).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="job-meta">
                                        <span><strong>{t('jobs.department')}:</strong> {job.department?.name || 'AITB'}</span>
                                        <span><strong>{t('jobs.position')}:</strong> {job.position}</span>
                                        <span><strong>{t('jobs.deadline')}:</strong> <DateDisplay date={job.applicationDeadline} format="short" /></span>
                                    </div>
                                    <div className="job-description"><p>{job.description}</p></div>
                                    {job.requirements && (
                                        <div className="job-requirements">
                                            <p><strong>{t('jobs.education')}:</strong> {job.requirements.education}</p>
                                            <p><strong>{t('jobs.experience')}:</strong> {job.requirements.experience}</p>
                                        </div>
                                    )}
                                    <div className="job-actions">
                                        <button className="btn-apply" onClick={() => handleApplyClick(job)}>
                                            {t('jobs.applyNow')}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Email Verification Modal for Internal Jobs */}
            {showEmailModal && (
                <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
                    <div className="email-verify-modal" onClick={e => e.stopPropagation()}>
                        <div className="email-verify-header">
                            <span className="internal-badge">🔒 {t('jobs.internal')}</span>
                            <h3>{t('jobs.verifyMembership')}</h3>
                            <p>{t('jobs.verifyMembershipDesc')}</p>
                        </div>
                        <form onSubmit={handleEmailVerify} className="email-verify-form">
                            <label>{t('jobs.enterEmail')}</label>
                            <input
                                type="email"
                                value={emailInput}
                                onChange={e => { setEmailInput(e.target.value); setVerifyError(''); }}
                                placeholder="yourname@aitb.gov.et"
                                required
                                autoFocus
                            />
                            <label>{t('login.password')}</label>
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={e => { setPasswordInput(e.target.value); setVerifyError(''); }}
                                placeholder="••••••••"
                                required
                            />
                            {verifyError && (
                                <div className="verify-error">❌ {verifyError}</div>
                            )}
                            <div className="email-verify-actions">
                                <button type="button" className="btn-cancel-verify" onClick={() => setShowEmailModal(false)}>
                                    {t('common.cancel')}
                                </button>
                                <button type="submit" className="btn-verify" disabled={verifying}>
                                    {verifying ? '...' : t('jobs.verify')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicJobs;
