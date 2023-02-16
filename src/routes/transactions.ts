import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'
import { ensureSessionExists } from '../middlewares/ensure-session-exists'

export async function transactionRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: ensureSessionExists }, async (request) => {
    const sessionId = request.cookies.sessionId
    const transactions = await knex('transactions').where({
      session_id: sessionId,
    })
    return { transactions }
  })

  app.get(
    '/:id',
    { preHandler: ensureSessionExists },
    async (request, reply) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      })
      const params = getTransactionParamsSchema.parse(request.params)
      const sessionId = request.cookies.sessionId
      const transaction = await knex('transactions')
        .where({
          id: params.id,
          session_id: sessionId,
        })
        .first()

      if (!transaction)
        return reply
          .status(422)
          .send({ error: `Transaction by id '${params.id}' not found` })
      return { transaction }
    },
  )

  app.get('/summary', { preHandler: ensureSessionExists }, async (request) => {
    const sessionId = request.cookies.sessionId
    const summary = await knex('transactions')
      .where({ session_id: sessionId })
      .sum('amount', { as: 'amount' })
      .first()
    return { summary }
  })

  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })
    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )
    let sessionId = request.cookies.sessionId
    if (!sessionId) {
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24, // 1 dia
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })
    reply.status(201).send('Transaction created')
  })
}
