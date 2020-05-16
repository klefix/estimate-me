<template>
  <div id="app" :class="theme">
    <header>
      <h1>Estimate-Me!</h1>
      <h2 v-if="isRoom">{{roomName}}</h2>
      <BaseButton class="settingsButton" variant="text" @click="toggleSettings">Settings</BaseButton>
      <div :class="['settingsArea', showSettings && 'settingsOpen']">
        <SettingsPanel
          v-if="showSettings"
          @theme-change="setTheme"
        />
      </div>
    </header>
    <main :class="[showSettings && 'settingsOpen']">
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
import BaseButton from './components/baseButton.vue'
import SettingsPanel from './components/settingsPanel.vue'

export default {
  name: 'App.vue',

  components: {
    BaseButton,
    SettingsPanel,
  },

  data() {
    return {
      showSettings: false,
      theme: 'cpt-obvious',
    }
  },

  computed: {
    isRoom() {
      return this.$route.name === 'room'
    },
    roomName() {
      console.log(this.$route);
      return this.isRoom ? this.$route.params.roomName : null
    },
  },

  methods: {
    toggleSettings() {
      this.showSettings = !this.showSettings
    },
    setTheme(value) {
      this.theme = value
    }
  }
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  background: var(--GLOBAL_BACKGROUND);
  color: var(--GLOBAL_TEXT_COLOR);
  font-family: var(--GLOBAL_FONT);
  font-weight: 400;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: var(--GLOBAL_TEXT_ALIGN);
}

header {
  position: sticky;
  top: 0;
  width: 100vw;
  padding: 0.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--GLOBAL_PRIMARY_COLOR_LIGHT);
  z-index: 42;
}

header h1 {
  color: var(--GLOBAL_PRIMARY_COLOR_DARK);
}

header h1,
header h2 {
  margin: 0;
  font-size: 1.25rem;
}

main {
  padding: 1rem;
  transition: transform 300ms ease-in;
}

main.settingsOpen {
  transform: translate(-100vw, 0);
}

.settingsArea {
  position: absolute;
  transition: transform 300ms ease-in;
  top: -2rem;
  right: 0;
  z-index: -1;
  height: 100vh;
  width: 100vw;
  padding: 4rem 1rem 1rem;
  transform: translate(100vw, 0);
  background: var(--GLOBAL_BACKGROUND_ACCENT);
}

.settingsArea.settingsOpen  {
  transform: translateX(0);
}

@media(min-width: 480px) {
  main.settingsOpen {
    transform: translate(-35vw, 0);
  }
  .settingsArea {
    width: 35vw;
    transform: translate(35vw, 0);
  }
}

/* THEMES */

.cpt-obvious {
  --GLOBAL_TEXT_COLOR: #40514e;
  --GLOBAL_TEXT_COLOR_LIGHT: fuchsia;
  --GLOBAL_TEXT_COLOR_LIGHTEST: #8b9b98;
  --GLOBAL_TEXT_COLOR_WHITE: white;
  --GLOBAL_BACKGROUND: white;
  --GLOBAL_BACKGROUND_ACCENT: #eff2f1;
  --GLOBAL_BACKGROUND_ACCENT: #dee4e3;
  --GLOBAL_FONT: 'Avenir', 'Roboto', Helvetica, Arial, sans-serif;
  --GLOBAL_TEXT_ALIGN: left;
  --GLOBAL_PRIMARY_COLOR_LIGHT: #8df8ea;
  --GLOBAL_PRIMARY_COLOR: #30e3ca;
  --GLOBAL_PRIMARY_COLOR_DARK: #11999e;
  --GLOBAL_SECONDARY_COLOR: orange;
  --GLOBAL_SECONDARY_COLOR_DARK: darkorange;
  --GLOBAL_SUCCESS_COLOR: #30e3ca;
  --GLOBAL_DANGER_COLOR: tomato;
  --GLOBAL_DANGER_COLOR_DARK: red;
  --GLOBAL_BORDER_DEFAULT: 1px solid var(--GLOBAL_TEXT_COLOR);
  --GLOBAL_BORDER_ACTIVE: 1px solid var(--GLOBAL_ACCENT_COLOR);
  --GLOBAL_BORDER_RADIUS_DEFAULT: 4px;

  --boxShadow200: none;
  --boxShadow400: none;
  --buttonPadding: 8px 16px;
  --buttonColorActive: var(--GLOBAL_TEXT_COLOR_WHITE);
  --inputColorActive: var(--GLOBAL_TEXT_COLOR);
}

.neumorpheus {
  --GLOBAL_TEXT_COLOR: #2c3e50;
  --GLOBAL_TEXT_COLOR: #2c3e50;
  --GLOBAL_TEXT_COLOR_LIGHT: #aaaaaa;
  --GLOBAL_TEXT_COLOR_LIGHTEST: #999999;
  --GLOBAL_TEXT_COLOR_WHITE: white;
  --GLOBAL_BACKGROUND: #eee;
  --GLOBAL_BACKGROUND_ACCENT: white;
  --GLOBAL_BORDER_RADIUS_DEFAULT: 15px;
  --GLOBAL_FONT: 'Roboto', Helvetica, Arial, sans-serif;
  --GLOBAL_TEXT_ALIGN: center;
  --GLOBAL_ACCENT_COLOR: #4b98bf;
  --GLOBAL_ACCENT_COLOR_DARK: #5ab9ea;

  --boxShadow200: inset 6px 6px 10px 0 rgba(0, 0, 0, 0.2),
    inset -6px -6px 10px 0 rgba(255, 255, 255, 0.5);
  --boxShadow400: 6px 6px 15px 0 rgba(0, 0, 0, 0.25),
    -8px -8px 12px 0 rgba(255, 255, 255, 0.8);

  --inputFontWeight: 700;
  --inputTextAlign: center;
  --inputColor: #999;
  --buttonColor: #999;
  --primaryButtonColor: var(--buttonColor);
  --primaryButtonColorActive: var(--GLOBAL_ACCENT_COLOR);
  --secondaryButtonColor: var(--buttonColor);
  --secondaryButtonColorActive: var(--GLOBAL_ACCENT_COLOR);
  --textButtonColor: var(--buttonColor);
  --textButtonColorActive: var(--GLOBAL_ACCENT_COLOR);
  --dangerButtonColor: var(--buttonColor);
  --dangerButtonColorActive: var(--GLOBAL_ACCENT_COLOR);

  --estimationSectionBoxShadow: var(--boxShadow400);
  --estimationBackground: var(--GLOBAL_BACKGROUND);
}

</style>