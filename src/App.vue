<template>
  <div id="app" :class="theme">
    <Header :room-name='roomName' @theme-change='setTheme' />
    <main>
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
import Header from './components/header.vue'

export default {
  name: 'App.vue',

  components: {
    Header,
  },

  data() {
    return {
      theme: 'cpt-obvious',
    }
  },

  watch: {
    theme: {
      handler() {
        localStorage.setItem('estimateMeTheme',this.theme);
      },
    }
  },

  computed: {
    roomName() {
      return this.$route.name === 'room' ? this.$route.params.roomName : null
    },
  },

  methods: {
    setTheme(value) {
      this.theme = value
    },
  },

  mounted() {
    if (localStorage.getItem('estimateMeTheme')) {
      this.theme = localStorage.getItem('estimateMeTheme')
    }
  },
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  background: var(--GLOBAL_BACKGROUND);
  color: var(--GLOBAL_TEXT_COLOR);
  font-family: var(--GLOBAL_FONT);
  font-weight: 400;
  width: 100vw;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: var(--GLOBAL_TEXT_ALIGN);
}

main {
  padding: 1rem;
  transition: transform 300ms ease-in;
}

/* THEMES */

.cpt-obvious {
  --GLOBAL_TEXT_COLOR: #102A43;
  --GLOBAL_TEXT_COLOR_LIGHT: #627D98;
  --GLOBAL_TEXT_COLOR_LIGHTEST: #9FB3C8;
  --GLOBAL_TEXT_COLOR_WHITE: white;
  --GLOBAL_BACKGROUND: white;
  --GLOBAL_BACKGROUND_ACCENT_DARK: #9FB3C8;
  --GLOBAL_BACKGROUND_ACCENT: #D9E2EC;
  --GLOBAL_BACKGROUND_ACCENT_LIGHT: #F0F4F8;
  --GLOBAL_FONT: 'Avenir', 'Roboto', Helvetica, Arial, sans-serif;
  --GLOBAL_TEXT_ALIGN: left;
  --GLOBAL_PRIMARY_COLOR_LIGHT: #62B0E8;
  --GLOBAL_PRIMARY_COLOR: #2680C2;
  --GLOBAL_PRIMARY_COLOR_DARK: #0F609B;
  --GLOBAL_SECONDARY_COLOR: #17B897;
  --GLOBAL_SECONDARY_COLOR_DARK: #048271;
  --GLOBAL_SUCCESS_COLOR: #2DCCA7;
  --GLOBAL_DANGER_COLOR: #D64545;
  --GLOBAL_DANGER_COLOR_DARK: #A61B1B;
  --GLOBAL_GRID_LINE_COLOR: var(--GLOBAL_TEXT_COLOR_LIGHT);
  --GLOBAL_BORDER_DEFAULT: 1px solid var(--GLOBAL_TEXT_COLOR);
  --GLOBAL_BORDER_ACTIVE: 1px solid var(--GLOBAL_ACCENT_COLOR);
  --GLOBAL_BORDER_RADIUS_DEFAULT: 4px;

  --boxShadow200: none;
  --boxShadow400: none;
  --buttonPadding: 8px 16px;
  --buttonColorActive: var(--GLOBAL_TEXT_COLOR_WHITE);
  --inputColorActive: var(--GLOBAL_TEXT_COLOR);
  --headerTextColor: var(--GLOBAL_TEXT_COLOR_WHITE);
}

@media(prefers-color-scheme: dark) {
  .cpt-obvious {
    --GLOBAL_TEXT_COLOR: #F0F4F8;
    --GLOBAL_TEXT_COLOR_LIGHT: #BCCCDC;
    --GLOBAL_TEXT_COLOR_LIGHTEST: #9FB3C8;
    --GLOBAL_TEXT_COLOR_WHITE: #102A43;
    --GLOBAL_BACKGROUND: #102A43;
    --GLOBAL_BACKGROUND_ACCENT_DARK: #486581;
    --GLOBAL_BACKGROUND_ACCENT: #486581;
    --GLOBAL_BACKGROUND_ACCENT_LIGHT: #334E68;
    --GLOBAL_PRIMARY_COLOR_LIGHT: #62B0E8;
    --GLOBAL_PRIMARY_COLOR: #2680C2;
    --GLOBAL_PRIMARY_COLOR_DARK: #0F609B;
    --GLOBAL_SECONDARY_COLOR: #17B897;
    --GLOBAL_SECONDARY_COLOR_DARK: #048271;
    --GLOBAL_SUCCESS_COLOR: #2DCCA7;
    --GLOBAL_DANGER_COLOR: #D64545;
    --GLOBAL_DANGER_COLOR_DARK: #A61B1B;
    --headerBackground: var(--GLOBAL_PRIMARY_COLOR_DARK);
    --inputBackground: var(--GLOBAL_BACKGROUND_ACCENT_LIGHT);
  }
}

.neumorpheus {
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
  --GLOBAL_GRID_LINE_COLOR: var(--GLOBAL_TEXT_COLOR_LIGHT);
  --GLOBAL_DANGER_COLOR: #D64545;
  --GLOBAL_DANGER_COLOR_DARK: #A61B1B;

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

.c64 {
  --GLOBAL_TEXT_COLOR: rgb(166,167,253);
  --GLOBAL_TEXT_COLOR_LIGHT: rgb(166,167,253);
  --GLOBAL_TEXT_COLOR_LIGHTEST: rgb(166,167,253);
  --GLOBAL_TEXT_COLOR_WHITE: white;
  --GLOBAL_BACKGROUND: rgb(68,74,227);
  --GLOBAL_BACKGROUND_ACCENT: rgb(78, 83, 228);
  --GLOBAL_BACKGROUND_ACCENT_LIGHT: rgb(94, 98, 230);
  --GLOBAL_PRIMARY_COLOR_LIGHT: rgb(166,167,253);
  --GLOBAL_PRIMARY_COLOR: rgb(166,167,253);
  --GLOBAL_PRIMARY_COLOR_DARK: rgb(166,167,253);
  --GLOBAL_SECONDARY_COLOR: rgb(166,167,253);
  --GLOBAL_SECONDARY_COLOR_DARK: rgb(166,167,253);
  --GLOBAL_SUCCESS_COLOR: rgb(166,167,253);
  --GLOBAL_DANGER_COLOR: rgb(166,167,253);
  --GLOBAL_DANGER_COLOR_DARK: rgb(166,167,253);
  --GLOBAL_GRID_LINE_COLOR: var(--GLOBAL_TEXT_COLOR);
  --GLOBAL_BORDER_RADIUS_DEFAULT: 1px;
  --GLOBAL_BORDER_DEFAULT: 4px solid rgb(166,167,253);
  --GLOBAL_FONT: 'Courier New', 'Menlo', Helvetica, Arial, sans-serif;
  --GLOBAL_TEXT_ALIGN: left;
  --GLOBAL_ACCENT_COLOR: white;
  --GLOBAL_ACCENT_COLOR_DARK: white;
  --headerBackground: var(--GLOBAL_BACKGROUND_ACCENT);
  --headerTextColor: white;
  --textButtonColor: white;
}

</style>
