import bcrypt from "bcrypt";
import connectDB from "./connect.js";
import User from "./models/User.js";
import { API_CONFIG } from "./config/constants.js";

const ADMIN_ACCOUNTS = [
  {
    name: "BigBag Super Admin",
    email: "admin@bigbag.com",
    password: "admin123",
    age: 30,
    gender: "male",
    country: "Jordan",
    city: "Amman"
  },
  {
    name: "Content Manager",
    email: "content@bigbag.com", 
    password: "content123",
    age: 28,
    gender: "female",
    country: "Jordan",
    city: "Amman"
  },
  {
    name: "Operations Manager",
    email: "ops@bigbag.com",
    password: "ops123", 
    age: 35,
    gender: "male",
    country: "Jordan",
    city: "Amman"
  }
];

async function seedAdmins() {
  await connectDB();

  console.log("Creating admin accounts...");

  for (const adminData of ADMIN_ACCOUNTS) {
    try {
      // Check if admin already exists
      const existingAdmin = await User.findOne({ email: adminData.email });
      
      if (existingAdmin) {
        console.log(`❌ Admin ${adminData.email} already exists`);
        continue;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(adminData.password, 10);

      // Create admin user
      const admin = await User.create({
        role: API_CONFIG.ROLES.ADMIN,
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        age: adminData.age,
        gender: adminData.gender,
        country: adminData.country,
        city: adminData.city,
        language: "en"
      });

      console.log(`✅ Created admin: ${adminData.email} | Password: ${adminData.password}`);
      
    } catch (error) {
      console.error(`❌ Error creating admin ${adminData.email}:`, error.message);
    }
  }

  console.log("\n🎉 Admin seeding completed!");
  console.log("\n📋 Admin Credentials:");
  ADMIN_ACCOUNTS.forEach(admin => {
    console.log(`Email: ${admin.email} | Password: ${admin.password}`);
  });

  process.exit(0);
}

seedAdmins().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});