import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSwitchToLogin }) => {
  const { register } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [position, setPosition] = useState<'Kiper' | 'Bek' | 'Gelandang' | 'Penyerang' | 'All-Rounder'>('Gelandang');
  const [jerseyNumber, setJerseyNumber] = useState<number>(10);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validasi Sisi Klien
    if (!name.trim()) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Format email tidak valid.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password, {
        position,
        jerseyNumber: Number(jerseyNumber) || 10,
      });
      // Sesi dan pengajuan otomatis ke Cornerkick17 OLAHGAYA akan langsung diupdate via AppContext
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan saat pendaftaran.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#071A33] flex flex-col justify-between p-6 max-w-md mx-auto select-none">
      {/* Top Branding Bar */}
      <div className="pt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#1261FF] text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20">
            M
          </div>
          <span className="font-black text-lg tracking-tight text-[#071A33]">MABOL</span>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#1261FF] border border-blue-100">
          Daftar Akun Baru
        </span>
      </div>

      {/* Main Content Area */}
      <div className="my-auto py-4 space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-[#071A33]">Buat Akun MABOL</h1>
          <p className="text-xs text-gray-500">
            Daftar untuk mengelola pertandingan, kehadiran, dan komunitas sepak bola Anda.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Default Community Banner */}
        <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-center justify-between text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1261FF] text-white flex items-center justify-center font-bold text-xs shrink-0">
              CK
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-[#1261FF] tracking-wider uppercase">
                Komunitas Default
              </div>
              <div className="text-xs font-black text-[#071A33]">
                Cornerkick17 OLAHGAYA
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#1261FF]">
            comm-ck17
          </span>
        </div>

        {/* Form Pendaftaran */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              placeholder="Contoh: Pratama Arhan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-[#1261FF] rounded-2xl text-xs font-medium focus:outline-hidden transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-[#1261FF] rounded-2xl text-xs font-medium focus:outline-hidden transition-colors"
            />
          </div>

          {/* Kata Sandi */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Kata Sandi</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-[#1261FF] rounded-2xl text-xs font-medium focus:outline-hidden pr-10 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Konfirmasi Kata Sandi */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Konfirmasi Kata Sandi</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Ulangi kata sandi Anda"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-[#1261FF] rounded-2xl text-xs font-medium focus:outline-hidden transition-colors"
            />
          </div>

          {/* Posisi & Nomor Punggung */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Posisi Main</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as any)}
                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 focus:border-[#1261FF] rounded-2xl text-xs font-medium focus:outline-hidden transition-colors"
              >
                <option value="Gelandang">Gelandang</option>
                <option value="Penyerang">Penyerang</option>
                <option value="Bek">Bek</option>
                <option value="Kiper">Kiper</option>
                <option value="All-Rounder">All-Rounder</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Punggung</label>
              <input
                type="number"
                min="0"
                max="99"
                placeholder="Contoh: 10"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-[#1261FF] rounded-2xl text-xs font-medium focus:outline-hidden transition-colors"
              />
            </div>
          </div>

          {/* Tombol Submit Daftar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-[#1261FF] hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-xs tracking-wider uppercase rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>DAFTAR SEKARANG</span>
            )}
          </button>
        </form>

        {/* Link ke Login */}
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            Sudah punya akun?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-bold text-[#1261FF] hover:underline cursor-pointer"
            >
              Masuk
            </button>
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center text-[11px] text-gray-400 pb-2">
        MABOL • "Maen Bola. Bayar. Hadir. Beres."
      </div>
    </div>
  );
};
