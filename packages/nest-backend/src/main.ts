import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as fs from 'fs'

const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH),
}
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  })
  await app.listen(3000)
}
bootstrap()
