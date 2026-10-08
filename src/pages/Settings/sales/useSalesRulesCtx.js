import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../../../store/settingsStore'
import { getSales } from '../../../api/salesService'

const MONTHS_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const ym = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

// Sozlamalar → Savdo qoidalari (avval Boshqaruv → Sozlamalar/Chegirmalar): kurs, rejalar, manbalar,
// nasiya tashkilotlari, chegirma chegaralari, ogohlantirish sozlamalari. Hammasi serverda (settingsStore → app_settings.business).
export const useSalesRulesCtx = ({ withSales = true } = {}) => {
  const { t, i18n } = useTranslation()
  const s = useSettingsStore()
  const MONTHS = i18n.language === 'ru' ? MONTHS_RU : MONTHS_UZ

  const [MOCK_SALES, setSales] = useState([])
  useEffect(() => { if (withSales) getSales().then(setSales).catch(() => {}) }, [withSales])

  const [usdForm, setUsdForm] = useState(s.usdRate)
  const [usdSaved, setUsdSaved] = useState(false)
  useEffect(() => { setUsdForm(s.usdRate) }, [s.usdRate])

  const [monthlyTargetMonth, setMonthlyTargetMonth] = useState(ym())
  const [monthlyTargetAmount, setMonthlyTargetAmount] = useState('')
  const [monthlyTargetSaved, setMonthlyTargetSaved] = useState(false)
  const [empTargetId, setEmpTargetId] = useState('')
  const [empTargetMonth, setEmpTargetMonth] = useState(ym())
  const [empTargetAmount, setEmpTargetAmount] = useState('')
  const [empTargetSaved, setEmpTargetSaved] = useState(false)
  useEffect(() => {
    const active = s.employees.filter(e => e.isActive)
    if (active.length && !empTargetId) setEmpTargetId(active[0].id)
  }, [s.employees, empTargetId])

  const [showSourceModal, setShowSourceModal] = useState(false)
  const [newSourceLabel, setNewSourceLabel] = useState('')
  const [editingSourceId, setEditingSourceId] = useState(null)
  const [editingSourceValue, setEditingSourceValue] = useState('')
  const [deleteSourceConfirm, setDeleteSourceConfirm] = useState(null)

  const [showOrgModal, setShowOrgModal] = useState(false)
  const [editingOrg, setEditingOrg] = useState(null)
  const [deleteOrgConfirm, setDeleteOrgConfirm] = useState(null)
  const [orgForm, setOrgForm] = useState({ name: '', commissionPercent: 0, paymentSchedule: 'weekly_2x', maxTermMonths: 12, availableTerms: [], startDate: '' })

  const [discountForm, setDiscountForm] = useState({ discountSmallMax: s.discountSmallMax, discountMediumMax: s.discountMediumMax })
  useEffect(() => { setDiscountForm({ discountSmallMax: s.discountSmallMax, discountMediumMax: s.discountMediumMax }) }, [s.discountSmallMax, s.discountMediumMax])
  const [discountSaved, setDiscountSaved] = useState(false)
  const saveDiscounts = () => {
    s.updateSettings({ discountSmallMax: Number(discountForm.discountSmallMax) || 0, discountMediumMax: Number(discountForm.discountMediumMax) || 0 })
    setDiscountSaved(true)
    setTimeout(() => setDiscountSaved(false), 2000)
  }

  const ALL_TERM_OPTIONS = [
    { value: 0.25, label: `1 ${t('mgmt_term_week')}` },
    { value: 0.5, label: `2 ${t('mgmt_term_week')}` },
    { value: 1, label: `1 ${t('mgmt_term_month')}` },
    { value: 3, label: `3 ${t('mgmt_term_month')}` },
    { value: 6, label: `6 ${t('mgmt_term_month')}` },
    { value: 12, label: `12 ${t('mgmt_term_month')}` },
    { value: 24, label: `24 ${t('mgmt_term_month')}` },
  ]

  // Oxirgi 6 oy + keyingi 3 oy
  const getMonthOptions = () => {
    const now = new Date()
    return Array.from({ length: 10 }, (_, k) => {
      const d = new Date(now.getFullYear(), now.getMonth() + k - 6, 1)
      return { key: ym(d), label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
    })
  }

  const flattenedEmployeeTargets = []
  Object.entries(s.employeeTargets || {}).forEach(([empId, monthsObj]) => {
    const emp = s.employees.find(e => e.id === empId)
    if (!emp) return
    Object.entries(monthsObj).forEach(([month, amount]) => flattenedEmployeeTargets.push({ empId, empName: emp.name, month, amount }))
  })
  flattenedEmployeeTargets.sort((a, b) => b.month.localeCompare(a.month))

  const now = new Date()
  return {
    t, som: t('unit_som'), MONTHS, currentYear: now.getFullYear(), currentMonth: now.getMonth() + 1,
    MOCK_SALES, items: [],
    employees: s.employees, notificationSettings: s.notificationSettings, toggleNotification: s.toggleNotification,
    usdRate: s.usdRate, setUsdRate: s.setUsdRate, usdForm, setUsdForm, usdSaved, setUsdSaved,
    monthlyTargets: s.monthlyTargets, setMonthlyTarget: s.setMonthlyTarget, setEmployeeTarget: s.setEmployeeTarget,
    monthlyTargetMonth, setMonthlyTargetMonth, monthlyTargetAmount, setMonthlyTargetAmount, monthlyTargetSaved, setMonthlyTargetSaved,
    empTargetId, setEmpTargetId, empTargetMonth, setEmpTargetMonth, empTargetAmount, setEmpTargetAmount, empTargetSaved, setEmpTargetSaved,
    flattenedEmployeeTargets, getMonthOptions,
    sources: s.sources, addSource: s.addSource, updateSource: s.updateSource, toggleSource: s.toggleSource, removeSource: s.removeSource,
    showSourceModal, setShowSourceModal, newSourceLabel, setNewSourceLabel,
    editingSourceId, setEditingSourceId, editingSourceValue, setEditingSourceValue, deleteSourceConfirm, setDeleteSourceConfirm,
    installmentOrganizations: s.installmentOrganizations, addInstallmentOrg: s.addInstallmentOrg, updateInstallmentOrg: s.updateInstallmentOrg,
    toggleInstallmentOrg: s.toggleInstallmentOrg, removeInstallmentOrg: s.removeInstallmentOrg,
    showOrgModal, setShowOrgModal, editingOrg, setEditingOrg, deleteOrgConfirm, setDeleteOrgConfirm, orgForm, setOrgForm, ALL_TERM_OPTIONS,
    discountForm, setDiscountForm, discountSaved, saveDiscounts,
  }
}

export default useSalesRulesCtx
