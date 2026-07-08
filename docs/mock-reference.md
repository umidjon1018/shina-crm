# Mock Reference

## Asosiy massivlar (src/api/mock.js)
- MOCK_PRODUCTS — mahsulotlar
- MOCK_BATCHES — partiyalar
- MOCK_ITEMS — individual birliklar (barcode)
- MOCK_SALES — sotuvlar (status:'cancelled' faqat reference)
- MOCK_CUSTOMERS — mijozlar
- MOCK_SUPPLIERS — yetkazib beruvchilar
- MOCK_INCOME_BATCHES — kirim partiyalari
- MOCK_EXPENSES — xarajatlar
- MOCK_CAPITAL — kapital harakati
- MOCK_RETURNS — bekor/almashtirish (yagona manba)
- MOCK_USED_STOCK — B/U ombor (status: in_stock|sold|scrapped; acquiredPrice, acquiredAt, acquiredSaleId, soldAt, soldSaleId, sellPrice, scrapAt, scrapPrice, scrapBuyer, scrapNote, category, categoryLabel, name)
- MOCK_USED_SALES — B/U sotuvlar (customerName, soldAt, status, items, total, paymentType, installmentCommissionAmount)

## Asosiy funksiyalar
- getStock(productId) — in_stock itemlar soni
- getBarcodeReadyStock(productId) — barcoded+in_stock
- findItemByBarcode(barcode) — POS scanner uchun
- createSale() — bump() chaqiradi
- cancelSale() — bump() chaqiradi
- addReturn() — bump() chaqiradi
- addBatch() — bump() chaqiradi
- addPaymentToBatch() — bump() chaqiradi
- mergeCustomers(keepId, removeId) — mijoz birlashtirish
- createUsedSale() — B/U sotuv, stockItem.status = 'sold' (oddiy sotuv ham, utilizatsiya ham); utilizatsiya sale.customerName === 'Utilizatsiya' bilan ajratiladi

## Inventory modeli
MOCK_PRODUCTS → MOCK_BATCHES → MOCK_ITEMS
- item.barcode: null = sotib bo'lmaydi
- barcodeStatus: null → active → printed|downloaded → inactive

## bump() qayerda chaqiriladi
Sales, Income, Customers, Management (price/delete), Warehouse (barcode)
