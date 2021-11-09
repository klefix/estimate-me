<template>
  <div class="grid">
    <div>
      <input
        type="text"
        v-model="roomName"
        placeholder="Room Name"
        pattern="^[a-zA-Z0-9\-]+$"
        v-on:keydown.enter="btnActive = true"
        v-on:keyup.enter=";(btnActive = false), joinRoom()"
      />
      &nbsp;
      <BaseButton @click="randomRoomName">
        <i class="fas fa-dice-five"></i>
      </BaseButton>
      <small v-show="invalidRoomName"> Please enter a valid room name! </small>
    </div>
    <div>
      <BaseButton ref="joinBtn" variant="primary" @click="joinRoom">
        Create Or Join
      </BaseButton>
    </div>
    <aside>
      <p>The first user to enter a room will be admin of the room.</p>
      <p>If the admin leaves, some other user will get the admin role.</p>
      <p>Only admins can clear or reveal estimations.</p>
    </aside>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import BaseButton from '../components/baseButton.vue'
import { Component } from 'vue-property-decorator'
import { generateName } from '@/utils/randomName'

@Component({
  components: {
    BaseButton,
  },
})
export default class Intro extends Vue {
  roomName = ''
  invalidRoomName = false
  btnActive = false

  randomRoomName(): void {
    this.roomName = generateName()
  }

  joinRoom(): void {
    // check if room exists
    if (this.roomName === '') {
      this.invalidRoomName = true
      return
    }

    this.$router.push('/' + this.roomName)
  }
}
</script>

<style scoped>
.grid {
  display: grid;
  grid-gap: 1rem;
  max-width: 768px;
  margin: 0 auto;
  width: 100vw;
}
</style>
