<template>
  <header class="header">
    <LogoCutout class="logo" />
    <h2 class="marginRight">Estimagic</h2>
    <h2 v-if="roomName" class="marginRight">room: '{{ roomName }}'</h2>
    <SettingsPanel class="settings" v-on="$listeners" />
  </header>
</template>

<script>
import SettingsPanel from './settingsPanel'
import LogoCutout from "./logo-cutout.vue";

export default {
  name: 'AppHeader',

  components: {
    LogoCutout,
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
    filter: drop-shadow(0 0 0 var(--headerTextColor, var(--GLOBAL_TEXT_COLOR)));
    color: var(--headerTextColor, var(--GLOBAL_TEXT_COLOR));
  }

  .marginRight {
    margin-right: 9.375rem;
  }

  .settings {
    margin-left: auto;
  }
}
</style>
