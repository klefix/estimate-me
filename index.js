var app = require('express')()
var http = require('http').createServer(app)
var io = require('socket.io')(http)

app.get('/', function(req, res) {
  // res.sendFile(__dirname + '/static/index.html');
})

let values = []
let users = []

io.on('connection', function(socket) {
  console.log('a user connected with id: ' + socket.id)

  users.push({
    id: socket.id,
    estimation: '',
  })

  socket.emit('userList', users)

  socket.on('estimate', function(msg) {
    console.log('estimate', msg)

    users = users.map(el =>
      el.id === socket.id ? { ...el, estimation: msg } : el
    )
    socket.emit('userList', users)
  })

  socket.on('pingServer', function(msg) {
    socket.emit('messageChannel', 'PONG!')
  })

  socket.on('disconnect', function() {
    console.log('user disconnected')
    socket.emit('messageChannel', `User ${socket.id} disconnected`)
    users = users.filter(el => el.id !== socket.id)
  })
})

http.listen(3000, function() {
  console.log('listening on *:3000')
})
