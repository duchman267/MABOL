import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Match, MatchStatus } from '../types';
import { X, Calendar, Clock, MapPin, DollarSign, Camera, Users, CheckCircle2 } from 'lucide-react';

interface CreateMatchModalProps {
  initialMatch?: Match;
  onClose: () => void;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({ initialMatch, onClose }) => {
  const { activeCommunity, currentUser, createMatch, updateMatch } = useApp();

  const [title, setTitle] = useState(initialMatch?.title || 'Main Bareng Cornerkick17');
  const [date, setDate] = useState(initialMatch?.date || new Date().toISOString().split('T')[0]);
  const [kickoffTime, setKickoffTime] = useState(initialMatch?.kickoffTime || '18:30');
  const [endTime, setEndTime] = useState(initialMatch?.endTime || '21:00');
  const [venue, setVenue] = useState(initialMatch?.venue || 'Baleendah Stadium');
  const [address, setAddress] = useState(
    initialMatch?.address || 'Jl. Adipati Agung No. 17, Baleendah, Kab. Bandung'
  );
  const [mapUrl, setMapUrl] = useState(initialMatch?.mapUrl || 'https://maps.google.com');
  const [standardFee, setStandardFee] = useState<number>(initialMatch?.standardFee || 35000);
  const [playerQuota, setPlayerQuota] = useState<number>(initialMatch?.playerQuota || 24);
  const [status, setStatus] = useState<MatchStatus>(initialMatch?.status || 'Aktif');
  const [cancellationDeadline, setCancellationDeadline] = useState(
    initialMatch?.cancellationDeadline || `${date}T15:00`
  );
  const [notes, setNotes] = useState(
    initialMatch?.notes || 'Harap hadir 30 menit sebelum kick-off. Wajib bawa jersey dan pelindung kaki.'
  );

  // Fotografer / Media
  const [photographerAvailable, setPhotographerAvailable] = useState<boolean>(
    initialMatch?.photographerAvailable ?? true
  );
  const [photographerName, setPhotographerName] = useState(
    initialMatch?.photographerName || 'Kang Igun Visuals'
  );
  const [photographerFee, setPhotographerFee] = useState<number>(
    initialMatch?.photographerFee || 150000
  );
  const [albumUrl, setAlbumUrl] = useState(initialMatch?.albumUrl || '');

  // Rekening Bank
  const [paymentBankName, setPaymentBankName] = useState(initialMatch?.paymentBankName || 'BCA');
  const [paymentAccountNumber, setPaymentAccountNumber] = useState(
    initialMatch?.paymentAccountNumber || '7770123456'
  );
  const [paymentAccountHolder, setPaymentAccountHolder] = useState(
    initialMatch?.paymentAccountHolder || 'Dicky Maulana Zayn'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      communityId: activeCommunity.id,
      title: title.trim(),
      date,
      kickoffTime,
      endTime,
      venue: venue.trim(),
      address: address.trim(),
      mapUrl: mapUrl.trim() || undefined,
      standardFee,
      playerQuota,
      status,
      cancellationDeadline,
      notes: notes.trim() || undefined,
      createdBy: currentUser.name,
      photographerAvailable,
      photographerName: photographerAvailable ? photographerName.trim() : undefined,
      photographerFee: photographerAvailable ? photographerFee : 0,
      albumUrl: albumUrl.trim() || undefined,
      paymentBankName: paymentBankName.trim() || undefined,
      paymentAccountNumber: paymentAccountNumber.trim() || undefined,
      paymentAccountHolder: paymentAccountHolder.trim() || undefined,
    };

    if (initialMatch) {
      updateMatch(initialMatch.id, payload);
    } else {
      createMatch(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div>
            <h3 className="font-bold text-[#071A33] text-base">
              {initialMatch ? 'Edit Data Pertandingan' : 'Buat Pertandingan Baru'}
            </h3>
            <p className="text-xs text-gray-500">{activeCommunity.name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto space-y-4 pr-1 flex-1">
          {/* Judul Pertandingan */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Judul / Nama Pertandingan</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-[#1261FF]"
            />
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kick-off</label>
              <input
                type="time"
                required
                value={kickoffTime}
                onChange={(e) => setKickoffTime(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Selesai</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800"
              />
            </div>
          </div>

          {/* Venue & Alamat */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lapangan / Venue</label>
            <input
              type="text"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#1261FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Lapangan</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-[#1261FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tautan Google Maps</label>
            <input
              type="url"
              placeholder="https://maps.google.com/..."
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-[#1261FF]"
            />
          </div>

          {/* HTM & Kuota */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Standar HTM (Rp)</label>
              <input
                type="number"
                min="0"
                step="5000"
                required
                value={standardFee}
                onChange={(e) => setStandardFee(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-extrabold text-[#071A33]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kuota Peserta</label>
              <input
                type="number"
                min="6"
                max="60"
                required
                value={playerQuota}
                onChange={(e) => setPlayerQuota(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-extrabold text-[#071A33]"
              />
            </div>
          </div>

          {/* Batas Waktu Pembatalan */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Batas Pembatalan (Cancellation Deadline)
            </label>
            <input
              type="datetime-local"
              required
              value={cancellationDeadline}
              onChange={(e) => setCancellationDeadline(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
            />
          </div>

          {/* Status Pertandingan */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Status Pertandingan</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Draft', 'Aktif', 'Selesai'] as MatchStatus[]).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                    status === st
                      ? 'bg-blue-50 border-[#1261FF] text-[#1261FF]'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Seksi Fotografer / Media */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#1261FF]" />
                Fotografer & Media Pertandingan
              </span>
              <button
                type="button"
                onClick={() => setPhotographerAvailable(!photographerAvailable)}
                className={`text-xs font-bold px-2 py-0.5 rounded-lg border transition-all ${
                  photographerAvailable
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-gray-100 text-gray-500 border-gray-300'
                }`}
              >
                {photographerAvailable ? 'Ada Fotografer' : 'Tidak Ada'}
              </button>
            </div>

            {photographerAvailable && (
              <div className="space-y-2 bg-gray-50 p-3 rounded-2xl border border-gray-100 animate-fade-in">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Nama Fotografer</label>
                    <input
                      type="text"
                      placeholder="Kang Igun"
                      value={photographerName}
                      onChange={(e) => setPhotographerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Biaya (Rp)</label>
                    <input
                      type="number"
                      step="10000"
                      value={photographerFee}
                      onChange={(e) => setPhotographerFee(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Tautan Album Foto (Google Photos / Drive)</label>
                  <input
                    type="url"
                    placeholder="https://photos.google.com/..."
                    value={albumUrl}
                    onChange={(e) => setAlbumUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Seksi Rekening Transfer */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Info Rekening Transfer Anggota</label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Bank (BCA)"
                value={paymentBankName}
                onChange={(e) => setPaymentBankName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
              <input
                type="text"
                placeholder="No Rekening"
                value={paymentAccountNumber}
                onChange={(e) => setPaymentAccountNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
              <input
                type="text"
                placeholder="Nama Pemilik"
                value={paymentAccountHolder}
                onChange={(e) => setPaymentAccountHolder(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          {/* Catatan / Aturan */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Pertandingan</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-[#1261FF]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-[#1261FF] hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/20"
            >
              {initialMatch ? 'SIMPAN PERUBAHAN' : status === 'Aktif' ? 'TERBITKAN PERTANDINGAN' : 'SIMPAN DRAFT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
