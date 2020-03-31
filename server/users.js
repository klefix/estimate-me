import db from './db'

export const users = db.addCollection('users')

export const ROLE_ADMIN = 'ADMIN'

export function isAdmin(user) {
  return user.roles.includes(ROLE_ADMIN)
}

export const createUser = id => ({
  id: id,
  name: '',
  estimation: null,
  room: null,
  roles: [],
})
