const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const loki = require('lokijs')

// TODO: get from env
const SERVER_PORT = 3000

const db = new loki('estimate-me.db')

const rooms = db.addCollection('rooms')
const users = db.addCollection('users')

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
    room = rooms.insert({ name: roomName })
  }
  return room
}

io.on('connection', function(socket) {
  log(`user ${socket.id} connected`)

  const currentUser = users.insert({
    id: socket.id,
    name: socket.id,
    estimation: '',
    room: null,
  })

  const roomUsers = () => users.find({ room: currentUser.room })

  const emitToRoom = (channel, payload) => {
    console.log(roomUsers())
    io.to(currentUser.room).emit(channel, payload)
  }

  socket.on('joinRoom', function(roomName) {
    log(`User ${socket.id} joined room ${roomName}`)
    const room = findOrCreateRoom(roomName)

    currentUser.room = room.$loki
    socket.join(room.$loki)
    socket.emit('joinedRoom', room.$loki)

    emitToRoom('serverMessage', `User ${currentUser.name} joined ${roomName}`)
    emitToRoom('userList', roomUsers())
  })

  socket.on('setEstimation', function(value) {
    log('setEstimation', value)

    currentUser.estimation = value
    users.update(currentUser)

    emitToRoom('userList', roomUsers())
  })

  socket.on('setName', function(value) {
    log(`user ${socket.id} set their name to ${value}`)

    currentUser.name = value
    users.update(currentUser)

    emitToRoom('userList', roomUsers())
  })

  socket.on('disconnect', function() {
    log('user disconnected', socket.id)

    socket.leave(currentUser.room)
    users.remove(currentUser)

    emitToRoom('serverMessage', `User ${currentUser.name} disconnected`)
    emitToRoom('userList', roomUsers())
  })
})

http.listen(SERVER_PORT, function() {
  console.log(`listening on *:${SERVER_PORT}`)
})
