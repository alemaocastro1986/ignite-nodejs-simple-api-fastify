import { execSync } from 'node:child_process'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback -all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new Transaction', async () => {
    const response = await request(app.server).post('/transactions').send({
      title: 'New Transaction',
      type: 'credit',
      amount: 99,
    })
    expect(response.statusCode).toEqual(201)
  })

  it('should be able to list all transactions', async () => {
    const newTransaction = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        type: 'credit',
        amount: 99,
      })
    const cookies = newTransaction.get('Set-Cookie')
    const listTransactionRespose = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)

    expect(listTransactionRespose.body).toEqual({
      transactions: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          title: 'New Transaction',
          amount: 99,
          session_id: expect.any(String),
        }),
      ]),
    })
  })

  it('should be able to get specific transaction', async () => {
    const newTransaction = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        type: 'credit',
        amount: 99,
      })
    const cookies = newTransaction.get('Set-Cookie')
    const listTransactionRespose = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
    const transactionId = listTransactionRespose.body.transactions[0].id
    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)

    expect(getTransactionResponse.body).toEqual({
      transaction: expect.objectContaining({
        id: transactionId,
        title: 'New Transaction',
        amount: 99,
      }),
    })
  })

  it('should be able to get the summary', async () => {
    const newTransaction = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        type: 'credit',
        amount: 7500,
      })
    const cookies = newTransaction.get('Set-Cookie')
    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'New Transaction',
        type: 'debit',
        amount: 1050,
      })
    const summaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)

    expect(summaryResponse.body).toEqual({ summary: { amount: 6450 } })
  })
})
