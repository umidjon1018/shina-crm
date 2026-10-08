import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../../store/authStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { useNotificationStore } from '../../../store/notificationStore'
import { useDataStore } from '../../../store/dataStore'
import { updateBarcodeStatus } from '../../../api/itemService'
import { createProduct, deleteProduct, updateProductPrice } from '../../../api/productService'

// Ombor → Tovarlar (avval Boshqaruv → Tovarlar): katalog, narxlar, kategoriyalar, atributlar, barkodni qayta chop ruxsati.
// Ma'lumotlar Ombor sahifasidan keladi (qayta yuklanmaydi).
const ITEMS_PER_PAGE = 10

export const useProductsCtx = ({ products = [], batches = [], items = [], refresh }) => {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const { bump } = useDataStore()
  const settings = useSettingsStore()
  const {
    productCategories, addProductCategory, updateProductCategory, toggleProductCategory, removeProductCategory,
    productAttributeDefs, addProductAttributeDef, removeProductAttributeDef, addAttributeValue, removeAttributeValue,
    downloadEnabled, toggleDownloadEnabled, priceListSettings, setPriceListSettings, usdRate, notificationSettings,
  } = settings

  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteProductConfirm, setDeleteProductConfirm] = useState(null)
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [barcodePage, setBarcodePage] = useState(1)
  const [productsPage, setProductsPage] = useState(1)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [newCategory, setNewCategory] = useState({ label: '', turnoverDays: 30 })
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState(null)
  const [sortField, setSortField] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [productSearch, setProductSearch] = useState('')
  const [productCatFilter, setProductCatFilter] = useState('all')

  const batchId = selectedBatchId || batches[0]?.id || ''
  const filteredBarcodeItems = items.filter(i => i.batchId === batchId)
  const totalBarcodePages = Math.ceil(filteredBarcodeItems.length / ITEMS_PER_PAGE)
  const pagedBarcodeItems = filteredBarcodeItems.slice((barcodePage - 1) * ITEMS_PER_PAGE, barcodePage * ITEMS_PER_PAGE)

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  const sortedProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim()
    let list = [...products]
    if (q) {
      list = list.filter(p => [p.name, p.brand, p.size, p.country].some(v => (v || '').toLowerCase().includes(q)))
    }
    if (productCatFilter !== 'all') list = list.filter(p => p.category === productCatFilter)
    if (!sortField) return list
    return list.sort((a, b) => {
      const av = (a[sortField] ?? '').toString().toLowerCase()
      const bv = (b[sortField] ?? '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [sortField, sortDir, products, productSearch, productCatFilter])

  const pagedProducts = sortedProducts.slice((productsPage - 1) * ITEMS_PER_PAGE, productsPage * ITEMS_PER_PAGE)
  const totalProductPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE)

  // Chop etilgan/yuklangan barkodlarga qayta chop ruxsati (tanlangan partiya)
  const handleAllowReprint = async () => {
    const toUpdate = items.filter(i =>
      i.batchId === batchId &&
      (i.barcodeStatus === 'printed' || i.barcodeStatus === 'downloaded') &&
      i.status !== 'sold' && i.status !== 'returned'
    )
    if (!toUpdate.length) return
    await updateBarcodeStatus(toUpdate.map(i => i.id), { reprintAllowed: true })
    refresh?.()
    if (notificationSettings?.REPRINT_ALLOWED !== false) {
      addNotification({
        type: 'REPRINT_ALLOWED',
        severity: 'warning',
        title: 'Barkod qayta chop/yuklash ruxsati berildi',
        message: `${toUpdate.length} ta tovar uchun barkod qayta chop va yuklash ruxsati berildi`,
        titleKey: 'notif_title_reprint_allowed',
        messageKey: 'notif_msg_reprint_allowed',
        messageParams: { count: toUpdate.length },
        sellerId: user?.id,
        sellerName: user?.name,
        count: toUpdate.length,
      })
    }
  }

  return {
    t, user, som: t('unit_som'), barcodeSelectClass: user?.role === 'admin' ? '' : 'select-none', bump, usdRate,
    productCategories, updateProductCategory, toggleProductCategory, addProductCategory, removeProductCategory,
    productAttributeDefs, addProductAttributeDef, removeProductAttributeDef, addAttributeValue, removeAttributeValue,
    downloadEnabled, toggleDownloadEnabled, priceListSettings, setPriceListSettings,
    apiProducts: products, refreshProducts: refresh, createProduct, deleteProduct, updateProductPrice,
    editingProduct, setEditingProduct, deleteProductConfirm, setDeleteProductConfirm,
    batches, items, selectedBatchId: batchId, setSelectedBatchId, barcodePage, setBarcodePage,
    productsPage, setProductsPage, ITEMS_PER_PAGE, barcodeLoading: false,
    showCategoryForm, setShowCategoryForm, newCategory, setNewCategory,
    editingCategory, setEditingCategory, deleteCategoryConfirm, setDeleteCategoryConfirm,
    sortedProducts, pagedProducts, totalProductPages, sortField, sortDir, handleSort,
    filteredBarcodeItems, totalBarcodePages, pagedBarcodeItems, handleAllowReprint,
    productSearch, setProductSearch, productCatFilter, setProductCatFilter,
  }
}

export default useProductsCtx
