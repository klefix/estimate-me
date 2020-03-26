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
        <div v-if="currentUserIsAdmin" class="controls">
          <div class="row">
            <div class="col">
              <button @click="clearEstimations()">Clear Estimations</button>
            </div>
            <div class="col">
              <button @click="revealEstimations()">Reveal Estimations</button>
            </div>
          </div>
        </div>
        <div class="chart-container">
          <estimation-chart :chart-data="chartData" />
        </div>
      </div>

      <div class="row">
        <div class="user" v-for="user in users" :key="user.id">
          <div class="role-icon">
            <i v-if="isAdmin(user)" class="fas fa-crown"></i>
            <i
              v-if="user.roles.includes('TRACK_TIME')"
              class="fas fa-clock"
            ></i>
          </div>
          <i v-if="user.name !== ''" class="fas fa-user"></i>
          <i v-else class="fas fa-user-secret"></i>
          <div class="name">{{ user.name }}</div>
          <div class="estimation">
            <i v-if="user.estimation === true" class="fas fa-check"></i>
            <span v-else>{{ user.estimation }}</span>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col" v-for="number in numbers" :key="number">
          <button :class="{number: true, active: estimation === number}" @click="estimate(number)">
            {{ number }}
          </button>
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
        <div class="col">
          <button @click="disconnect">Disconnect</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import EstimationChart from '../components/estimationChart.vue'

let reconnectionInterval = undefined

export default {
  components: {
    EstimationChart,
  },

  data() {
    return {
      roomName: this.$route.params.roomName,
      roomId: undefined,
      isConnected: false,
      users: [],
      numbers: [1, 2, 3, 5, 8, 13, 21, '?'],
      name: '',
      estimation: null,
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    }
  },

  computed: {
    chartData: function() {
      return {
        labels: this.numbers,
        datasets: [
          {
            label: 'Estimations',
            backgroundColor: '#f87979',
            data: this.estimations,
          },
        ],
      }
    },
    estimations: function() {
      if (!this.users) {
        return []
      }
      const intArr = Object.values(this.users).map(user => user.estimation)
      return this.numbers.map(
        fibNum => intArr.filter(x => x === fibNum).length || null
      )
    },
    currentUser: function() {
      return this.users.find(user => user.id === this.$socket.client.id)
    },
    currentUserIsAdmin: function() {
      return this.isAdmin(this.currentUser)
    },
  },

  mounted() {
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

    userList(users) {
      this.users = users.sort((a, b) => a.$loki > b.$loki)
    },

    joinedRoom(roomId) {
      this.roomId = roomId
    },

    estimationsCleared() {
      this.estimation = null
    }
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
      this.estimation = value
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

    isAdmin(user) {
      if (!user) {
        return false
      }
      return user.roles.includes('ADMIN')
    },

    clearEstimations() {
      this.$socket.client.emit('clearEstimations')
    },

    revealEstimations() {
      this.$socket.client.emit('revealEstimations')
    },
  },
}
</script>
