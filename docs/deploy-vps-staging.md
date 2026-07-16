# Deploy ke VPS Debian (Staging) via GitHub Actions

Tutorial ini untuk deploy aplikasi Ajuan Pembayaran ke satu VPS Debian, untuk keperluan **staging/uji coba** (bukan produksi dengan data asli). Setelah setup awal selesai, deploy berikutnya otomatis: cukup `git push` ke `main`, GitHub Actions yang mengurus sisanya lewat SSH ke VPS.

> Ditulis untuk yang belum pernah deploy aplikasi ini sebelumnya — ikuti urut dari atas, jangan lompat langkah.

## 0. Yang Perlu Disiapkan

- VPS Debian yang sudah bisa di-SSH (punya IP publik + akses root/sudo).
- Akses ke pengaturan GitHub repo ini (**Settings → Secrets and variables → Actions**) untuk menambahkan secrets.
- Nomor port yang bakal dipakai publik: **3000** (aplikasi) dan **9000** (RustFS, untuk foto profil/bukti transfer/LPJ). Port lain (5432 Postgres, 9001 konsol RustFS) sengaja **tidak** dibuka ke publik — lihat Bagian 4.

## 1. Install Docker di VPS

SSH ke VPS sebagai root (atau user dengan sudo), lalu:

```bash
curl -fsSL https://get.docker.com | sh
```

Ini menginstal Docker Engine + plugin Compose (`docker compose`, bukan `docker-compose` versi lama). Cek berhasil:

```bash
docker --version
docker compose version
```

### Buat user khusus deploy (jangan pakai root untuk ini)

```bash
adduser deploy
usermod -aG docker deploy
```

`usermod -aG docker` supaya user `deploy` bisa menjalankan `docker`/`docker compose` **tanpa** `sudo`. Setelah ini, semua langkah berikutnya jalankan sebagai user `deploy`, bukan root:

```bash
su - deploy
```

## 2. Clone Repo & Setup Environment

```bash
cd ~
git clone https://github.com/Moodboard-net/app-ajuan-refactor.git ajuan
cd ajuan
cp .env.example .env
```

Edit `.env` (`nano .env`). Isi setiap nilai — **jangan** pakai nilai contoh dari dokumentasi dev/lokal (`devpassword123` dsb.), meskipun ini staging. Generate nilai acak yang kuat untuk tiap secret:

```bash
openssl rand -base64 32
```

Jalankan perintah di atas beberapa kali untuk mengisi `POSTGRES_PASSWORD`, `RUSTFS_ACCESS_KEY`, `RUSTFS_SECRET_KEY`, `APP_SESSION_SECRET`, dan password seed (`SEED_SUPER_ADMIN_PASSWORD`, `SEED_APPROVAL_PASSWORD`) dengan nilai berbeda-beda.

**Satu nilai yang WAJIB disesuaikan** dan sering kelewatan: `RUSTFS_PUBLIC_ENDPOINT`. Ini harus jadi alamat yang bisa dijangkau **browser pengguna**, bukan `localhost`:

```bash
RUSTFS_PUBLIC_ENDPOINT=http://<IP-PUBLIK-VPS>:9000
```

(Ganti `<IP-PUBLIK-VPS>` dengan IP VPS Anda. Kalau nanti sudah pasang domain, ganti ke `https://domain-anda.com` — tapi itu di luar scope tutorial ini, lihat Bagian 8.)

`DATABASE_URL` dan `RUSTFS_ENDPOINT` di `.env` tidak dipakai langsung oleh `docker-compose.yml` (nilainya di-generate ulang dari `POSTGRES_*`/`RUSTFS_*` di dalam file compose) — boleh dibiarkan seperti bawaan `.env.example`, tidak berpengaruh.

## 3. Bring-Up Pertama Kali (Manual, Sebelum Otomatisasi)

Jalankan manual dulu supaya kalau ada yang salah, errornya kelihatan langsung di layar (bukan tersembunyi di log GitHub Actions).

```bash
set -a && source .env && set +a
docker compose build
docker compose up -d postgres rustfs app
docker compose run --rm migrator
```

`migrator` adalah service khusus yang menerapkan skema database + data awal (super_admin, approval, 5 divisi) — lihat komentar di `docker-compose.yml` kalau penasaran kenapa ini perlu service terpisah (image `app` produksi sengaja tidak membawa tool migrasi supaya ukurannya kecil).

Kalau semua perintah di atas selesai tanpa error, cek:

```bash
docker compose ps
curl -I http://localhost:3000/login
```

Harus muncul 3 container `Up` (`app`, `postgres`, `rustfs`) dan curl mengembalikan `HTTP/1.1 200 OK`. Buka `http://<IP-VPS>:3000` dari browser di komputer Anda (bukan dari dalam VPS) untuk pastikan benar-benar bisa diakses dari luar.

## 4. Buka Firewall (ufw)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
sudo ufw allow 9000/tcp
sudo ufw enable
```

**Jangan** buka port 5432 (Postgres) atau 9001 (konsol admin RustFS) — keduanya sudah diikat ke `127.0.0.1` di `docker-compose.yml` (tidak bisa diakses dari luar VPS sama sekali, terlepas dari aturan firewall). Ini sengaja: Postgres & konsol admin tidak pernah perlu diakses langsung dari internet.

## 5. Setup SSH Key Khusus untuk GitHub Actions

**Jangan pakai key pribadi Anda.** Buat keypair baru khusus untuk GitHub Actions, dari komputer Anda sendiri (bukan dari VPS):

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ./deploy_key -N ""
```

