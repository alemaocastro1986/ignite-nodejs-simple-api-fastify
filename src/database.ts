import { knex as setupKnex, Knex } from 'knex'
import { env } from './env'

const databaseConfigOptions: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename: env.DATABASE_URL,
  },
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: './database/migrations',
  },
}

const knex = setupKnex(databaseConfigOptions)

export { knex, databaseConfigOptions }
