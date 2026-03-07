import { useState, useEffect } from 'react';
import { ChatProvider, useChatContext } from './components/ChatContext';
import { ToastProvider, useToast } from './components/ToastContext';
import { LandingPage } from './components/LandingPage';
import { GuestChat } from './components/GuestChat';
import { ChatLayout } from './components/ChatLayout';
import { AuthModal } from './components/AuthModal';

function AppContent() {
  const { isAuthenticated, login } = useChatContext();
  const { showToast } = useToast();
  const [appState, setAppState] = useState<'landing' | 'guest' | 'authenticated'>('guest');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleStart = () => {
    setAppState('guest');
  };

  const handleLearnMore = () => {
    setAppState('landing');
  };

  const handleLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleSignup = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleAuth = (email: string, password: string, name?: string, id?: string) => {
    login(email, name || email.split('@')[0], id || '');
    setShowAuthModal(false);
    setAppState('authenticated');
    showToast(`Welcome ${name || email.split('@')[0]}!`, 'success');
  };

  // Sync application state with authentication status
  useEffect(() => {
    if (!isAuthenticated) {
      setAppState('guest');
    } else {
      setAppState('authenticated');
    }
  }, [isAuthenticated]);

  const handleSwitchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
  };

  if (appState === 'landing') {
    return <LandingPage onStart={handleStart} />;
  }

  if (appState === 'guest') {
    return (
      <>
        <GuestChat onLogin={handleLogin} onSignup={handleSignup} onLearnMore={handleLearnMore} />
        <AuthModal
          isOpen={showAuthModal}
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onAuth={handleAuth}
          onSwitchMode={handleSwitchAuthMode}
        />
      </>
    );
  }

  return <ChatLayout />;
}

export default function App() {
  return (
    <ChatProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ChatProvider>
  );
}