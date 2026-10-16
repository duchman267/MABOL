// Centralized Financial Engine for MABOL
// Seluruh perhitungan keuangan, HTM, kontribusi tambahan, surplus/defisit, dan kas komunitas
// dipusatkan di file ini sesuai aturan Section 21, 22, 23, dan 36.

import { Match, MatchParticipant, MatchExpense, MatchAddOn, MatchSponsorship, PaymentRecord, CashTransaction } from '../types';

export interface MatchFinancialSummary {
  standardFee: number;
  totalPlayersPaid: number;
  totalPlayersUnpaid: number;
  totalPlayerPayments: number; // Pendapatan diterima dari pemain
  totalOutstandingPayments: number; // Belum dibayar
  totalExtraContributions: number; // Total udunan lebih (Support of the match)
  totalSponsorships: number; // Pendapatan dari sponsor
  totalRevenue: number; // Total Pendapatan Diterima = Pemain + Sponsor
  
  fieldExpense: number; // Biaya lapangan
  photographerExpense: number; // Biaya fotografer
  addOnsExpense: number; // Biaya add-ons (air, snack, rompi, dll)
  operationalExpense: number; // Operasional lain
  otherExpense: number; // Biaya lainnya
  totalExpenses: number; // Total Pengeluaran
  
  netResult: number; // netResult = totalRevenue - totalExpenses
  isSurplus: boolean;
  isDeficit: boolean;
  surplusAmount: number;
  deficitAmount: number;
}

/**
 * Format angka ke mata uang Rupiah
 * Contoh: 35000 -> "Rp 35.000"
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(absVal);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Hitung kontribusi tambahan (extra contribution)
 * extraContribution = max(0, amount - standardFee)
 */
export function calculateExtraContribution(amount: number, standardFee: number): number {
  return Math.max(0, amount - standardFee);
}

/**
 * Hitung ringkasan finansial pertandingan secara komprehensif
 */
export function calculateMatchFinances(
  match: Match,
  payments: PaymentRecord[],
  expenses: MatchExpense[],
  addOns: MatchAddOn[],
  sponsorships: MatchSponsorship[],
  participants?: MatchParticipant[]
): MatchFinancialSummary {
  // Filter yang terkait dengan match ini
  const matchPayments = payments.filter((p) => p.matchId === match.id);
  const matchExpenses = expenses.filter((e) => e.matchId === match.id);
  const matchAddOns = addOns.filter((a) => a.matchId === match.id);
  const matchSponsorships = sponsorships.filter((s) => s.matchId === match.id);
  const matchParticipants = participants ? participants.filter((p) => p.matchId === match.id) : [];

  // 1. Pembayaran Pemain
  let totalPlayerPayments = 0;
  let totalExtraContributions = 0;
  let totalPlayersPaid = 0;
  let totalPlayersUnpaid = 0;
  let totalOutstandingPayments = 0;

  for (const p of matchPayments) {
    const fee = p.standardFee || match.standardFee;
    const participant = matchParticipants.find((part) => part.id === p.participantId);
    const isCancelled = participant?.rsvpStatus === 'Batal';

    if (p.status === 'Sudah Bayar') {
      totalPlayerPayments += p.amount;
      const extra = calculateExtraContribution(p.amount, fee);
      totalExtraContributions += extra;
      totalPlayersPaid++;
      // Pembayaran yang sudah masuk tetap dicatat dan tidak di-refund saat batal; outstanding = 0
    } else if (p.status === 'Bayar Sebagian') {
      totalPlayerPayments += p.amount;
      totalPlayersPaid++;
      if (!isCancelled) {
        totalOutstandingPayments += Math.max(0, fee - p.amount);
      }
    } else {
      // Belum Bayar: hanya peserta aktif (bukan Batal) yang dihitung sebagai tunggakan
      if (!isCancelled) {
        totalPlayersUnpaid++;
        totalOutstandingPayments += fee;
      }
    }
  }

  // 2. Sponsorship
  let totalSponsorships = 0;
  for (const s of matchSponsorships) {
    if (s.paymentStatus === 'Sudah Bayar') {
      totalSponsorships += s.amount;
    }
  }

  // Total Pendapatan Diterima
  const totalRevenue = totalPlayerPayments + totalSponsorships;

  // 3. Pengeluaran
  let fieldExpense = 0;
  let photographerExpense = 0;
  let addOnsExpense = 0;
  let operationalExpense = 0;
  let otherExpense = 0;

  // Tambahkan biaya fotografer jika didefinisikan di match dan belum tercatat di expenses
  const hasPhotographerExpenseRecord = matchExpenses.some((e) => e.category === 'Photographer');
  if (match.photographerAvailable && match.photographerFee && !hasPhotographerExpenseRecord) {
    photographerExpense += match.photographerFee;
  }

  // Dari daftar expenses
  for (const exp of matchExpenses) {
    if (exp.category === 'Lapangan') fieldExpense += exp.total;
    else if (exp.category === 'Photographer') photographerExpense += exp.total;
    else if (exp.category === 'Add-on') addOnsExpense += exp.total;
    else if (exp.category === 'Operasional') operationalExpense += exp.total;
    else otherExpense += exp.total;
  }

  // Dari daftar add-ons terpisah (jika ada)
  for (const addon of matchAddOns) {
    addOnsExpense += addon.total;
  }

  const totalExpenses = fieldExpense + photographerExpense + addOnsExpense + operationalExpense + otherExpense;

  // 4. Hasil Bersih
  const netResult = totalRevenue - totalExpenses;
  const isSurplus = netResult > 0;
  const isDeficit = netResult < 0;
  const surplusAmount = isSurplus ? netResult : 0;
  const deficitAmount = isDeficit ? Math.abs(netResult) : 0;

  return {
    standardFee: match.standardFee,
    totalPlayersPaid,
    totalPlayersUnpaid,
    totalPlayerPayments,
    totalOutstandingPayments,
    totalExtraContributions,
    totalSponsorships,
    totalRevenue,
    fieldExpense,
    photographerExpense,
    addOnsExpense,
    operationalExpense,
    otherExpense,
    totalExpenses,
    netResult,
    isSurplus,
    isDeficit,
    surplusAmount,
    deficitAmount,
  };
}

/**
 * Hitung Saldo Kas Komunitas dari Ledger Transaksi (Source of Truth)
 */
export function calculateCommunityBalance(transactions: CashTransaction[], communityId?: string): {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  recentTransactions: CashTransaction[];
} {
  const filtered = communityId
    ? transactions.filter((t) => t.communityId === communityId)
    : transactions;

  // Urutkan transaksi dari yang terbaru
  const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of sorted) {
    if (t.type === 'Pemasukan') {
      totalIncome += t.amount;
    } else if (t.type === 'Pengeluaran') {
      totalExpense += t.amount;
    }
  }

  const balance = totalIncome - totalExpense;

  return {
    balance,
    totalIncome,
    totalExpense,
    recentTransactions: sorted,
  };
}

/**
 * Generate pesan apresiasi "SUPPORT OF THE MATCH" jika pemain membayar lebih dari HTM
 */
export function getSupportAppreciationData(
  playerName: string,
  amount: number,
  standardFee: number
): {
  isEligible: boolean;
  extraContribution: number;
  message: string;
} {
  const extra = calculateExtraContribution(amount, standardFee);
  if (extra <= 0) {
    return {
      isEligible: false,
      extraContribution: 0,
      message: '',
    };
  }

  const defaultQuote = 'Sehat terus, sukses terus, rezeki makin lancar! 🤝⚽';

  return {
    isEligible: true,
    extraContribution: extra,
    message: defaultQuote,
  };
}
