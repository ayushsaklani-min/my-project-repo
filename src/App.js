import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('landing');

  const handleLaunchApp = () => {
    setCurrentView('dashboard');
  };

  return (
    <>
      {currentView === 'landing' ? (
        <LandingPage onLaunchApp={handleLaunchApp} />
      ) : (
        <Dashboard />
      )}
    </>
  );
}

export default App;
