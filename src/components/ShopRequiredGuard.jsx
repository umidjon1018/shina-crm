import { useState } from 'react'
import { useShopStore } from '../store/shopStore'
import { ShopPickerModal } from './ShopPickerModal'

const ShopRequiredGuard = ({ children }) => {
  const { selectedShopId, setSelectedShop } = useShopStore()
  const [showPicker, setShowPicker] = useState(false)

  if (selectedShopId !== 'all') return <>{children}</>

  return (
    <div className="relative">
      {children}
      <div
        className="absolute inset-0 z-[50] cursor-pointer"
        onClick={() => setShowPicker(true)}
      />
      {showPicker && (
        <ShopPickerModal
          onConfirm={(shopId) => { setSelectedShop(shopId); setShowPicker(false) }}
          onCancel={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

export default ShopRequiredGuard
