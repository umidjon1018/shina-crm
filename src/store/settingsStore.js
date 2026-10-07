import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getEmployees, createEmployee, updateEmployee as apiUpdateEmp, deactivateEmployee, activateEmployee, deleteEmployee } from '../api/employeeService'
import { getProductImageMap, saveProductImages } from '../api/productImageService'
import { getBranding, saveBranding } from '../api/settingsService'

// Brend sozlamalari serverga yoziladi (admin yozishni to'xtatgach 600ms dan keyin, bitta so'rov)
const BRANDING_KEYS = ['companyName', 'companyLogo', 'loginIconMode', 'loginPageTitle', 'sidebarLogoSize']
let brandingTimer = null
let brandingPatch = {}
const queueBrandingSave = (patch) => {
  brandingPatch = { ...brandingPatch, ...patch }
  clearTimeout(brandingTimer)
  brandingTimer = setTimeout(() => {
    const p = brandingPatch
    brandingPatch = {}
    saveBranding(p).catch(() => {})
  }, 600)
}
import { getCategories, createCategory, updateCategory as apiUpdateCat, toggleCategory as apiToggleCat, deleteCategory as apiDeleteCat } from '../api/categoryService'

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // Kompaniya ma'lumotlari
      companyName: 'SICRM',
      companyLogo: null,
      companyLogoOriginal: null,
      loginIconMode: 'animation',  // 'animation' | 'logo'
      loginPageTitle: '',          // bo'sh = companyName ishlatiladi
      sidebarLogoSize: 'medium',   // 'small'|'medium'|'large'


      // Tovar rasmlari: { [productId]: url[] } — serverda saqlanadi, bu yerda kesh
      productImages: {},
      loadProductImages: async () => {
        try { set({ productImages: await getProductImageMap() }) } catch {}
      },
      setProductImages: async (productId, images) => {
        const urls = await saveProductImages(productId, images)
        set(s => ({ productImages: { ...s.productImages, [String(productId)]: urls } }))
      },

      // Narxnoma dizayn sozlamalari
      priceListSettings: {
        headerColor:  '#1c1c2e',
        accentColor:  '#cc0000',
        logoTextColor:'#ffffff',
        font:         'Arial',
        logoPosition: 'left',
        logoMode:     'normal',   // 'normal' | 'background'
        footer:       '',
        logo:         null,       // narxnoma uchun alohida logo
        logoOriginal: null,       // crop uchun asl versiya
      },

      // Sodiqlik dasturi (Mavjud - o'zgarmasin)
      loyaltyMinAmount: 100000,
      loyaltyVisitsRequired: 10,
      loyaltyDiscountPercent: 25,
      silverVisits: 5,

      // Chegirma darajalari (Mavjud - o'zgarmasin)
      discountSmallMax: 5,
      discountMediumMax: 10,
      // 10%+ avtomatik admin PIN

      // 1. USD kursi
      usdRate: 12700,

      // 2. Manbalar
      sources: [
        { id: 'walk_in',   label: "Ko'cha / Tasodif",  isActive: true },
        { id: 'instagram', label: 'Instagram',          isActive: true },
        { id: 'telegram',  label: 'Telegram',           isActive: true },
        { id: 'repeat',    label: 'Qaytuvchi mijoz',    isActive: true },
        { id: 'referral',  label: "Do'stdan eshitgan",  isActive: true },
      ],

      // 3. Mahsulot kategoriyalari
      productCategories: [
        { id: 'tire',      label: 'Shina',     turnoverDays: 45, isActive: true },
        { id: 'wheel',     label: 'Disk',      turnoverDays: 60, isActive: true },
        { id: 'accessory', label: 'Aksessuar', turnoverDays: 30, isActive: true },
      ],

      // 7. Muddatli to'lov tashkilotlari
      // Struktura: [{ id, name, commissionPercent, paymentSchedule, isActive }]
      // paymentSchedule: 'weekly_2x' | 'biweekly' | 'custom'
      installmentOrganizations: [
        {
          id: 'uzum_nasiya',
          name: 'Uzum Nasiya',
          commissionPercent: 0,
          paymentSchedule: 'weekly_2x',
          maxTermMonths: 24,
          availableTerms: [3, 6, 12, 24],
          isActive: true,
        },
        {
          id: 'oddiy_nasiya',
          name: 'Oddiy Nasiya',
          commissionPercent: 3,
          paymentSchedule: 'biweekly',
          maxTermMonths: 12,
          availableTerms: [3, 6, 12],
          isActive: true,
        },
      ],
      // Struktura: { 'YYYY-MM': number }
      monthlyTargets: {},
      downloadEnabled: true,

      // Ogohlantirish sozlamalari
      notificationSettings: {
        BARCODE_NOT_PRINTED: true,
        BARCODE_REPRINTED: true,
        BARCODE_SOLD_RESCAN: true,
        SALE_NO_CUSTOMER: true,
        DEVICE_LOGIN_ATTEMPT: true,
        REPRINT_ALLOWED: true,
        DEVICE_APPROVED: true,
      },

      // 5. Xodim oylik maqsadlari
      // Struktura: { 'empId': { 'YYYY-MM': number } }
      employeeTargets: {},

      // 5b. Rol bo'yicha sahifa/tab/ustun ruxsatlari (checkbox daraxti)
      // Har bir rol uchun belgilangan (checked) node id'lar ro'yxati.
      // Agar parent id checked bo'lsa — uning barcha avlodlari ham ruxsat etilgan hisoblanadi.
      roleAccessTrees: {
        manager:     ['dashboard','warehouse','sales','income','expenses','reports','ai_agent','customers','management','marketing'],
        seller:      ['dashboard','warehouse','sales','ai_agent','customers'],
        storekeeper: ['dashboard','warehouse','ai_agent'],
        technician:  ['dashboard','warehouse','ai_agent'],
      },
      setRoleAccessTree: (role, nodeIds) =>
        set(s => ({ roleAccessTrees: { ...s.roleAccessTrees, [role]: nodeIds } })),

      // Rol checked bo'lgan sahifa/tab ichidagi alohida yashiriladigan ustun/maydon id'lari
      roleDeniedNodes: {
        seller: [
          'warehouse.stock.income_price',
          'warehouse.income.financial',
          'sales.installment.percent_columns',
          'sales.installment.org_commission',
          'sales.profit',
        ],
        storekeeper: [
          'warehouse.stock.income_price',
          'warehouse.income.financial',
        ],
        technician: [
          'warehouse.stock.income_price',
          'warehouse.income.financial',
        ],
      },
      setRoleDeniedNodes: (role, nodeIds) =>
        set(s => ({ roleDeniedNodes: { ...s.roleDeniedNodes, [role]: nodeIds } })),

      // Admin tomonidan qo'shilgan qo'shimcha lavozimlar (masalan: Marketolog, Bugalter)
      customRoles: [],
      addCustomRole: (role) =>
        set(s => ({ customRoles: [...s.customRoles, role] })),
      removeCustomRole: (id) =>
        set(s => ({ customRoles: s.customRoles.filter(r => r.id !== id) })),

      // Tovar xususiyat shablonlari (batch darajasida qo'llaniladi)
      // [{ id: string, label: string, values: string[] }]
      productAttributeDefs: [],
      addProductAttributeDef: (label) =>
        set(s => ({ productAttributeDefs: [...s.productAttributeDefs, { id: Date.now().toString(), label, values: [] }] })),
      removeProductAttributeDef: (id) =>
        set(s => ({ productAttributeDefs: s.productAttributeDefs.filter(d => d.id !== id) })),
      updateProductAttributeDef: (id, newLabel) =>
        set(s => ({ productAttributeDefs: s.productAttributeDefs.map(d => d.id === id ? { ...d, label: newLabel } : d) })),
      addAttributeValue: (defId, value) =>
        set(s => ({ productAttributeDefs: s.productAttributeDefs.map(d => d.id === defId ? { ...d, values: [...d.values, value] } : d) })),
      removeAttributeValue: (defId, value) =>
        set(s => ({ productAttributeDefs: s.productAttributeDefs.map(d => d.id === defId ? { ...d, values: d.values.filter(v => v !== value) } : d) })),

      // 6. Xodimlar ro'yxati — backend dan yuklanadi
      employees: [],
      // Har bir xodim:
      // {
      //   id: string,
      //   name: string,
      //   phone: string,
      //   role: 'admin' | 'manager' | 'seller' | 'storekeeper' | 'technician',
      //   hiredAt: string,  // 'YYYY-MM-DD'
      //   salary: number,
      //   isActive: boolean,
      //   username: string,
      //   password: string,
      // }

      // Xodimlarni tahrirlash/o'chirishni bloklash (Admin tomonidan, Boshqaruvchi uchun ham)
      employeeEditLocked: false,
      toggleEmployeeEditLocked: () => set(s => ({ employeeEditLocked: !s.employeeEditLocked })),

      // Xodim tahrirlash tarixi — diff (oldingi/keyingi holat) va bekor qilish uchun
      // Struktura: { id, employeeId, employeeName, editedBy, editedByRole, timestamp, before, after, undone }
      employeeEditHistory: [],
      addEmployeeEditHistory: (entry) =>
        set(s => ({
          employeeEditHistory: [
            { id: Date.now().toString() + Math.random().toString(36).slice(2, 6), undone: false, ...entry },
            ...s.employeeEditHistory,
          ].slice(0, 200)
        })),
      undoEmployeeEdit: (historyId) =>
        set(s => {
          const entry = s.employeeEditHistory.find(h => h.id === historyId)
          if (!entry || entry.undone) return s
          return {
            employees: s.employees.map(e => e.id === entry.employeeId ? { ...e, ...entry.before } : e),
            employeeEditHistory: s.employeeEditHistory.map(h => h.id === historyId ? { ...h, undone: true } : h),
          }
        }),

      // Setterlar
      updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),

      // USD kursi
      setCompanyName: (name) => { set({ companyName: name }); queueBrandingSave({ companyName: name }) },
      setCompanyLogo: (logo) => { set({ companyLogo: logo }); queueBrandingSave({ companyLogo: logo }) },
      setCompanyLogoOriginal: (logo) => set({ companyLogoOriginal: logo }),
      setLoginIconMode: (mode) => { set({ loginIconMode: mode }); queueBrandingSave({ loginIconMode: mode }) },
      setLoginPageTitle: (title) => { set({ loginPageTitle: title }); queueBrandingSave({ loginPageTitle: title }) },
      setSidebarLogoSize: (size) => { set({ sidebarLogoSize: size }); queueBrandingSave({ sidebarLogoSize: size }) },
      // Serverdagi brendni olish. Server bo'sh bo'lsa va admin bo'lsa — shu qurilmadagi qiymatlar bir marta yuklanadi
      loadBranding: async (isAdmin = false) => {
        try {
          const b = await getBranding()
          const cur = get()
          // Admin qurilmasida logotip (yoki uning asl nusxasi) bor, serverda yo'q — bu o'chirish emas
          // (o'chirishda asl nusxa ham o'chadi), demak serverga qayta yuboriladi
          const localLogo = cur.companyLogo || cur.companyLogoOriginal || null
          if (isAdmin && !b.companyLogo && localLogo) {
            await saveBranding({ companyLogo: localLogo })
            b.companyLogo = localLogo
          }
          const has = BRANDING_KEYS.some(k => b[k] !== undefined)
          if (has) {
            const next = {}
            BRANDING_KEYS.forEach(k => { if (b[k] !== undefined) next[k] = b[k] })
            set(next)
          } else if (isAdmin) {
            // Birinchi ko'chirish: faqat haqiqatda o'rnatilgan (bo'sh/standart bo'lmagan) qiymatlar
            const defaults = { companyName: 'SICRM', companyLogo: null, loginIconMode: 'animation', loginPageTitle: '', sidebarLogoSize: 'medium' }
            const local = {}
            // 'Shina CRM' — platformaning eski standart nomi, o'rnatilgan brend hisoblanmaydi
            BRANDING_KEYS.forEach(k => { if (cur[k] != null && cur[k] !== '' && cur[k] !== defaults[k] && !(k === 'companyName' && cur[k] === 'Shina CRM')) local[k] = cur[k] })
            if (Object.keys(local).length) await saveBranding(local)
          }
        } catch { /* oflayn — mahalliy qiymatlar qoladi */ }
      },
      setPriceListSettings: (s) => set(state => ({ priceListSettings: { ...state.priceListSettings, ...s } })),

      // Sidebar konfiguratsiyasi
      sidebarLabels: {
        dashboard: '',
        warehouse: '',
        sales: '',
        customers: '',
        income: '',
        expenses: '',
        reports: '',
        aiAgent: '',
        management: '',
      },
      hiddenPages: [],

      // AI Agent — API kaliti va chuqurroq sozlamalar (Admin panelida boshqariladi)
      aiApiKey: '',
      aiApiProvider: 'anthropic', // anthropic | openai
      aiModel: 'claude-sonnet',
      aiMonthlyLimit: 0, // 0 = cheklanmagan
      aiAgentEnabled: true,
      aiAutoAnalysisHour: 23, // Kunlik avtomatik tahlil vaqti (soat, 0-23)
      setAiAutoAnalysisHour: (h) => set({ aiAutoAnalysisHour: Number(h) }),
      setAiApiKey: (key) => set({ aiApiKey: key }),
      setAiApiProvider: (provider) => set({ aiApiProvider: provider }),
      setAiModel: (model) => set({ aiModel: model }),
      setAiMonthlyLimit: (limit) => set({ aiMonthlyLimit: limit }),
      toggleAiAgentEnabled: () => set(s => ({ aiAgentEnabled: !s.aiAgentEnabled })),

      setSidebarLabel: (key, label, lang) => set(s => {
        const prev = s.sidebarLabels[key]
        const prevObj = (prev && typeof prev === 'object') ? prev : {}
        return { sidebarLabels: { ...s.sidebarLabels, [key]: { ...prevObj, [lang]: label } } }
      }),
      toggleHiddenPage: (key) => set(s => ({
        hiddenPages: s.hiddenPages.includes(key)
          ? s.hiddenPages.filter(p => p !== key)
          : [...s.hiddenPages, key]
      })),
      setUsdRate: (rate) => set({ usdRate: rate }),
      toggleDownloadEnabled: () =>
        set(s => ({ downloadEnabled: !s.downloadEnabled })),

      // Ogohlantirish toggle
      toggleNotification: (type) =>
        set(s => ({
          notificationSettings: {
            ...s.notificationSettings,
            [type]: !(s.notificationSettings[type] ?? true)
          }
        })),

      // Manbalar
      addSource: ({ id, label }) =>
        set(s => ({ sources: [...s.sources, { id, label, isActive: true }] })),
      updateSource: (id, data) =>
        set(s => ({ sources: s.sources.map(x => x.id === id ? { ...x, ...data } : x) })),
      toggleSource: (id) =>
        set(s => ({ sources: s.sources.map(x => x.id === id ? { ...x, isActive: !x.isActive } : x) })),
      removeSource: (id) =>
        set(s => ({ sources: s.sources.filter(x => x.id !== id) })),

      // Mahsulot kategoriyalari
      loadProductCategories: async () => {
        try {
          const cats = await getCategories()
          if (cats.length > 0) set({ productCategories: cats })
        } catch {}
      },
      addProductCategory: async ({ id, label, labelRu, turnoverDays }) => {
        try {
          const created = await createCategory({ id, label, labelRu: labelRu || label, sortOrder: 0 })
          set(s => ({ productCategories: [...s.productCategories, { ...created, turnoverDays: turnoverDays || 30 }] }))
        } catch {
          set(s => ({ productCategories: [...s.productCategories, { id, label, turnoverDays: turnoverDays || 30, isActive: true }] }))
        }
      },
      updateProductCategory: async (id, data) => {
        try {
          const updated = await apiUpdateCat(id, { label: data.label, labelRu: data.labelRu || data.label, isActive: data.isActive ?? true })
          set(s => ({ productCategories: s.productCategories.map(x => x.id === id ? { ...x, ...updated, turnoverDays: data.turnoverDays ?? x.turnoverDays } : x) }))
        } catch {
          set(s => ({ productCategories: s.productCategories.map(x => x.id === id ? { ...x, ...data } : x) }))
        }
      },
      removeProductCategory: async (id) => {
        set(s => ({ productCategories: s.productCategories.filter(x => x.id !== id) }))
        try { await apiDeleteCat(id) } catch {}
      },
      toggleProductCategory: async (id) => {
        try {
          const updated = await apiToggleCat(id)
          set(s => ({ productCategories: s.productCategories.map(x => x.id === id ? { ...x, isActive: updated.isActive } : x) }))
        } catch {
          set(s => ({ productCategories: s.productCategories.map(x => x.id === id ? { ...x, isActive: !x.isActive } : x) }))
        }
      },

      // Maqsadlar
      setMonthlyTarget: (month, amount) =>
        set(s => ({ monthlyTargets: { ...s.monthlyTargets, [month]: amount } })),
      setEmployeeTarget: (empId, month, amount) =>
        set(s => ({
          employeeTargets: {
            ...s.employeeTargets,
            [empId]: { ...(s.employeeTargets[empId] || {}), [month]: amount }
          }
        })),

      // Muddatli to'lov tashkilotlari
      addInstallmentOrg: (org) =>
        set(s => ({ installmentOrganizations: [...s.installmentOrganizations, { ...org, isActive: true }] })),
      updateInstallmentOrg: (id, data) =>
        set(s => ({ installmentOrganizations: s.installmentOrganizations.map(x => x.id === id ? { ...x, ...data } : x) })),
      toggleInstallmentOrg: (id) =>
        set(s => ({ installmentOrganizations: s.installmentOrganizations.map(x => x.id === id ? { ...x, isActive: !x.isActive } : x) })),
      removeInstallmentOrg: (id) =>
        set(s => ({ installmentOrganizations: s.installmentOrganizations.filter(x => x.id !== id) })),

      // Xodimlar
      loadEmployees: async () => {
        try {
          const emps = await getEmployees()
          const current = get().employees
          const merged = emps.map(e => {
            const existing = current.find(x => x.id === e.id)
            return { ...e, password: existing?.password || '' }
          })
          set({ employees: merged.length > 0 ? merged : [] })
        } catch {}
      },
      addEmployee: async (employee) => {
        const created = await createEmployee(employee)
        set(s => ({ employees: [...s.employees, { ...created, password: employee.password || '' }] }))
        return created
      },
      updateEmployee: async (id, data) => {
        set(s => ({ employees: s.employees.map(x => x.id === id ? { ...x, ...data } : x) }))
        try { await apiUpdateEmp(id, { ...get().employees.find(e => e.id === id), ...data }) } catch {}
      },
      removeEmployee: async (id) => {
        set(s => ({ employees: s.employees.map(x => x.id === id ? { ...x, isActive: false, deactivatedAt: new Date().toISOString() } : x) }))
        try { await deactivateEmployee(id) } catch {}
      },
      restoreEmployee: async (id) => {
        set(s => ({ employees: s.employees.map(x => x.id === id ? { ...x, isActive: true, deactivatedAt: null } : x) }))
        try { await activateEmployee(id) } catch {}
      },
      permanentlyDeleteEmployee: async (id) => {
        set(s => ({ employees: s.employees.filter(x => x.id !== id) }))
        try { await deleteEmployee(id) } catch {}
      },

      // Boshqaruvchi o'chirish so'rovi — Admin tasdiqlamaguncha xodim faol qoladi
      requestEmployeeDeletion: async (id) => {
        set(s => ({ employees: s.employees.map(x => x.id === id ? { ...x, pendingDelete: true, pendingDeleteAt: new Date().toISOString() } : x) }))
        try { await apiUpdateEmp(id, { ...get().employees.find(e => e.id === id), pendingDelete: true, pendingDeleteAt: new Date().toISOString() }) } catch {}
      },
      approveEmployeeDeletion: async (id) => {
        set(s => ({ employees: s.employees.map(x => x.id === id ? { ...x, isActive: false, deactivatedAt: new Date().toISOString(), pendingDelete: false, pendingDeleteAt: null } : x) }))
        try { await deactivateEmployee(id) } catch {}
      },
      cancelEmployeeDeletion: async (id) => {
        set(s => ({ employees: s.employees.map(x => x.id === id ? { ...x, pendingDelete: false, pendingDeleteAt: null, lastEditedBy: 'admin' } : x) }))
        try { await apiUpdateEmp(id, { ...get().employees.find(e => e.id === id), pendingDelete: false, pendingDeleteAt: null }) } catch {}
      },
    }),
    {
      name: 'goodtires-settings',
      version: 5,
      migrate: (state, version) => {
        if (version < 5) {
          state.sidebarLabels = {
            dashboard: '',
            warehouse: '',
            sales: '',
            customers: '',
            income: '',
            expenses: '',
            reports: '',
            aiAgent: '',
            management: '',
          }
        }
        if (version < 3) {
          state.roleDeniedNodes = {
            ...state.roleDeniedNodes,
            storekeeper: state.roleDeniedNodes?.storekeeper || [
              'warehouse.stock.income_price',
              'warehouse.income.financial',
            ],
            technician: state.roleDeniedNodes?.technician || [
              'warehouse.stock.income_price',
              'warehouse.income.financial',
            ],
          }
        }
        if (version < 4) {
          state.roleAccessTrees = {
            ...state.roleAccessTrees,
            storekeeper: ['dashboard','warehouse','ai_agent'],
            technician: ['dashboard','warehouse','ai_agent'],
          }
        }
        if (version < 2) {
          // Test xodimlar o'chirildi — backend dan yuklanadi
          state.employees = []
        }
        return state
      },
    }
  )
)
