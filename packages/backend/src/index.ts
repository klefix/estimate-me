import dotenv from 'dotenv-flow'
import { Server } from 'socket.io'

dotenv.config()

const { NODEJS_SERVER_PORT, ENABLE_SSL, SSL_KEY_PATH, SSL_CERT_PATH } =
  process.env

import express from 'express'
import fs from 'fs'
import http from 'http'
import https from 'https'

const app = express()

let server
if (ENABLE_SSL && SSL_KEY_PATH && SSL_CERT_PATH) {
  server = https.createServer(
    {
      key: fs.readFileSync(SSL_KEY_PATH),
      cert: fs.readFileSync(SSL_CERT_PATH),
    },
    app
  )
} else {
  server = http.createServer(app)
}

server.listen(NODEJS_SERVER_PORT, function () {
  console.log(`listening on *:${NODEJS_SERVER_PORT}`)
})

const io = new Server(server, {
  cors: {
    origin: '*',
  },
})

import { rooms, findOrCreateRoom, numClientsInRoom } from './rooms'
import { createUser, isAdmin, users } from './users'

import { log, renderEstimation } from './utils'
import { User, Room, Role } from '@estimate-me/api'

io.on('connection', function (socket) {
  log(`user ${socket.id} connected`)

  const currentUser = users.insert(createUser(socket.id))

  if (!currentUser) {
    throw new Error(`Could not create user ${socket.id}`)
  }

  let currentRoom: Room | null = null

  const roomUsers = () => {
    if (!currentRoom) return []
    return users.find({ room: currentRoom.name })
  }

  const emitToRoom = <Payload>(channel: string, payload?: Payload) => {
    if (!currentUser?.room) return
    io.to(currentUser.room).emit(channel, payload)
  }

  const updateUserList = () => {
    emitToRoom('userList', maskEstimations(roomUsers()))
  }

  const areEstimationsComplete = () =>
    roomUsers().every((user) => user.estimation !== null)

  const maskEstimations = (users: User[]) => {
    if (!currentRoom) {
      return
    }
    const room = currentRoom
    return users.map((user) => ({
      ...user,
      estimation: renderEstimation(user, room),
    }))
  }

  const revealEstimations = () => {
    if (currentRoom) {
      currentRoom.estimationsVisible = true
      rooms.update(currentRoom)
    }
    updateUserList()
  }

  socket.on('joinRoom', function (roomName) {
    log(`User ${socket.id} joined room ${roomName}`)
    const room = findOrCreateRoom(roomName)

    currentRoom = room

    if (currentUser) {
      currentUser.room = room.name
    }

    socket.join(room.name)
    if (numClientsInRoom(io, room.name) === 1) {
      currentUser.roles.push(Role.ADMIN)
    }
    socket.emit('joinedRoom', room.name)

    emitToRoom('userList', maskEstimations(roomUsers()))
  })

  socket.on('setEstimation', function (value) {
    if (!currentUser) return
    log('setEstimation', value)

    currentUser.estimation = value
    users.update(currentUser)

    updateUserList()

    if (areEstimationsComplete()) {
      revealEstimations()
    }
  })

  socket.on('setName', function (value) {
    if (!currentUser) return
    log(`user ${socket.id} set their name to ${value}`)

    currentUser.name = value
    users.update(currentUser)

    updateUserList()
  })

  socket.on('setIcon', function (value) {
    log(`user ${socket.id} set their icon to ${value}`)

    currentUser.icon = value
    users.update(currentUser)

    updateUserList()
  })

  socket.on('disconnect', function () {
    log('user disconnected', socket.id)

    if (currentUser) {
      if (currentUser.room) {
        socket.leave(currentUser.room)
      }
      users.remove(currentUser)

      if (isAdmin(currentUser)) {
        const otherUsers = roomUsers()
        if (otherUsers.length > 0) {
          const nextAdmin = otherUsers[0]
          nextAdmin.roles.push(Role.ADMIN)
          users.update(nextAdmin)
        }
      }
    }

    updateUserList()
  })

  socket.on('setEstimationValues', function (values: string[]) {
    if (!isAdmin(currentUser) || !currentRoom) {
      return
    }

    currentRoom.estimationValues = values
    rooms.update(currentRoom)
    updateUserList()
    emitToRoom('estimationValuesUpdated', values)
    log('admin set estimationValues', values)
  })

  socket.on('clearEstimations', function () {
    if (!currentUser || !isAdmin(currentUser)) {
      return
    }

    roomUsers().forEach((user) => {
      user.estimation = null
      users.update(user)
    })
    if (currentRoom) {
      currentRoom.estimationsVisible = false
      rooms.update(currentRoom)
    }
    updateUserList()
    emitToRoom('estimationsCleared')
  })

  socket.on('revealEstimations', function () {
    if (!currentUser || !isAdmin(currentUser)) {
      return
    }

    revealEstimations()
  })

  socket.on('grantAdmin', function (userId) {
    log('grantAdmin', userId)
    if (currentUser && !isAdmin(currentUser)) {
      return
    }

    const result = users.find({ id: userId })

    if (result && result.length === 1 && currentUser) {
      const otherUser = result[0]
      otherUser.roles.push(Role.ADMIN)
      currentUser.roles = [] // TODO: remove admin role instead of clearing all...
      users.update(otherUser)
      users.update(currentUser)
      updateUserList()
    }
  })
})
