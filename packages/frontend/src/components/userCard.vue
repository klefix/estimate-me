<template>
  <div :class="['user', highlight && 'highlight']">
    <div class="role-icon">
      <i v-if="isAdmin(user)" class="fas fa-crown" />
      <i
        v-if="isAdmin(currentUser) && user.id !== currentUser.id"
        class="fas fa-crown shadow"
        @click="grantAdmin(user)"
      />
      <i v-if="user.roles.includes('TRACK_TIME')" class="fas fa-clock" />
    </div>
    <emoji-picker @emoji="changeIcon" :emojiTable="emojiTable">
      <div
        ref="emojiPicker"
        class="icon"
        :class="{ pointer: user.id === currentUser.id }"
        slot="emoji-invoker"
        slot-scope="{ events: { click: clickEvent } }"
        @click.stop="user.id === currentUser.id && clickEvent()"
      >
        <template v-if="user.icon">
          {{ user.icon }}
        </template>
        <template v-else>
          <i v-if="user.name !== ''" class="fas fa-user" />
          <i v-else class="fas fa-user-secret" />
        </template>
      </div>
      <div slot="emoji-picker" slot-scope="{ emojis, insert }">
        <div class="emoji-picker">
          <div v-for="(emojiGroup, category) in emojis" :key="category">
            <h6 class="emoji-category">{{ category }}</h6>
            <div>
              <span
                v-for="(emoji, emojiName) in emojiGroup"
                :key="emojiName"
                @click="insert(emoji)"
                :title="emojiName"
                class="emoji-item"
              >
                {{ emoji }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </emoji-picker>
    <div class="name">{{ user.name }}</div>
    <div class="estimation">
      <i v-if="user.estimation === true" class="fas fa-check" />
      <span v-else>{{ user.estimation }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { EmojiPicker } from 'vue-emoji-picker'
import emojis from '../config/emojis'

import Vue from 'vue'
import { Component, Prop, Ref } from 'vue-property-decorator'
import type { User } from '../../../@types/api'

@Component({
  name: 'UserCard',
  components: {
    EmojiPicker,
  },
})
export default class UserControls extends Vue {
  icon: string | null = null
  emojiTable = emojis

  @Prop({ required: true, type: Object }) user!: User
  @Prop({ type: Object }) currentUser!: User
  @Prop({ type: Boolean, default: false }) highlight!: boolean
  @Ref() readonly emojiPicker!: HTMLInputElement

  mounted(): void {
    if (localStorage) {
      this.icon = localStorage.getItem('icon')
      this.broadcastIcon()
    }
  }

  isAdmin(user: User): boolean {
    if (!user) {
      return false
    }
    return user.roles.includes('admin')
  }

  grantAdmin(user: User): void {
    this.$socket.client.emit('grantAdmin', user.id)
  }

  changeIcon(icon: string): void {
    this.icon = icon
    this.emojiPicker.click()

    if (localStorage) {
      localStorage.setItem('icon', icon)
    }
    this.broadcastIcon()
  }

  broadcastIcon(): void {
    this.$socket.client.emit('setIcon', this.icon)
  }
}
</script>

<style lang="scss" scoped>
.user {
  position: relative;
  display: grid;
  grid-template-rows: 1.5rem 1.5rem auto 2rem;
  grid-gap: 0.25rem;
  text-align: center;
  align-content: center;

  color: var(--GLOBAL_TEXT_COLOR_LIGHTEST);

  border-radius: var(--GLOBAL_BORDER_RADIUS_DEFAULT);
  padding: 0.5rem 0;

  &.highlight {
    background: rgba(255, 255, 255, 0.15);
  }
}

.icon {
  font-size: 1.5rem;
  cursor: default;

  &.pointer {
    cursor: pointer;
  }
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
  margin: 0.3rem 0 0;
  min-height: 1.2rem;
}

.estimation {
  font-size: 2rem;
  line-height: 1;
  display: inline-block;

  border-radius: var(--GLOBAL_BORDER_RADIUS, 15px);
  box-shadow: var(--estimationBoxShadow, var(--boxShadow200));
}

.emoji-picker {
  z-index: 10;
  position: absolute;
  left: 4rem;
  top: 1.5rem;
  width: 11.7rem;
  height: 10rem;
  background-color: var(--GLOBAL_BACKGROUND_ACCENT, #aaa);
  overflow-x: hidden;
  overflow-y: scroll;
  padding: 0.3rem 0.6rem 0.6rem;
}

.emoji-category {
  padding: 0.5rem 0;
  margin: 0;
}

.emoji-item {
  cursor: pointer;
}
</style>
