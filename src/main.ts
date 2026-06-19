import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from '@/router'

import '@icon-park/vue-next/styles/index.css'
import 'prosemirror-view/style/prosemirror.css'
import 'animate.css'
import '@/assets/styles/prosemirror.scss'
import '@/assets/styles/global.scss'
import '@/assets/styles/font.scss'
import '@/assets/icons/iconfont.css'
import '@/assets/icons-design/iconfont.css'
import '@/assets/colorIcons/iconfont.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from "element-plus/es/locale/lang/zh-cn";

import Icon from '@/plugins/icon'
import Directive from '@/plugins/directive'

const app = createApp(App)
app.use(Icon)
app.use(Directive)
app.use(createPinia())
app.use(router)
app.use(ElementPlus, {
locale: zhCn,
size: 'small',
})
app.mount('#app')
