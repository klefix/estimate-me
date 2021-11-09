<template>
  <div class="userControls">
    <div class="name">
      <input
        type="text"
        placeholder="Your name..."
        v-model="name"
        v-on:keyup.enter="setName()"
      />
      &nbsp;
      <BaseButton variant="secondary" @click="setName()">Set Name</BaseButton>
    </div>
    <div class="options">
      <BaseButton variant="text" @click="disconnect">Reconnect</BaseButton>
      <BaseButton variant="danger" to="/">Leave</BaseButton>
      <BaseButton variant="secondary" @click="copyLink">{{
        justCopied ? 'Copied!' : 'Copy Link'
      }}</BaseButton>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import BaseButton from '../components/baseButton.vue'
import { Component } from 'vue-property-decorator'

@Component({
  name: 'UserControls',
  components: {
    BaseButton,
  },
})
export default class UserControls extends Vue {
  name = ''
  timeoutId = undefined
  justCopied = false

  mounted() {
    if (localStorage) {
      this.name = localStorage.getItem('name')
      this.broadcastName()
    }
  }

  setName() {
    if (localStorage) {
      localStorage.setItem('name', this.name)
    }
    this.broadcastName()
  }

  broadcastName() {
    this.$socket.client.emit('setName', this.name)
  }

  disconnect() {
    this.$socket.client.disconnect()
  }

  async copyLink() {
    await navigator.clipboard.writeText(location.href)
    if (this.timeoutId) clearTimeout(this.timeoutId)
    this.justCopied = true
    this.timeoutId = setTimeout(() => {
      this.justCopied = false
    }, 2500)
  }
}
</script>

<style lang="scss" scoped>
.userControls {
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 2rem;
  margin: 2rem 0;
}

@media (min-width: 768px) {
  .userControls {
    grid-template-columns: 2fr 1fr;
    grid-gap: 0.5rem;
    margin: 2rem auto;
  }
}

.options {
  display: grid;
  grid-gap: 1rem;
  justify-items: center;
}
</style>
