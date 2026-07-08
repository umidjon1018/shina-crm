import re, os, sys
sys.stdout.reconfigure(encoding='utf-8')

CTX_VARS = {
    'period','modal','openModal','closeModal',
    'salesData','stockStats','profitStats','customerStats','employeeStats','financeStats','usedData',
    'isPrivileged',
    'StatCard','SectionTitle','MonthFilterSelect','LockedTab','SortIcon','MonthSortBtn',
    'filterByPeriod','filterUsedByMonth','sortedData','toggleSort','sortConfig',
    'getSourceLabel','getCategoryLabel','getCancelLabel','getCatLabel','getCatLabelPlural',
    'getCatColor','getCatColorHex','renderCatBadge','getExpNote','getMonthLabel',
    'setSelectedCustomer','selectedCustomer','customersPage','setCustomersPage','CUSTOMERS_PAGE_SIZE',
    'cstmSearch','setCstmSearch','selectedEmployee','setSelectedEmployee',
    'empChartMetric','setEmpChartMetric','hourTab','setHourTab',
    'expandedMonth','setExpandedMonth','seasonYear','setSeasonYear',
    'modalFilter','setModalFilter','varMonthFilter','setVarMonthFilter',
    'slowRotIdx','setSlowRotIdx','staleIdx','setStaleIdx','notSoldDays','setNotSoldDays',
    'msd','sortMonths',
    'showAllCfMonths','setShowAllCfMonths',
    'salesTablePage','setSalesTablePage','SALES_PAGE_SIZE',
    'stockCategory','setStockCategory',
    'periodOptions',
    'usedChartMonth','setUsedChartMonth',
    'usedHistoryMonth','setUsedHistoryMonth','usedHistorySales',
    'usedRevenueMonth','setUsedRevenueMonth',
    'usedProfitMonth','setUsedProfitMonth',
    'usedAcquiredMonth','setUsedAcquiredMonth',
    'usedInStockMonth','setUsedInStockMonth',
    'usedSoldMonth','setUsedSoldMonth',
    'usedScrappedMonth','setUsedScrappedMonth',
    'usedMarginMonth','setUsedMarginMonth',
    'usedChartCategories','getMonthlySalesChart',
    'USD_RATE',
    'storeInstallmentOrgs','storeMonthlyTargets','storeEmployeeTargets','storeCompanyName',
    'ctxFmtSoldAt','ctxFmtItems',
    'fmtSoldAt','fmtItems',
}

SKIP = {
    'true','false','null','undefined','NaN','Infinity',
    'if','else','for','while','do','switch','case','break','continue','return',
    'typeof','instanceof','new','delete','void','in','of',
    'async','await','try','catch','finally','throw',
    'class','extends','super','import','export','default','from','as',
    'const','let','var','function','this','arguments','yield','static',
    'Math','Date','Object','Array','String','Number','Boolean','Symbol',
    'Promise','Set','Map','WeakMap','WeakSet','Proxy','Reflect','Error',
    'parseInt','parseFloat','isNaN','isFinite',
    'JSON','console','window','document','navigator',
    'React','Fragment',
    'encodeURIComponent','decodeURIComponent',
    't','e','s','x','p','n','r','k','v','d','m','i','j','g','c','b','a',
    'l','f','h','q','w','y','z','u','o','idx',
    'map','filter','reduce','find','some','every','forEach','sort','slice',
    'push','pop','join','split','trim','replace','includes','startsWith',
    'endsWith','indexOf','toLowerCase','toUpperCase','toFixed','toString',
    'keys','values','entries','assign','fromEntries',
    'then','catch','resolve','reject',
    'log','warn','error',
    'floor','ceil','abs','max','min','round','random','sign','pow','sqrt',
    'now','getTime','getDate','getMonth','getFullYear','getHours','getMinutes',
    'toLocaleDateString','toLocaleString','toISOString',
    'length','size','name','type','value','key','ref','src','href',
    'className','style','onClick','onChange','onSubmit','onKeyDown',
    'placeholder','disabled','checked','children','props',
    'str','num','obj','arr','val','res','err','msg','sum','avg','cnt',
    'prev','next','cur','pos','len','tmp','buf','idx',
}

TABS_DIR = 'C:/Users/Umidjon/Desktop/shina_crm/src/pages/Reports/tabs'

for fname in sorted(os.listdir(TABS_DIR)):
    if not fname.endswith('.jsx'):
        continue
    path = os.path.join(TABS_DIR, fname)
    c = open(path, encoding='utf-8').read()

    # Importlar
    imported = set()
    for m in re.finditer(r'import \{([^}]+)\}', c):
        for n in m.group(1).split(','):
            parts = n.strip().split(' as ')
            imported.add(parts[-1].strip())
    for m in re.finditer(r'import (\w+) from', c):
        imported.add(m.group(1))

    # ctx destructuring local names
    ctx_d = re.search(r'const \{([^}]+)\} = ctx', c, re.DOTALL)
    ctx_local = set()
    if ctx_d:
        for n in ctx_d.group(1).split(','):
            n = n.strip().split('//')[0].strip()
            if ':' in n:
                ctx_local.add(n.split(':')[1].strip())
            elif n:
                ctx_local.add(n.strip())

    # Lokal aniqlangan
    local_def = set()
    for m in re.finditer(r'(?:const|let|var|function)\s+(\w+)', c):
        local_def.add(m.group(1))
    for m in re.finditer(r'const \[(\w+)', c):
        local_def.add(m.group(1))

    available = imported | CTX_VARS | ctx_local | local_def | SKIP

    # Ishlatilgan identifikatorlar
    used = set(re.findall(r'\b([a-zA-Z_]\w+)\b', c))

    missing = used - available
    real = sorted(v for v in missing if len(v) >= 4 and not v.startswith('_') and not v[0].isupper())

    if real:
        print(f'\n=== {fname} ===')
        print('  ' + ', '.join(real[:40]))
