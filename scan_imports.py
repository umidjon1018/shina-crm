import sys, re, os
sys.stdout.reconfigure(encoding='utf-8')

SRC = 'C:/Users/Umidjon/Desktop/shina_crm/src'

CTX_OR_GLOBAL = {
    'React','Fragment',
    'StatCard','SortIcon','MonthSortBtn','LockedTab','SectionTitle','MonthFilterSelect',
}

results = {}

for root, dirs, files in os.walk(SRC):
    dirs[:] = [d for d in dirs if d not in ('node_modules',)]
    for fname in files:
        if not (fname.endswith('.jsx') or fname.endswith('.js')):
            continue
        fpath = os.path.join(root, fname)
        rel = fpath.replace(SRC, '').replace(os.sep, '/').lstrip('/')

        try:
            with open(fpath, encoding='utf-8') as f:
                content = f.read()
        except:
            continue

        all_imported = set()
        for imp in re.finditer(r'import \{([^}]+)\}', content):
            all_imported |= {n.strip().split(' as ')[0].strip() for n in imp.group(1).split(',') if n.strip()}
        for imp in re.finditer(r'import\s+(\w+)\s+from', content):
            all_imported.add(imp.group(1))

        locally_defined = set(re.findall(r'(?:const|function|class|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*[=({\[]', content))

        mock_used = set(re.findall(r'\bMOCK_[A-Z_]+\b', content))
        import_section = content[:min(len(content), 2000)]
        mock_in_imports = set(re.findall(r'\bMOCK_[A-Z_]+\b', import_section))
        missing_mocks = mock_used - mock_in_imports

        jsx_used = set(re.findall(r'<([A-Z][A-Za-z0-9]+)[\s/>]', content))
        missing_jsx = jsx_used - all_imported - locally_defined - CTX_OR_GLOBAL

        if missing_mocks or missing_jsx:
            results[rel] = {'mocks': sorted(missing_mocks), 'jsx': sorted(missing_jsx)}

for rel, data in sorted(results.items()):
    print('=== ' + rel + ' ===')
    if data['mocks']:
        print('  MOCK: ' + str(data['mocks']))
    if data['jsx']:
        print('  JSX: ' + str(data['jsx']))
