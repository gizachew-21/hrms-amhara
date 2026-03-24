import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import Navbar from './Navbar';
import './Login.css';

// Import the background image
const loginBackground = '/images/image_324fa1.jpg';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: '60px' }}>
      <Navbar />
      <div className="login-container" style={{ backgroundImage: `url(${loginBackground})` }}>
        <div className="login-overlay"></div>
        <div className="login-box">
          <h1>{t('login.organizationName')}</h1>
          <h2>{t('login.title')}</h2>

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

            <button type="submit" disabled={loading}>
              {loading ? t('login.loggingIn') : t('login.loginButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
