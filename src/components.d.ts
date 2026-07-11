import type { Icons } from '@/plugins/icon'

declare module 'vue' {
  interface GlobalComponents extends Icons {}
}

export {}