import Vue from 'vue'
import VueRouter from 'vue-router'

import socketClient from 'socket.io-client'
import VueSocketIOExt from 'vue-socket.io-extended'

import App from './App.vue'
import Intro from './views/intro.vue'
import Room from './views/room.vue'

// TODO: get from env
const SERVER_PORT = 3000;

import './assets/css/main.css'

export const SocketInstance = socketClient(`http://localhost:${SERVER_PORT}`)

const routes = [
  { path: '/', component: Intro },
  { path: '/:roomName', component: Room }
]

const router = new VueRouter({
  routes // short for `routes: routes`
})

Vue.use(VueRouter)
Vue.use(VueSocketIOExt, SocketInstance)

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
