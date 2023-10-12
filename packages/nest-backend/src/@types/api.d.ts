export interface Room {
  name: string
  estimationsVisible: boolean
  estimationValues: string[]
}

export interface User {
  id: string
  name: string
  icon?: string
  estimation: string | null
  room: string | null
  roles: Role[]
}
