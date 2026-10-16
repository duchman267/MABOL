import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah, calculateMatchFinances } from '../services/financialService';
import { CashCategory, CashTransactionType } from '../types';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Filter,
  DollarSign,
  Award,
  Calendar,
  Building,
  AlertCircle,
  X,
  Tag,
} from 'lucide-react';

export const FinanceScreen: React.FC = () => {
  const {
    activeCommunity,
    currentUser,
    isAdmin,
    communityCashBalance,
    cashTransactions,
    addCashTransaction,
    sponsors,
    addSponsor,
    matches,
    payments,
    expenses,
    addOns,
    matchSponsorships,
    participants,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ledger' | 'matches' | 'sponsors'>('ledger');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | CashCategory>('Semua');
  const [showAddTrxModal, setShowAddTrxModal] = useState(false);
  const [showAddSponsorModal, setShowAddSponsorModal] = useState(false);

  // Form Transaksi Kas
  const [trxType, setTrxType] = useState<CashTransactionType>('Pemasukan');
  const [trxCategory, setTrxCategory] = useState<CashCategory>('Operasional');
  const [trxAmount, setTrxAmount] = useState<number>(0);
  const [trxDesc, setTrxDesc] = useState('');

  // Form Sponsor
  const [spName, setSpName] = useState('');
  const [spContact, setSpContact] = useState('');
  const [spNotes, setSpNotes] = useState('');

  // Perhitungan Akumulasi Kas
  const communityTrx = cashTransactions.filter((t) => t.communityId === activeCommunity.id);

  let totalIncome = 0;
  let totalExpense = 0;
  for (const t of communityTrx) {
    if (t.type === 'Pemasukan') totalIncome += t.amount;
    else if (t.type === 'Pengeluaran') totalExpense += t.amount;
  }

  const filteredTrx = communityTrx.filter((t) => {
    if (categoryFilter === 'Semua') return true;
    return t.category === categoryFilter;
  });

  const handleCreateTrx = (e: React.FormEvent) => {
    e.preventDefault();
    if (trxAmount <= 0 || !trxDesc.trim()) return;

    addCashTransaction({
      communityId: activeCommunity.id,
      type: trxType,
      category: trxCategory,
      amount: trxAmount,
      description: trxDesc.trim(),
      date: new Date().toISOString(),
      createdBy: currentUser.name,
    });

    setTrxAmount(0);
    setTrxDesc('');
    setShowAddTrxModal(false);
  };

  const handleCreateSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spName.trim()) return;

    addSponsor({
      communityId: activeCommunity.id,
      name: spName.trim(),
      contact: spContact.trim() || undefined,
      notes: spNotes.trim() || undefined,
    });

    setSpName('');
    setSpContact('');
    setSpNotes('');
    setShowAddSponsorModal(false);
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#071A33]">Keuangan & Kas</h2>
          <p className="text-xs text-gray-500">Buku kas transparan untuk seluruh anggota</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddTrxModal(true)}
            className="py-2.5 px-3.5 bg-[#1261FF] hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>CATAT KAS</span>
          </button>
        )}
      </div>

      {/* Kartu Saldo Kas Komunitas Utama (Section 22, 23) */}
      <div className="bg-gradient-to-br from-[#071A33] via-[#0C2A52] to-[#1261FF] text-white p-5 rounded-3xl shadow-xl shadow-blue-900/20 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-1">
            Saldo Kas Komunitas ({activeCommunity.name})
          </div>
          <div className="text-3xl font-black tracking-tight text-white mb-4">
            {formatRupiah(communityCashBalance)}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-gray-300 font-semibold uppercase">Total Masuk</div>
                <div className="text-xs font-black text-emerald-400">
                  {formatRupiah(totalIncome)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-gray-300 font-semibold uppercase">Total Keluar</div>
                <div className="text-xs font-black text-red-400">
                  {formatRupiah(totalExpense)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'ledger' ? 'bg-white text-[#1261FF] shadow-xs' : 'text-gray-500'
          }`}
        >
          Buku Kas (Ledger)
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'matches' ? 'bg-white text-[#1261FF] shadow-xs' : 'text-gray-500'
          }`}
        >
          Finansial Match
        </button>
        <button
          onClick={() => setActiveTab('sponsors')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'sponsors' ? 'bg-white text-[#1261FF] shadow-xs' : 'text-gray-500'
          }`}
        >
          Sponsor Tim
        </button>
      </div>

      {/* TAB 1: BUKU KAS (LEDGER) */}
      {activeTab === 'ledger' && (
        <div className="space-y-3">
          {/* Filter Kategori */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {(['Semua', 'Match', 'Sponsor', 'Jersey', 'Operasional', 'Lainnya'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
                    categoryFilter === cat
                      ? 'bg-[#1261FF] text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          {/* List Transaksi */}
          <div className="space-y-2">
            {filteredTrx.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center text-gray-400 text-xs">
                Belum ada transaksi kas untuk kategori {categoryFilter}.
              </div>
            ) : (
              filteredTrx.map((trx) => (
                <div
                  key={trx.id}
                  className="bg-white p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        trx.type === 'Pemasukan'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-red-50 text-red-500'
                      }`}
                    >
                      {trx.type === 'Pemasukan' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-[#071A33] truncate">
                        {trx.description}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                        <span className="font-semibold text-gray-600">{trx.category}</span>
                        <span>•</span>
                        <span>
                          {new Date(trx.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span>•</span>
                        <span>oleh {trx.createdBy}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <div
                      className={`font-black text-xs ${
                        trx.type === 'Pemasukan' ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {trx.type === 'Pemasukan' ? '+' : '-'}
                      {formatRupiah(trx.amount)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FINANSIAL MATCH PER MATCH */}
      {activeTab === 'matches' && (
        <div className="space-y-3">
          {matches.map((m) => {
            const summary = calculateMatchFinances(
              m,
              payments,
              expenses,
              addOns,
              matchSponsorships,
              participants
            );

            return (
              <div key={m.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {m.status}
                    </span>
                    <h4 className="font-extrabold text-sm text-[#071A33] mt-1">{m.title}</h4>
                    <div className="text-xs text-gray-400">
                      {new Date(m.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                        summary.isSurplus
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : summary.isDeficit
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {summary.isSurplus
                        ? `SURPLUS +${formatRupiah(summary.surplusAmount)}`
                        : summary.isDeficit
                        ? `DEFISIT -${formatRupiah(summary.deficitAmount)}`
                        : 'IMPAS'}
                    </span>
                    {m.cashSettled && (
                      <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                        ✓ Masuk Kas
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-2xl">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">
                      Pendapatan Match
                    </span>
                    <span className="font-bold text-emerald-600">
                      {formatRupiah(summary.totalRevenue)}
                    </span>
                    <span className="text-[10px] text-gray-400 block">
                      ({summary.totalPlayersPaid} pemain bayar)
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">
                      Pengeluaran Match
                    </span>
                    <span className="font-bold text-red-500">
                      {formatRupiah(summary.totalExpenses)}
                    </span>
                    <span className="text-[10px] text-gray-400 block">
                      (Lapangan, foto, dll)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: DAFTAR SPONSOR TIM */}
      {activeTab === 'sponsors' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">
              Mitra & Sponsor Komunitas ({sponsors.length})
            </span>
            {isAdmin && (
              <button
                onClick={() => setShowAddSponsorModal(true)}
                className="text-xs font-bold text-[#1261FF] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Sponsor</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {sponsors.map((sp) => (
              <div
                key={sp.id}
                className="bg-white p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1261FF] flex items-center justify-center font-black">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-[#071A33]">{sp.name}</div>
                    {sp.contact && <div className="text-xs text-gray-500">{sp.contact}</div>}
                    {sp.notes && <div className="text-[11px] text-gray-400 italic">{sp.notes}</div>}
                  </div>
                </div>

                <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                  Aktif
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL CATAT TRANSAKSI KAS */}
      {showAddTrxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-[#071A33] text-base">Catat Transaksi Kas</h3>
                <p className="text-xs text-gray-500">Catat pemasukan atau pengeluaran komunitas</p>
              </div>
              <button
                onClick={() => setShowAddTrxModal(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrx} className="space-y-3.5">
              {/* Tipe Transaksi */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tipe Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTrxType('Pemasukan')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      trxType === 'Pemasukan'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    Pemasukan (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrxType('Pengeluaran')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      trxType === 'Pengeluaran'
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    Pengeluaran (-)
                  </button>
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
                <select
                  value={trxCategory}
                  onChange={(e) => setTrxCategory(e.target.value as CashCategory)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                >
                  <option value="Operasional">Operasional</option>
                  <option value="Match">Match</option>
                  <option value="Sponsor">Sponsor</option>
                  <option value="Jersey">Jersey</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  required
                  placeholder="0"
                  value={trxAmount || ''}
                  onChange={(e) => setTrxAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base font-extrabold text-[#071A33] focus:outline-hidden focus:border-[#1261FF]"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi / Keperluan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembelian 2 Bola Molten & Pompa"
                  value={trxDesc}
                  onChange={(e) => setTrxDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#1261FF]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTrxModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1261FF] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
                >
                  SIMPAN TRANSAKSI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH SPONSOR */}
      {showAddSponsorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-[#071A33] text-base">Tambah Mitra Sponsor</h3>
              <button
                onClick={() => setShowAddSponsorModal(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSponsor} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Sponsor / Usaha</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kopi Guyub Baleendah"
                  value={spName}
                  onChange={(e) => setSpName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kontak Person / No HP</label>
                <input
                  type="text"
                  placeholder="0812xxxxxxxx"
                  value={spContact}
                  onChange={(e) => setSpContact(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Kerjasama</label>
                <textarea
                  rows={2}
                  placeholder="Bentuk sponsorship..."
                  value={spNotes}
                  onChange={(e) => setSpNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSponsorModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1261FF] hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                >
                  SIMPAN SPONSOR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
