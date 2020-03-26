const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const loki = require('lokijs')

// TODO: get from env
const SERVER_PORT = 3000

const db = new loki('estimate-me.db')

const rooms = db.addCollection('rooms')
const users = db.addCollection('users')

const ROLE_ADMIN = 'ADMIN'

const log = (msg, msg2) => {
  const date = new Date().toDateString().toLocaleString()

  let str = `[${date}]: ${msg}`
  if (msg2) {
    str += ' ' + msg2
  }
  console.log(str)
}

const findOrCreateRoom = roomName => {
  let room = rooms.findOne({ name: roomName })
  if (!room) {
    room = rooms.insert({ name: roomName, estimationsVisible: false })
  }
  return room
}

function numClientsInRoom(roomId) {
  const room = io.sockets.adapter.rooms[roomId]
  if (!room) {
    return -1
  }
  return room.length
}

function isAdmin(user) {
  return user.roles.includes(ROLE_ADMIN)
}

const estimationDisplay = (user, currentRoom) => {
  if (currentRoom.estimationsVisible && user.estimation !== null) {
    return user.estimation
  }
  return user.estimation !== null ? true : null
}

io.on('connection', function(socket) {
  log(`user ${socket.id} connected`)

  const currentUser = users.insert({
    id: socket.id,
    name: '',
    estimation: '',
    room: null,
    roles: [],
  })

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
      estimation: estimationDisplay(user, currentRoom),
    }))

  socket.on('joinRoom', function(roomName) {
    log(`User ${socket.id} joined room ${roomName}`)
    const room = findOrCreateRoom(roomName)

    currentRoom = room
    currentUser.room = room.$loki

    socket.join(room.$loki)
    if (numClientsInRoom(room.$loki) === 1) {
      currentUser.roles.push(ROLE_ADMIN)
    }
    socket.emit('joinedRoom', room.$loki)

    emitToRoom('serverMessage', `User ${currentUser.name} joined ${roomName}`)
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
    if (currentUser.roles.includes(ROLE_ADMIN)) {
      const otherUsers = roomUsers()
      if (otherUsers.length > 0) {
        const nextAdmin = otherUsers[0]
        nextAdmin.roles.push(ROLE_ADMIN)
        users.update(nextAdmin)
      }
    }

    emitToRoom('serverMessage', `User ${currentUser.name} disconnected`)
    updateUserList()
  })

  socket.on('clearEstimations', function() {
    if (isAdmin(currentUser)) {
      roomUsers().forEach(user => {
        user.estimation = null
        users.update(user)
      })
      currentRoom.estimationsVisible = false
      rooms.update(currentRoom)
      updateUserList()
    }
  })

  socket.on('revealEstimations', function() {
    currentRoom.estimationsVisible = true
    rooms.update(currentRoom)
    updateUserList()
  })
})

http.listen(SERVER_PORT, function() {
  console.log(`listening on *:${SERVER_PORT}`)
})
