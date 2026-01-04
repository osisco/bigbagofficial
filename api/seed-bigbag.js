import { faker } from "@faker-js/faker";
import connectDB from "./connect.js";
import User from "./models/User.js";
import Shop from "./models/Shop.js";
import Roll from "./models/Roll.js";
import Comment from "./models/Comment.js";
import Offer from "./models/Offer.js";
import Coupon from "./models/Coupon.js";
import { API_CONFIG } from "./config/constants.js";

const USERS = 1000;
const ADMIN_SHOPS = 50; // Admin-created shops
const SHOPS_PER_VENDOR = 1;
const ROLLS_PER_SHOP = 5;
const OFFERS_PER_SHOP = 3;
const COUPONS_PER_SHOP = 2;
const COMMENTS_PER_ROLL = 3;
const LIKES_PER_ROLL = 10;
const BATCH_SIZE = 500;

const ROLL_CATEGORIES = [
  "fashion", "food", "tech", "beauty", "home",
  "sports", "gaming", "travel", "fitness", "music"
];

// Real video URLs for testing
const REAL_VIDEO_URLS = [
  "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
];

// Popular real shop names
const POPULAR_SHOPS = [
  { name: "Nike", category: "fashion", description: "Just Do It" },
  { name: "McDonald's", category: "food", description: "I'm Lovin' It" },
  { name: "Apple Store", category: "tech", description: "Think Different" },
  { name: "Sephora", category: "beauty", description: "Beauty Insider" },
  { name: "IKEA", category: "home", description: "Affordable Swedish Design" },
  { name: "Adidas", category: "fashion", description: "Impossible is Nothing" },
  { name: "Starbucks", category: "food", description: "Third Place Coffee" },
  { name: "Samsung", category: "tech", description: "Do What You Can't" },
  { name: "H&M", category: "fashion", description: "Fashion and Quality" },
  { name: "Zara", category: "fashion", description: "Fast Fashion" }
];

