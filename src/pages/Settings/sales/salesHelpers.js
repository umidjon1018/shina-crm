// Lavozim ustuvorligi (xodim maqsadlari ro'yxatida tartib uchun)
const rolePriority = { admin: 4, manager: 3, seller: 2, storekeeper: 2, technician: 2 }
export const getRolePriority = (role) => rolePriority[role] ?? 2
