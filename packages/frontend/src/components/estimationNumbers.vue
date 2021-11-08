<template>
  <div class="numbers_wrapper">
    <h3 v-if="!estimation">Please estimate</h3>
    <h3 v-else>Wait for reveal, feel free to change your estimation</h3>
    <div class="numbers">
      <div class="number" v-for="number in numbers" :key="number">
        <BaseButton
          :class="{ active: estimation === number }"
          :variant="estimation === number ? 'primary' : 'text'"
          @click="setEstimation(number)"
        >
          {{ number }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import BaseButton from './baseButton.vue'
import { Component, Prop } from 'vue-property-decorator'

@Component({
  name: 'EstimationNumbers',
  components: {
    BaseButton,
  },
})
export default class EstimationNumbers extends Vue {
  @Prop({ type: Array, required: true }) numbers!: string[]
  
  @Prop({ type: String, default: null }) estimation!: string | null

  setEstimation(number: string) {
    this.$emit('estimated', number)
  }
}
</script>

<style lang="scss" scoped>
.numbers_wrapper {
  align-self: center;
  padding: 2rem 1rem;
  border-radius: var(--GLOBAL_BORDER_RADIUS_DEFAULT);
  background: var(--estimationBackground, var(--GLOBAL_BACKGROUND_ACCENT_LIGHT));
  box-shadow: var(--estimationSectionBoxShadow, none);
}
.numbers_wrapper h3 {
  margin: 0;
}

.numbers {
  display: grid;
  grid-template-columns: repeat(auto-fill, 3rem);
  grid-gap: 1rem;
  margin: 1rem 0;
}
.number {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
