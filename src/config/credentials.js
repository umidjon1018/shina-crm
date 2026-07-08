// Demo credentials — development only
// Production da bu faylni credentials.local.js ga ko'chiring
// va .gitignore orqali git dan chiqaring
//
// MUHIM: Bu parollar faqat demo uchun. Real deploymentda
// backend autentifikatsiyasiga o'ting va bu faylni o'chiring.

export const DEMO_USERS = [
  { id: 1, name: 'Umidjon',  username: 'admin',  password: 'admin123',  role: 'admin',   permissions: ['all'] },
  { id: 2, name: 'Sardor',   username: 'sardor', password: 'sardor123', role: 'manager', permissions: ['warehouse','sales','income','expenses','reports','ai_agent'] },
  { id: 3, name: 'Jasur',    username: 'jasur',  password: 'jasur123',  role: 'seller',  permissions: ['warehouse','sales','income','ai_agent'] },
]
