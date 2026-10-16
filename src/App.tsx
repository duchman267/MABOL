/**
 * MABOL — Master Football Community Management Platform
 * Platform Manajemen Sepak Bola Komunitas Modern
 * Komunitas Pertama: Cornerkick17 OLAHGAYA
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { SupportOfMatchModal } from './components/SupportOfMatchModal';
import { HomeScreen } from './screens/HomeScreen';
import { MatchesScreen } from './screens/MatchesScreen';
import { FinanceScreen } from './screens/FinanceScreen';
import { PenaltyGameScreen } from './screens/PenaltyGameScreen';
import { CommunityScreen } from './screens/CommunityScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { NoCommunityScreen } from './screens/NoCommunityScreen';

function AppContent() {
  const { authLoading, userProfile, userMemberships } = useApp();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  // 1. Loading State: Do not flash dashboard before auth is resolved
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#071A33] to-[#1261FF] flex items-center justify-center shadow-xl shadow-blue-500/20 animate-pulse">
            <span className="text-2xl font-black text-white">⚽</span>
          </div>
        </div>
        <h2 className="text-lg font-black text-[#071A33] tracking-tight">MABOL</h2>
        <p className="text-xs text-gray-400 mt-1 font-medium">Memuat data autentikasi...</p>
      </div>
    );
  }

  // 2. Unauthenticated State: Show Login or Register Screen
  if (!userProfile) {
    if (authScreen === 'register') {
      return <RegisterScreen onSwitchToLogin={() => setAuthScreen('login')} />;
    }
    return <LoginScreen onSwitchToRegister={() => setAuthScreen('register')} />;
  }

  // 3. Authenticated without Community: Show No-Community Onboarding
  if (userMemberships.length === 0) {
    return <NoCommunityScreen />;
  }

  // 4. Authenticated with Community: Render Protected Dashboard
  return (
    <div className="min-h-screen bg-[#F5F8FC] text-[#071A33] flex flex-col items-center">
      {/* Container Mobile-First Maksimal Lebar (Responsive Smartphone & Desktop Frame) */}
      <div className="w-full max-w-md min-h-screen bg-[#F5F8FC] flex flex-col shadow-2xl relative border-x border-gray-100/80">
        {/* Header Tetap */}
        <Header />

        {/* Konten Halaman Aktif */}
        <main className="flex-1 px-4 py-4 overflow-y-auto">
          {activeTab === 'home' && <HomeScreen onNavigateTab={setActiveTab} />}
          {activeTab === 'matches' && <MatchesScreen />}
          {activeTab === 'finance' && <FinanceScreen />}
          {activeTab === 'game' && <PenaltyGameScreen />}
          {activeTab === 'community' && <CommunityScreen />}
        </main>

        {/* Navigasi Bawah Tetap */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Modal Apresiasi SUPPORT OF THE MATCH */}
        <SupportOfMatchModal />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
