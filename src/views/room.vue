<template>
  <div class="grid">
    <div v-if="!isConnected">
      Connecting...
    </div>
    <div v-else-if="!roomId">
      Joining room...
    </div>
    <div :class="['ui_grid', currentUserIsAdmin && 'ui_grid--admin' ]" v-else>
      <div v-if="currentUserIsAdmin" class="admin_controls">
        <section>
          <p>You are the admin of this room!</p>
          <p>
            To make someone else admin, move the cursor above their head and
            click the appearing crown icon.
          </p>
        </section>
        <div>
          <BaseButton variant="danger" @click="clearEstimations()">
            Clear Estimations
          </BaseButton>
        </div>
        <div>
          <BaseButton variant="primary" @click="revealEstimations()">
            Reveal Estimations
          </BaseButton>
        </div>
      </div>
      <div class="chart-container">
        <estimation-chart :chart-data="chartData" />
      </div>

      <div class="users">
        <UserCard
          v-for="user in users"
          :key="user.id"
          :user="user"
          :currentUser="currentUser"
        />
      </div>

      <EstimationNumbers
        class="estimation-numbers"
        :numbers="numbers"
        :estimation="estimation"
        @estimated="
          (value) => {
            estimate(value)
          }
        "
      />

      <UserControls class="user-controls" />
    </div>
  </div>
</template>

<script>
import BaseButton from '../components/baseButton.vue'
import EstimationChart from '../components/estimationChart.vue'
import EstimationNumbers from '../components/estimationNumbers.vue'
import UserCard from '../components/userCard.vue'
import UserControls from '../components/userControls.vue'
let reconnectionInterval = undefined

export default {
  components: {
    BaseButton,
    EstimationChart,
    EstimationNumbers,
    UserCard,
    UserControls,
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
      dndOptions: this.currentDndOptions,
    }
  },

  computed: {
    chartData: function () {
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
    estimations: function () {
      if (!this.users) {
        return []
      }
      const intArr = Object.values(this.users).map((user) => user.estimation)
      return this.numbers.map(
        (fibNum) => intArr.filter((x) => x === fibNum).length || null
      )
    },

    currentUser: function () {
      return this.users.find((user) => user.id === this.$socket.client.id)
    },

    currentUserIsAdmin: function () {
      if (!this.currentUser) {
        return false
      }
      return this.currentUser.roles.includes('ADMIN')
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
    },

    estimate(value) {
      // allow deselect of number/button
      if (this.estimation === value) {
        value = null
      }
      this.estimation = value
      this.$socket.client.emit('setEstimation', value)
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
<style lang="scss" scoped>
.grid {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 1rem;
  padding: 1rem;
  transition: transform 300ms ease-in;
}

.roomname {
  margin: 0;
}

.ui_grid {
  display: grid;
  grid-template-areas: 'graph'
  'estimation'
  'users'
  'controls';
  grid-template-columns: 1fr;
  grid-template-rows: auto;
  grid-gap: 2rem;
  max-width: 100%;
}

.ui_grid--admin {
  grid-template-areas: 'graph'
  'adminArea'
  'estimation'
  'users'
  'controls';
}

@media(min-width: 768px) {
  .ui_grid {
    grid-template-areas: 'estimation estimation graph'
    'users users users'
    'controls controls controls';
    grid-template-columns: 1fr 1fr 300px;
    grid-template-rows: repeat(3, auto);
  }
  .ui_grid--admin {
    grid-template-areas: 'adminArea adminArea graph'
    'estimation estimation graph'
    'users users users'
    'controls controls controls';
    grid-template-rows: repeat(4, auto);
    grid-gap: 2rem;
  }
}

.admin_controls {
  grid-area: adminArea;
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 1rem;
}

.users {
  grid-area: users;
  display: grid;
  justify-content: start;
  grid-template-columns: repeat(auto-fit, 5rem);
  grid-gap: 1rem;
}

.chart-container {
  grid-area: graph;
}

.estimation-numbers {
  grid-area: estimation;
}

.user-controls {
  grid-area: controls;
}

@media(min-width: 768px) {
  .header {
    grid-template-columns: 1fr 1fr;
  }
  
  .admin_controls {
    grid-template-columns: 1fr 1fr;

    section {
      grid-column: 1 / 3;
    }
  }
}
</style>
