import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle, Eye, EyeOff, HelpCircle, X } from 'lucide-react';

interface LoginScreenProps {
  onSwitchToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSwitchToRegister }) => {
  const { login } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Email wajib diisi.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Format email tidak valid.');
      return;
    }

    if (!password) {
      setErrorMessage('Kata sandi wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    try {
      setLoading(true);
      await login(cleanEmail, password);
      // Login sukses akan mengubah state sesi di AppContext
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal masuk. Periksa email dan kata sandi Anda.');
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
          Masuk Akun
        </span>
      </div>

      {/* Main Content Area */}
      <div className="my-auto py-6 space-y-6">
        {/* Brand Headline & Tagline */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#071A33] to-[#1261FF] flex items-center justify-center shadow-xl shadow-blue-600/20 mx-auto mb-3">
            <span className="text-2xl font-black text-white">⚽</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#071A33]">Masuk ke MABOL</h1>
          <p className="text-xs font-bold text-[#1261FF]">
            "Maen Bola. Bayar. Hadir. Beres."
          </p>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Kelola pertandingan, kehadiran, kas, jersey, dan komunitas dalam satu aplikasi.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Form Login Manual */}
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">Kata Sandi</label>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="text-[11px] font-semibold text-[#1261FF] hover:underline cursor-pointer"
              >
                Lupa kata sandi?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Masukkan kata sandi"
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
            <div className="text-[11px] text-gray-400 mt-1.5 flex items-center justify-between">
              <span>Lupa kata sandi? Hubungi Admin Komunitas.</span>
            </div>
          </div>

          {/* Tombol Submit Masuk */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-[#1261FF] hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-xs tracking-wider uppercase rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>MASUK</span>
            )}
          </button>
        </form>

        {/* Link ke Registrasi */}
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            Belum punya akun?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-bold text-[#1261FF] hover:underline cursor-pointer"
            >
              Daftar
            </button>
          </p>
        </div>
      </div>

      {/* Modal Bantuan Lupa Kata Sandi */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-gray-100 animate-scale-up text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1261FF] flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-[#071A33] text-base mb-2">Lupa Kata Sandi?</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-5">
              Demi keamanan akun, silakan hubungi <strong>Admin Komunitas</strong> secara langsung untuk verifikasi identitas dan bantuan pemulihan akses akun Anda.
            </p>
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 px-4 bg-[#1261FF] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-center text-[11px] text-gray-400 pb-2">
        MABOL • Multi-Community Football Management
      </div>
    </div>
  );
};
