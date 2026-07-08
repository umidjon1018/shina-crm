const fs = require('fs');
let content = fs.readFileSync('src/pages/Reports.jsx', 'utf8');

// 1. Array order
content = content.replace(/\['2026-03', '2026-04', '2026-05'\]/g, "['2026-05', '2026-04', '2026-03']");
content = content.replace(/\['2026-03','2026-04','2026-05'\]/g, "['2026-05','2026-04','2026-03']");

// 2. Add wrapperStyle to Tooltip
content = content.replace(/<Tooltip([\s\S]*?)\/>/g, (match, p1) => {
  if (p1.includes('wrapperStyle')) return match;
  return `<Tooltip${p1} wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} />`;
});

// 3. monthNames
content = content.replace(/const monthNames = \{ '2026-03':'Mart','2026-04':'Aprel','2026-05':'May' \}/g, "const monthNames = { '2026-03':'Mart 2026','2026-04':'Aprel 2026','2026-05':'May 2026' }");

// 4. allMonths
content = content.replace(/const allMonths = \['2026-03','2026-04','2026-05'\]/g, "const allMonths = ['2026-05','2026-04','2026-03']");

fs.writeFileSync('src/pages/Reports.jsx', content);
