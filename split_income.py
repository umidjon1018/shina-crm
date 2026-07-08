"""Income.jsx ni bo'lish skripti."""
import os

SRC     = r'C:\Users\Umidjon\Desktop\shina_crm\src\pages\Income.jsx'
OUT_DIR = r'C:\Users\Umidjon\Desktop\shina_crm\src\pages\Income'

with open(SRC, encoding='utf-8') as f:
    lines = f.readlines()

os.makedirs(os.path.join(OUT_DIR, 'components'), exist_ok=True)
os.makedirs(os.path.join(OUT_DIR, 'tabs'),       exist_ok=True)

# ── 1. Helpers (lines 1-54, index 0-53) ─────────────────────────────────────
comp_start = next(i for i, l in enumerate(lines) if l.startswith('const Income = () =>'))
helpers_content = (
    "import React from 'react'\n\n"
    + ''.join(lines[0:comp_start])
    + "\nexport { formatPrice, formatUSD, statusConfig, getDueDays, calcRateDiff, calcPaymentRateDiff }\n"
)
# Remove BOM if present
helpers_content = helpers_content.replace('﻿', '')
with open(os.path.join(OUT_DIR, 'components', 'incHelpers.jsx'), 'w', encoding='utf-8') as f:
    f.write(helpers_content)
print(f'incHelpers.jsx ({comp_start} qator)')

# ── 2. Tab boundaries ────────────────────────────────────────────────────────
TAB_IDS = ['batches', 'suppliers', 'debts']
tab_starts = {}
for i, l in enumerate(lines):
    for tid in TAB_IDS:
        if f"{{activeTab === '{tid}'" in l and l.strip().endswith('('):
            tab_starts[tid] = i
            break

# return statement line
return_line = next(i for i, l in enumerate(lines) if l.rstrip() == '  return (')
# tab content wrapper line (before first tab)
tab_wrapper_line = tab_starts['batches'] - 1  # `      <div className="min-h-[500px]">`

# Tab ranges
sorted_tabs = sorted(tab_starts.items(), key=lambda x: x[1])
tab_ranges = {}
for idx, (tid, start) in enumerate(sorted_tabs):
    if idx + 1 < len(sorted_tabs):
        next_s = sorted_tabs[idx+1][1]
        # find closing )} before next tab
        end = next_s
        for j in range(next_s-1, start, -1):
            if lines[j].strip() == ')}':
                end = j + 1
                break
    else:
        # last tab: find closing )}
        close_ap = next(i for i in range(len(lines)-1, start, -1) if '</AnimatePresence>' in lines[i] or '    </motion.div>' in lines[i])
        end = start
        for j in range(close_ap-1, start, -1):
            if lines[j].strip() == ')}':
                end = j + 1
                break
    tab_ranges[tid] = (start, end)

print("Tab chegaralari:")
for tid, (s, e) in tab_ranges.items():
    print(f"  {tid}: lines {s+1}–{e} ({e-s} qator)")

# close section (after last tab)
last_end = max(e for _, e in tab_ranges.values())
close_section = ''.join(lines[last_end:])

# ── 3. Tab fayllar ───────────────────────────────────────────────────────────
TAB_IMPORTS = {
    'batches': """import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Truck, Edit3, Search, Plus, DollarSign, Clock, ChevronDown, ChevronUp, Check, X, Trash2, ExternalLink, Filter, Info, CheckCircle, Wallet, BarChart3, TrendingUp, AlertCircle } from 'lucide-react'
import { formatPrice, formatUSD, statusConfig, getDueDays, calcRateDiff, calcPaymentRateDiff } from '../components/incHelpers'
""",
    'suppliers': """import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Truck, Plus, Edit3, X, Check, ExternalLink, DollarSign, Package, AlertCircle } from 'lucide-react'
import { formatPrice, formatUSD, statusConfig, getDueDays } from '../components/incHelpers'
""",
    'debts': """import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, Clock, AlertCircle, Check, X, ChevronDown, ChevronUp, Wallet, TrendingUp } from 'lucide-react'
import { formatPrice, formatUSD, statusConfig, getDueDays, calcRateDiff, calcPaymentRateDiff } from '../components/incHelpers'
""",
}

TAB_NAMES = {
    'batches':   'BatchesTab',
    'suppliers': 'SuppliersTab',
    'debts':     'DebtsTab',
}

