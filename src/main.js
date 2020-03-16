import Vue from 'vue'
import socketClient from 'socket.io-client'
import VueSocketIOExt from 'vue-socket.io-extended'

import App from './App.vue'

export const SocketInstance = socketClient('http://localhost:3000')

Vue.use(VueSocketIOExt, SocketInstance)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
