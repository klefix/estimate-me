<template>
  <div class="admin_controls">
    <section>
      <p>You are the admin of this room!</p>
      <p>
        To make someone else admin, move the cursor above their head and click
        the appearing crown icon.
      </p>
    </section>
    <div>
      <input v-model="estimationValues" />
      <BaseButton variant="primary" @click="setEstimationValues">
        Set Estimation Values
      </BaseButton>
    </div>
    <div>
      <BaseButton variant="danger" @click="clearEstimations">
        Clear Estimations
      </BaseButton>
    </div>
    <div>
      <BaseButton variant="primary" @click="revealEstimations">
        Reveal Estimations
      </BaseButton>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator'
import Vue from 'vue'
import BaseButton from '../components/baseButton.vue'

@Component({
  name: 'AdminControls',
  components: {
    BaseButton,
  },
})
export default class AdminControls extends Vue {
  estimationValues = ''

  get estimationValuesArray() {
    return this.estimationValues.split(',').map((value) => value.trim())
  }

  clearEstimations() {
    this.$socket.client.emit('clearEstimations')
  }

  revealEstimations() {
    this.$socket.client.emit('revealEstimations')
  }

  setEstimationValues() {
    this.$socket.client.emit('setEstimationValues', this.estimationValues)
  }
}
</script>

<style scoped></style>
