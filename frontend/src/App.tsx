import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Notification from './components/Notification/Notification';
import HomePage from './pages/HomePage/HomePage';
import AuthPage from './pages/AuthPage/AuthPage';
import VerificationPage from './pages/VerificationPage/VerificationPage';
import EditorPage from './pages/EditorPage/EditorPage';
import HackathonPage from './pages/HackathonPage/HackathonPage';
import Footer from './components/Footer/Footer';
import AboutPage from './pages/AboutPage/AboutPage';
import UserPage from './pages/UserPage/UserPage';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';
import { loginUser, registerUser, verifyEmail, getCurrentUser } from './services/apiService';
import './App.css';

interface UserData {
  username: string;
  email: string;
  user_id: number;
}

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const navigate = useNavigate();
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);

  const showNotification = useCallback((message: string, severity: 'success' | 'error') => {
    setNotification({ open: true, message, severity });
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    showNotification('Вы успешно вышли из системы', 'success');
    navigate('/');
  }, [navigate, showNotification]);

  const handleVerifyTokenFromUrl = useCallback(async (token: string) => {
    try {
      const response = await verifyEmail(token);
      if (response.success && response.data) {
        localStorage.setItem('access_token', response.data.access_token);
        setIsAuthenticated(true);
        setCurrentUser({
          username: response.data.username,
          email: response.data.email,
          user_id: response.data.user_id
        });
        setVerificationStatus('success');
        showNotification('Email успешно подтвержден! Вы автоматически вошли в систему.', 'success');
        window.history.replaceState(null, '', '/verify-email');
      } else {
        setVerificationStatus('error');
        showNotification(response.error || 'Ошибка при верификации email', 'error');
      }
    } catch (error) {
      setVerificationStatus('error');
      showNotification('Ошибка при верификации email', 'error');
    }
  }, [showNotification]);

  useEffect(() => {
    const handleTokenFromUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      
      if (urlParams.has('access_token')) {
        const access_token = urlParams.get('access_token')!;
        const username = urlParams.get('username')!;
        const email = urlParams.get('email')!;
        const user_id = parseInt(urlParams.get('user_id')!);

        localStorage.setItem('access_token', access_token);
        setIsAuthenticated(true);
        setCurrentUser({ username, email, user_id });
        setVerificationStatus('success');
        window.history.replaceState({}, '', '/verify-email');
      } 
      else if (urlParams.has('status') && urlParams.get('status') === 'error') {
        setVerificationStatus('error');
        showNotification(urlParams.get('message') || 'Ошибка верификации', 'error');
        window.history.replaceState({}, '', '/verify-email');
      }
    };

    handleTokenFromUrl();
  }, [showNotification]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await getCurrentUser(token);
          if (response.success && response.data) {
            setIsAuthenticated(true);
            setCurrentUser({
              username: response.data.username,
              email: response.data.email,
              user_id: response.data.user_id
            });
          } else {
            handleLogout();
          }
        } catch (error) {
          handleLogout();
        }
      }
    };
    checkAuth();
  }, [handleLogout]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verificationToken = urlParams.get('token');
    
    if (verificationToken) {
      handleVerifyTokenFromUrl(verificationToken);
    }
  }, [handleVerifyTokenFromUrl]);

  useEffect(() => {
    if (location.state?.refresh) {
      setRefreshKey(prev => prev + 1);
    }
  }, [location.state]);

  const handleLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await loginUser({ email, password });
      if (response.success && response.data) {
        localStorage.setItem('access_token', response.data.access_token);
        
        const userResponse = await getCurrentUser(response.data.access_token);
        if (userResponse.success && userResponse.data) {
          setIsAuthenticated(true);
          setCurrentUser({
            username: userResponse.data.username,
            email: userResponse.data.email,
            user_id: userResponse.data.user_id
          });
          
          showNotification('Вход выполнен успешно', 'success');
          navigate('/');
          return true;
        }
      }
      return false;
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Ошибка входа',
        'error'
      );
      return false;
    }
  }, [navigate, showNotification]);

  const handleRegister = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await registerUser({ email, password });
      if (response.success) {
        navigate('/verify-email', { state: { email } });
        setVerificationStatus('pending');
        return true;
      }
      return false;
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Ошибка регистрации',
        'error'
      );
      return false;
    }
  }, [navigate, showNotification]);

  return (
    <div className="app-container">
      <Header 
        isAuthenticated={isAuthenticated} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
      />
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage key={refreshKey} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route 
            path="/auth" 
            element={<AuthPage 
              onLogin={handleLogin} 
              onRegister={handleRegister} 
            />} 
          />
          <Route 
            path="/verify-email" 
            element={
              <VerificationPage 
                status={verificationStatus}
                email={currentUser?.email}
              />
            } 
          />
          <Route path="/user/:userId?" element={<UserPage />} />
          <Route 
            path="/editor" 
            element={<EditorPage />} 
          />
          <Route path="/hackathon/:id" element={<HackathonPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />

      {notification.open && (
        <Notification
          message={notification.message}
          type={notification.severity}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          autoClose={5000}
        />
      )}
    </div>
  );
}

function App() {
  /*
  // При монтировании приложения
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();

    // Удаление всех куки
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    console.log('Кеш очищен при запуске приложения');
  }, []);
  */

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;