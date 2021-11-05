<template>
  <div :class="['user', highlight && 'highlight' ]">
    <div class="role-icon">
      <i v-if="isAdmin(user)" class="fas fa-crown"/>
      <i
        v-if="isAdmin(currentUser) && user.id !== currentUser.id"
        class="fas fa-crown shadow"
        @click="grantAdmin(user)"
      />
      <i v-if="user.roles.includes('TRACK_TIME')" class="fas fa-clock"/>
    </div>
    <i v-if="user.name !== ''" class="icon fas fa-user"/>
    <i v-else class="icon fas fa-user-secret"/>
    <div class="name">{{ user.name }}</div>
    <div class="estimation">
      <i v-if="user.estimation === true" class="fas fa-check"/>
      <span v-else>{{ user.estimation }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserCard',
  props: {
    user: {
      required: true,
      type: Object,
    },
    currentUser: {
      type: Object,
    },
    highlight: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    isAdmin(user) {
      if (!user) {
        return false
      }
      return user.roles.includes('ADMIN')
    },
    grantAdmin(user) {
      this.$socket.client.emit('grantAdmin', user.id)
    },
  },
}
</script>

<style lang="scss" scoped>
.user {
  display: grid;
  grid-template-rows: 1.5rem 1.5rem auto 2rem;
  grid-gap: 0.25rem;
  text-align: center;
  align-content: center;

  color: var(--GLOBAL_TEXT_COLOR_LIGHTEST);

  border-radius: var(--GLOBAL_BORDER_RADIUS_DEFAULT);
  padding: 0.5rem 0;

  &.highlight {
    background: rgba(255,255,255, 0.15);
  }
}

.icon {
  font-size: 1.5rem;
}

.role-icon {
  font-size: 1rem;
  margin: 0;

  .fa-crown.shadow {
    display: none;
    background-color: var(--crownShadowBackground, #aaa);
    color: transparent;
    cursor: pointer;
    text-shadow: var(--crownTextShadow, 2px 2px 3px rgba(255, 255, 255, 0.5));
    -webkit-background-clip: text;
    -moz-background-clip: text;
    background-clip: text;
  }
  &:hover {
    .fa-crown.shadow {
      display: inline;
    }
  }
}

.name {
  font-size: 1rem;
  line-height: 1.2;
  margin: 0;
  min-height: 1.2rem;
}

.estimation {
  font-size: 2rem;
  line-height: 1;
  display: inline-block;

  border-radius: var(--GLOBAL_BORDER_RADIUS, 15px);
  box-shadow: var(--estimationBoxShadow, var(--boxShadow200));
}
</style>
