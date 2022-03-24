import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Controller, Get, Logger } from '@nestjs/common'
import { Socket, Server } from 'socket.io'
import { Role, Room, User } from '@estimate-me/api'

interface ServerRoom extends Room {
  users: Map<string, ServerUser>
}

interface ServerUser extends Omit<User, 'room'> {
  room: ServerRoom | null
}

function createUser(id: string): ServerUser {
  return {
    id: id,
    name: '',
    estimation: null,
    room: null,
    roles: [],
  }
}

function arrayFromMap<T>(map: Map<string, T>): Array<T> {
  return Array.from(map.values())
}

function maskEstimations(
  estimationsVisible: boolean,
  users: ServerUser[],
): ServerUser[] {
  return users.map((user) => ({
    ...user,
    estimation: estimationsVisible ? user.estimation : null,
  }))
}

function areEstimationsComplete(room: ServerRoom): boolean {
  return arrayFromMap(room.users).every((user) => user.estimation !== null)
}

function isAdmin(user: ServerUser): boolean {
  return user.roles.includes(Role.ADMIN)
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Controller()
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private rooms: Map<string, ServerRoom> = new Map()

  private users: Map<string, ServerUser> = new Map()

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

  private removeUserFromRoom(user: ServerUser, room: ServerRoom) {
    this.rooms.get(room.name)?.users.delete(user.id)
  }

  @Get('/status')
  getStats(): object {
    return {
      server: 'running',
      users: this.users.size,
      rooms: this.rooms.size,
    }
  }

  @WebSocketServer() server: Server
  private logger: Logger = new Logger('AppGateway')

  afterInit(server: Server) {
    this.logger.log('Init')
  }

  handleDisconnect(client: Socket) {
    const user = this.getUser(client.id)
    const room = user.room

    if (room) {
      this.removeUserFromRoom(user, room)

      if (room.users.size === 0) {
        this.rooms.delete(room.name)
      } else if (isAdmin(user)) {
        const otherUsers = room.users
        console.log(otherUsers.values())
        const [nextUser] = room.users.values()
        nextUser.roles.push(Role.ADMIN)
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

  getUser(id: string): ServerUser {
    return this.users.get(id)
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

    const user = this.getUser(client.id)
    if (room.users.size === 0) {
      user.roles.push(Role.ADMIN)
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
    const user = this.getUser(client.id)
    if (!isAdmin(user)) {
      return
    }

    console.log(values)
    user.room.estimationValues = values
    this.broadcastUserList(user.room)
    this.server.emit('estimationValuesUpdated', values)
    this.logger.log(`Admin set estimationValues name to: ${values.join(',')}`)
  }

  @SubscribeMessage('clearEstimations')
  clearEstimations(client: Socket): void {
    const user = this.getUser(client.id)
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
    const user = this.getUser(client.id)
    if (!isAdmin(user)) {
      return
    }

    user.room.estimationsVisible = true
    this.broadcastUserList(user.room)
  }

  @SubscribeMessage('grantAdmin')
  grantAdmin(client: Socket, userId: string): void {
    const user = this.getUser(client.id)
    if (!isAdmin(user)) {
      return
    }

    const otherUser = this.users.get(userId)
    if (otherUser) {
      otherUser.roles.push(Role.ADMIN)
      user.roles = [] // TODO: remove admin role instead of clearing them all
      this.broadcastUserList(user.room)
    }
  }

  @SubscribeMessage('setName')
  setName(client: Socket, name: string): void {
    this.logger.log(`User ${client.id} set their name to ${name}`)

    const user = this.getUser(client.id)
    user.name = name

    this.broadcastUserList(user.room)
  }

  @SubscribeMessage('setEstimation')
  setEstimation(client: Socket, estimation: string): void {
    const user = this.getUser(client.id)
    user.estimation = estimation

    if (areEstimationsComplete(user.room)) {
      user.room.estimationsVisible = true
    }

    this.broadcastUserList(user.room)
  }

  @SubscribeMessage('setIcon')
  setIcon(client: Socket, icon: string): void {
    const user = this.getUser(client.id)
    user.icon = icon
    this.broadcastUserList(user.room)
  }
}
