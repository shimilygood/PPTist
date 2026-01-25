import { defineStore } from 'pinia'

export interface ScreenState {
  isHome: boolean,
  screening: boolean
}

export const useScreenStore = defineStore('screen', {
  state: (): ScreenState => ({
    isHome: true,
    screening: false, // 是否进入放映状态
  }),

  actions: {
    setIsHome(isHome: boolean) {
      this.isHome = isHome
    },
    setScreening(screening: boolean) {
      this.screening = screening
    },
  },
})