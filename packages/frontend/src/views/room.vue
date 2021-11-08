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

<script lang="ts">
import Vue from 'vue'
import BaseButton from '../components/baseButton.vue'
import EstimationChart from '../components/estimationChart.vue'
import EstimationNumbers from '../components/estimationNumbers.vue'
import UserCard from '../components/userCard.vue'
import UserControls from '../components/userControls.vue'
import { Component } from 'vue-property-decorator'

import { Socket } from 'vue-socket.io-extended'

type User = any // TODO replace with actually typed user

@Component({
  components: {
    BaseButton,
    EstimationChart,
    EstimationNumbers,
    UserCard,
    UserControls,
  },
})
export default class Room extends Vue {

  roomName = this.$route.params.roomName
  roomId: string | null = null
  isConnected = false
  users: User[] = [] // TODO specific type for user
  numbers = ['1', '2', '3', '5', '8', '13', '21', '?']
  name = ''
  estimation: string | null = null
  options= {
    responsive: true,
    maintainAspectRatio: false,
  }
  reconnectionInterval?: number

  get chartData () {
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
  }
  
  get estimations() {
    if (!this.users) {
      return []
    }
    const intArr = Object.values(this.users).map((user) => (user as any).estimation)
    return this.numbers.map(
      (fibNum) => intArr.filter((x) => x === fibNum).length || null
    )
  }

  get currentUser() {
    return this.users.find((user) => user.id === this.$socket.client.id)
  }

  get currentUserIsAdmin() {
    if (!this.currentUser) {
      return false
    }
    return this.currentUser.roles.includes('ADMIN')
  }

  mounted() {
    this.isConnected = this.$socket.connected
    this.reconnectionInterval = setInterval(this.reconnect, 1000)
    this.reconnect()
  }

  destroyed() {
    if (this.reconnectionInterval) clearInterval(this.reconnectionInterval)
  }

  @Socket()
  connect() {
    this.isConnected = true
  }

  @Socket()
  disconnect() {
    this.isConnected = false
  }

  @Socket()
  userList(users: User[]) {
    this.users = users.sort((a: any, b: any) => (a.$loki > b.$loki) as any)
  }

  @Socket()
  joinedRoom(roomId: string) {
    this.roomId = roomId
  }

  @Socket()
  estimationsCleared() {
    this.estimation = null
  }

  reconnect() {
    if (!this.isConnected) {
      console.log('Reconnecting...')
      this.$socket.client.connect()
      this.joinRoom()
    }
    if (!this.roomId) {
      this.joinRoom()
    }
  }

  joinRoom() {
    console.log('Joining Room...')
    this.$socket.client.emit('joinRoom', this.roomName)
  }

  estimate(value: string | null) {
    // allow deselect of number/button
    if (this.estimation === value) {
      value = null
    }
    this.estimation = value
    this.$socket.client.emit('setEstimation', value)
  }

  clearEstimations() {
    this.$socket.client.emit('clearEstimations')
  }

  revealEstimations() {
    this.$socket.client.emit('revealEstimations')
  }

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
