require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { withAccelerate } = require('@prisma/extension-accelerate');

const prisma = new PrismaClient().$extends(withAccelerate());

const createUser = async ({ email, password, name, role }) => {
	const hashedPassword = await bcrypt.hash(password, 10);
	const user = await prisma.user.create({
		data: { email, password: hashedPassword, name, role },
	});

	const token = jwt.sign(
		{ id: user.id, role: user.role },
		process.env.JWT_SECRET,
		{ expiresIn: '4h' }
	);

	return { email, role, token };
};

async function main() {
	if (!process.env.JWT_SECRET) {
		throw new Error('JWT_SECRET is required to generate tokens in prisma/seed.js');
	}

	// Crear usuarios con contraseña hasheada y tokens JWT
	const user1 = await createUser({
		email: 'user12@example.com',
		password: 'password123',
		name: 'User One',
		role: 'USER',
	});

	const user2 = await createUser({
		email: 'admin1@example.com',
		password: 'admin123',
		name: 'Admin User',
		role: 'ADMIN',
	});

	// Crear bloques de tiempo
	const timeBlock1 = await prisma.timeBlock.create({
		data: {
			startTime: new Date('2023-10-01T09:00:00Z'),
			endTime: new Date('2023-10-01T10:00:00Z'),
		},
	});

	const timeBlock2 = await prisma.timeBlock.create({
		data: {
			startTime: new Date('2023-10-01T10:00:00Z'),
			endTime: new Date('2023-10-01T11:00:00Z'),
		},
	});

	// Crear citas
	await prisma.appointment.create({
		data: {
			date: new Date('2023-10-01T09:00:00Z'),
			user: { connect: { email: 'user12@example.com' } },
			timeBlock: { connect: { id: timeBlock1.id } },
		},
	});

	await prisma.appointment.create({
		data: {
			date: new Date('2023-10-01T10:00:00Z'),
			user: { connect: { email: 'admin1@example.com' } },
			timeBlock: { connect: { id: timeBlock2.id } },
		},
	});

	console.log('Seeded users with tokens:');
	console.log(JSON.stringify({ user1, user2 }, null, 2));
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});