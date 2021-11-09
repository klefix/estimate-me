import { Room } from '@estimate-me/api'
import { Server } from 'socket.io'
import db from './db'

export const rooms = db.addCollection<Room>('rooms')

export const findOrCreateRoom = (roomName: string) => {
  return (
    rooms.findOne({ name: roomName }) ??
    rooms.insert({
      name: roomName,
      estimationsVisible: false,
      estimationValues: [],
    })!
  )
}

export const numClientsInRoom = (io: Server, roomId: string) => {
  console.log(io.sockets.adapter.rooms)
  const room = io.sockets.adapter.rooms.get(roomId)
  if (!room) {
    return -1
  }
  return room.size
}
