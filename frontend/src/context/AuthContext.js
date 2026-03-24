import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const res = await axios.get('/api/auth/me');
        setUser(res.data.user);
        setLoading(false);
        return; // Success, exit function
      } catch (error) {
        // If error is 401 (Unauthorized), the token is invalid.
        // Stop retrying and log out immediately.
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          break;
        }

        // For other errors (500, network error), wait and retry
        retries++;
        if (retries >= maxRetries) {
          console.error('Failed to fetch user after retries:', error);
          // Optional: Don't clear token here, effectively keeping the user "logged in" 
          // (in terms of token presence) but with no user data.
          // Or we can choose to logout if even retries fail. 
          // Given the "morning" issue, we likely don't want to logout on timeout.
          // However, if we don't logout, the app might be in a weird state (token but no user object).
          // But RequireAuthOrLanding checks checks (!user).
          // So the user will see Landing page anyway.

          // Let's keep the token to allow manual refresh to work without re-entering credentials
          // provided the server eventually comes up.
        } else {
          // Wait 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user);
      return res.data.user;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
