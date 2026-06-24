const SIDEBAR_OPEN_STORAGE_KEY = 'pockets-cuadernos-sidebar-open'

export function getCuadernoSidebarOpen(): boolean {
  const saved = localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY)
  return saved === null ? true : saved === 'true'
}

export function setCuadernoSidebarOpen(open: boolean): void {
  localStorage.setItem(SIDEBAR_OPEN_STORAGE_KEY, String(open))
}
