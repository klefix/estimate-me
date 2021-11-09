import { Room } from '@estimate-me/api'
import { Server } from 'socket.io'
import db from './db'

export const rooms = db.addCollection<Room>('rooms')

export const findOrCreateRoom = (roomName: string): Room => {
  const possiblyExistingRoom = rooms.findOne({ name: roomName })
  if (possiblyExistingRoom) {
    return possiblyExistingRoom
  }
  const freshRoom = rooms.insert({
    name: roomName,
    estimationsVisible: false,
    estimationValues: [],
  })
  if (!freshRoom) {
    throw Error(`Could not insert room ${roomName}`)
  }
  return freshRoom
}

export const numClientsInRoom = (io: Server, roomId: string): number => {
  console.log(io.sockets.adapter.rooms)
  const room = io.sockets.adapter.rooms.get(roomId)
  if (!room) {
    return -1
  }
  return room.size
}
