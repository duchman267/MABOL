import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Match, AttendanceStatus, PaymentMethod, PaymentStatus, RsvpStatus } from '../types';
import { parseWhatsAppList, ParsedWhatsAppItem } from '../utils/whatsappParser';
import { formatRupiah } from '../services/financialService';
import { X, FileText, CheckCircle2, AlertCircle, ArrowRight, UserPlus } from 'lucide-react';

interface WhatsAppImportModalProps {
  match: Match;
  onClose: () => void;
}

export const WhatsAppImportModal: React.FC<WhatsAppImportModalProps> = ({ match, onClose }) => {
  const { members, importWhatsAppParticipants } = useApp();

  const [rawText, setRawText] = useState<string>(
    `1. xherdan ✅tf\n2. Ghaisan✅tf\n3. Hamba alloh✅\n4. Abah ✅\n5. Mang perang`
  );

  const [step, setStep] = useState<'input' | 'review'>('input');
  const [parsedItems, setParsedItems] = useState<ParsedWhatsAppItem[]>([]);

  // Langkah 1: TINJAU DATA
  const handleReview = () => {
    if (!rawText.trim()) return;
    const parsed = parseWhatsAppList(rawText, members, match.standardFee);
    setParsedItems(parsed);
    setStep('review');
  };

  // Modifikasi item di tabel review jika admin ingin menyesuaikan
  const updateParsedItem = (index: number, updates: Partial<ParsedWhatsAppItem>) => {
    setParsedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  // Langkah 2: SIMPAN
  const handleSave = () => {
    importWhatsAppParticipants(match.id, parsedItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-5 max-w-lg w-full shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#071A33] text-base">Import Peserta dari WhatsApp</h3>
              <p className="text-xs text-gray-500">Otomatis deteksi kehadiran & status transfer/tunai</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tahap Input */}
        {step === 'input' && (
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-xs text-blue-800 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Panduan Format Chat WA:
              </div>
              <div>• <span className="font-semibold">Nama ✅tf</span> ➔ Hadir, Sudah Bayar (Transfer)</div>
              <div>• <span className="font-semibold">Nama ✅</span> ➔ Hadir, Sudah Bayar (Tunai)</div>
              <div>• <span className="font-semibold">Nama tanpa tanda</span> ➔ Menunggu, Belum Bayar</div>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tempel (Paste) Daftar Peserta dari WhatsApp
              </label>
              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Contoh:&#10;1. Xherdan ✅tf&#10;2. Ghaisan ✅tf&#10;3. Hamba alloh ✅&#10;4. Abah ✅&#10;5. Mang perang"
                className="w-full flex-1 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono text-gray-800 focus:outline-hidden focus:border-[#1261FF] resize-none"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={handleReview}
                className="flex-1 py-3 bg-[#1261FF] hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                <span>TINJAU DATA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tahap Review (TINJAU DATA) */}
        {step === 'review' && (
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                Terdeteksi <span className="font-bold text-[#071A33]">{parsedItems.length}</span> peserta. Periksa hasil sebelum disimpan.
              </div>
              <button
                onClick={() => setStep('input')}
                className="text-xs text-[#1261FF] font-bold hover:underline"
              >
                Ubah Teks Input
              </button>
            </div>

            <div className="overflow-y-auto flex-1 border border-gray-100 rounded-2xl divide-y divide-gray-100 bg-gray-50/50">
              {parsedItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-white hover:bg-gray-50/80 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}.</span>
                      <span className="font-extrabold text-sm text-[#071A33]">{item.name}</span>
                      {item.isGuest ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Guest
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#1261FF] border border-blue-200">
                          Anggota
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {/* Kehadiran */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-0.5">Kehadiran</label>
                      <select
                        value={item.attendanceStatus}
                        onChange={(e) =>
                          updateParsedItem(idx, {
                            attendanceStatus: e.target.value as AttendanceStatus,
                            rsvpStatus: e.target.value === 'Hadir' ? 'Ikut' : 'Menunggu',
                          })
                        }
                        className="w-full py-1 px-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold"
                      >
                        <option value="Hadir">Hadir</option>
                        <option value="Belum Dicek">Belum Dicek</option>
                        <option value="Tidak Hadir">Tidak Hadir</option>
                      </select>
                    </div>

                    {/* Pembayaran */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-0.5">Bayar</label>
                      <select
                        value={item.paymentStatus}
                        onChange={(e) =>
                          updateParsedItem(idx, {
                            paymentStatus: e.target.value as PaymentStatus,
                            paymentAmount: e.target.value === 'Sudah Bayar' ? match.standardFee : 0,
                          })
                        }
                        className="w-full py-1 px-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold"
                      >
                        <option value="Sudah Bayar">Sudah Bayar</option>
                        <option value="Belum Bayar">Belum Bayar</option>
                      </select>
                    </div>

                    {/* Metode */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-0.5">Metode</label>
                      <select
                        value={item.paymentMethod}
                        onChange={(e) =>
                          updateParsedItem(idx, { paymentMethod: e.target.value as PaymentMethod })
                        }
                        className="w-full py-1 px-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold"
                      >
                        <option value="Transfer">Transfer</option>
                        <option value="Tunai">Tunai</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="flex-1 py-3 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl"
              >
                KEMBALI
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-3 bg-[#16A34A] hover:bg-green-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-green-600/20 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>SIMPAN KE MATCH</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
