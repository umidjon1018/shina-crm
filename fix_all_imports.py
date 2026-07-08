import sys, re, os
sys.stdout.reconfigure(encoding='utf-8')

BASE = 'C:/Users/Umidjon/Desktop/shina_crm/src'

def read(p):
    with open(p, encoding='utf-8') as f: return f.read()

def write(p, c):
    with open(p, 'w', encoding='utf-8') as f: f.write(c)

def add_lucide(content, icons):
    m = re.search(r"import \{([^}]+)\} from 'lucide-react'", content)
    if not m: return content
    existing = {n.strip() for n in m.group(1).split(',') if n.strip()}
    new_set = existing | set(icons)
    return content.replace(m.group(0), "import { " + ', '.join(sorted(new_set)) + " } from 'lucide-react'")

def add_mock(content, mocks, mock_path):
    m = re.search(r"import \{([^}]+)\} from '" + re.escape(mock_path) + "'", content)
    if m:
        existing = {n.strip() for n in m.group(1).split(',') if n.strip()}
        new_set = existing | set(mocks)
        return content.replace(m.group(0), "import { " + ', '.join(sorted(new_set)) + " } from '" + mock_path + "'")
    else:
        # Insert after first import line
        first_import_end = content.find('\n', content.find('import ')) + 1
        mock_line = "import { " + ', '.join(sorted(mocks)) + " } from '" + mock_path + "'\n"
        return content[:first_import_end] + mock_line + content[first_import_end:]

def add_shared(content, exports, shared_path):
    m = re.search(r"import \{([^}]+)\} from '" + re.escape(shared_path) + "'", content)
    if m:
        existing = {n.strip() for n in m.group(1).split(',') if n.strip()}
        new_set = existing | set(exports)
        return content.replace(m.group(0), "import { " + ', '.join(sorted(new_set)) + " } from '" + shared_path + "'")
    return content

def add_framer(content, exports):
    m = re.search(r"import \{([^}]+)\} from 'framer-motion'", content)
    if m:
        existing = {n.strip() for n in m.group(1).split(',') if n.strip()}
        new_set = existing | set(exports)
        return content.replace(m.group(0), "import { " + ', '.join(sorted(new_set)) + " } from 'framer-motion'")
    return content

FIXES = [
    # Expenses
    (BASE+'/pages/Expenses/components/CapitalFormModal.jsx',
     {'lucide': ['AlertCircle']}),
    (BASE+'/pages/Expenses/components/ExpenseFormModal.jsx',
     {'lucide': ['AlertCircle']}),
    (BASE+'/pages/Expenses/tabs/CapitalTab.jsx',
     {'lucide': ['Search']}),
    (BASE+'/pages/Expenses/tabs/ShopExpensesTab.jsx',
     {'lucide': ['User']}),

    # Income
    (BASE+'/pages/Income/tabs/DebtsTab.jsx',
     {'lucide': ['Plus'],
      'mock': (['MOCK_INCOME_BATCHES','MOCK_PRODUCTS'], '../../../api/mock')}),

    # Management
    (BASE+'/pages/Management/tabs/DiscountsTab.jsx',
     {'lucide': ['AlertCircle']}),
    (BASE+'/pages/Management/tabs/NotificationsTab.jsx',
     {'lucide': ['AlertCircle'],
      'mock': (['MOCK_ITEMS','MOCK_PRODUCTS','MOCK_SALES'], '../../../api/mock')}),
    (BASE+'/pages/Management/tabs/ProductsTab.jsx',
     {'lucide': ['CheckCircle','Pencil','ToggleLeft','ToggleRight'],
      'framer': ['AnimatePresence'],
      'mock': (['MOCK_PRODUCTS'], '../../../api/mock')}),
    (BASE+'/pages/Management/tabs/PromotionsTab.jsx',
     {'mock': (['MOCK_PRODUCTS'], '../../../api/mock')}),
    (BASE+'/pages/Management/tabs/SettingsTab.jsx',
     {'lucide': ['Package','Percent','ShieldAlert','TrendingUp'],
      'mock': (['MOCK_BATCHES','MOCK_CUSTOMERS','MOCK_PRODUCTS','MOCK_SALES'], '../../../api/mock')}),

    # Reports tabs — shared dan
    (BASE+'/pages/Reports/tabs/CustomersTab.jsx',
     {'shared': (['DetailButton','MonthlyDynamicsChart'], '../components/shared')}),
    (BASE+'/pages/Reports/tabs/EmployeesTab.jsx',
     {'shared': (['DetailButton','MonthlyDynamicsChart'], '../components/shared')}),
    (BASE+'/pages/Reports/tabs/FinanceTab.jsx',
     {'shared': (['DetailButton','MonthlyDynamicsChart'], '../components/shared')}),
    (BASE+'/pages/Reports/tabs/ProfitTab.jsx',
     {'shared': (['DetailButton'], '../components/shared')}),
    (BASE+'/pages/Reports/tabs/StockTab.jsx',
     {'shared': (['DetailButton'], '../components/shared')}),
]

for fpath, fix in FIXES:
    content = read(fpath)
    if 'lucide' in fix:
        content = add_lucide(content, fix['lucide'])
    if 'mock' in fix:
        mocks, mock_path = fix['mock']
        content = add_mock(content, mocks, mock_path)
    if 'shared' in fix:
        exports, shared_path = fix['shared']
        content = add_shared(content, exports, shared_path)
    if 'framer' in fix:
        content = add_framer(content, fix['framer'])
    write(fpath, content)
    name = fpath.split('/')[-1]
    print(f'{name} tuzatildi')

print('\nHamma tuzatildi.')
