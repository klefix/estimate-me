<template>
  <div class="admin_controls">
    <section>
      <p>You are the admin of this room!</p>
      <p>
        To make someone else admin, move the cursor above their head and
        click the appearing crown icon.
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

<script>
import BaseButton from '../components/baseButton.vue'

export default {
  name: "AdminControls",
  components: {
    BaseButton,
  },
  data() {
    return {
      estimationValues: '',
    }
  },
  methods: {
    clearEstimations() {
      this.$socket.client.emit('clearEstimations')
    },

    revealEstimations() {
      this.$socket.client.emit('revealEstimations')
    },

    setEstimationValues() {
      console.log({estimationValues: this.estimationValues})
      this.$socket.client.emit('setEstimationValues', this.estimationValues)
    }
  }
}
</script>

<style scoped>

</style>
