import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_URL = "http://localhost:5000/api/auth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [dbUsers, setDbUsers] = useState([]);
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));

  const saveToken = (newToken) => {
    if (newToken) {
      localStorage.setItem('accessToken', newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem('accessToken');
      setToken(null);
    }
  };

  const authFetch = async (url, options = {}) => {
    const currentToken = token || localStorage.getItem('accessToken');
    const headers = {
      ...(options.headers || {}),
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
    };
    return fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
  };

  const fetchDbUsers = async () => {
    try {
      const res = await authFetch(`${API_URL}/users`, {
        method: "GET"
      });
      if (res.status === 401) {
        setUser(null);
        setDbUsers([]);
        return;
      }
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.users) {
          setDbUsers(result.data.users);
        }
      }
    } catch (err) {
      console.error("Failed to fetch database users:", err);
    }
  };

  // Restore session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await authFetch(`${API_URL}/me`, {
          method: "GET"
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data?.user) {
            setUser(result.data.user);
            fetchDbUsers();
          }
        }
      } catch (err) {
        console.error("Session restoration failed:", err);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  // Sync database users to allUsers
  useEffect(() => {
    setAllUsers(dbUsers);
  }, [dbUsers]);

  const login = async (email, password) => {
    try {
      const res = await authFetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Login failed");
      }

      setUser(result.data.user);
      if (result.data?.token) saveToken(result.data.token);
      fetchDbUsers();
      return result.data.user;
    } catch (err) {
      throw new Error(err.message || "Connection to authentication server failed");
    }
  };

  const register = async (email, name, password, phone) => {
    try {
      const res = await authFetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, name, password, phone })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Registration failed");
      }

      setUser(result.data.user);
      if (result.data?.token) saveToken(result.data.token);
      fetchDbUsers();
      return result.data.user;
    } catch (err) {
      throw new Error(err.message || "Connection to authentication server failed");
    }
  };


  const logout = async () => {
    try {
      await authFetch(`${API_URL}/logout`, {
        method: "POST"
      });
    } catch (err) {
      console.error("Logout request failed on server:", err);
    } finally {
      saveToken(null);
      setUser(null);
      setDbUsers([]);
    }
  };

  const verifyEmail = async (code) => {
    const email = user?.email || sessionStorage.getItem('pendingVerificationEmail');
    if (!email) {
      throw new Error("Session expired. Please register again.");
    }
    try {
      const res = await authFetch(`${API_URL}/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, code })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Verification failed");
      }

      setUser(result.data.user);
      sessionStorage.removeItem('pendingVerificationEmail');
      return result.data.user;
    } catch (err) {
      throw new Error(err.message || "Connection to authentication server failed");
    }
  };

  const resendVerification = async () => {
    const email = user?.email || sessionStorage.getItem('pendingVerificationEmail');
    if (!email) {
      throw new Error("No user session found. Please register again.");
    }
    try {
      const res = await authFetch(`${API_URL}/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Resending failed");
      }

      return result;
    } catch (err) {
      throw new Error(err.message || "Connection to authentication server failed");
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await authFetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to send reset code");
      }
      return result;
    } catch (err) {
      throw new Error(err.message || "Connection to authentication server failed");
    }
  };

  const resetPassword = async (email, code, password) => {
    try {
      const res = await authFetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, code, password })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to reset password");
      }
      return result;
    } catch (err) {
      throw new Error(err.message || "Connection to authentication server failed");
    }
  };

  const updateProfile = async (formData) => {
    try {
      const res = await authFetch(`${API_URL}/update-profile`, {
        method: "PUT",
        body: formData
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to update profile");
      }

      if (result.success && result.data?.user) {
        setUser(result.data.user);
        setAllUsers(users => users.map(u => u.id === result.data.user.id || u.email === result.data.user.email ? result.data.user : u));
        return result.data.user;
      }
    } catch (err) {
      throw new Error(err.message || "Connection to authentication server failed");
    }
  };

  const updateUserSettings = (category, settings) => {
    setUser(prev => {
      if (!prev) return null;
      const updatedUser = {
        ...prev,
        settings: {
          ...prev.settings,
          [category]: {
            ...prev.settings?.[category],
            ...settings
          }
        }
      };
      setAllUsers(users => users.map(u => u.id === prev.id ? updatedUser : u));
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, allUsers, token, authFetch, login, register, logout, verifyEmail, resendVerification, forgotPassword, resetPassword, updateProfile, updateUserSettings, fetchDbUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
