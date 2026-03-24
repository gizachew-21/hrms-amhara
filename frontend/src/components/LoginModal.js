import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import './LoginModal.css';

const LoginModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // Reset form when modal closes
    React.useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setPassword('');
            setError('');
        }
    }, [isOpen]);

    // Close modal on Escape key
    React.useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            onClose(); // Close modal on success
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || t('login.loginFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>&times;</button>
                <div className="login-box-modal">
                    <h2>{t('login.loginButton')}</h2>
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>{t('login.email')}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder={t('login.enterEmail')}
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('login.password')}</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder={t('login.enterPassword')}
                            />
                        </div>
                        <button type="submit" disabled={loading} className="login-btn">
                            {loading ? t('login.loggingIn') : t('login.loginButton')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
