import Vue from 'vue'
import VueRouter from 'vue-router'

import socketClient from 'socket.io-client'
import VueSocketIOExt from 'vue-socket.io-extended'

import App from './App.vue'
import Intro from './views/intro.vue'
import Room from './views/room.vue'

import '@fortawesome/fontawesome-free/css/all.css'
import './assets/scss/main.scss'

const { VUE_APP_SERVER_URI } = process.env

export const SocketInstance = socketClient(VUE_APP_SERVER_URI)

const routes = [
  { path: '/', name: 'index', component: Intro },
  { path: '/:roomName', name: 'room', component: Room },
]

const router = new VueRouter({
  routes, // short for `routes: routes`
})

Vue.use(VueRouter)
Vue.use(VueSocketIOExt, SocketInstance)

Vue.config.productionTip = false

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app')
