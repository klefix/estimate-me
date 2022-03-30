import { Injectable } from '@nestjs/common'
import { Room, User } from '@estimate-me/api'

export interface ServerRoom extends Room {
  users: Map<string, ServerUser>
}

export interface ServerUser extends Omit<User, 'room'> {
  room: ServerRoom | null
}

@Injectable()
export class AppService {
  public rooms: Map<string, ServerRoom> = new Map()

  public users: Map<string, ServerUser> = new Map()

  public removeUserFromRoom(user: ServerUser, room: ServerRoom) {
    this.rooms.get(room.name)?.users.delete(user.id)
  }

  public getUserById(id: string): ServerUser {
    return this.users.get(id)
  }
}
