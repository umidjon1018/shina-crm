import sys, re, os
sys.stdout.reconfigure(encoding='utf-8')

SRC = 'C:/Users/Umidjon/Desktop/shina_crm/src'
REPORTS_DIRS = [
    SRC + '/pages/Reports',
]

# ctx / props orqali keladigan — bularni o'tkazib yuboramiz
CTX_PROVIDED = {
    'React','Fragment',
    'StatCard','SortIcon','MonthSortBtn','LockedTab','SectionTitle','MonthFilterSelect',
}

def scan_file(fpath):
    with open(fpath, encoding='utf-8') as f:
        content = f.read()

    # Barcha import qilingan nomlar
    all_imported = set()
    for imp in re.finditer(r'import \{([^}]+)\}', content):
        all_imported |= {n.strip().split(' as ')[0].strip() for n in imp.group(1).split(',') if n.strip()}
    for imp in re.finditer(r'import\s+(\w+)\s+from', content):
        all_imported.add(imp.group(1))

    # Lokal aniqlangan nomlar
    locally_defined = set(re.findall(
        r'(?:const|function|class|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*[=({\[]', content))
    # Destructuring parametrlar (props, ctx)
    for m in re.finditer(r'\(\s*\{([^}]+)\}', content):
        for n in m.group(1).split(','):
            locally_defined.add(n.strip().split(':')[0].strip().split('=')[0].strip())
    # useState, useMemo return values
    for m in re.finditer(r'const \[([A-Za-z0-9_]+)', content):
        locally_defined.add(m.group(1))

    # MOCK_ ishlatilgan vs import qilingan
    mock_used = set(re.findall(r'\bMOCK_[A-Z_]+\b', content))
    import_section = content[:min(len(content), 3000)]
    mock_imported = set(re.findall(r'\bMOCK_[A-Z_]+\b', import_section))
    missing_mocks = mock_used - mock_imported

    # JSX komponentlar
    jsx_used = set(re.findall(r'<([A-Z][A-Za-z0-9]+)[\s/>]', content))
    missing_jsx = jsx_used - all_imported - locally_defined - CTX_PROVIDED

    # Hook/funksiyalar — bosh kichik harf bilan, lekin import kerak
    # useXxx hooks
    hooks_used = set(re.findall(r'\b(use[A-Z][A-Za-z0-9]+)\s*\(', content))
    missing_hooks = hooks_used - all_imported - locally_defined

    return missing_mocks, missing_jsx, missing_hooks

issues = {}
for rdir in REPORTS_DIRS:
    for root, dirs, files in os.walk(rdir):
        dirs[:] = [d for d in dirs if d != 'node_modules']
        for fname in sorted(files):
            if not fname.endswith('.jsx') and not fname.endswith('.js'):
                continue
            fpath = os.path.join(root, fname)
            rel = fpath.replace(SRC + os.sep, '').replace('\', '/')
            mm, mj, mh = scan_file(fpath)
            if mm or mj or mh:
                issues[rel] = {'mocks': sorted(mm), 'jsx': sorted(mj), 'hooks': sorted(mh)}

for rel, data in sorted(issues.items()):
    print('=== ' + rel + ' ===')
    if data['mocks']: print('  MOCK: ' + str(data['mocks']))
    if data['jsx']:   print('  JSX:  ' + str(data['jsx']))
    if data['hooks']: print('  HOOK: ' + str(data['hooks']))
