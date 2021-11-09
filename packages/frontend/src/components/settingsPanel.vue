<template>
  <aside class="settings">
    <form class="form" @submit.prevent="saveSettings">
      <h2 class="title">theme</h2>
      <select
        v-model="settings.theme"
        @change="$emit('theme-change', settings.theme)"
      >
        <option
          v-for="theme in availableThemes"
          :key="theme.value"
          :value="theme.value"
        >
          {{ theme.name }}
        </option>
      </select>
    </form>
  </aside>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component } from 'vue-property-decorator'

@Component({
  name: 'SettingsPanel',
})
export default class SettingsPanel extends Vue {
  settings = {
    theme: 'cpt-obvious',
  }
  availableThemes = [
    {
      value: 'cpt-obvious',
      name: 'Cpt. Obvious',
    },
    {
      value: 'neumorpheus',
      name: 'NeuMorpheus',
    },
    {
      value: 'c64',
      name: 'C64',
    },
  ]

  saveSettings(): void {
    console.log(this.settings)
  }

  mounted(): void {
    if (localStorage.getItem('estimateMeTheme')) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.settings.theme = localStorage.getItem('estimateMeTheme')!
    }
  }
}
</script>

<style scoped lang="scss">
.settings {
  text-align: left;
  color: var(--GLOBAL_TEXT_COLOR);

  .form {
    display: flex;
    align-items: center;

    .title {
      padding-right: 0.75rem;
      font-size: 1.25rem;
      color: var(--headerTextColor, var(--GLOBAL_TEXT_COLOR));
    }

    select {
      max-width: 100%;
      padding: var(--buttonPadding, 0.75rem);
      border: var(--buttonBorder, var(--GLOBAL_BORDER_DEFAULT, none));
      border-radius: var(
        --buttonBorderRadius,
        var(--GLOBAL_BORDER_RADIUS_DEFAULT)
      );
      background-color: transparent;
      color: var(--inputColor, var(--GLOBAL_TEXT_COLOR));
      font-size: 1rem;
      font-weight: 700;
      box-shadow: var(--buttonBoxShadow, var(--boxShadow400));
      opacity: 0.8;
    }

    select:active,
    select:focus {
      outline: none;
      box-shadow: none;
    }
  }
}
</style>
