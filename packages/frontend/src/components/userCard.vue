<template>
  <div class="user">
    <div class="role-icon">
      <i v-if="isAdmin(user)" class="fas fa-crown"></i>
      <i
        v-if="isAdmin(currentUser) && user.id !== currentUser.id"
        class="fas fa-crown shadow"
        @click="grantAdmin(user)"
      ></i>
      <i v-if="user.roles.includes('TRACK_TIME')" class="fas fa-clock"></i>
    </div>
    <i v-if="user.name !== ''" class="icon fas fa-user"></i>
    <i v-else class="icon fas fa-user-secret"></i>
    <div class="name">{{ user.name }}</div>
    <div class="estimation">
      <i v-if="user.estimation === true" class="fas fa-check"></i>
      <span v-else>{{ user.estimation }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Role, User } from '@estimate-me/api'
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component({
  name: 'UserCard',
})
export default class UserControls extends Vue {

  @Prop({ required: true, type: Object }) user!: User

  @Prop({ type: Object }) currentUser!: User

  isAdmin(user: User) {
    if (!user) {
      return false
    }
    return user.roles.includes(Role.ADMIN)
  }
  grantAdmin(user: User) {
    this.$socket.client.emit('grantAdmin', user.id)
  }
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
