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
    </div>
  </div>
</template>
<script>
import BaseButton from '../components/baseButton.vue'

export default {
  name: 'UserControls',
  components: {
    BaseButton,
  },
  data() {
    return {
      name: '',
    }
  },
  methods: {
    setName() {
      if (this.name) {
        this.$socket.client.emit('setName', this.name)
      }
    },

    disconnect() {
      this.$socket.client.disconnect()
    },
  },
}
</script>

<style lang="scss" scoped>
.userControls {
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 2rem;
  margin: 2rem 0;
}

@media(min-width: 768px) {
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
