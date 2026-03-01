import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'operator' | 'viewer';
  email?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('blackv_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // Try backend authentication first
      const response = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      const userData: User = {
        id: data.id,
        username: data.username,
        role: data.role,
        email: data.email,
      };

      setUser(userData);
      localStorage.setItem('blackv_user', JSON.stringify(userData));
      localStorage.setItem('blackv_token', data.token);
      
      toast.success('Login successful');
      navigate('/');
    } catch (error) {
      // Fallback: Default admin credentials when backend is unavailable
      if (username === 'admin' && password === 'admin') {
        const defaultAdmin: User = {
          id: 'admin-001',
          username: 'admin',
          role: 'admin',
          email: 'admin@blackv.local',
        };
        
        setUser(defaultAdmin);
        localStorage.setItem('blackv_user', JSON.stringify(defaultAdmin));
        localStorage.setItem('blackv_token', 'dev-token-admin');
        
        toast.success('Login successful (offline mode)');
        navigate('/');
        return;
      }
      
      toast.error('Login failed: Invalid credentials');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('blackv_user');
    localStorage.removeItem('blackv_token');
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const hasRole = (role: string) => {
    if (!user) return false;
    if (role === 'admin') return user.role === 'admin';
    if (role === 'operator') return user.role === 'admin' || user.role === 'operator';
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
