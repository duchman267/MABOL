import React from 'react';
import { Home, Calendar, Wallet, Gamepad2, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';

export type NavTab = 'home' | 'matches' | 'finance' | 'game' | 'community';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { isAdmin, pendingMembershipCount } = useApp();

  const tabs = [
    { id: 'home' as NavTab, label: 'HOME', icon: Home },
    { id: 'matches' as NavTab, label: 'PERTANDINGAN', icon: Calendar },
    { id: 'finance' as NavTab, label: 'KEUANGAN', icon: Wallet },
    { id: 'game' as NavTab, label: 'GAME', icon: Gamepad2 },
    { id: 'community' as NavTab, label: 'KOMUNITAS', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'community' && isAdmin && pendingMembershipCount > 0;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all relative ${
                isActive
                  ? 'text-[#1261FF] font-black scale-105'
                  : 'text-gray-400 hover:text-gray-600 font-semibold'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all relative ${
                  isActive ? 'bg-blue-50 text-[#1261FF]' : 'text-gray-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
                    {pendingMembershipCount > 9 ? '9+' : pendingMembershipCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