for tid, (start, end) in tab_ranges.items():
    tab_lines = lines[start:end]
    inner = tab_lines[1:]  # remove `{activeTab === 'xxx' && (`
    while inner and inner[-1].strip() in ('', ')}', '})'):
        inner.pop()

    body = ''.join(inner)
    name = TAB_NAMES[tid]
    imp  = TAB_IMPORTS[tid]

    content = f"""{imp}
const {name} = ({{ ctx }}) => {{
  const {{ t }} = useTranslation()
  const {{
    user, isPrivileged, som,
    batches, setBatches, suppliers, setSuppliers, loading,
    activeTab, setActiveTab,
    shopBatches, filteredBatches,
    showSupplierModal, setShowSupplierModal,
    editingSupplier, setEditingSupplier,
    showPaymentModal, setShowPaymentModal,
    expandedBatch, setExpandedBatch,
    showLinkModal, setShowLinkModal,
    filterSupplier, setFilterSupplier,
    filterStatus, setFilterStatus,
    searchQuery, setSearchQuery,
    showNewBatchModal, setShowNewBatchModal,
    newBatchForm, setNewBatchForm,
    editingBatch, setEditingBatch,
    editingPayment, setEditingPayment,
    showSupplierDetail, setShowSupplierDetail,
    contractDialog, setContractDialog,
    currentPage, setCurrentPage, ITEMS_PER_PAGE,
    search1, setSearch1, filter1Supplier, setFilter1Supplier,
    filter1Status, setFilter1Status, page1, setPage1,
    search2, setSearch2, filter2Supplier, setFilter2Supplier,
    filter2Status, setFilter2Status, page2, setPage2,
    PAGE_SIZE, deletePaymentConfirm, setDeletePaymentConfirm,
    usdRate, productCategories, bump,
    loadData, pagedBatches1, totalPages1, pagedBatches2, totalPages2,
    supplierStats,
  }} = ctx

  return (
{body}
  )
}}

export default {name}
"""
    fname = f'{name}.jsx'
    with open(os.path.join(OUT_DIR, 'tabs', fname), 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'{fname} ({end - start} qator)')

# ── 4. index.jsx ─────────────────────────────────────────────────────────────
state_section = ''.join(lines[comp_start:return_line])

# return header: from `return (` to tab wrapper (inclusive of <div min-h>)
return_header = ''.join(lines[return_line:tab_wrapper_line+1])

ctx_obj = """
  const ctx = {
    user, isPrivileged, som,
    batches, setBatches, suppliers, setSuppliers, loading,
    activeTab, setActiveTab,
    shopBatches, filteredBatches,
    showSupplierModal, setShowSupplierModal,
    editingSupplier, setEditingSupplier,
    showPaymentModal, setShowPaymentModal,
    expandedBatch, setExpandedBatch,
    showLinkModal, setShowLinkModal,
    filterSupplier, setFilterSupplier,
    filterStatus, setFilterStatus,
    searchQuery, setSearchQuery,
    showNewBatchModal, setShowNewBatchModal,
    newBatchForm, setNewBatchForm,
    editingBatch, setEditingBatch,
    editingPayment, setEditingPayment,
    showSupplierDetail, setShowSupplierDetail,
    contractDialog, setContractDialog,
    currentPage, setCurrentPage, ITEMS_PER_PAGE,
    search1, setSearch1, filter1Supplier, setFilter1Supplier,
    filter1Status, setFilter1Status, page1, setPage1,
    search2, setSearch2, filter2Supplier, setFilter2Supplier,
    filter2Status, setFilter2Status, page2, setPage2,
    PAGE_SIZE, deletePaymentConfirm, setDeletePaymentConfirm,
    usdRate, productCategories, bump,
    loadData, pagedBatches1, totalPages1, pagedBatches2, totalPages2,
    supplierStats,
  }

"""

tab_render = """        <BatchesTab   ctx={ctx} />
        <SuppliersTab ctx={ctx} />
        <DebtsTab     ctx={ctx} />
"""

index_imports = """import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Truck, AlertCircle, Edit3, Search, Plus,
  DollarSign, Clock, ChevronDown, ChevronUp, Check, X,
  Trash2, ExternalLink, Filter, Info, CheckCircle, Wallet,
  BarChart3, TrendingUp
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { getCategoryColor } from '../../utils/categoryColors'
import {
  MOCK_PRODUCTS, MOCK_ITEMS, MOCK_INCOME_BATCHES,
  getIncomeBatches, getSuppliers,
  addSupplier, updateSupplier,
  addPaymentToBatch, updateIncomeBatch,
  linkBatchToSupplier, addBatch
} from '../../api/mock'
import { useDataStore } from '../../store/dataStore'
import { useShopStore } from '../../store/shopStore'
import { formatPrice, formatUSD, statusConfig, getDueDays, calcRateDiff, calcPaymentRateDiff } from './components/incHelpers'
import BatchesTab   from './tabs/BatchesTab'
import SuppliersTab from './tabs/SuppliersTab'
import DebtsTab     from './tabs/DebtsTab'

"""

# Check if there are computed variables between state and return
# (pagedBatches1, totalPages1, supplierStats etc.)
# These are in state_section already since it's lines[comp_start:return_line]

index_content = (
    index_imports
    + state_section
    + ctx_obj
    + return_header
    + tab_render
    + '      </div>\n'   # close min-h div
    + close_section
)

with open(os.path.join(OUT_DIR, 'index.jsx'), 'w', encoding='utf-8') as f:
    f.write(index_content)
print('index.jsx yozildi')
print('Tayyor!')
