// import { db } from "../index";
import { drizzle } from "drizzle-orm/node-postgres";
import { seed } from "drizzle-seed";
import * as schema from '../schema/index'


export default async function runSeed() {
  const db = drizzle(process.env.DATABASE_URL!);
  await seed(db, schema).refine((f) => ({
    users: {
      // how many users to generate
      count: 1,  // we just need one user for now

      // override / refine some columns
      columns: {
        clerkId: f.default({ defaultValue: 'clerk_12345' }),     // hardcoded value
        username: f.firstName(),
        email: f.email(),
        firstName: f.firstName(),
        middleName: f.default({ defaultValue: '' }),
        lastName: f.lastName(),
        phone: f.phoneNumber(),
        status: f.valuesFromArray({ values: ["active", "inactive"] }),
        // createdAt, updatedAt, deletedAt will use defaults or generics by seed
      },
    },

    customers: {
      // how many customers to generate
      count: 5,

      // refine customer columns
      columns: {
        alias: f.firstName(),
        fullName: f.fullName(),
        email: f.email(),
        gender: f.valuesFromArray({ values: ["Male", "Female", "Other"] }),
        phone: f.phoneNumber(),
        status: f.valuesFromArray({ values: ["active", "inactive"] }),
        // createdAt, updatedAt, deletedAt are handled by default or generic
      },

      // “with” helps to link references (i.e. customers’ createdBy references users)
      with: {
        users: 1,  // link each customer to 1 user (the one user we generated)
      },
    },
  }));

  console.log("✅ Seed complete");
}


