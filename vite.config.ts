import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '',
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 7897,
    proxy: {
      
      // 1. 优先级最高：oss-proxy，放在最前面
      '/api/oss-proxy': {
        target: 'https://yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/oss-proxy/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('cookie')
          })
        },
      },
      '/app-api': {
        target: 'http://47.102.84.13:48095',
        changeOrigin: true,
        rewrite: (path) => path,
        // rewrite: (path) => path.replace(/^\/api/, ''),
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq, req) => {
            // 打印转发给后端的完整路径
            console.log('转发后端URL：', req.url)
          })
        }
      },

      // 2. 认证接口
      '/api/auth/': {
        target: 'http://47.102.84.13:48095',
        changeOrigin: true,
      },

      // 3. 其他 api 接口（需要登录）
      '/api': {
        target: 'http://47.102.84.13:48095',
        changeOrigin: true,
        // 这里默认 withCredentials=true，会带登录态
      },

      '/ai': {
        target: 'http://47.102.84.13:48095',
        changeOrigin: true,
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import '@/assets/styles/variable.scss';
          @import '@/assets/styles/mixin.scss';
        `
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})