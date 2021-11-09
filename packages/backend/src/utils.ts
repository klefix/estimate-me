import { Room, User } from '@estimate-me/api'

export const log = (msg: string, msg2?: string | string[]): void => {
  const date = new Date().toDateString().toLocaleString()

  let str = `[${date}]: ${msg}`
  if (msg2) {
    str += ' ' + msg2
  }
  console.log(str)
}

export const renderEstimation = (
  user: User,
  currentRoom: Room
): boolean | string | null => {
  if (currentRoom.estimationsVisible && user.estimation !== null) {
    return user.estimation
  }
  return user.estimation !== null ? true : null
}
