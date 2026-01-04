import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";
import Shop from "./models/Shop.js";
import Category from "./models/Category.js";
import Roll from "./models/Roll.js";
import Coupon from "./models/Coupon.js";
import Offer from "./models/Offer.js";
import Ad from "./models/Ad.js";
import VendorProfile from "./models/Vendor.js";

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Shop.deleteMany({}),
      Category.deleteMany({}),
      Roll.deleteMany({}),
      Coupon.deleteMany({}),
      Offer.deleteMany({}),
      Ad.deleteMany({}),
      VendorProfile.deleteMany({}),
    ]);

    // Create hashed password
    const hashedPassword = await bcrypt.hash("123123Os#", 10);

    // Create Admin User first for category creation
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@bigbag.com",
      password: hashedPassword,
      role: "admin",
      age: 30,
      gender: "male",
      country: "US",
      city: "New York",
    });

    // Create Categories
    const categories = await Category.insertMany([
      {
        name: "Electronics",
        icon: "phone-portrait-outline",
        color: "#3B82F6",
        createdBy: adminUser._id,
      },
      {
        name: "Fashion",
        icon: "shirt-outline",
        color: "#EC4899",
        createdBy: adminUser._id,
      },
      {
        name: "Food & Dining",
        icon: "restaurant-outline",
        color: "#F59E0B",
        createdBy: adminUser._id,
      },
      {
        name: "Beauty & Health",
        icon: "heart-outline",
        color: "#EF4444",
        createdBy: adminUser._id,
      },
      {
        name: "Home & Garden",
        icon: "home-outline",
        color: "#10B981",
        createdBy: adminUser._id,
      },
      {
        name: "Sports & Fitness",
        icon: "fitness-outline",
        color: "#8B5CF6",
        createdBy: adminUser._id,
      },
      {
        name: "Books & Education",
        icon: "library-outline",
        color: "#6366F1",
        createdBy: adminUser._id,
      },
      {
        name: "Automotive",
        icon: "car-outline",
        color: "#374151",
        createdBy: adminUser._id,
      },
      {
        name: "Travel & Tourism",
        icon: "airplane-outline",
        color: "#06B6D4",
        createdBy: adminUser._id,
      },
      {
        name: "Entertainment",
        icon: "film-outline",
        color: "#F97316",
        createdBy: adminUser._id,
      },
    ]);

    // Create remaining Users
    const otherUsers = await User.insertMany([
      {
        name: "John Vendor",
        email: "john@vendor.com",
        password: hashedPassword,
        role: "vendor",
        age: 35,
        gender: "male",
        country: "US",
        city: "San Francisco",
      },
      {
        name: "Sarah Shop",
        email: "sarah@shop.com",
        password: hashedPassword,
        role: "vendor",
        age: 28,
        gender: "female",
        country: "US",
        city: "Los Angeles",
      },
      {
        name: "Mike Customer",
        email: "mike@customer.com",
        password: hashedPassword,
        role: "user",
        age: 25,
        gender: "male",
        country: "US",
        city: "Chicago",
      },
      {
        name: "Lisa User",
        email: "lisa@user.com",
        password: hashedPassword,
        role: "user",
        age: 32,
        gender: "female",
        country: "CA",
        city: "Toronto",
      },
    ]);

    const users = [adminUser, ...otherUsers];

    // Create Vendor Profiles
    const vendorProfiles = await VendorProfile.insertMany([
      {
        userId: users[1]._id, // John Vendor
        availableRolls: 10,
      },
      {
        userId: users[2]._id, // Sarah Shop
        availableRolls: 15,
      },
    ]);

    // Create Shops
    const shops = await Shop.insertMany([
      {
        name: "TechWorld Electronics",
        description: "Latest gadgets and electronics",
        category: categories[0]._id,
        vendorId: vendorProfiles[0]._id,
        location: "123 Tech Street, Silicon Valley, CA",
        city: "San Francisco",
        country: "US",
        logo: "https://res.cloudinary.com/demo/image/upload/techworld-logo.jpg",
        rating: 4.5,
        reviewCount: 120,
        isApproved: true,
        supportedCountries: ["US", "CA"],
      },
      {
        name: "Fashion Forward",
        description: "Trendy clothing and accessories",
        category: categories[1]._id,
        vendorId: vendorProfiles[1]._id,
        location: "456 Fashion Ave, New York, NY",
        city: "New York",
        country: "US",
        logo: "https://res.cloudinary.com/demo/image/upload/fashion-logo.jpg",
        rating: 4.8,
        reviewCount: 89,
        isApproved: true,
        supportedCountries: ["US"],
      },
      {
        name: "Gourmet Delights",
        description: "Fine dining and gourmet food",
        category: categories[2]._id,
        vendorId: vendorProfiles[0]._id,
        location: "789 Culinary Blvd, Chicago, IL",
        city: "Chicago",
        country: "US",
        logo: "https://res.cloudinary.com/demo/image/upload/gourmet-logo.jpg",
        rating: 4.7,
        reviewCount: 156,
        isApproved: true,
        supportedCountries: ["US"],
      },
      {
        name: "Beauty Bliss",
        description: "Premium beauty and skincare products",
        category: categories[3]._id,
        vendorId: vendorProfiles[1]._id,
        location: "321 Beauty Lane, Los Angeles, CA",
        city: "Los Angeles",
        country: "US",
        logo: "https://res.cloudinary.com/demo/image/upload/beauty-logo.jpg",
        rating: 4.6,
        reviewCount: 203,
        isApproved: true,
        supportedCountries: ["US", "CA"],
      },
    ]);

    // Create Rolls
    const rolls = await Roll.insertMany([
      {
        videoUrl: "https://res.cloudinary.com/demo/video/upload/iphone-review.mp4",
        caption: "Latest iPhone Review - Comprehensive review of the newest iPhone features",
        shop: shops[0]._id,
        category: "all",
        createdBy: vendorProfiles[0]._id,
        duration: 120,
        likesCount: 89,
        likes: [users[3]._id, users[4]._id],
      },
      {
        videoUrl: "https://res.cloudinary.com/demo/video/upload/summer-fashion.mp4",
        caption: "Summer Fashion Trends - Discover the hottest summer fashion trends",
        shop: shops[1]._id,
        category: "women",
        createdBy: vendorProfiles[1]._id,
        duration: 90,
        likesCount: 156,
        likes: [users[3]._id],
      },
      {
        videoUrl: "https://res.cloudinary.com/demo/video/upload/pasta-recipe.mp4",
        caption: "Gourmet Pasta Recipe - Learn to make authentic Italian pasta",
        shop: shops[2]._id,
        category: "all",
        createdBy: vendorProfiles[0]._id,
        duration: 180,
        likesCount: 67,
        likes: [users[4]._id],
      },
      {
        videoUrl: "https://res.cloudinary.com/demo/video/upload/skincare.mp4",
        caption: "Skincare Routine - Daily skincare routine for glowing skin",
        shop: shops[3]._id,
        category: "women",
        createdBy: vendorProfiles[1]._id,
        duration: 150,
        likesCount: 98,
        likes: [users[3]._id, users[4]._id],
      },
    ]);

    // Create Coupons
    const coupons = await Coupon.insertMany([
      {
        code: "TECH20",
        description: "Get 20% off on all electronics",
        discount: "20%",
        shop: shops[0]._id,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        image: "https://res.cloudinary.com/demo/image/upload/tech-coupon.jpg",
      },
      {
        code: "FASHION30",
        description: "30% off on designer clothing",
        discount: "30%",
        shop: shops[1]._id,
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        image: "https://res.cloudinary.com/demo/image/upload/fashion-coupon.jpg",
      },
      {
        code: "FOOD10",
        description: "$10 off on orders above $30",
        discount: "$10",
        shop: shops[2]._id,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        image: "https://res.cloudinary.com/demo/image/upload/food-coupon.jpg",
      },
    ]);

    // Create Offers
    const offers = await Offer.insertMany([
      {
        title: "Buy 2 Get 1 Free - Smartphones",
        description: "Purchase any 2 smartphones and get the third one free",
        shop: shops[0]._id,
        discount: "33%",
        originalPrice: "999",
        salePrice: "666",
        image: "https://res.cloudinary.com/demo/image/upload/phone-offer.jpg",
        expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        isLimited: true,
      },
      {
        title: "Designer Handbag Collection",
        description: "Exclusive designer handbags at 40% off",
        shop: shops[1]._id,
        discount: "40%",
        originalPrice: "250",
        salePrice: "150",
        image: "https://res.cloudinary.com/demo/image/upload/handbag-offer.jpg",
        expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        isLimited: false,
      },
    ]);

    // Create Ads
    const ads = await Ad.insertMany([
      {
        title: "Summer Electronics Sale",
        image: "https://res.cloudinary.com/demo/image/upload/electronics-ad.jpg",
        linkType: "external",
        linkUrl: "https://techworld.com/sale",
        shopId: shops[0]._id,
        createdBy: adminUser._id,
        priority: 3,
        isActive: true,
      },
      {
        title: "New Fashion Collection",
        image: "https://res.cloudinary.com/demo/image/upload/fashion-ad.jpg",
        linkType: "internal",
        linkUrl: "/shop/" + shops[1]._id,
        shopId: shops[1]._id,
        createdBy: adminUser._id,
        priority: 2,
        isActive: true,
      },
    ]);

    console.log("✅ Database seeded successfully!");
    console.log(`Created ${categories.length} categories`);
    console.log(`Created ${users.length} users`);
    console.log(`Created ${vendorProfiles.length} vendor profiles`);
    console.log(`Created ${shops.length} shops`);
    console.log(`Created ${rolls.length} rolls`);
    console.log(`Created ${coupons.length} coupons`);
    console.log(`Created ${offers.length} offers`);
    console.log(`Created ${ads.length} ads`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};
seedData();