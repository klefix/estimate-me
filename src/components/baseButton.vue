<template>
  <component
    :is="comp"
    v-bind="$attrs"
    :class="['button', variant]"
    @click="$emit('click')"
  >
    <slot />
  </component>
</template>
<script>
export default {
  name: 'BaseButton',

  props: {
    tag: {
      type: String,
    },
    variant: {
      type: String,
      validator: (string) =>
        ['primary', 'secondary', 'success', 'danger', 'text'].includes(string),
      default: 'secondary',
    },
  },

  computed: {
    comp() {
      if (this.$attrs.to) {
        return 'router-link'
      }
      return 'button'
    },
  },
}
</script>

<style lang="scss" scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  background: var(--buttonBackground, var(--GLOBAL_ACCENT_COLOR, none));
  border: var(--buttonBorder, var(--GLOBAL_BORDER_DEFAULT, none));
  border-radius: var(--buttonBorderRadius, var(--GLOBAL_BORDER_RADIUS_DEFAULT));
  color: var(--buttonColor, var(--GLOBAL_TEXT_COLOR_WHITE));
  font-size: 1rem;
  font-family: inherit;
  font-weight: 700;
  padding: var(--buttonPadding, 10px);
  box-shadow: var(--buttonBoxShadow, var(--boxShadow400));
  opacity: 0.8;
  transform: opacity 300ms ease-in;
  text-decoration: none;
}

.primary {
  background: var(--primaryButtonBackground, var(--GLOBAL_PRIMARY_COLOR));
  border-color: var(--primaryButtonBorderColor, var(--GLOBAL_PRIMARY_COLOR));
  color: var(--primaryButtonColor, var(--GLOBAL_TEXT_COLOR_WHITE));
}
.primary:hover,
.primary:focus,
.primary:active {
  background: var(
    --primaryButtonBackgroundActive,
    var(--GLOBAL_PRIMARY_COLOR_DARK)
  );
  border-color: var(
    --primaryButtonBorderActive,
    var(--GLOBAL_PRIMARY_COLOR_DARK)
  );
  color: var(--primaryButtonColorActive, var(--GLOBAL_TEXT_COLOR_WHITE));
}

.secondary {
  background: var(--secondaryButtonBackground, var(--GLOBAL_SECONDARY_COLOR));
  border-color: var(
    --secondaryButtonBorderColor,
    var(--GLOBAL_SECONDARY_COLOR)
  );
  color: var(--secondaryButtonColor, var(--GLOBAL_TEXT_COLOR_WHITE));
}
.secondary:hover,
.secondary:focus,
.secondary:active {
  background: var(
    --secondaryButtonBackgroundActive,
    var(--GLOBAL_SECONDARY_COLOR_DARK)
  );
  border-color: var(
    --secondaryButtonBorderActive,
    var(--GLOBAL_SECONDARY_COLOR_DARK)
  );
  color: var(--secondaryButtonColorActive, var(--GLOBAL_TEXT_COLOR_WHITE));
}

.success {
  background: var(--successButtonBackground, var(--GLOBAL_SUCCESS_COLOR));
  border-color: var(--successButtonBorderColor, var(--GLOBAL_SUCCESS_COLOR));
  color: var(--successButtonColor, var(--GLOBAL_TEXT_COLOR_WHITE));
}
.success:hover,
.success:focus,
.success:active {
  background: var(
    --successButtonBackgroundActive,
    var(--GLOBAL_SUCCESS_COLOR_DARK)
  );
  border-color: var(
    --successButtonBorderActive,
    var(--GLOBAL_SUCCESS_COLOR_DARK)
  );
  color: var(--successButtonColorActive, var(--GLOBAL_TEXT_COLOR_WHITE));
}

.danger {
  background: var(--dangerButtonBackground, var(--GLOBAL_DANGER_COLOR));
  border-color: var(--dangerButtonBorderColor, var(--GLOBAL_DANGER_COLOR));
  color: var(--dangerButtonColor, var(--GLOBAL_TEXT_COLOR_WHITE));
}
.danger:hover,
.danger:focus,
.danger:active {
  background: var(
    --dangerButtonBackgroundActive,
    var(--GLOBAL_DANGER_COLOR_DARK)
  );
  border-color: var(
    --dangerButtonBorderActive,
    var(--GLOBAL_DANGER_COLOR_DARK)
  );
  color: var(--dangerButtonColorActive, var(--GLOBAL_TEXT_COLOR_WHITE));
}

.text {
  background: var(--textButtonBackground, none);
  border-color: var(--textButtonBorderColor, transparent);
  color: var(--textButtonColor, var(--GLOBAL_TEXT_COLOR));
}
.text:hover,
.text:focus,
.text:active {
  background: var(--textButtonBackgroundActive, none);
  border-color: var(--textButtonBorderActive, transparent);
  color: var(--textButtonColorActive, var(--GLOBAL_TEXT_COLOR));
}
</style>
