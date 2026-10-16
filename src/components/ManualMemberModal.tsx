import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Member } from '../types';
import { X, UserPlus, Phone, Mail, Shield, Shirt, Camera, AlertCircle } from 'lucide-react';

interface ManualMemberModalProps {
  memberToEdit?: Member | null;
  onClose: () => void;
}

export const ManualMemberModal: React.FC<ManualMemberModalProps> = ({ memberToEdit, onClose }) => {
  const { createManualMember, updateManualMember } = useApp();

  const isEditMode = !!memberToEdit;

  const [name, setName] = useState(memberToEdit ? memberToEdit.fullName || memberToEdit.nickname : '');
  const [whatsapp, setWhatsapp] = useState(memberToEdit ? memberToEdit.whatsapp || memberToEdit.phone || '' : '');
  const [email, setEmail] = useState(memberToEdit?.email || '');
  const [position, setPosition] = useState<Member['position']>(memberToEdit?.position || 'Gelandang');
  const [jerseyNumber, setJerseyNumber] = useState<string>(
    memberToEdit && memberToEdit.jerseyNumber !== undefined ? String(memberToEdit.jerseyNumber) : ''
  );
  const [photo, setPhoto] = useState(memberToEdit?.photo || '');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>(memberToEdit?.status || 'Aktif');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = name.trim();
    const cleanWhatsapp = whatsapp.trim();

    if (!cleanName) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }

    if (!cleanWhatsapp) {
      setErrorMsg('Nomor WhatsApp wajib diisi.');
      return;
    }

    const parsedJersey = jerseyNumber.trim() ? parseInt(jerseyNumber.trim(), 10) : 0;
    if (jerseyNumber.trim() && (isNaN(parsedJersey) || parsedJersey < 0 || parsedJersey > 99)) {
      setErrorMsg('Nomor punggung harus antara 0 - 99.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditMode && memberToEdit) {
        await updateManualMember(memberToEdit.id, {
          nickname: cleanName,
          fullName: cleanName,
          whatsapp: cleanWhatsapp,
          phone: cleanWhatsapp,
          email: email.trim() || undefined,
          position,
          jerseyNumber: parsedJersey,
          photo: photo.trim() || undefined,
          status,
        });
      } else {
        await createManualMember({
          name: cleanName,
          whatsapp: cleanWhatsapp,
          email: email.trim() || undefined,
          position,
          jerseyNumber: parsedJersey,
          photo: photo.trim() || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan data.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#071A33] text-base">
                {isEditMode ? 'Edit Anggota Manual' : 'Tambah Anggota Manual'}
              </h3>
              <p className="text-xs text-gray-500">
                {isEditMode
                  ? 'Perbarui data anggota resmi komunitas'
                  : 'Anggota resmi komunitas tanpa membutuhkan akun login'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Info Box */}
        {!isEditMode && (
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900 mb-3 flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Khusus Anggota Manual:</strong> Anggota ini langsung terdaftar sebagai <strong>MEMBER resmi</strong> komunitas untuk pertandingan, presensi, kas, dan jersey, tanpa perlu akun login aplikasi MABOL.
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 space-y-3.5 flex-1">
          {/* Nama Lengkap (WAJIB) */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Bapa Ujang / H. Asep Sunandar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-hidden focus:border-[#1261FF] focus:bg-white transition-all"
            />
          </div>

          {/* Nomor WhatsApp (WAJIB) */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1">
              Nomor WhatsApp <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="tel"
                required
                placeholder="081234567890"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-hidden focus:border-[#1261FF] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Email (OPSIONAL) */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1">
              Email <span className="text-gray-400 font-normal text-[11px]">(Opsional)</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-hidden focus:border-[#1261FF] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Posisi & Nomor Punggung (OPSIONAL) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-gray-700 mb-1">
                Posisi Utama <span className="text-gray-400 font-normal text-[11px]">(Opsional)</span>
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Member['position'])}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-hidden focus:border-[#1261FF]"
              >
                <option value="Gelandang">Gelandang</option>
                <option value="Penyerang">Penyerang</option>
                <option value="Bek">Bek</option>
                <option value="Kiper">Kiper</option>
                <option value="All-Rounder">All-Rounder</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 mb-1">
                No. Punggung <span className="text-gray-400 font-normal text-[11px]">(Opsional)</span>
              </label>
              <div className="relative">
                <Shirt className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="0"
                  max="99"
                  placeholder="Contoh: 10"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-hidden focus:border-[#1261FF]"
                />
              </div>
            </div>
          </div>

          {/* Foto (OPSIONAL) */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1">
              URL Foto / Avatar <span className="text-gray-400 font-normal text-[11px]">(Opsional)</span>
            </label>
            <div className="relative">
              <Camera className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="url"
                placeholder="https://example.com/foto.jpg"
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:border-[#1261FF]"
              />
            </div>
          </div>

          {/* Status (Hanya saat edit) */}
          {isEditMode && (
            <div>
              <label className="block text-xs font-extrabold text-gray-700 mb-1">
                Status Keanggotaan
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('Aktif')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    status === 'Aktif'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  Aktif
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Nonaktif')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    status === 'Nonaktif'
                      ? 'bg-red-50 text-red-600 border-red-300 shadow-xs'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  Nonaktif
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs transition-colors cursor-pointer"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#1261FF] hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'MENYIMPAN...' : isEditMode ? 'SIMPAN PERUBAHAN' : 'TAMBAH ANGGOTA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
