import ProductsTab from '../tabs/ProductsTab'
import ProductsModals from './ProductsModals'
import useProductsCtx from './useProductsCtx'

// Ombor → Tovarlar: katalog, narxlar, kategoriyalar, atributlar, barkod qayta chop ruxsati
const ProductsSection = ({ products, batches, items, refresh }) => {
  const ctx = useProductsCtx({ products, batches, items, refresh })
  return (
    <>
      <ProductsTab ctx={ctx} />
      <ProductsModals ctx={ctx} />
    </>
  )
}

export default ProductsSection
