import { toast } from 'sonner'

export async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copiado`)
  } catch {
    toast.error('No se pudo copiar al portapapeles')
  }
}
