import { faker } from "@faker-js/faker";
import connectDB from "./connect.js";
import User from "./models/User.js";
import Shop from "./models/Shop.js";
import Roll from "./models/Roll.js";
import Comment from "./models/Comment.js";
import Offer from "./models/Offer.js";
import Coupon from "./models/Coupon.js";
import Category from "./models/Category.js";
import Ad from "./models/Ad.js";
import Review from "./models/Review.js";
import WeeklyShopShare from "./models/WeeklyShopShare.js";
import VendorProfile from "./models/Vendor.js";
import RollPackage from "./models/RollPackage.js";
import Saved from "./models/Saved.js";
import { API_CONFIG } from "./config/constants.js";
import bcrypt from "bcryptjs";

// ============================================
// CONFIGURATION
// ============================================
const BATCH_SIZE = 500;
const USERS_TOTAL = 2000;
const VENDOR_PERCENTAGE = 0.25; // 25% of users are vendors
const ADMIN_COUNT = 3;
const SHOPS_PER_VENDOR = 1;
const ROLLS_PER_SHOP = 8;
const OFFERS_PER_SHOP = 4;
const COUPONS_PER_SHOP = 3;
const COMMENTS_PER_ROLL = 5;
const LIKES_PER_ROLL = 15;
const SAVES_PER_ROLL = 8;
const SHARES_PER_SHOP_WEEK = 25; // Shares per shop per week
const REVIEWS_PER_SHOP = 12;
const ADS_COUNT = 15;
const ROLL_PACKAGES_PER_VENDOR = 2;

// ============================================
// FAST-LOADING VIDEO URLS (Placeholder videos that load instantly)
// ============================================
// Using Google's optimized sample videos (well-cached CDN, load relatively fast)
// For production, replace with your own CDN-hosted optimized videos
const FAST_VIDEO_URLS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
];

// ============================================
// CATEGORIES DATA
// ============================================
const CATEGORIES_DATA = [
  { name: "Fashion", icon: "shirt-outline", color: "#EC4899" },
  { name: "Electronics", icon: "phone-portrait-outline", color: "#3B82F6" },
  { name: "Food & Dining", icon: "restaurant-outline", color: "#F59E0B" },
  { name: "Beauty & Health", icon: "heart-outline", color: "#EF4444" },
  { name: "Home & Garden", icon: "home-outline", color: "#10B981" },
  { name: "Sports & Fitness", icon: "fitness-outline", color: "#8B5CF6" },
  { name: "Books & Education", icon: "library-outline", color: "#6366F1" },
  { name: "Automotive", icon: "car-outline", color: "#374151" },
  { name: "Travel & Tourism", icon: "airplane-outline", color: "#06B6D4" },
  { name: "Entertainment", icon: "film-outline", color: "#F97316" },
  { name: "Men", icon: "man-outline", color: "#2563EB" },
  { name: "Women", icon: "woman-outline", color: "#DB2777" },
  { name: "Kids", icon: "happy-outline", color: "#F59E0B" },
  { name: "Jewelry", icon: "diamond-outline", color: "#FCD34D" },
  { name: "Toys & Games", icon: "game-controller-outline", color: "#8B5CF6" },
  { name: "Pet Supplies", icon: "paw-outline", color: "#10B981" },
  { name: "Office Supplies", icon: "briefcase-outline", color: "#6366F1" },
  { name: "Music & Instruments", icon: "musical-notes-outline", color: "#EC4899" },
  { name: "Art & Crafts", icon: "brush-outline", color: "#F97316" },
  { name: "Baby Products", icon: "baby-outline", color: "#F59E0B" },
];

// ============================================
// COUNTRIES DATA (Top countries for shops)
// ============================================
const COUNTRIES = [
  "UNITED STATES", "CANADA", "UNITED KINGDOM", "AUSTRALIA", "GERMANY",
  "FRANCE", "ITALY", "SPAIN", "JAPAN", "SOUTH KOREA",
  "CHINA", "INDIA", "BRAZIL", "MEXICO", "ARGENTINA",
  "SAUDI ARABIA", "UNITED ARAB EMIRATES", "JORDAN", "LEBANON", "EGYPT",
  "TURKEY", "SOUTH AFRICA", "NIGERIA", "KENYA", "MOROCCO",
];

