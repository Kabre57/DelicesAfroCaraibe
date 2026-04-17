const path = require('path')
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const prisma = new PrismaClient()

const hashPassword = (password) => bcrypt.hash(password, 10)

const upsertUser = async ({ email, password, role, firstName, lastName, phone }) => {
  const passwordHash = await hashPassword(password)

  return prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash,
      role,
      firstName,
      lastName,
      phone,
    },
    create: {
      email,
      password: passwordHash,
      role,
      firstName,
      lastName,
      phone,
    },
  })
}

const ensureClient = async () => {
  const user = await upsertUser({
    email: (process.env.CLIENT_EMAIL || 'client@delice.com').trim().toLowerCase(),
    password: process.env.CLIENT_PASSWORD || 'Client2026!',
    role: 'CLIENT',
    firstName: process.env.CLIENT_FIRST_NAME || 'Client',
    lastName: process.env.CLIENT_LAST_NAME || 'Delice',
    phone: process.env.CLIENT_PHONE || '0600000001',
  })

  await prisma.client.upsert({
    where: { userId: user.id },
    update: {
      address: process.env.CLIENT_ADDRESS || '1 Rue de la Paix',
      city: process.env.CLIENT_CITY || 'Paris',
      postalCode: process.env.CLIENT_POSTAL_CODE || '75001',
    },
    create: {
      userId: user.id,
      address: process.env.CLIENT_ADDRESS || '1 Rue de la Paix',
      city: process.env.CLIENT_CITY || 'Paris',
      postalCode: process.env.CLIENT_POSTAL_CODE || '75001',
    },
  })

  return {
    role: user.role,
    email: user.email,
    password: process.env.CLIENT_PASSWORD || 'Client2026!',
  }
}

const ensureRestaurateur = async () => {
  const user = await upsertUser({
    email: (process.env.RESTAURATEUR_EMAIL || 'restaurateur@delice.com').trim().toLowerCase(),
    password: process.env.RESTAURATEUR_PASSWORD || 'Restaurateur2026!',
    role: 'RESTAURATEUR',
    firstName: process.env.RESTAURATEUR_FIRST_NAME || 'Resto',
    lastName: process.env.RESTAURATEUR_LAST_NAME || 'Delice',
    phone: process.env.RESTAURATEUR_PHONE || '0600000002',
  })

  const restaurateur = await prisma.restaurateur.upsert({
    where: { userId: user.id },
    update: {
      isApproved: true,
      approvedAt: new Date(),
    },
    create: {
      userId: user.id,
      isApproved: true,
      approvedAt: new Date(),
    },
  })

  const existingRestaurant = await prisma.restaurant.findFirst({
    where: { restaurateurId: restaurateur.id },
  })

  if (existingRestaurant) {
    await prisma.restaurant.update({
      where: { id: existingRestaurant.id },
      data: {
        name: process.env.RESTAURANT_NAME || 'Delices Demo',
        description: process.env.RESTAURANT_DESCRIPTION || 'Restaurant de demonstration',
        address: process.env.RESTAURANT_ADDRESS || '10 Avenue des Saveurs',
        city: process.env.RESTAURANT_CITY || 'Paris',
        postalCode: process.env.RESTAURANT_POSTAL_CODE || '75002',
        phone: process.env.RESTAURANT_PHONE || '0102030405',
        cuisineType: process.env.RESTAURANT_CUISINE_TYPE || 'Afro-Caribeen',
        openingHours: {
          monday: '09:00-22:00',
          tuesday: '09:00-22:00',
          wednesday: '09:00-22:00',
          thursday: '09:00-22:00',
          friday: '09:00-23:00',
          saturday: '10:00-23:00',
          sunday: '10:00-21:00',
        },
        isActive: true,
      },
    })
  } else {
    await prisma.restaurant.create({
      data: {
        restaurateurId: restaurateur.id,
        name: process.env.RESTAURANT_NAME || 'Delices Demo',
        description: process.env.RESTAURANT_DESCRIPTION || 'Restaurant de demonstration',
        address: process.env.RESTAURANT_ADDRESS || '10 Avenue des Saveurs',
        city: process.env.RESTAURANT_CITY || 'Paris',
        postalCode: process.env.RESTAURANT_POSTAL_CODE || '75002',
        phone: process.env.RESTAURANT_PHONE || '0102030405',
        cuisineType: process.env.RESTAURANT_CUISINE_TYPE || 'Afro-Caribeen',
        openingHours: {
          monday: '09:00-22:00',
          tuesday: '09:00-22:00',
          wednesday: '09:00-22:00',
          thursday: '09:00-22:00',
          friday: '09:00-23:00',
          saturday: '10:00-23:00',
          sunday: '10:00-21:00',
        },
        isActive: true,
      },
    })
  }

  return {
    role: user.role,
    email: user.email,
    password: process.env.RESTAURATEUR_PASSWORD || 'Restaurateur2026!',
  }
}

const ensureLivreur = async () => {
  const user = await upsertUser({
    email: (process.env.LIVREUR_EMAIL || 'livreur@delice.com').trim().toLowerCase(),
    password: process.env.LIVREUR_PASSWORD || 'Livreur2026!',
    role: 'LIVREUR',
    firstName: process.env.LIVREUR_FIRST_NAME || 'Livreur',
    lastName: process.env.LIVREUR_LAST_NAME || 'Delice',
    phone: process.env.LIVREUR_PHONE || '0600000003',
  })

  await prisma.livreur.upsert({
    where: { userId: user.id },
    update: {
      vehicleType: process.env.LIVREUR_VEHICLE_TYPE || 'Scooter',
      licensePlate: process.env.LIVREUR_LICENSE_PLATE || 'DL-2026-AA',
      coverageZones: (process.env.LIVREUR_COVERAGE_ZONES || 'Paris 1,Paris 2').split(',').map((zone) => zone.trim()),
      isAvailable: true,
      isApproved: true,
      approvedAt: new Date(),
    },
    create: {
      userId: user.id,
      vehicleType: process.env.LIVREUR_VEHICLE_TYPE || 'Scooter',
      licensePlate: process.env.LIVREUR_LICENSE_PLATE || 'DL-2026-AA',
      coverageZones: (process.env.LIVREUR_COVERAGE_ZONES || 'Paris 1,Paris 2').split(',').map((zone) => zone.trim()),
      isAvailable: true,
      isApproved: true,
      approvedAt: new Date(),
    },
  })

  return {
    role: user.role,
    email: user.email,
    password: process.env.LIVREUR_PASSWORD || 'Livreur2026!',
  }
}

const seedDemoUsers = async () => {
  const users = []
  users.push(await ensureClient())
  users.push(await ensureRestaurateur())
  users.push(await ensureLivreur())

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        action: 'seed-demo-users',
        users,
      },
      null,
      2
    )
  )
}

seedDemoUsers()
  .catch((error) => {
    console.error('Failed to seed demo users:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
