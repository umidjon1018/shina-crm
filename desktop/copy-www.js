// Boshlang'ich sahifa (kompaniya kodi, offlayn) — mobil ilova bilan umumiy: ../mobile/www → ./www
const fs = require('fs')
const path = require('path')
const src = path.join(__dirname, '..', 'mobile', 'www')
const dst = path.join(__dirname, 'www')
fs.rmSync(dst, { recursive: true, force: true })
fs.cpSync(src, dst, { recursive: true })
console.log('www tayyor')
