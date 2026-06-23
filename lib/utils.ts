import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const toArray = (v: string) => (v ? v.split(',') : [])
export function fmtDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function statusColor(status: number) {
  if (status < 300) return 'text-emerald-400 bg-emerald-400/10'
  if (status < 400) return 'text-sky-400 bg-sky-400/10'
  if (status < 500) return 'text-amber-400 bg-amber-400/10'
  return 'text-red-400 bg-red-400/10'
}
 
export function methodColor(method: string) {
  if (method === 'GET') return 'text-sky-400'
  if (method === 'POST') return 'text-emerald-400'
  if (method === 'PATCH' || method === 'PUT') return 'text-amber-400'
  if (method === 'DELETE') return 'text-red-400'
  return 'text-zinc-400'
}
 
export function durationColor(ms: number) {
  if (ms < 100) return 'text-emerald-400'
  if (ms < 500) return 'text-amber-400'
  return 'text-red-400'
}
 
export function fmtTime(date: string) {
  return new Date(date).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
