<template>
  <div>
    <h1>{{ roomName }}</h1>
    <div v-if="!isConnected">
      Connecting...
    </div>
    <div v-else-if="!roomId">
      Joining room...
    </div>
    <div v-else>
      <div class="row">
        <div class="user" v-for="user in users" :key="user.id">
          <h5>{{ user.name || user.id }}</h5>
          <div class="inset">
            {{ user.estimation }}
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col">
          <input
            type="text"
            placeholder="Your name..."
            v-model="name"
            v-on:keyup.enter="setName()"
          />
          &nbsp;
          <button @click="setName()">Set Name</button>
        </div>
        <div class="col"></div>
      </div>

      <div class="row">
        <div class="col" v-for="number in numbers" :key="number">
          <button class="number" @click="estimate(number)">
            {{ number }}
          </button>
        </div>
      </div>

      <button @click="disconnect">Disconnect</button>

      <div class="row">
        <div>
          Message from server:
          <p>
            {{ socketMessage }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
let reconnectionInterval = undefined

export default {
  data() {
    return {
      roomName: this.$route.params.roomName,
      roomId: undefined,
      isConnected: false,
      socketMessage: '',
      values: [],
      users: {},
      numbers: [1, 2, 3, 5, 8, 13, 21],
      name: '',
    }
  },

  mounted() {
    console.log('Mounted')
    this.isConnected = this.$socket.connected

    reconnectionInterval = setInterval(this.reconnect, 1000)

    this.reconnect()
  },

  destroyed() {
    clearInterval(reconnectionInterval)
  },

  sockets: {
    connect() {
      this.isConnected = true
    },

    disconnect() {
      this.isConnected = false
    },

    serverMessage(data) {
      this.socketMessage = data
    },

    estimatedValues(values) {
      this.values = values
    },

    userList(users) {
      console.log({users})
      this.users = users.sort((a, b) => a.$loki > b.$loki)
    },

    joinedRoom(roomId) {
      this.roomId = roomId
    },
  },

  methods: {
    reconnect() {
      if (!this.isConnected) {
        console.log('Reconnecting...')
        this.$socket.client.connect()
        this.joinRoom()
      }
      if (!this.roomId) {
        this.joinRoom()
      }
    },

    joinRoom() {
      console.log('Joining Room...')
      this.$socket.client.emit('joinRoom', this.roomName)
      this.setName()
    },

    estimate(value) {
      this.$socket.client.emit('setEstimation', value)
    },

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
