/**
 * Generates a sortKey as a bigint for database index ordering.
 * The sortKey places volume first, then chapter number, to allow sequential,
 * database-level indexed ordering.
 */
export function generateSortKey(volume: number | null, chapterNumber: number): bigint {
  const vol = volume !== null && volume >= 0 ? BigInt(volume) : BigInt(0);
  // Handle fractional chapters by multiplying by 10000 to keep up to 4 decimal places
  const chap = BigInt(Math.round(Math.max(0, chapterNumber) * 10000));
  
  // Shift volume by 10^12 to ensure no overlap (assuming chapter * 10000 < 10^12)
  return vol * BigInt("1000000000000") + chap;
}

export default generateSortKey;
