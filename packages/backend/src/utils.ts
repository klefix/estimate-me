export const log = (msg: string, msg2?: string) => {
  const date = new Date().toDateString().toLocaleString()

  let str = `[${date}]: ${msg}`
  if (msg2) {
    str += ' ' + msg2
  }
  console.log(str)
}

type User = any // TODO actual type
type Room = any // TODO actual type

export const renderEstimation = (user: User, currentRoom: Room) => {
  if (currentRoom.estimationsVisible && user.estimation !== null) {
    return user.estimation
  }
  return user.estimation !== null ? true : null
}
