"""Expenses.jsx ni bo'lish skripti."""
import os

SRC     = r'C:\Users\Umidjon\Desktop\shina_crm\src\pages\Expenses.jsx'
OUT_DIR = r'C:\Users\Umidjon\Desktop\shina_crm\src\pages\Expenses'

with open(SRC, encoding='utf-8') as f:
    lines = f.readlines()

os.makedirs(os.path.join(OUT_DIR, 'components'), exist_ok=True)
os.makedirs(os.path.join(OUT_DIR, 'tabs'), exist_ok=True)

def find_line(keyword, start=0):
    for i in range(start, len(lines)):
        if keyword in lines[i]:
            return i
    return -1

def section(start_kw, end_kw, end_offset=0):
    s = find_line(start_kw)
    e = find_line(end_kw, s + 1)
    return s, e + end_offset

# ── Chegaralar ────────────────────────────────────────────────────────────────
helpers_start   = find_line('─── ICON MAP')
form_modal_start = find_line('─── EXPENSE FORM MODAL')
cap_modal_start  = find_line('─── CAPITAL FORM MODAL')
del_modal_start  = find_line('─── DELETE CONFIRM MODAL')
shop_tab_start   = find_line('const ShopExpensesTab = ')
sup_tab_start    = find_line('const SupplierPaymentsTab = ')
main_comp_start  = find_line('export const Expenses = ')
cap_tab_start    = find_line('const CapitalTabWithHeader = ')

print(f"helpers:      line {helpers_start+1}")
print(f"form_modal:   line {form_modal_start+1}")
print(f"cap_modal:    line {cap_modal_start+1}")
print(f"del_modal:    line {del_modal_start+1}")
print(f"shop_tab:     line {shop_tab_start+1}")
print(f"sup_tab:      line {sup_tab_start+1}")
print(f"main_comp:    line {main_comp_start+1}")
print(f"cap_tab:      line {cap_tab_start+1}")

def get_lines(start, end):
    return ''.join(lines[start:end]).replace('﻿', '')

# ── 1. expHelpers.jsx ─────────────────────────────────────────────────────────
helpers_body = get_lines(helpers_start, form_modal_start)
helpers_content = """import React from 'react'
import { ChevronLeft, ChevronRight, Building2, Zap, Users, Truck, Wrench, Megaphone, MoreHorizontal, Sparkles, Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'

""" + helpers_body + """
export { ICON_MAP, fmtUZS, fmtNum, fmtDate, today, CURRENT_MONTH, sortedCategories, isPrivileged, getCatLabel, PAGE_SIZE, monthLabel, StatCard, MonthFilterBar, Pagination }
"""
with open(os.path.join(OUT_DIR, 'components', 'expHelpers.jsx'), 'w', encoding='utf-8') as f:
    f.write(helpers_content)
print(f'expHelpers.jsx — OK')

# ── 2. ExpenseFormModal.jsx ────────────────────────────────────────────────────
efm_body = get_lines(form_modal_start, cap_modal_start)
efm_content = """import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wallet, Building2, Zap, Users, Truck, Wrench, Megaphone, MoreHorizontal, Sparkles, Monitor, Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { useShopStore } from '../../store/shopStore'
import { useSettingsStore } from '../../store/settingsStore'
import { ICON_MAP, fmtUZS, today, sortedCategories, getCatLabel } from './expHelpers'

""" + efm_body + """
export default ExpenseFormModal
"""
with open(os.path.join(OUT_DIR, 'components', 'ExpenseFormModal.jsx'), 'w', encoding='utf-8') as f:
    f.write(efm_content)
print(f'ExpenseFormModal.jsx — OK')

# ── 3. CapitalFormModal.jsx ────────────────────────────────────────────────────
cfm_body = get_lines(cap_modal_start, del_modal_start)
cfm_content = """import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { today } from './expHelpers'

""" + cfm_body + """
export default CapitalFormModal
"""
with open(os.path.join(OUT_DIR, 'components', 'CapitalFormModal.jsx'), 'w', encoding='utf-8') as f:
    f.write(cfm_content)
print(f'CapitalFormModal.jsx — OK')

