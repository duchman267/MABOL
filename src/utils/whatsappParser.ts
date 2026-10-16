import { AttendanceStatus, PaymentMethod, PaymentStatus, RsvpStatus } from '../types';

export interface ParsedWhatsAppItem {
  rawLine: string;
  name: string;
  matchedMemberId?: string;
  isGuest: boolean;
  rsvpStatus: RsvpStatus;
  attendanceStatus: AttendanceStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentAmount: number; // default 0 atau standardFee jika admin mengaktifkan
}

/**
 * Parser pesan daftar peserta dari grup WhatsApp sepak bola
 */
export function parseWhatsAppList(
  text: string,
  members: Array<{ id: string; nickname: string; userId?: string }>,
  standardFee: number = 35000
): ParsedWhatsAppItem[] {
  if (!text.trim()) return [];

  const lines = text.split('\n');
  const results: ParsedWhatsAppItem[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Bersihkan nomor urut di awal baris: "1.", "1)", "1 -", "[1]", dsb
    const strippedNumber = trimmed.replace(/^(\d+[\.\)\-\:\s\]]+)/i, '').trim();
    if (!strippedNumber) continue;

    // Cek marker pembayaran dan kehadiran
    // Pola umum: ✅tf, ✅ tf, ✔️tf, [tf], tf, lunas, ✅, ✔️
    const lower = strippedNumber.toLowerCase();

    let attendanceStatus: AttendanceStatus = 'Belum Dicek';
    let rsvpStatus: RsvpStatus = 'Menunggu';
    let paymentStatus: PaymentStatus = 'Belum Bayar';
    let paymentMethod: PaymentMethod = 'Tunai';

    const hasTransferMarker =
      lower.includes('✅tf') ||
      lower.includes('✔️tf') ||
      lower.includes('✅ tf') ||
      lower.includes('✔️ tf') ||
      lower.includes('(tf)') ||
      lower.includes('[tf]') ||
      lower.includes('tf✅') ||
      lower.includes('transfer');

    const hasCashOrGeneralPaidMarker =
      !hasTransferMarker &&
      (lower.includes('✅') ||
        lower.includes('✔️') ||
        lower.includes('lunas') ||
        lower.includes('(lunas)') ||
        lower.includes('[lunas]') ||
        lower.includes('tunai') ||
        lower.includes('cash'));

    if (hasTransferMarker) {
      attendanceStatus = 'Hadir';
      rsvpStatus = 'Ikut';
      paymentStatus = 'Sudah Bayar';
      paymentMethod = 'Transfer';
    } else if (hasCashOrGeneralPaidMarker) {
      attendanceStatus = 'Hadir';
      rsvpStatus = 'Ikut';
      paymentStatus = 'Sudah Bayar';
      paymentMethod = 'Tunai';
    } else {
      attendanceStatus = 'Belum Dicek';
      rsvpStatus = 'Menunggu';
      paymentStatus = 'Belum Bayar';
      paymentMethod = 'Tunai';
    }

    // Bersihkan nama dari simbol dan marker
    let cleanName = strippedNumber
      .replace(/✅/g, '')
      .replace(/✔️/g, '')
      .replace(/☑️/g, '')
      .replace(/\(tf\)/gi, '')
      .replace(/\[tf\]/gi, '')
      .replace(/\(lunas\)/gi, '')
      .replace(/\[lunas\]/gi, '')
      .replace(/\btf\b/gi, '')
      .replace(/\btransfer\b/gi, '')
      .replace(/\btunai\b/gi, '')
      .replace(/\bcash\b/gi, '')
      .trim();

    // Hapus tanda baca berlebih di ujung nama
    cleanName = cleanName.replace(/^[-–—:\s]+|[-–—:\s]+$/g, '').trim();

    if (!cleanName || cleanName.length < 2) continue;

    // Kapitalisasi huruf pertama setiap kata
    const formattedName = cleanName
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Cocokkan dengan member terdaftar
    const matched = members.find(
      (m) =>
        m.nickname.toLowerCase() === formattedName.toLowerCase() ||
        formattedName.toLowerCase().includes(m.nickname.toLowerCase()) ||
        m.nickname.toLowerCase().includes(formattedName.toLowerCase())
    );

    results.push({
      rawLine: trimmed,
      name: matched ? matched.nickname : formattedName,
      matchedMemberId: matched ? matched.id : undefined,
      isGuest: !matched,
      rsvpStatus,
      attendanceStatus,
      paymentStatus,
      paymentMethod,
      paymentAmount: paymentStatus === 'Sudah Bayar' ? standardFee : 0,
    });
  }

  return results;
}
