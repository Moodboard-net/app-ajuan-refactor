export type StatusAjuan =
  | "Menunggu Verifikasi"
  | "Menunggu Approval"
  | "Perlu Revisi"
  | "Ditolak"
  | "Disetujui"
  | "Selesai Dibayar";

export type Ajuan = {
  id: number;
  id_divisi: number;
  nama_divisi: string;
  nama_pengaju: string;
  atas_nama_rekening: string;
  nomor_rekening: string;
  nama_bank: string;
  keterangan_kegiatan: string;
  nominal_diajukan: string;
  status: StatusAjuan;
  catatan_approval: string | null;
  kode_tracking: string | null;
  created_at: string;
};
