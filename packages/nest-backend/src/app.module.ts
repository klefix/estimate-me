import { Module } from '@nestjs/common'
import { AppService } from './app.service'
import { AppGateway } from './app.gateway'
import { AppController } from './app.controller'

@Module({
  imports: [],
  providers: [AppService, AppGateway],
  controllers: [AppController],
})
export class AppModule {}
