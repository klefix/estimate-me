<template>
  <aside class="settings">
    <form @submit.prevent="saveSettings">
      <fieldset>
        <legend>Theme</legend>
        <select v-model="settings.theme" @change="$emit('theme-change', settings.theme)">
          <option
            v-for="theme in availableThemes"
            :key="theme.value"
            :value="theme.value"
          >
            {{ theme.name }}
          </option>
        </select>
      </fieldset>
    </form>
  </aside>
</template>
<script>
export default {
  name: 'SettingsPanel',
  data() {
    return {
      settings: {
        theme: 'cpt-obvious',
      },
      availableThemes: [
        {
          value: 'cpt-obvious',
          name: 'Cpt. Obvious'
        },
        {
          value: 'neumorpheus',
          name: 'NeuMorpheus'
        },
        {
          value: 'c64',
          name: 'C64'
        }
      ]
    }
  },
  methods: {
    saveSettings() {
      console.log(this.settings)
    }
  },
  mounted() {
    if (localStorage.getItem('estimateMeTheme')) {
      this.settings.theme = localStorage.getItem('estimateMeTheme')
    }
  }
}
</script>

<style scoped>
.settings {
  padding: 3rem 0.5rem;
  text-align: left;
  color: var(--GLOBAL_TEXT_COLOR);
}

fieldset {
  border: none;
}

legend {
  padding: 0;
  margin: 0;
}
</style>