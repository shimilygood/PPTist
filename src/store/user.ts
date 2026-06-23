import { defineStore } from 'pinia'

export const DEFAULT_USER_AVATAR = 'https://webs-fe-cdn.aiyunhui.com/webs/login/defaultAvatar.png'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null as any,
  }),

  getters: {
    userAvatar: (state): any => {
      const data = state.userInfo?.data || state.userInfo || {}
      return data.avatar || data.headImg || data.headUrl || data.userAvatar || DEFAULT_USER_AVATAR
    },
  },

  actions: {
    setUserInfo(info: any) {
      this.userInfo = info
    },

    clearUserInfo() {
      this.userInfo = null
    },

    syncFromStorage() {
      try {
        const raw = localStorage.getItem('EDITOR_USER_INFO')
        this.userInfo = raw ? JSON.parse(raw) : null
      }
      catch {
        this.userInfo = null
      }
    },
  },
})
