import api from './client'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export const productImageUrl = (id) => `${BASE_URL}/api/product-images/${id}/file`

const idFromUrl = (url) => {
  const m = /\/api\/product-images\/(\d+)\/file$/.exec(url || '')
  return m ? Number(m[1]) : null
}

const toMap = (rows) => rows.reduce((acc, r) => {
  const key = String(r.product_id)
  ;(acc[key] ||= []).push(productImageUrl(r.id))
  return acc
}, {})

// { [productId]: [url, ...] }
export const getProductImageMap = async () => {
  const { data } = await api.get('/api/product-images')
  return toMap(data)
}

// images: tartiblangan — mavjud rasm URL'i yoki yangi data URL
export const saveProductImages = async (productId, images) => {
  const payload = images.map(img => {
    const id = idFromUrl(img)
    return id ? { id } : { data: img }
  })
  const { data } = await api.put(`/api/product-images/product/${productId}`, { images: payload })
  return data.map(r => productImageUrl(r.id))
}

// Telefon rasmi (3–5MB) → eng uzun tomoni 1280px, JPEG ~150KB
export const compressImage = (file, maxSide = 1280, quality = 0.82) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e) }
    img.src = url
  })
