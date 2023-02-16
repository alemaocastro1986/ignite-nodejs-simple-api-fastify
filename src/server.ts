import { env } from './env'
import app from './app'

app
  .listen({
    port: env.PORT,
    host: '0.0.0.0',
  })
  .then((address) => {
    app.log.info(`Server is running on ${address}`)
  })
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
