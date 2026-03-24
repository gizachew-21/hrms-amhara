import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Navbar from './Navbar';
import StatusBadge from './StatusBadge';
import DateDisplay from './DateDisplay';
import './ApplicationStatus.css';

const ApplicationStatus = () => {
    const { t } = useTranslation();
    const [appNumber, setAppNumber] = useState('');
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!appNumber.trim()) return;

        setLoading(true);
        setError('');
        setStatusData(null);

        try {
            const res = await axios.get(`/api/applicants/status/${appNumber.trim()}`);
            setStatusData(res.data.data);
        } catch (err) {
            console.error('Error fetching status:', err);
            setError(err.response?.data?.error || t('status.applicationNotFound'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="status-page">
            <Navbar />
            <div className="status-container">
                <header className="status-header">
                    <h1>{t('appStatus.title')}</h1>
                    <p>{t('appStatus.subtitle')}</p>
                </header>

                <div className="search-box">
                    <form onSubmit={handleSearch}>
                        <input
                            type="text"
                            placeholder={t('appStatus.enterAppNumber')}
                            value={appNumber}
                            onChange={(e) => setAppNumber(e.target.value)}
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? t('appStatus.searching') : t('appStatus.checkStatus')}
                        </button>
                    </form>
                </div>

                {error && <div className="status-error">{error}</div>}

                {statusData && (
                    <div className="status-result">
                        <div className="result-card">
                            <div className="result-header">
                                <h2>{t('appStatus.applicationFound')}</h2>
                                <StatusBadge status={statusData.status} />
                            </div>
                            <div className="result-grid">
                                <div className="result-item">
                                    <label>{t('appStatus.applicantName')}</label>
                                    <div>{statusData.fullName}</div>
                                </div>
                                <div className="result-item">
                                    <label>{t('appStatus.appliedVacancy')}</label>
                                    <div>{statusData.vacancy}</div>
                                </div>
                                <div className="result-item">
                                    <label>{t('appStatus.appliedDate')}</label>
                                    <div><DateDisplay date={statusData.appliedAt} format="full" /></div>
                                </div>
                                <div className="result-item">
                                    <label>{t('appStatus.applicationId')}</label>
                                    <div>{statusData.applicationNumber}</div>
                                </div>
                            </div>

                            <div className="status-timeline">
                                <h3>{t('appStatus.recruitmentProgress')}</h3>
                                <div className="timeline">
                                    <div className={`timeline-item completed`}>
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-content">
                                            <h4>{t('appStatus.applicationSubmitted')}</h4>
                                            <p>{t('appStatus.applicationSubmittedDesc')}</p>
                                        </div>
                                    </div>
                                    {(statusData.status === 'shortlisted' || statusData.status === 'hired') && (
                                        <div className="timeline-item completed">
                                            <div className="timeline-dot"></div>
                                            <div className="timeline-content">
                                                <h4>{t('appStatus.shortlisted')}</h4>
                                                <p>{t('appStatus.shortlistedDesc')}</p>
                                            </div>
                                        </div>
                                    )}
                                    {statusData.status === 'hired' && (
                                        <div className="timeline-item completed">
                                            <div className="timeline-dot"></div>
                                            <div className="timeline-content">
                                                <h4>{t('appStatus.hired')}</h4>
                                                <p>{t('appStatus.hiredDesc')}</p>
                                            </div>
                                        </div>
                                    )}
                                    {statusData.status === 'rejected' && (
                                        <div className="timeline-item rejected">
                                            <div className="timeline-dot"></div>
                                            <div className="timeline-content">
                                                <h4>{t('appStatus.applicationClosed')}</h4>
                                                <p>{t('appStatus.applicationClosedDesc')}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApplicationStatus;
