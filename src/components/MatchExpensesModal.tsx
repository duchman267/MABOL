import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Match, ExpenseCategory } from '../types';
import { formatRupiah, calculateMatchFinances } from '../services/financialService';
import { X, Plus, Trash2, DollarSign, Tag, Award, Receipt } from 'lucide-react';

interface MatchExpensesModalProps {
  match: Match;
  onClose: () => void;
}

export const MatchExpensesModal: React.FC<MatchExpensesModalProps> = ({ match, onClose }) => {
  const {
    expenses,
    addExpense,
    deleteExpense,
    addOns,
    addAddOn,
    deleteAddOn,
    sponsors,
    matchSponsorships,
    addMatchSponsorship,
    payments,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'expenses' | 'addons' | 'sponsors'>('expenses');

  // Form expense
  const [expName, setExpName] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Lapangan');
  const [expAmount, setExpAmount] = useState<number>(0);

  // Form add-on
  const [addOnName, setAddOnName] = useState('');
  const [addOnCategory, setAddOnCategory] = useState('Konsumsi');
  const [addOnQty, setAddOnQty] = useState(1);
  const [addOnPrice, setAddOnPrice] = useState(0);

  // Form sponsor
  const [selectedSponsorId, setSelectedSponsorId] = useState(sponsors[0]?.id || '');
  const [sponsorAmount, setSponsorAmount] = useState(100000);

  const matchExpenses = expenses.filter((e) => e.matchId === match.id);
  const matchAddOns = addOns.filter((a) => a.matchId === match.id);
  const currentMatchSponsors = matchSponsorships.filter((s) => s.matchId === match.id);

  // Perhitungan Keuangan Real-time
  const summary = calculateMatchFinances(match, payments, expenses, addOns, matchSponsorships);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expName.trim() || expAmount <= 0) return;
    addExpense({
      matchId: match.id,
      category: expCategory,
      name: expName.trim(),
      quantity: 1,
      unitPrice: expAmount,
      total: expAmount,
      paidAt: new Date().toISOString(),
    });
    setExpName('');
    setExpAmount(0);
  };

  const handleAddAddOn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addOnName.trim() || addOnPrice <= 0) return;
    addAddOn({
      matchId: match.id,
      name: addOnName.trim(),
      category: addOnCategory.trim(),
      quantity: addOnQty,
      unitPrice: addOnPrice,
      total: addOnQty * addOnPrice,
    });
    setAddOnName('');
    setAddOnPrice(0);
    setAddOnQty(1);
  };

  const handleAddSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSponsorId || sponsorAmount <= 0) return;
    addMatchSponsorship({
      matchId: match.id,
      sponsorId: selectedSponsorId,
      amount: sponsorAmount,
      paymentStatus: 'Sudah Bayar',
      paidAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
          <div>
            <h3 className="font-bold text-[#071A33] text-base">Biaya, Add-On & Sponsor</h3>
            <p className="text-xs text-gray-500">{match.title}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ringkasan Finansial Singkat */}
        <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100 mb-3 text-center">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase">Pendapatan</div>
            <div className="text-xs font-black text-emerald-600">{formatRupiah(summary.totalRevenue)}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase">Pengeluaran</div>
            <div className="text-xs font-black text-red-500">{formatRupiah(summary.totalExpenses)}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase">Hasil</div>
            <div
              className={`text-xs font-black ${
                summary.isSurplus ? 'text-[#1261FF]' : summary.isDeficit ? 'text-amber-600' : 'text-gray-600'
              }`}
            >
              {summary.isSurplus
                ? `+${formatRupiah(summary.surplusAmount)}`
                : summary.isDeficit
                ? `-${formatRupiah(summary.deficitAmount)}`
                : 'Rp 0'}
            </div>
          </div>
        </div>

        {/* Tab Navigasi */}
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1 mb-3">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'expenses' ? 'bg-white text-[#1261FF] shadow-xs' : 'text-gray-500'
            }`}
          >
            Pengeluaran ({matchExpenses.length})
          </button>
          <button
            onClick={() => setActiveTab('addons')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'addons' ? 'bg-white text-[#1261FF] shadow-xs' : 'text-gray-500'
            }`}
          >
            Add-On ({matchAddOns.length})
          </button>
          <button
            onClick={() => setActiveTab('sponsors')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'sponsors' ? 'bg-white text-[#1261FF] shadow-xs' : 'text-gray-500'
            }`}
          >
            Sponsor ({currentMatchSponsors.length})
          </button>
        </div>

        {/* Konten Tab */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-3">
          {/* TAB PENGELUARAN */}
          {activeTab === 'expenses' && (
            <div className="space-y-3">
              <form onSubmit={handleAddExpense} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                <div className="text-xs font-bold text-gray-700">Tambah Pengeluaran Match</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nama (Sewa Lapangan, dll)"
                    value={expName}
                    onChange={(e) => setExpName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                  />
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="Lapangan">Lapangan</option>
                    <option value="Photographer">Photographer</option>
                    <option value="Operasional">Operasional</option>
                    <option value="Add-on">Add-on</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    step="5000"
                    placeholder="Nominal (Rp)"
                    value={expAmount || ''}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#1261FF] text-white text-xs font-bold rounded-lg hover:bg-blue-700"
                  >
                    Tambah
                  </button>
                </div>
              </form>

              <div className="space-y-1.5">
                {matchExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-2.5 bg-white border border-gray-100 rounded-xl"
                  >
                    <div>
                      <div className="font-bold text-xs text-[#071A33]">{exp.name}</div>
                      <div className="text-[10px] text-gray-400">{exp.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-red-500">
                        {formatRupiah(exp.total)}
                      </span>
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB ADD-ONS */}
          {activeTab === 'addons' && (
            <div className="space-y-3">
              <form onSubmit={handleAddAddOn} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                <div className="text-xs font-bold text-gray-700">Tambah Add-On Khusus (Air, Snack, dll)</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nama item (cth: Air Mineral 2 Galon)"
                    value={addOnName}
                    onChange={(e) => setAddOnName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Kategori (cth: Konsumsi)"
                    value={addOnCategory}
                    onChange={(e) => setAddOnCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] text-gray-400 block">Jumlah</label>
                    <input
                      type="number"
                      min="1"
                      value={addOnQty}
                      onChange={(e) => setAddOnQty(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 block">Harga Satuan</label>
                    <input
                      type="number"
                      step="1000"
                      value={addOnPrice || ''}
                      onChange={(e) => setAddOnPrice(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-1.5 bg-[#1261FF] text-white text-xs font-bold rounded-lg hover:bg-blue-700"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-1.5">
                {matchAddOns.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between p-2.5 bg-white border border-gray-100 rounded-xl"
                  >
                    <div>
                      <div className="font-bold text-xs text-[#071A33]">{addon.name}</div>
                      <div className="text-[10px] text-gray-400">
                        {addon.quantity} × {formatRupiah(addon.unitPrice)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-red-500">
                        {formatRupiah(addon.total)}
                      </span>
                      <button
                        onClick={() => deleteAddOn(addon.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB SPONSOR */}
          {activeTab === 'sponsors' && (
            <div className="space-y-3">
              <form onSubmit={handleAddSponsor} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                <div className="text-xs font-bold text-gray-700">Hubungkan Sponsor Pertandingan</div>
                <div>
                  <select
                    value={selectedSponsorId}
                    onChange={(e) => setSelectedSponsorId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                  >
                    {sponsors.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="10000"
                    placeholder="Nominal Sponsor (Rp)"
                    value={sponsorAmount || ''}
                    onChange={(e) => setSponsorAmount(Number(e.target.value))}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
                  >
                    Simpan Sponsor
                  </button>
                </div>
              </form>

              <div className="space-y-1.5">
                {currentMatchSponsors.map((ms) => {
                  const spInfo = sponsors.find((s) => s.id === ms.sponsorId);
                  return (
                    <div
                      key={ms.id}
                      className="flex items-center justify-between p-2.5 bg-white border border-gray-100 rounded-xl"
                    >
                      <div>
                        <div className="font-bold text-xs text-[#071A33]">{spInfo?.name || 'Sponsor'}</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">{ms.paymentStatus}</div>
                      </div>
                      <span className="font-extrabold text-xs text-emerald-600">
                        +{formatRupiah(ms.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};
