"""Customers.jsx ni bo'lish skripti."""
import os

SRC     = r'C:\Users\Umidjon\Desktop\shina_crm\src\pages\Customers.jsx'
OUT_DIR = r'C:\Users\Umidjon\Desktop\shina_crm\src\pages\Customers'

with open(SRC, encoding='utf-8') as f:
    lines = f.readlines()

os.makedirs(os.path.join(OUT_DIR, 'components'), exist_ok=True)

def find_line(keyword, start=0):
    for i in range(start, len(lines)):
        if keyword in lines[i]:
            return i
    return -1

def get_lines(start, end):
    return ''.join(lines[start:end]).replace('﻿', '')

# ── Chegaralar ────────────────────────────────────────────────────────────────
comp_start   = find_line('const Customers = ')        # line 27 (0-indexed: 26)
return_line  = find_line('  return (', comp_start)    # main return
add_modal    = find_line('ADD CUSTOMER MODAL')
prof_modal   = find_line('CUSTOMER PROFILE MODAL')
edit_modal   = find_line('EDIT CUSTOMER MODAL')
del_modal    = find_line('DELETE CONFIRM MODAL')
merge_banner = find_line("Qo'lda birlashtirish uchun banner")
merge_modal  = find_line('MERGE MODAL')
end_line     = find_line('export default Customers')

print(f"comp_start:   {comp_start+1}")
print(f"return_line:  {return_line+1}")
print(f"add_modal:    {add_modal+1}")
print(f"prof_modal:   {prof_modal+1}")
print(f"edit_modal:   {edit_modal+1}")
print(f"del_modal:    {del_modal+1}")
print(f"merge_banner: {merge_banner+1}")
print(f"merge_modal:  {merge_modal+1}")
print(f"end_line:     {end_line+1}")

# Helpers (lines 0..comp_start)
helpers_body = get_lines(0, comp_start)

# State + handlers (lines comp_start..return_line)
state_section = get_lines(comp_start, return_line)

# Main table JSX (return_line..add_modal-1 comment line)
# We need the return header up to just before ADD CUSTOMER MODAL comment
table_section = get_lines(return_line, add_modal - 1)

# Find what closes the main content (</AnimatePresence>\n</motion.div>)
# It's the last 3 lines before export
close_section = get_lines(end_line - 4, end_line)

COMMON_IMPORTS = """import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
"""

CTX_KEYS = """    customers, setCustomers, loading,
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

# ── 1. AddCustomerModal ────────────────────────────────────────────────────────
add_body = get_lines(add_modal - 1, prof_modal - 1)
# Remove first line (comment) — keep it, it helps readability
add_content = COMMON_IMPORTS + """import { UserPlus, X, Phone, User, Calendar, Star } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { useShopStore } from '../../store/shopStore'
import { ShopPickerModal } from '../../components/ShopPickerModal'

const AddCustomerModal = ({ ctx }) => {
  const { t } = useTranslation()
  const {
""" + CTX_KEYS + """
  } = ctx
  return (
""" + add_body + """
  )
}

export default AddCustomerModal
"""
with open(os.path.join(OUT_DIR, 'components', 'AddCustomerModal.jsx'), 'w', encoding='utf-8') as f:
    f.write(add_content)
print(f'AddCustomerModal.jsx ({prof_modal - add_modal} qator)')

# ── 2. CustomerProfileModal ────────────────────────────────────────────────────
prof_body = get_lines(prof_modal - 1, edit_modal - 1)
prof_content = COMMON_IMPORTS + """import { X, CreditCard, History, Calendar, TrendingUp, AlertCircle, CheckCircle, Star, Phone, DollarSign, Package, Check, Info, User, Pencil, Trash2, Recycle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { MOCK_SALES, MOCK_USED_STOCK, MOCK_USED_SALES } from '../../api/mock'

const CustomerProfileModal = ({ ctx }) => {
  const { t } = useTranslation()
  const {
""" + CTX_KEYS + """
  } = ctx
  return (
""" + prof_body + """
  )
}

export default CustomerProfileModal
"""
with open(os.path.join(OUT_DIR, 'components', 'CustomerProfileModal.jsx'), 'w', encoding='utf-8') as f:
    f.write(prof_content)
print(f'CustomerProfileModal.jsx ({edit_modal - prof_modal} qator)')

# ── 3. EditCustomerModal ───────────────────────────────────────────────────────
edit_body = get_lines(edit_modal - 1, del_modal - 1)
edit_content = COMMON_IMPORTS + """import { Pencil, X, Phone, User, Calendar, Star } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { useShopStore } from '../../store/shopStore'
import { ShopPickerModal } from '../../components/ShopPickerModal'

const EditCustomerModal = ({ ctx }) => {
  const { t } = useTranslation()
  const {
""" + CTX_KEYS + """
  } = ctx
  return (
""" + edit_body + """
  )
}

export default EditCustomerModal
"""
with open(os.path.join(OUT_DIR, 'components', 'EditCustomerModal.jsx'), 'w', encoding='utf-8') as f:
    f.write(edit_content)
print(f'EditCustomerModal.jsx ({del_modal - edit_modal} qator)')

# ── 4. DeleteModal ─────────────────────────────────────────────────────────────
del_body = get_lines(del_modal - 1, merge_banner - 1)
del_content = COMMON_IMPORTS + """import { Trash2, X } from 'lucide-react'

const DeleteModal = ({ ctx }) => {
  const { t } = useTranslation()
  const {
""" + CTX_KEYS + """
  } = ctx
  return (
""" + del_body + """
  )
}

export default DeleteModal
"""
with open(os.path.join(OUT_DIR, 'components', 'DeleteModal.jsx'), 'w', encoding='utf-8') as f:
    f.write(del_content)
print(f'DeleteModal.jsx ({merge_banner - del_modal} qator)')

# ── 5. MergeModal (banner + modal) ────────────────────────────────────────────
merge_body = get_lines(merge_banner - 1, end_line - 4)
merge_content = COMMON_IMPORTS + """import { GitMerge, Link2, X, Check, AlertCircle, User, Phone } from 'lucide-react'

const MergeModal = ({ ctx }) => {
  const { t } = useTranslation()
  const {
""" + CTX_KEYS + """
  } = ctx
  return (
""" + merge_body + """
  )
}

export default MergeModal
"""
with open(os.path.join(OUT_DIR, 'components', 'MergeModal.jsx'), 'w', encoding='utf-8') as f:
    f.write(merge_content)
print(f'MergeModal.jsx ({end_line - 4 - merge_banner} qator)')

# ── 6. index.jsx ──────────────────────────────────────────────────────────────
index_content = """import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, UserPlus, Eye,
  TrendingUp, GitMerge, Star
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../store/settingsStore'
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, mergeCustomers, MOCK_SALES, MOCK_USED_STOCK, MOCK_USED_SALES } from '../api/mock'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useShopStore } from '../store/shopStore'
import { ShopPickerModal } from '../components/ShopPickerModal'
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

""" + state_section + """
  const ctx = {
    customers, setCustomers, loading,
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
    formatPrice: formatPriceRaw, LOYALTY_CONFIG,
  }

""" + table_section + """
      <AddCustomerModal     ctx={ctx} />
      <CustomerProfileModal ctx={ctx} />
      <EditCustomerModal    ctx={ctx} />
      <DeleteModal          ctx={ctx} />
      <MergeModal           ctx={ctx} />
""" + close_section + """
export default Customers
"""

with open(os.path.join(OUT_DIR, 'index.jsx'), 'w', encoding='utf-8') as f:
    f.write(index_content)
print('index.jsx yozildi')
print('Tayyor!')
