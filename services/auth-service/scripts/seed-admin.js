const path = require('path')
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const prisma = new PrismaClient()

const requiredEnv = (name) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

const seedAdmin = async () => {
  const email = requiredEnv('ADMIN_EMAIL').trim().toLowerCase()
  const password = requiredEnv('ADMIN_PASSWORD')
  const firstName = (process.env.ADMIN_FIRST_NAME || 'Admin').trim()
  const lastName = (process.env.ADMIN_LAST_NAME || 'Delices').trim()
  const phone = (process.env.ADMIN_PHONE || '0000000000').trim()

  const passwordHash = await bcrypt.hash(password, 10)

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash,
      role: 'ADMIN',
      firstName,
      lastName,
      phone,
    },
    create: {
      email,
      password: passwordHash,
      role: 'ADMIN',
      firstName,
      lastName,
      phone,
    },
  })

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        action: 'seed-admin',
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
      },
      null,
      2
    )
  )
}

seedAdmin()
  .catch((error) => {
    console.error('Failed to seed admin:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
