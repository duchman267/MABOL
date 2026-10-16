/**
 * Utility tanggal dan waktu untuk MABOL
 * Memastikan perbandingan tanggal menggunakan runtime sebenarnya (Date.now())
 */

/**
 * Mengubah tanggal dan jam kickoff pertandingan menjadi objek Date
 */
export function getMatchDateTime(dateStr: string, timeStr: string = '00:00'): Date {
  // Parsing YYYY-MM-DD dan HH:mm
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0);
}

/**
 * Menentukan apakah pertandingan tergolong "Pertandingan Berikutnya" (Upcoming Match)
 * Syarat mutlak:
 * 1. match date + kickoff time > current date/time (runtime sebenarnya)
 * 2. Status BUKAN 'Selesai' dan BUKAN 'Dibatalkan'
 */
export function isMatchUpcoming(match: {
  date: string;
  kickoffTime?: string;
  status?: string;
}): boolean {
  if (match.status === 'Selesai' || match.status === 'Dibatalkan') {
    return false;
  }

  const matchDateTime = getMatchDateTime(match.date, match.kickoffTime || '00:00');
  return matchDateTime.getTime() > Date.now();
}

/**
 * Menentukan apakah pertandingan sudah lampau (Past Match)
 */
export function isMatchPast(match: {
  date: string;
  kickoffTime?: string;
  status?: string;
}): boolean {
  if (match.status === 'Selesai' || match.status === 'Dibatalkan') {
    return true;
  }
  const matchDateTime = getMatchDateTime(match.date, match.kickoffTime || '00:00');
  return matchDateTime.getTime() <= Date.now();
}

/**
 * Format tanggal dalam Bahasa Indonesia
 */
export function formatTanggalIndonesia(dateStr: string, withDay: boolean = false): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: withDay ? 'long' : undefined,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