Ini menghasilkan dua file: `deploy_key` (private, **rahasia**) dan `deploy_key.pub` (public).

Tempelkan isi `deploy_key.pub` ke VPS, ke user `deploy`:

```bash
ssh-copy-id -i deploy_key.pub deploy@<IP-VPS>
```

(Kalau `ssh-copy-id` tidak tersedia, isi manual: tempelkan isi `deploy_key.pub` ke akhir file `~/.ssh/authorized_keys` milik user `deploy` di VPS.)

Uji key-nya sebelum lanjut:

```bash
ssh -i deploy_key deploy@<IP-VPS> "echo berhasil"
```

Kalau muncul `berhasil` tanpa diminta password, key-nya sudah benar.

## 6. Tambahkan GitHub Secrets

Buka repo di GitHub → **Settings → Secrets and variables → Actions → New repository secret**. Tambahkan satu per satu:

| Nama Secret | Isi |
|---|---|
| `VPS_HOST` | IP publik VPS Anda |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Isi **lengkap** file `deploy_key` (private key) — buka dengan `cat deploy_key`, salin semua termasuk baris `-----BEGIN...-----` dan `-----END...-----` |
| `VPS_SSH_PORT` | `22` (atau port SSH kustom kalau VPS Anda pakai port lain) |
| `VPS_APP_DIR` | `/home/deploy/ajuan` (path hasil `git clone` di Langkah 2) |

Setelah semua secret masuk, **hapus file `deploy_key` dan `deploy_key.pub` dari komputer Anda** (atau simpan di password manager) — jangan biarkan private key tergeletak di folder biasa.

## 7. Coba Deploy Otomatis

Workflow-nya ada di [`.github/workflows/deploy-staging.yml`](../.github/workflows/deploy-staging.yml), jalan otomatis tiap push ke `main`. Untuk mencoba tanpa harus push dulu:

1. Buka tab **Actions** di GitHub.
2. Pilih workflow **Deploy Staging (VPS)** di sidebar kiri.
3. Klik **Run workflow** → **Run workflow** (tombol hijau).
4. Tunggu sampai selesai, klik masuk ke run-nya untuk lihat log tiap langkah.

Kalau sukses, buka lagi `http://<IP-VPS>:3000` untuk pastikan masih jalan normal.

**Deploy berikutnya otomatis** — begitu ada PR yang di-merge ke `main` (atau push langsung ke `main`), workflow ini jalan sendiri.

## 8. Verifikasi Akhir

- [ ] `http://<IP-VPS>:3000/login` bisa dibuka dari browser di luar VPS.
- [ ] Bisa login pakai akun yang di-seed (`SEED_SUPER_ADMIN_USERNAME` / `SEED_SUPER_ADMIN_PASSWORD` dari `.env`).
- [ ] Coba upload foto profil di `/profile` — foto harus benar-benar tampil (ini yang paling sering gagal kalau `RUSTFS_PUBLIC_ENDPOINT` salah, lihat Bagian 9).
- [ ] `docker compose ps` di VPS menunjukkan `postgres` dan `rustfs` **tidak** listen di `0.0.0.0` untuk port 5432/9001 (harus `127.0.0.1:...`).
- [ ] Trigger ulang workflow (Bagian 7) berhasil tanpa error.

## 9. Troubleshooting

**Foto profil/bukti transfer/LPJ tidak muncul (gambar rusak/tidak load):**
`RUSTFS_PUBLIC_ENDPOINT` di `.env` VPS salah atau belum di-set ke IP publik. Cek nilainya, lalu `docker compose up -d --build app` untuk restart dengan env baru.

**Workflow GitHub Actions gagal di step SSH:**
- Cek `VPS_SSH_KEY` di GitHub Secrets — pastikan isinya lengkap termasuk baris `BEGIN`/`END`, tidak ada baris terpotong.
- Cek `VPS_HOST`/`VPS_USER`/`VPS_SSH_PORT` sudah benar.
- Coba ulangi `ssh -i deploy_key deploy@<IP-VPS>` dari komputer Anda — kalau itu juga gagal, masalahnya di VPS/firewall, bukan di GitHub Actions.

**`docker compose run --rm migrator` gagal dengan error koneksi database:**
Pastikan `docker compose up -d postgres` sudah jalan dan statusnya `healthy` (`docker compose ps`) sebelum menjalankan migrator.

**Container `app` restart terus-menerus:**
Lihat log: `docker compose logs app --tail 50`. Penyebab paling umum: salah satu env var di `.env` kosong/salah format.

## 10. Bukan Bagian Tutorial Ini (Langkah Lanjutan Kalau Diperlukan)

Sengaja **tidak** dibahas di sini karena di luar scope "staging sederhana":

- **Domain + HTTPS** — kalau nanti butuh, pasang reverse proxy (mis. Caddy, otomatis dapat sertifikat TLS) di depan port 3000, lalu ganti `RUSTFS_PUBLIC_ENDPOINT` ke domain HTTPS juga.
- **Backup database terjadwal** — staging biasanya boleh hilang datanya sewaktu-waktu; kalau butuh backup, jadwalkan `pg_dump` lewat cron terpisah dari tutorial ini.
- **Rollback otomatis kalau deploy gagal** — workflow ini pakai `git reset --hard` + rebuild, tidak ada mekanisme rollback otomatis. Untuk staging ini dianggap cukup.
