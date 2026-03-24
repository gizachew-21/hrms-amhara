import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import EthiopianDatePicker from './EthiopianDatePicker';
import './ApplicationForm.css';

const ApplicationForm = () => {
    const { t } = useTranslation();
    const { vacancyId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [vacancy, setVacancy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    const [applicationNumber, setApplicationNumber] = useState('');
    const [dragActive, setDragActive] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        email: '',
        phoneNumber: '',
        address: {
            city: ''
        },
        education: [{
            level: '',
            fieldOfStudy: '',
            institution: '',
            graduationYear: ''
        }]
    });
    const [resume, setResume] = useState(null);

    useEffect(() => {
        const fetchVacancy = async () => {
            try {
                const res = await axios.get(`/api/vacancies/${vacancyId}`);
                const vacancyData = res.data.data;

                // Block internal vacancies unless employee verified
                if (vacancyData.vacancyType === 'internal' && !location.state?.verifiedEmployee) {
                    navigate('/jobs');
                    return;
                }

                setVacancy(vacancyData);
            } catch (error) {
                console.error('Error fetching vacancy:', error);
                alert('Vacancy not found or no longer available.');
                navigate('/jobs');
            } finally {
                setLoading(false);
            }
        };
        fetchVacancy();
    }, [vacancyId, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type !== 'application/pdf') {
            alert(t('application.uploadPDF'));
            e.target.value = '';
            return;
        }
        setResume(file);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type !== 'application/pdf') {
                alert(t('application.uploadPDF'));
                return;
            }
            setResume(file);
        }
    };

    const handleFileInputClick = () => {
        document.getElementById('resume-input').click();
    };

    const handleEducationChange = (index, e) => {
        const { name, value } = e.target;
        const newEducation = [...formData.education];
        newEducation[index][name] = value;
        setFormData(prev => ({ ...prev, education: newEducation }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!resume) {
            alert(t('application.uploadResume'));
            return;
        }

        try {
            setSubmitting(true);

            const data = new FormData();
            // Append basic fields
            Object.keys(formData).forEach(key => {
                if (typeof formData[key] === 'object') {
                    data.append(key, JSON.stringify(formData[key]));
                } else {
                    data.append(key, formData[key]);
                }
            });

            data.append('vacancy', vacancyId);
            data.append('resume', resume);

            const res = await axios.post('/api/applicants', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setApplicationNumber(res.data.data.applicationNumber);
            setSubmissionSuccess(true);
        } catch (error) {
            console.error('Error submitting application:', error);
            const errorMessage = error.response?.data?.error || 'Failed to submit application. Please check your details.';
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading">{t('application.loadingForm')}</div>;

    if (submissionSuccess) {
        return (
            <div className="application-page">
                <Navbar />
                <div className="form-container">
                    <div className="success-card">
                        <div className="success-icon">✓</div>
                        <h1>{t('application.successTitle')}</h1>
                        <p>{t('application.successMessage')} <strong>{vacancy?.title}</strong>.</p>

                        <div className="app-number-box">
                            <label>{t('application.applicationNumber')}</label>
                            <div className="number-display">
                                <code>{applicationNumber}</code>
                                <button className="btn-copy" onClick={() => {
                                    navigator.clipboard.writeText(applicationNumber);
                                    alert(t('application.numberCopied'));
                                }}>{t('application.copy')}</button>
                            </div>
                        </div>

                        <div className="success-info">
                            <p><strong>{t('application.saveNumber')}</strong> {t('application.trackInfo')}</p>
                        </div>

                        <div className="success-actions">
                            <button className="btn-track" onClick={() => navigate('/status')}>{t('application.trackNow')}</button>
                            <button className="btn-home" onClick={() => navigate('/')}>{t('application.returnHome')}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="application-page">
            <Navbar />
            <div className="form-container">
                <header className="form-header">
                    <h1>{t('application.title')}</h1>
                    {vacancy && (
                        <div className="vacancy-info">
                            <h2>{vacancy.title}</h2>
                            <p>{vacancy.department?.name} | {vacancy.vacancyNumber}</p>
                        </div>
                    )}
                </header>

                <form className="applicant-form" onSubmit={handleSubmit}>
                    <section className="form-section">
                        <h3>{t('application.personalInfo')}</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>{t('application.firstName')}</label>
                                <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>{t('application.middleName')}</label>
                                <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>{t('application.lastName')}</label>
                                <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>{t('application.dateOfBirth')}</label>
                                <EthiopianDatePicker
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('application.gender')}</label>
                                <select name="gender" required value={formData.gender} onChange={handleChange}>
                                    <option value="">{t('application.selectGender')}</option>
                                    <option value="male">{t('application.male')}</option>
                                    <option value="female">{t('application.female')}</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <h3>{t('application.contactInfo')}</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>{t('application.email')}</label>
                                <input type="email" name="email" required value={formData.email} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>{t('application.phone')}</label>
                                <input type="tel" name="phoneNumber" required value={formData.phoneNumber} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>{t('application.city')}</label>
                                <input type="text" name="address.city" required value={formData.address.city} onChange={handleChange} />
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <h3>{t('application.educationInfo')}</h3>
                        {formData.education.map((edu, index) => (
                            <div key={index} className="form-grid education-row">
                                <div className="form-group">
                                    <label>{t('application.level')}</label>
                                    <select name="level" required value={edu.level} onChange={(e) => handleEducationChange(index, e)}>
                                        <option value="">{t('application.selectLevel')}</option>
                                        <option value="diploma">{t('application.diploma')}</option>
                                        <option value="bachelor">{t('application.bachelor')}</option>
                                        <option value="master">{t('application.master')}</option>
                                        <option value="phd">{t('application.phd')}</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{t('application.fieldOfStudy')}</label>
                                    <input type="text" name="fieldOfStudy" required value={edu.fieldOfStudy} onChange={(e) => handleEducationChange(index, e)} />
                                </div>
                                <div className="form-group">
                                    <label>{t('application.institution')}</label>
                                    <input type="text" name="institution" required value={edu.institution} onChange={(e) => handleEducationChange(index, e)} />
                                </div>
                                <div className="form-group">
                                    <label>{t('application.graduationYear')}</label>
                                    <input type="number" name="graduationYear" required min="1950" max={new Date().getFullYear()} value={edu.graduationYear} onChange={(e) => handleEducationChange(index, e)} />
                                </div>
                            </div>
                        ))}
                    </section>

                    <section className="form-section">
                        <h3>{t('application.documents')}</h3>
                        <div className="form-group">
                            <label>{t('application.resume')}</label>
                            <div 
                                className={`file-drop-zone ${dragActive ? 'drag-active' : ''} ${resume ? 'has-file' : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={handleFileInputClick}
                            >
                                <input
                                    id="resume-input"
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    required
                                    style={{ display: 'none' }}
                                />
                                <div className="drop-zone-content">
                                    <svg className="cloud-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M7 16C4.79086 16 3 14.2091 3 12C3 9.79086 4.79086 8 7 8C7.17645 8 7.35073 8.00858 7.52253 8.02533C8.19625 5.69009 10.3779 4 13 4C16.3137 4 19 6.68629 19 10C19 10.3438 18.9715 10.6813 18.9164 11.0103C20.7002 11.1737 22 12.6076 22 14.5C22 16.433 20.433 18 18.5 18H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M12 13V21M12 13L9 16M12 13L15 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    {resume ? (
                                        <div className="file-info">
                                            <p className="file-name">📄 {resume.name}</p>
                                            <p className="file-size">{(resume.size / 1024).toFixed(2)} KB</p>
                                            <p className="change-file">{t('application.changeFile')}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="drop-text">{t('application.dragDrop')}</p>
                                            <p className="drop-or">{t('application.or')}</p>
                                            <button type="button" className="browse-btn">{t('application.browseFiles')}</button>
                                            <p className="file-requirements">{t('application.fileRequirements')}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/jobs')}>{t('application.cancel')}</button>
                        <button type="submit" className="btn-submit" disabled={submitting}>
                            {submitting ? t('application.submitting') : t('application.submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApplicationForm;
