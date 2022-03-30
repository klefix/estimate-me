<template>
  <div class="grid">
    <div v-if="!isConnected">Connecting...</div>
    <div v-else-if="!roomId">Joining room...</div>
    <div :class="['ui_grid', currentUserIsAdmin && 'ui_grid--admin']" v-else>
      <AdminControls v-if="currentUserIsAdmin" />
      <div class="chart-container">
        <EstimationChart
          :chart-data="chartData"
          @click="highlightUsersByEstimation"
        />

        <dl>
          <dt>Minimum:</dt>
          <dd>{{ estimations.min }}</dd>
          <dt>Maximum:</dt>
          <dd>{{ estimations.max }}</dd>
          <dt>Most agreed on:</dt>
          <dd>{{ estimations.mostAgreedOn }}</dd>
        </dl>
      </div>

      <div class="users">
        <UserCard
          v-for="user in users"
          :key="user.id"
          :user="user"
          :currentUser="currentUser"
          :highlight="highlightEstimation === user.estimation"
        />
      </div>

      <EstimationValues
        class="estimation-values"
        :values="estimationValues"
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
import AdminControls from '../components/adminControls.vue'
import EstimationChart from '../components/estimationChart.vue'
import EstimationValues from '../components/estimationValues.vue'
import UserCard from '../components/userCard.vue'
import UserControls from '../components/userControls.vue'
import { Component } from 'vue-property-decorator'
import { User, Role } from '@estimate-me/api'
import { findLastIndex } from '../utils/array'

import { Socket } from 'vue-socket.io-extended'

@Component({
  components: {
    AdminControls,
    EstimationChart,
    EstimationValues,
    UserCard,
    UserControls,
  },
})
export default class Room extends Vue {
  roomName = this.$route.params.roomName
  roomId: string | null = null
  isConnected = false
  users: User[] = []
  name = ''
  estimation: null | string = null
  estimationValues = ['1', '2', '3', '5', '8', '13', '21', '?']
  options = {
    responsive: true,
    maintainAspectRatio: false,
  }
  reconnectionInterval: number | null = null
  highlightEstimation: string | null = null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get chartData(): { labels: any[]; datasets: any[] } {
    return {
      labels: this.estimationValues,
      datasets: [
        {
          label: 'Estimations',
          backgroundColor: '#f87979',
          data: this.estimations?.values,
        },
      ],
    }
  }

  get estimations(): null | {
    values: (number | null)[]
    min: string
    max: string
    mostAgreedOn: string
  } {
    if (!this.users) {
      return null
    }
    const intArr = Object.values(this.users).map((user) => user.estimation)
    const values = this.estimationValues.map(
      (value) => intArr.filter((x) => x === value).length || null
    )
    const min = this.estimationValues[values.findIndex((e) => e !== null)]
    const max =
      this.estimationValues[
        findLastIndex(values, (e: number | null) => e !== null)
      ]
    const mostAgreedOn =
      this.estimationValues[
        findLastIndex(
          values,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (e: number | null) => e === Math.max(...(values as any))
        )
      ]
    return {
      values,
      min,
      max,
      mostAgreedOn,
    }
  }

  get currentUser(): User | undefined {
    return this.users.find((user) => user.id === this.$socket.client.id)
  }

  get currentUserIsAdmin(): boolean {
    if (!this.currentUser) {
      return false
    }
    return this.currentUser.roles.includes(Role.ADMIN)
  }

  mounted(): void {
    this.isConnected = this.$socket.connected
    this.reconnectionInterval = setInterval(this.reconnect, 1000)
    this.reconnect()
  }

  destroyed(): void {
    if (this.reconnectionInterval) clearInterval(this.reconnectionInterval)
    this.$socket.client.disconnect()
  }

  @Socket()
  connect(): void {
    this.isConnected = true
  }

  @Socket()
  disconnect(): void {
    this.isConnected = false
  }

  @Socket()
  userList(users: User[]): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.users = users.sort((a, b) => a.$loki > b.$loki)
  }

  @Socket()
  joinedRoom(roomId: string): void {
    this.roomId = roomId
  }

  @Socket()
  estimationsCleared(): void {
    this.estimation = null
  }

  @Socket()
  estimationValuesUpdated(values: string[]|string): void {
    console.info('estimationValuesUpdated', values)
    if (!values) {
      return
    }
    this.estimationValues = typeof values === 'string' ? values.split(',') : values
  }

  reconnect(): void {
    if (!this.isConnected) {
      console.log('Reconnecting...')
      this.$socket.client.connect()
      this.joinRoom()
    }
    if (!this.roomId) {
      this.joinRoom()
    }
  }

  joinRoom(): void {
    console.log('Joining Room...')
    this.$socket.client.emit('joinRoom', this.roomName)
  }

  estimate(value: string | null): void {
    // allow deselect of number/button
    if (this.estimation === value) {
      value = null
    }
    this.estimation = value
    this.$socket.client.emit('setEstimation', value)
  }

  highlightUsersByEstimation(data: { value: string; id: string }): void {
    if (this.highlightEstimation === data.value) {
      this.highlightEstimation = null
    } else {
      this.highlightEstimation = data.value
    }
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
  grid-template-areas:
    'graph'
    'estimation'
    'users'
    'controls';
  grid-template-columns: 1fr;
  grid-template-rows: auto;
  grid-gap: 2rem;
  max-width: 100%;
}

.ui_grid--admin {
  grid-template-areas:
    'graph'
    'adminArea'
    'estimation'
    'users'
    'controls';
}

@media (min-width: 768px) {
  .ui_grid {
    grid-template-areas:
      'estimation estimation graph'
      'users users users'
      'controls controls controls';
    grid-template-columns: 1fr 1fr 300px;
    grid-template-rows: repeat(3, auto);
  }
  .ui_grid--admin {
    grid-template-areas:
      'adminArea adminArea graph'
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

.estimation-values {
  grid-area: estimation;
}

.user-controls {
  grid-area: controls;
}

@media (min-width: 768px) {
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
