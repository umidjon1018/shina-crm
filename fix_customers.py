"""Customers/index.jsx ni to'g'ri qayta yozish."""
import subprocess, os

# Git dan original Customers.jsx ni ol
result = subprocess.run(
    ['git', 'show', '964e4e4b^:src/pages/Customers.jsx'],
    cwd=r'C:\Users\Umidjon\Desktop\shina_crm',
    capture_output=True, text=True, encoding='utf-8'
)
lines = result.stdout.splitlines(keepends=True)
print(f"Original: {len(lines)} qator")

OUT_DIR = r'C:\Users\Umidjon\Desktop\shina_crm\src\pages\Customers'

def find_line(keyword, start=0):
    for i in range(start, len(lines)):
        if keyword in lines[i]:
            return i
    return -1

def find_exact(pattern, start=0):
    for i in range(start, len(lines)):
        if lines[i].rstrip() == pattern:
            return i
    return -1

comp_start   = find_line('const Customers = () =>')  # 26
loading_ret  = find_line('  if (loading) return (', comp_start)  # 399
main_ret     = find_exact('  return (', comp_start)   # 405
add_modal    = find_line('ADD CUSTOMER MODAL')         # 636
prof_modal   = find_line('CUSTOMER PROFILE MODAL')
edit_modal   = find_line('EDIT CUSTOMER MODAL')
del_modal    = find_line('DELETE CONFIRM MODAL')
merge_banner = find_line("Qo'lda birlashtirish uchun banner")
merge_modal  = find_line('MERGE MODAL')

print(f"comp_start:  {comp_start+1}")
print(f"loading_ret: {loading_ret+1}")
print(f"main_ret:    {main_ret+1}")
print(f"add_modal:   {add_modal+1}")

def get(s, e):
    return ''.join(lines[s:e])

# ── Imports va helpers (lines 0-26) ───────────────────────────────────────────
original_imports = get(0, comp_start)

# ── State section: lines 27-399 (comp_start to loading_ret) ───────────────────
state_section = get(comp_start, loading_ret)

# ── Loading return: lines 400-405 ─────────────────────────────────────────────
loading_section = get(loading_ret, main_ret)

# ── Table JSX: lines 406-635 ──────────────────────────────────────────────────
table_section = get(main_ret, add_modal - 1)

# ── Close section: last 4 lines ───────────────────────────────────────────────
end_line = find_line('export default Customers')
close_section = get(end_line - 4, end_line)

CTX = """
  const ctx = {
    customers, setCustomers, loading,
    search, setSearch,
    customersPage, setCustomersPage, CUSTOMERS_PER_PAGE,
    showAddModal, setShowAddModal,
    showProfile, setShowProfile,
    modalTab, setModalTab,
    editTarget, setEditTarget,
    deleteTarget, setDeleteTarget,
    mergeModal, setMergeModal,
    showOverdueModal, setShowOverdueModal,
    newCust, setNewCust,
    shopPickCallback, setShopPickCallback,
    activeFilter, setActiveFilter,
    custSort, setCustSort,
    mergeSource, setMergeSource,
    usdRate, som, user, bump,
    handleAddCustomer, handleEditSave, handleEditOpen,
    handleDeleteConfirm, doMerge, handleManualMergeClick,
    handleInstPaymentSubmit,
    selectedShopId,
    stats, filtered,
    LOYALTY_CONFIG, formatPrice: formatPriceRaw,
    loyaltyMinAmount, loyaltyVisitsRequired, loyaltyDiscountPercent, silverVisits,
    CustSortIcon, custSort, setCustSort,
  }

"""

# New imports for index.jsx
index_imports = """import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, UserPlus, Eye,
  TrendingUp, GitMerge, Star, Phone,
  AlertCircle, CheckCircle, DollarSign
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../../store/settingsStore'
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, mergeCustomers, MOCK_SALES, MOCK_USED_STOCK, MOCK_USED_SALES } from '../../api/mock'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useShopStore } from '../../store/shopStore'
import { ShopPickerModal } from '../../components/ShopPickerModal'
import AddCustomerModal     from './components/AddCustomerModal'
import CustomerProfileModal from './components/CustomerProfileModal'
import EditCustomerModal    from './components/EditCustomerModal'
import DeleteModal          from './components/DeleteModal'
import MergeModal           from './components/MergeModal'

const formatPriceRaw = (n) => n?.toLocaleString('uz-UZ')

const LOYALTY_CONFIG = {
  bronze: { label: 'Bronze', color: 'bg-orange-100 text-orange-700', next: 5, nextLabel: 'Silver' },
  silver: { label: 'Silver', color: 'bg-slate-100 text-slate-700', next: 10, nextLabel: 'Gold' },
  gold:   { label: 'Gold',   color: 'bg-yellow-100 text-yellow-700', next: null, nextLabel: null },
}

"""

