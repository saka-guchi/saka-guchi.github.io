import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { StudyPage } from './pages/StudyPage';
import { ResultPage } from './pages/ResultPage';
import { SettingsPage } from './pages/SettingsPage';
import { FinalChallengePage } from './pages/FinalChallengePage';
import { ensureBuiltinPackLoaded } from './db';

export const App: React.FC = () => {
  useEffect(() => {
    ensureBuiltinPackLoaded();
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/final-challenge" element={<FinalChallengePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

