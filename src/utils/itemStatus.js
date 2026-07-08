export const getItemStatus = (item, t) => {
  if (item.isReturned && item.status === 'in_stock') {
    return {
      label: item.printCount > 0
        ? t('bc_returned_print', { n: item.printCount })
        : t('bc_returned'),
      cls:   'bg-accent-orange/10 text-accent-orange',
      trCls: 'opacity-60',
    }
  }

  if (item.status === 'returned') {
    return {
      label: item.printCount > 0
        ? t('bc_returned_print', { n: item.printCount })
        : t('bc_returned'),
      cls:   'bg-accent-orange/10 text-accent-orange',
      trCls: 'opacity-60',
    }
  }

  if (item.status === 'sold') {
    return {
      label: t('bc_printed') ? t('sold') : 'Sotilgan',
      cls:   'bg-bg-tertiary text-text-muted',
      trCls: 'opacity-40',
    }
  }

  if (item.reprintAllowed) {
    return {
      label: t('bc_reprint_ready'),
      cls:   'bg-accent-blue/10 text-accent-blue',
      trCls: '',
    }
  }

  if (
    item.barcodeStatus === 'printed' ||
    item.barcodeStatus === 'downloaded' ||
    (item.printCount || 0) > 0 ||
    (item.downloadCount || 0) > 0
  ) {
    const pCount = item.printCount || 0
    const dCount = item.downloadCount || 0
    const parts = []
    if (pCount > 0) parts.push(t('bc_print_count', { n: pCount }))
    if (dCount > 0) parts.push(t('bc_download_count', { n: dCount }))
    return {
      label: parts.length > 0 ? parts.join(' · ') : t('bc_printed'),
      cls:   'bg-accent-green/10 text-accent-green',
      trCls: '',
    }
  }

  if (item.barcodeStatus === 'active') {
    return {
      label: t('bc_ready'),
      cls:   'bg-accent-orange/10 text-accent-orange',
      trCls: '',
    }
  }

  if (!item.barcode) {
    return {
      label: t('bc_no_barcode'),
      cls:   'bg-accent-red/10 text-accent-red',
      trCls: '',
    }
  }

  return {
    label: t('bc_ready'),
    cls:   'bg-accent-orange/10 text-accent-orange',
    trCls: '',
  }
}
