import { ServerRoom, ServerUser } from './app.service'

const ROLE_ADMIN = 'admin'

export function createUser(id: string): ServerUser {
  return {
    id: id,
    name: '',
    estimation: null,
    room: null,
    roles: [],
  }
}

export function arrayFromMap<T>(map: Map<string, T>): Array<T> {
  return Array.from(map.values())
}

export function maskEstimations(
  estimationsVisible: boolean,
  users: ServerUser[],
): ServerUser[] {
  return users.map((user) => ({
    ...user,
    estimation: estimationsVisible ? user.estimation : null,
  }))
}

export function areEstimationsComplete(room: ServerRoom): boolean {
  return arrayFromMap(room.users).every((user) => user.estimation !== null)
}

export function isAdmin(user: ServerUser): boolean {
  return user.roles.includes(ROLE_ADMIN)
}
