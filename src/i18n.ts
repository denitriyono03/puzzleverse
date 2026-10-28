// Localisation-ready dictionary for core UI strings. Game puzzle content
// stays in English in v0.1; the dictionary is the single place to extend it.
export type Lang = 'en' | 'id';
export const DICT: Record<Lang, Record<string, string>> = {
  en: {
    home: 'Home', library: 'Library', daily: 'Daily', history: 'History', stats: 'Statistics',
    achievements: 'Achievements', leaderboard: 'Leaderboard', profile: 'Profile', friends: 'Friends',
    notifications: 'Notifications', settings: 'Settings', premium: 'Premium', privacy: 'Privacy & Account',
    help: 'Help', about: 'About', play: 'Play', continue: 'Continue', restart: 'Restart', reset: 'Reset',
    undo: 'Undo', hint: 'Hint', pause: 'Pause', resume: 'Resume', quit: 'Quit', results: 'Results',
    score: 'Score', time: 'Time', moves: 'Moves', hints: 'Hints', mistakes: 'Mistakes',
    guest: 'Guest', signIn: 'Sign in', signUp: 'Sign up', signOut: 'Sign out',
    dailyChallenge: 'Daily Challenge', freePlay: 'Free Play', streak: 'Streak',
    welcome: 'Welcome to PuzzleVerse', tagline: 'Four original puzzle games. One calm daily habit.',
  },
  id: {
    home: 'Beranda', library: 'Pustaka', daily: 'Harian', history: 'Riwayat', stats: 'Statistik',
    achievements: 'Pencapaian', leaderboard: 'Papan Peringkat', profile: 'Profil', friends: 'Teman',
    notifications: 'Notifikasi', settings: 'Pengaturan', premium: 'Premium', privacy: 'Privasi & Akun',
    help: 'Bantuan', about: 'Tentang', play: 'Main', continue: 'Lanjutkan', restart: 'Mulai Ulang', reset: 'Atur Ulang',
    undo: 'Urungkan', hint: 'Petunjuk', pause: 'Jeda', resume: 'Lanjutkan', quit: 'Keluar', results: 'Hasil',
    score: 'Skor', time: 'Waktu', moves: 'Langkah', hints: 'Petunjuk', mistakes: 'Kesalahan',
    guest: 'Tamu', signIn: 'Masuk', signUp: 'Daftar', signOut: 'Keluar',
    dailyChallenge: 'Tantangan Harian', freePlay: 'Bermain Bebas', streak: 'Beruntun',
    welcome: 'Selamat datang di PuzzleVerse', tagline: 'Empat permainan teka-teki orisinal. Satu kebiasaan harian yang tenang.',
  },
};
export function t(lang: Lang, key: string): string { return DICT[lang][key] ?? DICT.en[key] ?? key; }