# ── 4. DeleteModal.jsx ─────────────────────────────────────────────────────────
dm_body = get_lines(del_modal_start, shop_tab_start)
dm_content = """import React from 'react'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

""" + dm_body + """
export default DeleteModal
"""
with open(os.path.join(OUT_DIR, 'components', 'DeleteModal.jsx'), 'w', encoding='utf-8') as f:
    f.write(dm_content)
print(f'DeleteModal.jsx — OK')

# ── 5. ShopExpensesTab.jsx ─────────────────────────────────────────────────────
st_body = get_lines(shop_tab_start, sup_tab_start)
st_content = """import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, Wallet, TrendingDown, Plus, Search, Filter, Pencil, Trash2, X, RefreshCw, Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { useShopStore } from '../../store/shopStore'
import { ShopPickerModal } from '../../components/ShopPickerModal'
import { getExpenses, addExpense, updateExpense, deleteExpense, MOCK_EXPENSE_CATEGORIES } from '../../api/mock'
import { fmtUZS, fmtDate, today, CURRENT_MONTH, sortedCategories, getCatLabel, PAGE_SIZE, StatCard, MonthFilterBar, Pagination, ICON_MAP } from '../components/expHelpers'
import ExpenseFormModal from '../components/ExpenseFormModal'
import DeleteModal from '../components/DeleteModal'

""" + st_body + """
export default ShopExpensesTab
"""
with open(os.path.join(OUT_DIR, 'tabs', 'ShopExpensesTab.jsx'), 'w', encoding='utf-8') as f:
    f.write(st_content)
print(f'ShopExpensesTab.jsx — OK')

# ── 6. SupplierPaymentsTab.jsx ─────────────────────────────────────────────────
spt_body = get_lines(sup_tab_start, main_comp_start)
spt_content = """import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Truck, Package, DollarSign, Search, Store, Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useShopStore } from '../../store/shopStore'
import { getIncomeBatches, MOCK_INCOME_BATCHES, MOCK_SUPPLIERS } from '../../api/mock'
import { fmtUZS, fmtDate, PAGE_SIZE, monthLabel, MonthFilterBar, Pagination } from '../components/expHelpers'

""" + spt_body + """
export default SupplierPaymentsTab
"""
with open(os.path.join(OUT_DIR, 'tabs', 'SupplierPaymentsTab.jsx'), 'w', encoding='utf-8') as f:
    f.write(spt_content)
print(f'SupplierPaymentsTab.jsx — OK')

# ── 7. CapitalTab.jsx (CapitalTabWithHeader) ───────────────────────────────────
ct_body = get_lines(cap_tab_start, len(lines))
# Remove trailing export default Expenses
ct_content = """import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Landmark, Plus, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { getCapital, addCapital, updateCapital, deleteCapital } from '../../api/mock'
import { fmtUZS, fmtDate, today, CURRENT_MONTH, PAGE_SIZE, MonthFilterBar, Pagination } from '../components/expHelpers'
import CapitalFormModal from '../components/CapitalFormModal'
import DeleteModal from '../components/DeleteModal'

""" + ct_body

# Remove last line if it's "export default Expenses"
ct_lines = ct_content.splitlines()
while ct_lines and ct_lines[-1].strip() in ('', 'export default Expenses'):
    ct_lines.pop()
ct_content = '\n'.join(ct_lines) + '\n\nexport default CapitalTabWithHeader\n'

with open(os.path.join(OUT_DIR, 'tabs', 'CapitalTab.jsx'), 'w', encoding='utf-8') as f:
    f.write(ct_content)
print(f'CapitalTab.jsx — OK')

# ── 8. index.jsx ──────────────────────────────────────────────────────────────
main_body = get_lines(main_comp_start, cap_tab_start)
# Remove "export const Expenses = " → "const Expenses = "
main_body = main_body.replace('export const Expenses = ', 'const Expenses = ')

index_content = """import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Package, Landmark, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { isPrivileged } from './components/expHelpers'
import ShopExpensesTab     from './tabs/ShopExpensesTab'
import SupplierPaymentsTab from './tabs/SupplierPaymentsTab'
import CapitalTabWithHeader from './tabs/CapitalTab'

""" + main_body + """
export default Expenses
"""
with open(os.path.join(OUT_DIR, 'index.jsx'), 'w', encoding='utf-8') as f:
    f.write(index_content)
print('index.jsx — OK')
print('Tayyor!')
