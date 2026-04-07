// import { PrismaClient } from "../app/generated/prisma/client";
// import { PrismaPg } from "@prisma/adapter-pg"; // or the adapter for your database
// const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
// const prisma = new PrismaClient({ adapter });
import { prisma } from '../app/lib/prisma'
import bcrypt from 'bcrypt';
//const prisma = new PrismaClient();

async function main() {
    const hashedAdminPassword = await bcrypt.hash('123qwe@W', 10);

    const admin = await prisma.user.upsert({
        where: {
            email: 'admin@admin.com'
        },
        update: {
            name: 'Admin',
            role: 'ADMIN',
            password: hashedAdminPassword,
            verified: true,
        },
        create: {
            email: 'admin@admin.com',
            password: hashedAdminPassword,
            name: 'Admin',
            role: 'ADMIN',
            verified: true,
        }
        
    });
    console.log('Seeded admin:', admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });