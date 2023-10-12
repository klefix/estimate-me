<template>
  <header class="header">
    <img src="../assets/estimate-me.png" alt="logo" class="logo" />
    <h2 class="marginRight">Estimagic</h2>
    <h2 v-if="roomName" class="marginRight">room: '{{ roomName }}'</h2>
    <SettingsPanel v-on="$listeners" />
  </header>
</template>

<script>
import SettingsPanel from './settingsPanel'

export default {
  name: 'AppHeader',

  components: {
    SettingsPanel,
  },

  props: {
    roomName: {
      type: String,
    },
  },
}
</script>

<style scoped lang="scss">
.header h1,
.header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--headerTextColor, var(--GLOBAL_TEXT_COLOR));
}

.header {
  position: sticky;
  top: 0;
  width: 100vw;
  padding: 0.5rem 2rem;
  display: flex;
  align-items: center;
  background: var(--headerBackground, var(--GLOBAL_PRIMARY_COLOR_LIGHT));
  color: var(--headerTextColor, var(--GLOBAL_TEXT_COLOR));
  z-index: 42;

  .logo {
    height: 2.75rem;
    margin-right: 0.75rem;
    filter: opacity(0.5)
      drop-shadow(0 0 0 var(--headerTextColor, var(--GLOBAL_TEXT_COLOR)));
  }

  .marginRight {
    margin-right: 9.375rem;
  }
}
</style>
