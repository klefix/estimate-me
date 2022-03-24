import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Get('/status')
  getStats(): object {
    return {
      server: 'running',
      users: this.appService.users.size,
      rooms: this.appService.rooms.size,
    }
  }
}
