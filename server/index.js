const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http)

const dotenv = require('dotenv-flow')
dotenv.config()

import { rooms, findOrCreateRoom, numClientsInRoom } from './rooms'
import { createUser, isAdmin, users, ROLE_ADMIN } from './users'

import { log, renderEstimation } from './utils'

const { NODEJS_SERVER_PORT } = process.env

io.on('connection', function(socket) {
  log(`user ${socket.id} connected`)

  const currentUser = users.insert(createUser(socket.id))

  let currentRoom = null

  const roomUsers = () => users.find({ room: currentRoom.$loki })

  const emitToRoom = (channel, payload) => {
    io.to(currentUser.room).emit(channel, payload)
  }

  const updateUserList = () => {
    emitToRoom('userList', maskEstimations(roomUsers()))
  }

  const maskEstimations = users =>
    users.map(user => ({
      ...user,
      estimation: renderEstimation(user, currentRoom),
    }))

  socket.on('joinRoom', function(roomName) {
    log(`User ${socket.id} joined room ${roomName}`)
    const room = findOrCreateRoom(roomName)

    currentRoom = room
    currentUser.room = room.$loki

    socket.join(room.$loki)
    if (numClientsInRoom(io, room.$loki) === 1) {
      currentUser.roles.push(ROLE_ADMIN)
    }
    socket.emit('joinedRoom', room.$loki)

    emitToRoom('userList', maskEstimations(roomUsers()))
  })

  socket.on('setEstimation', function(value) {
    log('setEstimation', value)

    currentUser.estimation = value
    users.update(currentUser)

    updateUserList()
  })

  socket.on('setName', function(value) {
    log(`user ${socket.id} set their name to ${value}`)

    currentUser.name = value
    users.update(currentUser)

    updateUserList()
  })

  socket.on('disconnect', function() {
    log('user disconnected', socket.id)

    socket.leave(currentUser.room)
    users.remove(currentUser)

    if (isAdmin(currentUser)) {
      const otherUsers = roomUsers()
      if (otherUsers.length > 0) {
        const nextAdmin = otherUsers[0]
        nextAdmin.roles.push(ROLE_ADMIN)
        users.update(nextAdmin)
      }
    }

    updateUserList()
  })

  socket.on('clearEstimations', function() {
    if (!isAdmin(currentUser)) {
      return
    }

    roomUsers().forEach(user => {
      user.estimation = null
      users.update(user)
    })
    currentRoom.estimationsVisible = false
    rooms.update(currentRoom)
    updateUserList()
    emitToRoom('estimationsCleared')
  })

  socket.on('revealEstimations', function() {
    if (!isAdmin(currentUser)) {
      return
    }

    currentRoom.estimationsVisible = true
    rooms.update(currentRoom)
    updateUserList()
  })

  socket.on('grantAdmin', function(userId) {
    log('grantAdmin', userId)
    if (!isAdmin(currentUser)) {
      return
    }

    const result = users.find({ id: userId })

    if (result && result.length === 1) {
      const otherUser = result[0]
      otherUser.roles.push(ROLE_ADMIN)
      currentUser.roles = [] // TODO: remove admin role instead of clearing all...
      users.update(otherUser, currentUser)
      updateUserList()
    }
  })
})

http.listen(NODEJS_SERVER_PORT, function() {
  console.log(`listening on *:${NODEJS_SERVER_PORT}`)
})
