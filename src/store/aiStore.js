import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const AI_AGENTS = [
  {
    id: 'sales-agent',
    slug: 'sales-agent',
    name: 'Savdo agenti',
    nameRu: 'Агент продаж',
    description: 'Savdo tahlili, narx strategiyasi, daromad prognozi',
    icon: 'TrendingUp',
    color: 'accent-green',
    systemPrompt: `Siz Shina CRM tizimining savdo agentisiz. Vazifangiz:
- Savdo ko'rsatkichlarini tahlil qilish
- Narx strategiyasi bo'yicha maslahat berish
- Daromad prognozlari tuzish
- Sotuvchilar samaradorligini baholash
- Aksiya va chegirma tavsiyalari
Javoblaringiz qisqa, aniq va amaliy bo'lsin. O'zbek tilida javob bering.`,
  },
  {
    id: 'pr-agent',
    slug: 'pr-agent',
    name: 'PR/Marketing agenti',
    nameRu: 'PR/Маркетинг агент',
    description: 'Marketing kampaniyalari, mijoz jalb qilish, brend rivojlantirish',
    icon: 'Megaphone',
    color: 'accent-blue',
    systemPrompt: `Siz Shina CRM tizimining marketing va PR agentisiz. Vazifangiz:
- Marketing kampaniyalari rejalashtirish
- Ijtimoiy tarmoq kontenti tayyorlash
- Mijozlarni jalb qilish strategiyalari
- Brend ovozi va uslubini belgilash
- Aksiya matnlari va e'lonlar yozish
Ijodiy, qiziqarli va samarali tavsiyalar bering. O'zbek tilida javob bering.`,
  },
  {
    id: 'customer-agent',
    slug: 'customer-agent',
    name: 'Mijoz muloqoti agenti',
    nameRu: 'Агент по работе с клиентами',
    description: 'Mijoz munosabatlari, shikoyat hal qilish, sodiqlik dasturi',
    icon: 'Users',
    color: 'accent-orange',
    systemPrompt: `Siz Shina CRM tizimining mijozlar bilan ishlash agentisiz. Vazifangiz:
- Mijoz shikoyatlarini samarali hal qilish
- Mijoz sodiqligini oshirish strategiyalari
- Muloqot skriptlari va shablonlar
- Qaytuvchi mijozlarni ushlab turish
- Mijoz tajribasini yaxshilash
Do'stona, professional va empatik ton bilan javob bering. O'zbek tilida javob bering.`,
  },
  {
    id: 'product-agent',
    slug: 'product-agent',
    name: 'Tovar bazasi agenti',
    nameRu: 'Агент товарной базы',
    description: 'Ombor tahlili, tovar tavsiyasi, inventarizatsiya',
    icon: 'Package',
    color: 'accent-red',
    systemPrompt: `Siz Shina CRM tizimining tovar va ombor agentisiz. Vazifangiz:
- Ombor holati tahlili va optimizatsiya
- Tovar tavsiyalari (shina, disk, aksessuar)
- Yetkazib beruvchilar bilan ishlash maslahat
- Narx monitoring va raqobat tahlili
- Inventarizatsiya rejalari
Texnik bilimlarni oddiy tilda tushuntirib bering. O'zbek tilida javob bering.`,
  },
]

export const useAiStore = create(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,

      createChat: (agentId) => {
        const id = 'chat_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)
        const agent = AI_AGENTS.find(a => a.id === agentId)
        const chat = {
          id,
          agentId,
          title: agent?.name + ' suhbati',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
        }
        set(s => ({ chats: [chat, ...s.chats], activeChatId: id }))
        return id
      },

      setActiveChat: (chatId) => set({ activeChatId: chatId }),

      addMessage: (chatId, role, content, metadata = {}) => {
        const msg = {
          id: 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
          role,
          content,
          metadata,
          createdAt: new Date().toISOString(),
        }
        set(s => ({
          chats: s.chats.map(c =>
            c.id === chatId
              ? { ...c, messages: [...c.messages, msg], updatedAt: new Date().toISOString() }
              : c
          ),
        }))
        return msg
      },

      updateLastMessage: (chatId, content, metadata = {}) => {
        set(s => ({
          chats: s.chats.map(c => {
            if (c.id !== chatId) return c
            const msgs = [...c.messages]
            if (msgs.length === 0) return c
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content, metadata }
            return { ...c, messages: msgs, updatedAt: new Date().toISOString() }
          }),
        }))
      },

      renameChat: (chatId, title) => {
        set(s => ({
          chats: s.chats.map(c => c.id === chatId ? { ...c, title } : c),
        }))
      },

      deleteChat: (chatId) => {
        set(s => {
          const chats = s.chats.filter(c => c.id !== chatId)
          const activeChatId = s.activeChatId === chatId
            ? (chats[0]?.id || null)
            : s.activeChatId
          return { chats, activeChatId }
        })
      },

      clearChats: () => set({ chats: [], activeChatId: null }),
    }),
    { name: 'shina-ai-chats' }
  )
)
