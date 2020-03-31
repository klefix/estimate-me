export const log = (msg, msg2) => {
  const date = new Date().toDateString().toLocaleString()

  let str = `[${date}]: ${msg}`
  if (msg2) {
    str += ' ' + msg2
  }
  console.log(str)
}

export const renderEstimation = (user, currentRoom) => {
  if (currentRoom.estimationsVisible && user.estimation !== null) {
    return user.estimation
  }
  return user.estimation !== null ? true : null
}
