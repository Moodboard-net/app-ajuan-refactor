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
  status: "Menunggu Approval" | "Ditolak" | "Disetujui" | "Selesai Dibayar";
  catatan_approval: string | null;
  created_at: string;
};
