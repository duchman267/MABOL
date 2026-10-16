import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Shield,
  User as UserIcon,
  ChevronDown,
  Users,
  RefreshCw,
  Plus,
  CheckCircle2,
  X,
  LogOut,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    userProfile,
    logout,
    currentUser,
    currentMember,
    isAdmin,
    users,
    switchUser,
    activeCommunity,
    communities,
    switchCommunity,
    createCommunity,
    notifications,
    markNotificationAsRead,
    resetDemoData,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCommunityMenu, setShowCommunityMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showNewCommunityModal, setShowNewCommunityModal] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');

  const unreadNotifs = notifications.filter((n) => !n.read);

  const handleCreateCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommName.trim()) return;
    createCommunity({
      name: newCommName.trim(),
      description: newCommDesc.trim() || 'Komunitas sepak bola',
      primaryColor: '#1261FF',
    });
    setNewCommName('');
    setNewCommDesc('');
    setShowNewCommunityModal(false);
    setShowCommunityMenu(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Sisi Kiri: Sapaan & Komunitas */}
          <div className="flex items-center gap-3">
            {/* Logo Slot (Dapat diganti dengan logo resmi Cornerkick17) */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1261FF] to-[#071A33] flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20 shrink-0">
              {activeCommunity.logo ? (
                <img
                  src={activeCommunity.logo}
                  alt={activeCommunity.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <span>CK17</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowCommunityMenu(true)}
                  className="group flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#1261FF] transition-colors"
                >
                  <span className="truncate max-w-[140px] text-left">{activeCommunity.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#1261FF]" />
                </button>

                {isAdmin ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#1261FF] border border-blue-200">
                    <Shield className="w-2.5 h-2.5" />
                    ADMIN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">
                    MEMBER
                  </span>
                )}
              </div>

              <h1 className="text-base font-extrabold text-[#071A33] leading-tight flex items-center gap-1">
                Hallo, {currentMember ? currentMember.nickname : currentUser.name.split(' ')[0]} 👋
              </h1>
            </div>
          </div>

          {/* Sisi Kanan: Notifikasi & Switcher Akun */}
          <div className="flex items-center gap-1.5">
            {/* Tombol Notifikasi */}
            <button
              onClick={() => setShowNotifMenu(true)}
              className="relative p-2 rounded-2xl text-gray-600 hover:bg-gray-100 active:scale-95 transition-all"
              aria-label="Notifikasi"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Tombol Switcher Pengguna */}
            <button
              onClick={() => setShowUserMenu(true)}
              className="flex items-center gap-1.5 p-1.5 pl-2 pr-2.5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-blue-300 text-xs font-semibold text-[#071A33] transition-all"
              title="Ganti Pengguna Demo"
            >
              <div className="w-6 h-6 rounded-full bg-[#1261FF] text-white flex items-center justify-center font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <span className="hidden xs:inline truncate max-w-[70px]">
                {currentMember?.nickname || currentUser.name.split(' ')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Modal Switch Pengguna & Profil Akun */}
      {showUserMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div>
                <h3 className="font-bold text-[#071A33] text-base">Profil & Akun</h3>
                <p className="text-xs text-gray-500">Informasi pengguna & peran komunitas</p>
              </div>
              <button
                onClick={() => setShowUserMenu(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profil Pengguna Terautentikasi */}
            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 mb-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1261FF] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-sm text-[#071A33] truncate">
                    {userProfile?.name || currentUser.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{userProfile?.email || currentUser.email}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-blue-200/60 text-xs">
                <span className="text-gray-600 font-medium">Peran di {activeCommunity.name}:</span>
                <span
                  className={`font-black px-2 py-0.5 rounded-md text-[10px] ${
                    isAdmin
                      ? 'bg-[#1261FF] text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {isAdmin ? 'ADMIN' : 'ANGGOTA'}
                </span>
              </div>
            </div>

            {/* Tombol Keluar (Log Out) */}
            <button
              onClick={() => {
                setShowUserMenu(false);
                logout();
              }}
              className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors mb-3 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>

            {/* Simulasi Demo & Switch Akun (Requirement 7 & 18) */}
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Simulasi Demo (Development)
            </div>

            <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
              {users.map((u) => {
                const isSelected = u.id === currentUser.id;
                const isUserAdmin = u.email === 'dickymaulanazayn@gmail.com' || u.id === 'user-admin';

                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setShowUserMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-2 border-[#1261FF] text-[#1261FF]'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent text-[#071A33]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isSelected ? 'bg-[#1261FF] text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          {u.name}
                          {isUserAdmin && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-[#1261FF]">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500">{u.email}</div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#1261FF]" />}
                  </button>
                );
              })}
            </div>

            {/* Quick Demo Reset */}
            <div className="mt-3 pt-2.5 border-t border-gray-100">
              <button
                onClick={() => {
                  if (confirm('Kembalikan semua data pertandingan, anggota, dan kas ke data bawaan?')) {
                    resetDemoData();
                    setShowUserMenu(false);
                  }
                }}
                className="w-full py-2 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-[11px] font-semibold text-gray-600 flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Data Demo Awal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Switch Komunitas (Multi-Community) */}
      {showCommunityMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div>
                <h3 className="font-bold text-[#071A33] text-base">Pilih Komunitas</h3>
                <p className="text-xs text-gray-500">MABOL mendukung banyak komunitas sepak bola</p>
              </div>
              <button
                onClick={() => setShowCommunityMenu(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {communities.map((c) => {
                const isSelected = c.id === activeCommunity.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      switchCommunity(c.id);
                      setShowCommunityMenu(false);
                    }}
                    className={`w-full p-3.5 rounded-2xl text-left border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-[#1261FF] bg-blue-50 text-[#1261FF]'
                        : 'border-gray-200 hover:border-gray-300 text-gray-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">{c.name}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">{c.description}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-[#1261FF] shrink-0" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setShowCommunityMenu(false);
                setShowNewCommunityModal(true);
              }}
              className="w-full py-2.5 px-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-[#1261FF] border border-blue-100 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Komunitas Baru</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Tambah Komunitas */}
      {showNewCommunityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-[#071A33] text-base mb-1">Daftarkan Komunitas Baru</h3>
            <p className="text-xs text-gray-500 mb-4">Buat ruang komunitas baru di platform MABOL</p>

            <form onSubmit={handleCreateCommunity} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Komunitas</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sangkuriang FC"
                  value={newCommName}
                  onChange={(e) => setNewCommName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-[#1261FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi atau slogan komunitas..."
                  value={newCommDesc}
                  onChange={(e) => setNewCommDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-[#1261FF]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCommunityModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-[#1261FF] hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20"
                >
                  SIMPAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Notifikasi */}
      {showNotifMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#1261FF]" />
                <h3 className="font-bold text-[#071A33] text-base">Notifikasi Komunitas</h3>
              </div>
              <button
                onClick={() => setShowNotifMenu(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">Belum ada notifikasi baru</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      n.read ? 'bg-white border-gray-100 text-gray-600' : 'bg-blue-50/60 border-blue-200 text-[#071A33]'
                    }`}
                  >
                    <div className="font-bold text-xs mb-0.5">{n.title}</div>
                    <div className="text-xs text-gray-600 leading-relaxed">{n.message}</div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
