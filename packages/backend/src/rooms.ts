import { Room } from '@estimate-me/api'
import db from './db'

export const rooms = db.addCollection<Room>('rooms')

export const findOrCreateRoom = (roomName: string) => {
  return rooms.findOne({ name: roomName }) ?? rooms.insert({ name: roomName, estimationsVisible: false, estimationValues: [] })!
}

export const numClientsInRoom = (io: any, roomId: string) => {
  const room = io.sockets.adapter.rooms[roomId]
  if (!room) {
    return -1
  }
  return room.length
}
