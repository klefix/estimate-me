<template>
  <div id="app">
    <p v-if="isConnected">We're connected to the server!</p>
    <p>Message from server: "{{ socketMessage }}"</p>
    <div class="row">
      <div class="user" v-for="user in users" :key="user.id">
        <h5>{{ user.id }}</h5>
        <h3>{{ user.estimation }}</h3>
      </div>
    </div>
    <button @click="pingServer()">Ping Server</button>

    <button v-for="number in numbers" :key="number" @click="estimate(number)">
      {{ number }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'App',

  data() {
    return {
      isConnected: false,
      socketMessage: '',
      values: [],
      users: {},
      numbers: [1, 2, 3, 5, 8, 13, 21],
    }
  },

  sockets: {
    connect() {
      // Fired when the socket connects.
      this.isConnected = true
    },

    disconnect() {
      this.isConnected = false
    },

    // Fired when the server sends something on the "messageChannel" channel.
    messageChannel(data) {
      this.socketMessage = data
    },

    estimatedValues(values) {
      this.values = values
    },

    userList(users) {
      console.log(users)
      this.users = users.sort((a, b) => a > b)
    },
  },

  methods: {
    pingServer() {
      // Send the "ping" event to the server.
      console.log('sending ping...')
      this.$socket.client.emit('pingServer', 'PING!')
    },

    estimate(value) {
      console.log('estimate', value)
      this.$socket.client.emit('estimate', value)
    },
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.row {
  display: flex;
}

  .row div {
    flex: 1;
    border: 1px solid black;
    border-radius: 5px;
    margin: 1rem;
  }
</style>
