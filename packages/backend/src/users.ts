import { User, Role } from '@estimate-me/api'
import db from './db'

export const users = db.addCollection<User>('users')

export function isAdmin(user: User): boolean {
  return user.roles.includes(Role.ADMIN)
}

export const createUser = (id: string): User => ({
  id: id,
  name: '',
  estimation: null,
  room: null,
  roles: [],
})
