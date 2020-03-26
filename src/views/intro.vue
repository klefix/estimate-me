<template>
  <div>
    <h1>Estimate-Me!</h1>
    <div>
      <div>
      <input
        type="text"
        v-model="roomName"
        placeholder="Room Name"
        pattern="^[a-zA-Z0-9\-]+$"
        v-on:keydown.enter="btnActive = true"
        v-on:keyup.enter="
          btnActive = false,
          joinRoom()
        "
      />
        <br>
        <span class="hint" v-show="invalidRoomName">Please enter a valid room name!</span>
      </div><br />
      <br />
      <button ref="joinBtn" :class="{ active: btnActive }" @click="joinRoom">
        Create Or Join
      </button>
      <br>
      <br>
      <p>The first user to enter a room will be admin of the room.</p>
      <p>If the admin leaves, some other user will get the admin role.</p>
      <p>Only admins can clear or reveal estimations.</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      roomName: '',
      invalidRoomName: false,
      btnActive: false,
    }
  },

  methods: {
    // simulate button click

    joinRoom() {
      // check if room exists
      if (this.roomName === '') {
        this.invalidRoomName = true
        return
      }

      this.$router.push('/' + this.roomName)
    },
  },
}
</script>

<style scoped></style>
