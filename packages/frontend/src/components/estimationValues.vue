<template>
  <div class="values_wrapper">
    <h3 v-if="!estimation">Please estimate</h3>
    <h3 v-else>Wait for reveal, feel free to change your estimation</h3>
    <div class="values">
      <div class="value" v-for="value in values" :key="value">
        <BaseButton
          :class="{ active: estimation === value }"
          :variant="estimation === value ? 'primary' : 'text'"
          @click="setEstimation(value)"
        >
          {{ value }}
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
  @Prop({ type: Array, required: true }) values!: string[]

  @Prop({ type: String, default: null }) estimation!: string | null

  setEstimation(number: string): void {
    this.$emit('estimated', number)
  }
}
</script>

<style lang="scss" scoped>
.values_wrapper {
  align-self: center;
  padding: 2rem 1rem;
  border-radius: var(--GLOBAL_BORDER_RADIUS_DEFAULT);
  background: var(
    --estimationBackground,
    var(--GLOBAL_BACKGROUND_ACCENT_LIGHT)
  );
  box-shadow: var(--estimationSectionBoxShadow, none);
}
.values_wrapper h3 {
  margin: 0;
}

.values {
  display: grid;
  grid-template-columns: repeat(auto-fill, 3rem);
  grid-gap: 1rem;
  margin: 1rem 0;
}

.value {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
