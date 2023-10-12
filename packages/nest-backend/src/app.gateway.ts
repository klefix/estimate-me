import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { Socket, Server } from 'socket.io'
import { AppService, ServerRoom, ServerUser } from './app.service'
import {
  areEstimationsComplete,
  arrayFromMap,
  createUser,
  isAdmin,
  maskEstimations,
} from './utils'

const ROLE_ADMIN = 'admin'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private appService: AppService) {}

  get rooms() {
    return this.appService.rooms
  }

  get users() {
    return this.appService.users
  }

  private createRoom(name: string): ServerRoom {
    const room: ServerRoom = {
      name,
      estimationValues: null,
      estimationsVisible: false,
      users: new Map(),
    }
    this.rooms.set(name, room)
    return room
  }

  @WebSocketServer() server: Server
  private logger: Logger = new Logger('AppGateway')

  afterInit(server: Server) {
    this.logger.log('Init')
  }

  handleDisconnect(client: Socket) {
    const user = this.appService.getUserById(client.id)
    const room = user.room

    if (room) {
      this.appService.removeUserFromRoom(user, room)

      if (room.users.size === 0) {
        this.rooms.delete(room.name)
      } else if (isAdmin(user)) {
        const otherUsers = room.users
        console.log(otherUsers.values())
        const [nextUser] = room.users.values()
        nextUser.roles.push(ROLE_ADMIN)
      }
    }
    this.users.delete(user.id)

    console.log(room)

    this.broadcastUserList(room)

    this.logger.log(
      `Client disconnected: ${client.id} (name: ${user.name || 'unknown'})`,
    )
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`)

    this.users.set(client.id, createUser(client.id))
  }

  broadcastUserList(room: ServerRoom): void {
    this.server.emit(
      'userList',
      maskEstimations(room.estimationsVisible, arrayFromMap(room.users)),
    )
  }

  @SubscribeMessage('joinRoom')
  joinRoom(client: Socket, roomName: string): void {
    this.logger.log(`Client ${client.id} joined room ${roomName}`)

    const room = this.rooms.get(roomName) || this.createRoom(roomName)
    client.emit('joinedRoom', roomName)

    const user = this.appService.getUserById(client.id)
    if (room.users.size === 0) {
      user.roles.push(ROLE_ADMIN)
    }
    user.room = room

    room.users.set(user.id, user)

    this.broadcastUserList(user.room)
    if (room.estimationValues) {
      client.emit('estimationValuesUpdated', room.estimationValues)
    }
  }

  @SubscribeMessage('setEstimationValues')
  setEstimationValues(client: Socket, valueString: string): void {
    const values = valueString.split(',')
    const user = this.appService.getUserById(client.id)
    if (!isAdmin(user)) {
      return
    }

    user.room.estimationValues = values
    this.broadcastUserList(user.room)
    this.server.emit('estimationValuesUpdated', values)
    this.logger.log(`Admin set estimationValues name to: ${values.join(',')}`)
  }

  @SubscribeMessage('clearEstimations')
  clearEstimations(client: Socket): void {
    const user = this.appService.getUserById(client.id)
    if (!isAdmin(user)) {
      return
    }

    user.room.users.forEach(
      (roomUser: ServerUser) => (roomUser.estimation = null),
    )
    user.room.estimationsVisible = false
    this.broadcastUserList(user.room)
    this.server.emit('estimationsCleared')
  }

  @SubscribeMessage('revealEstimations')
  revealEstimations(client: Socket): void {
    const user = this.appService.getUserById(client.id)
    if (!isAdmin(user)) {
      return
    }

    user.room.estimationsVisible = true
    this.broadcastUserList(user.room)
  }

  @SubscribeMessage('grantAdmin')
  grantAdmin(client: Socket, userId: string): void {
    const user = this.appService.getUserById(client.id)
    if (!isAdmin(user)) {
      return
    }

    const otherUser = this.users.get(userId)
    if (otherUser) {
      otherUser.roles.push(ROLE_ADMIN)
      user.roles = [] // TODO: remove admin role instead of clearing them all
      this.broadcastUserList(user.room)
    }
  }

  @SubscribeMessage('setName')
  setName(client: Socket, name: string): void {
    this.logger.log(`User ${client.id} set their name to ${name}`)

    const user = this.appService.getUserById(client.id)
    user.name = name

    this.broadcastUserList(user.room)
  }

  @SubscribeMessage('setEstimation')
  setEstimation(client: Socket, estimation: string): void {
    const user = this.appService.getUserById(client.id)
    user.estimation = estimation

    if (areEstimationsComplete(user.room)) {
      user.room.estimationsVisible = true
    }

    this.broadcastUserList(user.room)
  }

  @SubscribeMessage('setIcon')
  setIcon(client: Socket, icon: string): void {
    const user = this.appService.getUserById(client.id)
    user.icon = icon
    this.broadcastUserList(user.room)
  }
}
