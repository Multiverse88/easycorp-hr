export interface DiscWord {
  text: string;
  dimension: 'D' | 'I' | 'S' | 'C';
}

export interface DiscQuestion {
  id: number;
  words: DiscWord[];
}

export const discQuestions: DiscQuestion[] = [
  {
    id: 1,
    words: [
      { text: 'Kuat', dimension: 'D' },
      { text: 'Menyenangkan', dimension: 'I' },
      { text: 'Setia', dimension: 'S' },
      { text: 'Tepat', dimension: 'C' }
    ]
  },
  {
    id: 2,
    words: [
      { text: 'Berani', dimension: 'D' },
      { text: 'Antusias', dimension: 'I' },
      { text: 'Tenang', dimension: 'S' },
      { text: 'Teliti', dimension: 'C' }
    ]
  },
  {
    id: 3,
    words: [
      { text: 'Dominan', dimension: 'D' },
      { text: 'Berpengaruh', dimension: 'I' },
      { text: 'Sabar', dimension: 'S' },
      { text: 'Hati-hati', dimension: 'C' }
    ]
  },
  {
    id: 4,
    words: [
      { text: 'Tegas', dimension: 'D' },
      { text: 'Ramah', dimension: 'I' },
      { text: 'Kooperatif', dimension: 'S' },
      { text: 'Akurat', dimension: 'C' }
    ]
  },
  {
    id: 5,
    words: [
      { text: 'Mandiri', dimension: 'D' },
      { text: 'Persuasif', dimension: 'I' },
      { text: 'Konsisten', dimension: 'S' },
      { text: 'Analitis', dimension: 'C' }
    ]
  },
  {
    id: 6,
    words: [
      { text: 'Kompetitif', dimension: 'D' },
      { text: 'Optimis', dimension: 'I' },
      { text: 'Dapat Diandalkan', dimension: 'S' },
      { text: 'Perfeksionis', dimension: 'C' }
    ]
  },
  {
    id: 7,
    words: [
      { text: 'Langsung', dimension: 'D' },
      { text: 'Ekspresif', dimension: 'I' },
      { text: 'Stabil', dimension: 'S' },
      { text: 'Sistematis', dimension: 'C' }
    ]
  },
  {
    id: 8,
    words: [
      { text: 'Menantang', dimension: 'D' },
      { text: 'Inspiratif', dimension: 'I' },
      { text: 'Sabar', dimension: 'S' },
      { text: 'Logis', dimension: 'C' }
    ]
  },
  {
    id: 9,
    words: [
      { text: 'Hasil-oriented', dimension: 'D' },
      { text: 'Sosial', dimension: 'I' },
      { text: 'Loyal', dimension: 'S' },
      { text: 'Kritis', dimension: 'C' }
    ]
  },
  {
    id: 10,
    words: [
      { text: 'Berinisiatif', dimension: 'D' },
      { text: 'Komunikatif', dimension: 'I' },
      { text: 'Empati', dimension: 'S' },
      { text: 'Terstruktur', dimension: 'C' }
    ]
  },
  {
    id: 11,
    words: [
      { text: 'Percaya Diri', dimension: 'D' },
      { text: 'Populer', dimension: 'I' },
      { text: 'Harmonis', dimension: 'S' },
      { text: 'Objektif', dimension: 'C' }
    ]
  },
  {
    id: 12,
    words: [
      { text: 'Decisive', dimension: 'D' },
      { text: 'Hangat', dimension: 'I' },
      { text: 'Tulus', dimension: 'S' },
      { text: 'Presisi', dimension: 'C' }
    ]
  },
  {
    id: 13,
    words: [
      { text: 'Ambisius', dimension: 'D' },
      { text: 'Verbal', dimension: 'I' },
      { text: 'Pengertian', dimension: 'S' },
      { text: 'Metodis', dimension: 'C' }
    ]
  },
  {
    id: 14,
    words: [
      { text: 'Pionir', dimension: 'D' },
      { text: 'Demonstratif', dimension: 'I' },
      { text: 'Penyabar', dimension: 'S' },
      { text: 'Konservatif', dimension: 'C' }
    ]
  },
  {
    id: 15,
    words: [
      { text: 'Keras', dimension: 'D' },
      { text: 'Ceria', dimension: 'I' },
      { text: 'Toleran', dimension: 'S' },
      { text: 'Disiplin', dimension: 'C' }
    ]
  },
  {
    id: 16,
    words: [
      { text: 'Penuh Tekad', dimension: 'D' },
      { text: 'Spontan', dimension: 'I' },
      { text: 'Pendengar', dimension: 'S' },
      { text: 'Teratur', dimension: 'C' }
    ]
  },
  {
    id: 17,
    words: [
      { text: 'Agresif', dimension: 'D' },
      { text: 'Terbuka', dimension: 'I' },
      { text: 'Lembut', dimension: 'S' },
      { text: 'Cermat', dimension: 'C' }
    ]
  },
  {
    id: 18,
    words: [
      { text: 'Cepat', dimension: 'D' },
      { text: 'Antusias', dimension: 'I' },
      { text: 'Santai', dimension: 'S' },
      { text: 'Hati-hati', dimension: 'C' }
    ]
  },
  {
    id: 19,
    words: [
      { text: 'Keras Kepala', dimension: 'D' },
      { text: 'Dramatis', dimension: 'I' },
      { text: 'Menolong', dimension: 'S' },
      { text: 'Sistemik', dimension: 'C' }
    ]
  },
  {
    id: 20,
    words: [
      { text: 'Berorientasi Tujuan', dimension: 'D' },
      { text: 'Meyakinkan', dimension: 'I' },
      { text: 'Terduga', dimension: 'S' },
      { text: 'Analitis', dimension: 'C' }
    ]
  },
  {
    id: 21,
    words: [
      { text: 'Risk Taker', dimension: 'D' },
      { text: 'Ceria', dimension: 'I' },
      { text: 'Berhati-hati', dimension: 'S' },
      { text: 'Akurat', dimension: 'C' }
    ]
  },
  {
    id: 22,
    words: [
      { text: 'Pemimpin', dimension: 'D' },
      { text: 'Populer', dimension: 'I' },
      { text: 'Setia Kawan', dimension: 'S' },
      { text: 'Bijaksana', dimension: 'C' }
    ]
  },
  {
    id: 23,
    words: [
      { text: 'Proaktif', dimension: 'D' },
      { text: 'Antusias', dimension: 'I' },
      { text: 'Suportif', dimension: 'S' },
      { text: 'Faktual', dimension: 'C' }
    ]
  },
  {
    id: 24,
    words: [
      { text: 'Otoriter', dimension: 'D' },
      { text: 'Persuasif', dimension: 'I' },
      { text: 'Pemaaf', dimension: 'S' },
      { text: 'Perfeksionis', dimension: 'C' }
    ]
  },
  {
    id: 25,
    words: [
      { text: 'Tegas', dimension: 'D' },
      { text: 'Ekspresif', dimension: 'I' },
      { text: 'Akomodatif', dimension: 'S' },
      { text: 'Rasional', dimension: 'C' }
    ]
  },
  {
    id: 26,
    words: [
      { text: 'Penantang', dimension: 'D' },
      { text: 'Emosional', dimension: 'I' },
      { text: 'Pendukung', dimension: 'S' },
      { text: 'Kritis', dimension: 'C' }
    ]
  },
  {
    id: 27,
    words: [
      { text: 'Langsung', dimension: 'D' },
      { text: 'Optimistis', dimension: 'I' },
      { text: 'Pendengar', dimension: 'S' },
      { text: 'Logis', dimension: 'C' }
    ]
  },
  {
    id: 28,
    words: [
      { text: 'Menguasai', dimension: 'D' },
      { text: 'Kreatif', dimension: 'I' },
      { text: 'Sabar', dimension: 'S' },
      { text: 'Detail-oriented', dimension: 'C' }
    ]
  }
];
