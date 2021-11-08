import { Role } from "./role";

export interface User {
  id: string
  name: string
  icon?: string
  estimation: string | null
  room: string | null
  roles: Role[]
}