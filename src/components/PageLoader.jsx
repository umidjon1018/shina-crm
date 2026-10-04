import { Loader2 } from 'lucide-react'

// Sahifa fayli yuklanayotganda (React.lazy) ko'rsatiladi
const PageLoader = () => (
  <div className="flex items-center justify-center py-24 text-text-muted">
    <Loader2 size={28} className="animate-spin" />
  </div>
)

export default PageLoader