index_content = (
    index_imports
    + state_section        # const Customers = () => { ... all state/handlers/CustSortIcon
    + CTX                  # const ctx = { ... }
    + loading_section      # if (loading) return (...)
    + table_section        # return ( <motion.div> ... table ... pagination ...
    + """      <AddCustomerModal     ctx={ctx} />
      <CustomerProfileModal ctx={ctx} />
      <EditCustomerModal    ctx={ctx} />
      <DeleteModal          ctx={ctx} />
      <MergeModal           ctx={ctx} />
"""
    + close_section        # </AnimatePresence> </motion.div> ) }
    + "\nexport default Customers\n"
)

with open(os.path.join(OUT_DIR, 'index.jsx'), 'w', encoding='utf-8') as f:
    f.write(index_content)
print("index.jsx yozildi")

# ── Modal destructuring fix ────────────────────────────────────────────────────
MODAL_CTX_DESTRUCTURE = """    customers, setCustomers, loading,
    search, setSearch,
    customersPage, setCustomersPage, CUSTOMERS_PER_PAGE,
    showAddModal, setShowAddModal,
    showProfile, setShowProfile,
    modalTab, setModalTab,
    editTarget, setEditTarget,
    deleteTarget, setDeleteTarget,
    mergeModal, setMergeModal,
    showOverdueModal, setShowOverdueModal,
    newCust, setNewCust,
    shopPickCallback, setShopPickCallback,
    activeFilter, setActiveFilter,
    custSort, setCustSort,
    mergeSource, setMergeSource,
    usdRate, som, user, bump,
    handleAddCustomer, handleEditSave, handleEditOpen,
    handleDeleteConfirm, doMerge, handleManualMergeClick,
    handleInstPaymentSubmit,
    selectedShopId,
    stats, filtered,
    LOYALTY_CONFIG, formatPrice,
    loyaltyMinAmount, loyaltyVisitsRequired, loyaltyDiscountPercent, silverVisits,
    CustSortIcon,"""

OLD_CTX_KEYS = """    customers, setCustomers, loading,
    search, setSearch, shopFilter, setShopFilter,
    page, setPage, PAGE_SIZE,
    showAddModal, setShowAddModal,
    showProfile, setShowProfile,
    modalTab, setModalTab,
    editTarget, setEditTarget,
    deleteTarget, setDeleteTarget,
    mergeModal, setMergeModal,
    showOverdueModal, setShowOverdueModal,
    overdueMergeSource, setOverdueMergeSource,
    usdRate, som, user, bump,
    handleAdd, handleEdit, handleDelete, handleMerge,
    handleInstallmentPay, handleOverdueMerge,
    selectedShopId, shops,
    stats, filtered, paged, totalPages,
    formatPrice, LOYALTY_CONFIG,"""

modal_files = [
    os.path.join(OUT_DIR, 'components', 'AddCustomerModal.jsx'),
    os.path.join(OUT_DIR, 'components', 'CustomerProfileModal.jsx'),
    os.path.join(OUT_DIR, 'components', 'EditCustomerModal.jsx'),
    os.path.join(OUT_DIR, 'components', 'DeleteModal.jsx'),
    os.path.join(OUT_DIR, 'components', 'MergeModal.jsx'),
]

for fpath in modal_files:
    with open(fpath, encoding='utf-8') as f:
        content = f.read()
    if OLD_CTX_KEYS in content:
        content = content.replace(OLD_CTX_KEYS, MODAL_CTX_DESTRUCTURE)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  {os.path.basename(fpath)} — tuzatildi")
    else:
        print(f"  {os.path.basename(fpath)} — eski ctx topilmadi (qo'lda tekshir)")

print("Tayyor!")