async function seed() {
  await connectDB();

  console.log("Clearing existing data...");
  await User.deleteMany({});
  await Shop.deleteMany({});
  await Roll.deleteMany({});
  await Comment.deleteMany({});
  await Offer.deleteMany({});
  await Coupon.deleteMany({});

  console.log("Creating admin user...");
  const admin = await User.create({
    role: API_CONFIG.ROLES.ADMIN,
    name: "BigBag Admin",
    email: "admin@bigbag.com",
    password: "$2b$10$hashedpassword",
    age: 30,
    gender: "male",
    country: "Jordan",
    city: "Amman",
    language: "en"
  });

  console.log("Seeding users...");
  const users = [];
  for (let i = 0; i < USERS; i++) {
    const isVendor = i < USERS * 0.2;
    users.push({
      role: isVendor ? API_CONFIG.ROLES.VENDOR : API_CONFIG.ROLES.USER,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: "$2b$10$hashedpassword",
      age: faker.number.int({ min: 18, max: 65 }),
      gender: faker.helpers.arrayElement(["male", "female"]),
      country: faker.location.country(),
      city: faker.location.city(),
      language: "en"
    });
  }

  let insertedUsers = [admin];
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const inserted = await User.insertMany(batch);
    insertedUsers = insertedUsers.concat(inserted);
  }

  const insertedVendors = insertedUsers.filter(u => u.role === API_CONFIG.ROLES.VENDOR);

  console.log("Creating admin shops...");
  const adminShops = [];
  for (let i = 0; i < ADMIN_SHOPS; i++) {
    const shopTemplate = faker.helpers.arrayElement(POPULAR_SHOPS);
    adminShops.push({
      name: i < POPULAR_SHOPS.length ? shopTemplate.name : faker.company.name(),
      logo: faker.image.url({ width: 200, height: 200 }),
      description: i < POPULAR_SHOPS.length ? shopTemplate.description : faker.company.catchPhrase(),
      link: faker.internet.url(),
      supportedCountries: ["Jordan", "UAE", "Saudi Arabia", "Lebanon"],
      rating: faker.number.float({ min: 4, max: 5, fractionDigits: 1 }),
      reviewCount: faker.number.int({ min: 50, max: 500 }),
      vendorId: admin._id,
      isApproved: true,
      location: faker.location.streetAddress(),
      city: "Amman",
      country: "Jordan",
      language: "en"
    });
  }

  console.log("Creating vendor shops...");
  const vendorShops = [];
  for (const vendor of insertedVendors) {
    for (let i = 0; i < SHOPS_PER_VENDOR; i++) {
      vendorShops.push({
        name: faker.company.name(),
        logo: faker.image.url({ width: 200, height: 200 }),
        description: faker.company.catchPhrase(),
        link: faker.internet.url(),
        supportedCountries: [vendor.country],
        rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
        reviewCount: faker.number.int({ min: 0, max: 100 }),
        vendorId: vendor._id,
        isApproved: true,
        location: faker.location.streetAddress(),
        city: vendor.city,
        country: vendor.country,
        language: "en"
      });
    }
  }

  const allShops = [...adminShops, ...vendorShops];
  let insertedShops = [];
  for (let i = 0; i < allShops.length; i += BATCH_SIZE) {
    const batch = allShops.slice(i, i + BATCH_SIZE);
    const inserted = await Shop.insertMany(batch);
    insertedShops = insertedShops.concat(inserted);
  }

  console.log("Creating offers...");
  const offers = [];
  for (const shop of insertedShops) {
    for (let i = 0; i < OFFERS_PER_SHOP; i++) {
      const originalPrice = faker.number.int({ min: 50, max: 500 });
      const discountPercent = faker.number.int({ min: 10, max: 70 });
      const salePrice = Math.round(originalPrice * (1 - discountPercent / 100));
      
      offers.push({
        shop: shop._id,
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        discount: `${discountPercent}%`,
        originalPrice: `${originalPrice} JOD`,
        salePrice: `${salePrice} JOD`,
        image: faker.image.url(),
        expiryDate: faker.date.soon({ days: 60 }),
        isLimited: faker.datatype.boolean()
      });
    }
  }

  for (let i = 0; i < offers.length; i += BATCH_SIZE) {
    const batch = offers.slice(i, i + BATCH_SIZE);
    await Offer.insertMany(batch);
  }

  console.log("Creating coupons...");
  const coupons = [];
  for (const shop of insertedShops) {
    for (let i = 0; i < COUPONS_PER_SHOP; i++) {
      const discountPercent = faker.number.int({ min: 5, max: 50 });
      
      coupons.push({
        shop: shop._id,
        code: faker.string.alphanumeric({ length: 8 }).toUpperCase(),
        description: `Get ${discountPercent}% off your next purchase`,
        discount: `${discountPercent}%`,
        image: faker.image.url(),
        expiryDate: faker.date.soon({ days: 90 }),
        isExpired: false
      });
    }
  }

  for (let i = 0; i < coupons.length; i += BATCH_SIZE) {
    const batch = coupons.slice(i, i + BATCH_SIZE);
    await Coupon.insertMany(batch);
  }

  console.log("Creating rolls with real video URLs...");
  const rolls = [];
  for (const shop of insertedShops) {
    for (let i = 0; i < ROLLS_PER_SHOP; i++) {
      rolls.push({
        shop: shop._id,
        videoUrl: faker.helpers.arrayElement(REAL_VIDEO_URLS),
        caption: faker.lorem.sentences(2),
        category: faker.helpers.arrayElement(ROLL_CATEGORIES),
        createdBy: shop.vendorId,
        duration: faker.number.int({ min: 15, max: 60 }),
        createdAt: faker.date.recent({ days: 30 })
      });
    }
  }

  let insertedRolls = [];
  for (let i = 0; i < rolls.length; i += BATCH_SIZE) {
    const batch = rolls.slice(i, i + BATCH_SIZE);
    const inserted = await Roll.insertMany(batch);
    insertedRolls = insertedRolls.concat(inserted);
  }

  console.log("Creating comments...");
  const comments = [];
  for (const roll of insertedRolls) {
    for (let i = 0; i < COMMENTS_PER_ROLL; i++) {
      comments.push({
        roll: roll._id,
        user: faker.helpers.arrayElement(insertedUsers)._id,
        comment: faker.lorem.sentence()
      });
    }
  }

  for (let i = 0; i < comments.length; i += BATCH_SIZE) {
    const batch = comments.slice(i, i + BATCH_SIZE);
    await Comment.insertMany(batch);
  }

  console.log("Adding likes to rolls...");
  for (const roll of insertedRolls) {
    const likeUsers = faker.helpers.arrayElements(insertedUsers, LIKES_PER_ROLL);
    roll.likes = likeUsers.map(u => u._id);
    roll.likesCount = likeUsers.length;
    await roll.save();
  }

  console.log("✅ Database seeded successfully");
  console.log(`Created:`);
  console.log(`- ${insertedUsers.length} users (including 1 admin)`);
  console.log(`- ${insertedShops.length} shops (${ADMIN_SHOPS} admin + ${insertedShops.length - ADMIN_SHOPS} vendor)`);
  console.log(`- ${offers.length} offers`);
  console.log(`- ${coupons.length} coupons`);
  console.log(`- ${insertedRolls.length} rolls`);
  console.log(`- ${comments.length} comments`);

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