// ============================================
// LANGUAGES DATA
// ============================================
const LANGUAGES = ["en", "ar", "fr", "es", "de", "it", "pt", "zh", "ja", "ko"];

// ============================================
// ROLL CATEGORIES
// ============================================
const ROLL_CATEGORIES = ["all", "men", "women", "kids", "fashion", "food", "tech", "beauty", "home", "sports"];

// ============================================
// HELPER FUNCTIONS
// ============================================

// Hash password helper
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Calculate week start (Monday 00:00:00 UTC)
const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff, 0, 0, 0, 0));
};

// Get random date within range
const getRandomDate = (daysAgo = 30) => {
  return faker.date.recent({ days: daysAgo });
};

// ============================================
// MAIN SEED FUNCTION
// ============================================
async function seed() {
  try {
    console.log("🌱 Starting comprehensive database seeding...\n");
    await connectDB();

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Shop.deleteMany({}),
      Roll.deleteMany({}),
      Comment.deleteMany({}),
      Offer.deleteMany({}),
      Coupon.deleteMany({}),
      Category.deleteMany({}),
      Ad.deleteMany({}),
      Review.deleteMany({}),
      WeeklyShopShare.deleteMany({}),
      VendorProfile.deleteMany({}),
      RollPackage.deleteMany({}),
      Saved.deleteMany({}),
    ]);
    console.log("✅ Data cleared\n");

    // ============================================
    // 1. CREATE ADMIN USERS
    // ============================================
    console.log("👑 Creating admin users...");
    const adminPassword = await hashPassword("admin123");
    const admins = [];
    for (let i = 0; i < ADMIN_COUNT; i++) {
      admins.push({
        role: API_CONFIG.ROLES.ADMIN,
        name: i === 0 ? "BigBag Admin" : `Admin ${i + 1}`,
        email: i === 0 ? "admin@bigbag.com" : `admin${i + 1}@bigbag.com`,
        password: adminPassword,
        age: 30 + i,
        gender: i % 2 === 0 ? "male" : "female",
        country: faker.helpers.arrayElement(COUNTRIES),
        city: faker.location.city(),
        language: faker.helpers.arrayElement(LANGUAGES),
        isEmailVerified: true,
      });
    }
    const insertedAdmins = await User.insertMany(admins);
    console.log(`✅ Created ${insertedAdmins.length} admin users\n`);

    // ============================================
    // 2. CREATE CATEGORIES
    // ============================================
    console.log("📁 Creating categories...");
    const categories = CATEGORIES_DATA.map((cat) => ({
      ...cat,
      createdBy: insertedAdmins[0]._id,
      isActive: true,
    }));
    const insertedCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${insertedCategories.length} categories\n`);

    // ============================================
    // 3. CREATE USERS (Regular + Vendors)
    // ============================================
    console.log("👥 Creating users...");
    const users = [];
    const vendorCount = Math.floor(USERS_TOTAL * VENDOR_PERCENTAGE);
    const regularUserCount = USERS_TOTAL - vendorCount;

    const hashedPassword = await hashPassword("user123");

    // Create regular users
    for (let i = 0; i < regularUserCount; i++) {
      users.push({
        role: API_CONFIG.ROLES.USER,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
        age: faker.number.int({ min: 18, max: 75 }),
        gender: faker.helpers.arrayElement(["male", "female"]),
        country: faker.helpers.arrayElement(COUNTRIES),
        city: faker.location.city(),
        language: faker.helpers.arrayElement(LANGUAGES),
        isEmailVerified: faker.datatype.boolean({ probability: 0.8 }),
      });
    }

    // Create vendor users
    for (let i = 0; i < vendorCount; i++) {
      users.push({
        role: API_CONFIG.ROLES.VENDOR,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
        age: faker.number.int({ min: 25, max: 65 }),
        gender: faker.helpers.arrayElement(["male", "female"]),
        country: faker.helpers.arrayElement(COUNTRIES),
        city: faker.location.city(),
        language: faker.helpers.arrayElement(LANGUAGES),
        isEmailVerified: true, // Vendors must be verified
      });
    }

    let insertedUsers = [...insertedAdmins];
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      const inserted = await User.insertMany(batch);
      insertedUsers = insertedUsers.concat(inserted);
    }
    const insertedVendors = insertedUsers.filter((u) => u.role === API_CONFIG.ROLES.VENDOR);
    const insertedRegularUsers = insertedUsers.filter((u) => u.role === API_CONFIG.ROLES.USER);
    console.log(`✅ Created ${insertedUsers.length} users (${insertedVendors.length} vendors, ${insertedRegularUsers.length} regular)\n`);

    // ============================================
    // 4. CREATE VENDOR PROFILES
    // ============================================
    console.log("🏪 Creating vendor profiles...");
    const vendorProfiles = insertedVendors.map((vendor) => ({
      userId: vendor._id,
      shopId: null, // Will be set after shops are created
      availableRolls: faker.number.int({ min: 0, max: 50 }),
      totalRollsUsed: faker.number.int({ min: 0, max: 100 }),
    }));
    const insertedVendorProfiles = await VendorProfile.insertMany(vendorProfiles);
    console.log(`✅ Created ${insertedVendorProfiles.length} vendor profiles\n`);

    // ============================================
    // 5. CREATE SHOPS
    // ============================================
    console.log("🏬 Creating shops...");
    const shops = [];

    // Admin shops
    for (let i = 0; i < 50; i++) {
      const category = faker.helpers.arrayElement(insertedCategories);
      shops.push({
        name: faker.company.name(),
        logo: faker.image.url({ width: 200, height: 200 }),
        description: faker.company.catchPhrase(),
        link: faker.internet.url(),
        supportedCountries: faker.helpers.arrayElements(COUNTRIES, { min: 1, max: 5 }),
        rating: faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 }),
        reviewCount: faker.number.int({ min: 50, max: 1000 }),
        category: category._id,
        vendorId: insertedAdmins[0]._id,
        isApproved: true,
        location: faker.location.streetAddress(),
        city: faker.location.city(),
        country: faker.helpers.arrayElement(COUNTRIES),
        language: faker.helpers.arrayElement(LANGUAGES),
        shareCount: faker.number.int({ min: 0, max: 500 }),
      });
    }

    // Vendor shops
    for (const vendor of insertedVendors) {
      for (let i = 0; i < SHOPS_PER_VENDOR; i++) {
        const category = faker.helpers.arrayElement(insertedCategories);
        shops.push({
          name: faker.company.name(),
          logo: faker.image.url({ width: 200, height: 200 }),
          description: faker.company.catchPhrase(),
          link: faker.internet.url(),
          supportedCountries: [vendor.country, ...faker.helpers.arrayElements(COUNTRIES, { min: 0, max: 3 })],
          rating: faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }),
          reviewCount: faker.number.int({ min: 0, max: 200 }),
          category: category._id,
          vendorId: vendor._id,
          isApproved: faker.datatype.boolean({ probability: 0.9 }), // 90% approved
          location: faker.location.streetAddress(),
          city: vendor.city,
          country: vendor.country,
          language: vendor.language,
          shareCount: faker.number.int({ min: 0, max: 100 }),
        });
      }
    }

    let insertedShops = [];
    for (let i = 0; i < shops.length; i += BATCH_SIZE) {
      const batch = shops.slice(i, i + BATCH_SIZE);
      const inserted = await Shop.insertMany(batch);
      insertedShops = insertedShops.concat(inserted);
    }

    // Update vendor profiles with shop IDs
    for (const vendorProfile of insertedVendorProfiles) {
      const vendorShop = insertedShops.find((s) => s.vendorId.toString() === vendorProfile.userId.toString());
      if (vendorShop) {
        vendorProfile.shopId = vendorShop._id;
        await vendorProfile.save();
      }
    }
    console.log(`✅ Created ${insertedShops.length} shops\n`);

    // ============================================
    // 6. CREATE ROLL PACKAGES
    // ============================================
    console.log("📦 Creating roll packages...");
    const rollPackages = [];
    const packageTypes = ["Basic", "Standard", "Premium", "Enterprise"];
    const packagePrices = [10, 25, 50, 100];
    const packageRolls = [10, 25, 50, 100];
    const packageBonuses = [0, 5, 10, 25];

    for (const vendorProfile of insertedVendorProfiles) {
      for (let i = 0; i < ROLL_PACKAGES_PER_VENDOR; i++) {
        const packageIndex = faker.number.int({ min: 0, max: packageTypes.length - 1 });
        rollPackages.push({
          vendor: vendorProfile._id,
          packageType: packageTypes[packageIndex],
          price: packagePrices[packageIndex],
          rollsIncluded: packageRolls[packageIndex],
          bonusRolls: packageBonuses[packageIndex],
          purchaseDate: getRandomDate(60),
          isActive: faker.datatype.boolean({ probability: 0.8 }),
        });
      }
    }

    let insertedRollPackages = [];
    for (let i = 0; i < rollPackages.length; i += BATCH_SIZE) {
      const batch = rollPackages.slice(i, i + BATCH_SIZE);
      const inserted = await RollPackage.insertMany(batch);
      insertedRollPackages = insertedRollPackages.concat(inserted);
    }
    console.log(`✅ Created ${insertedRollPackages.length} roll packages\n`);

    // ============================================
    // 7. CREATE ROLLS
    // ============================================
    console.log("🎬 Creating rolls...");
    const rolls = [];
    const approvedShops = insertedShops.filter((s) => s.isApproved);

    for (const shop of approvedShops) {
      for (let i = 0; i < ROLLS_PER_SHOP; i++) {
        rolls.push({
          shop: shop._id,
          videoUrl: faker.helpers.arrayElement(FAST_VIDEO_URLS),
          caption: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
          category: faker.helpers.arrayElement(ROLL_CATEGORIES),
          createdBy: shop.vendorId,
          duration: faker.number.int({ min: 15, max: 60 }),
          likesCount: 0, // Will be updated after likes are added
          commentsCount: 0, // Will be updated after comments are added
          savesCount: 0, // Will be updated after saves are added
          sharesCount: 0, // Will be updated after shares are added
          createdAt: getRandomDate(30),
        });
      }
    }

    let insertedRolls = [];
    for (let i = 0; i < rolls.length; i += BATCH_SIZE) {
      const batch = rolls.slice(i, i + BATCH_SIZE);
      const inserted = await Roll.insertMany(batch);
      insertedRolls = insertedRolls.concat(inserted);
    }
    console.log(`✅ Created ${insertedRolls.length} rolls\n`);

    // ============================================
    // 8. CREATE COMMENTS
    // ============================================
    console.log("💬 Creating comments...");
    const comments = [];
    for (const roll of insertedRolls) {
      const commentCount = faker.number.int({ min: 0, max: COMMENTS_PER_ROLL });
      const commentUsers = faker.helpers.arrayElements(insertedUsers, commentCount);
      
      for (const user of commentUsers) {
        comments.push({
          roll: roll._id,
          user: user._id,
          comment: faker.lorem.sentence(),
          likesCount: 0,
          createdAt: getRandomDate(20),
        });
      }
    }

    let insertedComments = [];
    for (let i = 0; i < comments.length; i += BATCH_SIZE) {
      const batch = comments.slice(i, i + BATCH_SIZE);
      const inserted = await Comment.insertMany(batch);
      insertedComments = insertedComments.concat(inserted);
    }

    // Update roll comment counts
    const commentCounts = await Comment.aggregate([
      { $group: { _id: "$roll", count: { $sum: 1 } } },
    ]);
    for (const item of commentCounts) {
      await Roll.findByIdAndUpdate(item._id, { commentsCount: item.count });
    }
    console.log(`✅ Created ${insertedComments.length} comments\n`);

    // ============================================
    // 9. ADD LIKES TO ROLLS
    // ============================================
    console.log("❤️  Adding likes to rolls...");
    for (const roll of insertedRolls) {
      const likeCount = faker.number.int({ min: 0, max: LIKES_PER_ROLL });
      const likeUsers = faker.helpers.arrayElements(insertedUsers, likeCount);
      roll.likes = likeUsers.map((u) => u._id);
      roll.likesCount = likeUsers.length;
      await roll.save();
    }
    console.log(`✅ Added likes to ${insertedRolls.length} rolls\n`);

    // ============================================
    // 10. ADD SAVES TO ROLLS
    // ============================================
    console.log("🔖 Adding saves to rolls...");
    const saves = [];
    for (const roll of insertedRolls) {
      const saveCount = faker.number.int({ min: 0, max: SAVES_PER_ROLL });
      const saveUsers = faker.helpers.arrayElements(insertedUsers, saveCount);
      
      for (const user of saveUsers) {
        saves.push({
          roll: roll._id,
          user: user._id,
        });
      }
    }

    let insertedSaves = [];
    for (let i = 0; i < saves.length; i += BATCH_SIZE) {
      const batch = saves.slice(i, i + BATCH_SIZE);
      const inserted = await Saved.insertMany(batch);
      insertedSaves = insertedSaves.concat(inserted);
    }

    // Update roll save counts
    const saveCounts = await Saved.aggregate([
      { $group: { _id: "$roll", count: { $sum: 1 } } },
    ]);
    for (const item of saveCounts) {
      await Roll.findByIdAndUpdate(item._id, { savesCount: item.count });
    }
    console.log(`✅ Created ${insertedSaves.length} saves\n`);

    // ============================================
    // 11. CREATE OFFERS
    // ============================================
    console.log("🎁 Creating offers...");
    const offers = [];
    for (const shop of insertedShops) {
      for (let i = 0; i < OFFERS_PER_SHOP; i++) {
        const originalPrice = faker.number.int({ min: 20, max: 1000 });
        const discountPercent = faker.number.int({ min: 10, max: 70 });
        const salePrice = Math.round(originalPrice * (1 - discountPercent / 100));
        
        offers.push({
          shop: shop._id,
          title: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          discount: `${discountPercent}%`,
          originalPrice: `${originalPrice} JOD`,
          salePrice: `${salePrice} JOD`,
          image: faker.image.url({ width: 400, height: 300 }),
          expiryDate: faker.date.future({ years: 1 }),
          isLimited: faker.datatype.boolean({ probability: 0.3 }),
        });
      }
    }

    let insertedOffers = [];
    for (let i = 0; i < offers.length; i += BATCH_SIZE) {
      const batch = offers.slice(i, i + BATCH_SIZE);
      const inserted = await Offer.insertMany(batch);
      insertedOffers = insertedOffers.concat(inserted);
    }
    console.log(`✅ Created ${insertedOffers.length} offers\n`);

    // ============================================
    // 12. CREATE COUPONS
    // ============================================
    console.log("🎫 Creating coupons...");
    const coupons = [];
    const usedCodes = new Set();

    for (const shop of insertedShops) {
      for (let i = 0; i < COUPONS_PER_SHOP; i++) {
        let code;
        do {
          code = faker.string.alphanumeric({ length: 8 }).toUpperCase();
        } while (usedCodes.has(code));
        usedCodes.add(code);

        const discountPercent = faker.number.int({ min: 5, max: 50 });
        const isExpired = faker.datatype.boolean({ probability: 0.1 }); // 10% expired
        
        coupons.push({
          shop: shop._id,
          code,
          description: `Get ${discountPercent}% off your next purchase at ${shop.name}`,
          discount: `${discountPercent}%`,
          image: faker.image.url({ width: 400, height: 300 }),
          expiryDate: isExpired ? faker.date.past() : faker.date.future({ years: 1 }),
          isExpired,
        });
      }
    }

    let insertedCoupons = [];
    for (let i = 0; i < coupons.length; i += BATCH_SIZE) {
      const batch = coupons.slice(i, i + BATCH_SIZE);
      const inserted = await Coupon.insertMany(batch);
      insertedCoupons = insertedCoupons.concat(inserted);
    }
    console.log(`✅ Created ${insertedCoupons.length} coupons\n`);

    // ============================================
    // 13. CREATE ADS
    // ============================================
    console.log("📢 Creating ads...");
    const ads = [];
    for (let i = 0; i < ADS_COUNT; i++) {
      const linkType = faker.helpers.arrayElement(["internal", "external"]);
      const shop = linkType === "internal" ? faker.helpers.arrayElement(insertedShops) : null;
      
      ads.push({
        title: faker.company.catchPhrase(),
        image: faker.image.url({ width: 800, height: 400 }),
        linkType,
        linkUrl: linkType === "internal" ? null : faker.internet.url(),
        shopId: shop ? shop._id : null,
        isActive: faker.datatype.boolean({ probability: 0.9 }),
        createdBy: insertedAdmins[0]._id,
        priority: faker.number.int({ min: 1, max: 10 }),
      });
    }

    const insertedAds = await Ad.insertMany(ads);
    console.log(`✅ Created ${insertedAds.length} ads\n`);

    // ============================================
    // 14. CREATE REVIEWS
    // ============================================
    console.log("⭐ Creating reviews...");
    const reviews = [];
    for (const shop of insertedShops) {
      const reviewCount = faker.number.int({ min: 0, max: REVIEWS_PER_SHOP });
      const reviewUsers = faker.helpers.arrayElements(insertedUsers, reviewCount);
      
      for (const user of reviewUsers) {
        reviews.push({
          shopId: shop._id,
          userId: user._id,
          userName: user.name,
          rating: faker.number.int({ min: 1, max: 5 }),
          comment: faker.lorem.paragraph(),
          createdAt: getRandomDate(60),
        });
      }
    }

    let insertedReviews = [];
    for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
      const batch = reviews.slice(i, i + BATCH_SIZE);
      const inserted = await Review.insertMany(batch);
      insertedReviews = insertedReviews.concat(inserted);
    }
    console.log(`✅ Created ${insertedReviews.length} reviews\n`);

    // ============================================
    // 15. CREATE WEEKLY SHOP SHARES
    // ============================================
    console.log("📤 Creating weekly shop shares...");
    const weeklyShares = [];
    const now = new Date();
    const currentWeekStart = getWeekStart(now);
    const lastWeekStart = getWeekStart(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));

    // Create shares for current week and last week
    for (const weekStart of [currentWeekStart, lastWeekStart]) {
      for (const shop of insertedShops) {
        const shareCount = faker.number.int({ min: 0, max: SHARES_PER_SHOP_WEEK });
        if (shareCount > 0) {
          // Create one share record per country
          const countries = shop.supportedCountries.length > 0 
            ? shop.supportedCountries 
            : [shop.country];
          
          for (const country of countries.slice(0, 3)) { // Limit to 3 countries per shop
            weeklyShares.push({
              shopId: shop._id,
              country: country.toUpperCase(),
              weekStart,
              shareCount: faker.number.int({ min: 1, max: shareCount }),
            });
          }
        }
      }
    }

    let insertedWeeklyShares = [];
    for (let i = 0; i < weeklyShares.length; i += BATCH_SIZE) {
      const batch = weeklyShares.slice(i, i + BATCH_SIZE);
      const inserted = await WeeklyShopShare.insertMany(batch);
      insertedWeeklyShares = insertedWeeklyShares.concat(inserted);
    }
    console.log(`✅ Created ${insertedWeeklyShares.length} weekly shop shares\n`);

    // ============================================
    // 16. ADD SHARES TO ROLLS
    // ============================================
    console.log("📱 Adding shares to rolls...");
    for (const roll of insertedRolls) {
      const shareCount = faker.number.int({ min: 0, max: 20 });
      roll.sharesCount = shareCount;
      await roll.save();
    }
    console.log(`✅ Added shares to ${insertedRolls.length} rolls\n`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("✅ COMPREHENSIVE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("\n📊 SEEDING SUMMARY:\n");
    console.log(`👑 Admins:           ${insertedAdmins.length}`);
    console.log(`👥 Users:            ${insertedUsers.length} (${insertedVendors.length} vendors, ${insertedRegularUsers.length} regular)`);
    console.log(`📁 Categories:       ${insertedCategories.length}`);
    console.log(`🏬 Shops:            ${insertedShops.length}`);
    console.log(`🏪 Vendor Profiles:  ${insertedVendorProfiles.length}`);
    console.log(`📦 Roll Packages:    ${insertedRollPackages.length}`);
    console.log(`🎬 Rolls:            ${insertedRolls.length}`);
    console.log(`💬 Comments:         ${insertedComments.length}`);
    console.log(`🔖 Saves:            ${insertedSaves.length}`);
    console.log(`🎁 Offers:           ${insertedOffers.length}`);
    console.log(`🎫 Coupons:          ${insertedCoupons.length}`);
    console.log(`📢 Ads:              ${insertedAds.length}`);
    console.log(`⭐ Reviews:          ${insertedReviews.length}`);
    console.log(`📤 Weekly Shares:   ${insertedWeeklyShares.length}`);
    console.log("\n" + "=".repeat(60));
    console.log("🔐 Default Passwords:");
    console.log("   Admin: admin123");
    console.log("   Users: user123");
    console.log("=".repeat(60) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seed();
