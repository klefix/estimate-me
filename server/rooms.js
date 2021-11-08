import db from './db'

export const rooms = db.addCollection('rooms')

export const findOrCreateRoom = roomName => {
  let room = rooms.findOne({ name: roomName })
  if (!room) {
    room = rooms.insert({ name: roomName, estimationsVisible: false })
  }
  return room
}

export const numClientsInRoom = (io, roomId) => {
  const room = io.sockets.adapter.rooms.get(roomId)
  if (!room) {
    return -1
  }
  return room.size
}
