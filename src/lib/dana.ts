export type StatusDana = "Surplus" | "Defisit" | "Sesuai";

export function hitungSelisihDana(
  nominalDiajukan: number,
  nominalRealisasi: number
): { selisih: number; statusDana: StatusDana } {
  const selisih = nominalDiajukan - nominalRealisasi;
  const statusDana: StatusDana =
    selisih > 0 ? "Surplus" : selisih < 0 ? "Defisit" : "Sesuai";
  return { selisih, statusDana };
}
