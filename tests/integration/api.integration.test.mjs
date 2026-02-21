import { test } from 'node:test'
import assert from 'node:assert/strict'

const AUTH_BASE_URL = process.env.AUTH_BASE_URL || 'http://localhost:3001'
const RESTAURANT_BASE_URL = process.env.RESTAURANT_BASE_URL || 'http://localhost:3003'
const ORDER_BASE_URL = process.env.ORDER_BASE_URL || 'http://localhost:3004'

const toJson = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

test('auth flow: register, login, verify token', async () => {
  const email = `integration.${Date.now()}@example.com`
  const password = 'TestPassword123!'
  const registerPayload = {
    email,
    password,
    role: 'CLIENT',
    firstName: 'Integration',
    lastName: 'Test',
    phone: '0600000000',
    additionalData: {
      address: '1 Rue de Test',
      city: 'Paris',
      postalCode: '75001',
    },
  }

  const registerResponse = await fetch(`${AUTH_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(registerPayload),
  })
  const registerBody = await toJson(registerResponse)
  assert.equal(registerResponse.status, 201)
  assert.ok(registerBody?.token)

  const loginResponse = await fetch(`${AUTH_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const loginBody = await toJson(loginResponse)
  assert.equal(loginResponse.status, 200)
  assert.ok(loginBody?.token)

  const verifyResponse = await fetch(`${AUTH_BASE_URL}/api/auth/verify`, {
    headers: { authorization: `Bearer ${loginBody.token}` },
  })
  const verifyBody = await toJson(verifyResponse)
  assert.equal(verifyResponse.status, 200)
  assert.equal(verifyBody?.user?.email, email)
})

test('restaurants read endpoint and write protection', async () => {
  const listResponse = await fetch(`${RESTAURANT_BASE_URL}/api/restaurants`)
  const listBody = await toJson(listResponse)
  assert.equal(listResponse.status, 200)
  assert.ok(Array.isArray(listBody))

  const createResponse = await fetch(`${RESTAURANT_BASE_URL}/api/restaurants`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      restaurateurId: 'unauthorized',
      name: 'Should Fail',
      address: 'x',
      city: 'x',
      postalCode: 'x',
      phone: 'x',
      cuisineType: 'x',
      openingHours: {},
    }),
  })
  assert.equal(createResponse.status, 401)
})

test('order write protection', async () => {
  const createOrderResponse = await fetch(`${ORDER_BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      clientId: 'unauthorized',
      restaurantId: 'unauthorized',
      items: [],
      deliveryAddress: 'x',
      deliveryCity: 'x',
      deliveryPostalCode: 'x',
    }),
  })
  assert.equal(createOrderResponse.status, 401)
})
