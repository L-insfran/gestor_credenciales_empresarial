export async function copyToClipboard(text) {
  const value = typeof text === 'string' ? text : text == null ? '' : String(text)
  if (!value) {
    throw new Error('Texto vacío para copiar')
  }

  // Clipboard API: requiere contexto seguro (https/localhost) en la mayoría de navegadores
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value)
    return
  }

  // Fallback compatible: textarea + execCommand('copy')
  const ta = document.createElement('textarea')
  ta.value = value
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.top = '-9999px'
  ta.style.left = '-9999px'
  ta.style.opacity = '0'

  document.body.appendChild(ta)
  ta.focus()
  ta.select()
  ta.setSelectionRange(0, ta.value.length)

  let ok = false
  try {
    ok = document.execCommand('copy')
  } finally {
    document.body.removeChild(ta)
  }

  if (!ok) {
    throw new Error('execCommand(copy) falló')
  }
}
