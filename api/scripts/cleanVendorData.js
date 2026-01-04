// import mongoose from 'mongoose';
// import VendorProfile from '../models/Vendor.js';

// const cleanVendorData = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bigbag');

//     // Find all vendor profiles with corrupted rollPackages
//     const vendors = await VendorProfile.find({});

//     for (const vendor of vendors) {
//       let needsUpdate = false;

//       // Check if rollPackages contains strings instead of ObjectIds
//       if (vendor.rollPackages && vendor.rollPackages.length > 0) {
//         const firstPackage = vendor.rollPackages[0];
//         if (typeof firstPackage === 'string') {
//           console.log(`Cleaning vendor ${vendor._id}: corrupted rollPackages`);
//           vendor.rollPackages = [];
//           needsUpdate = true;
//         }
//       }

//       if (needsUpdate) {
//         await vendor.save();
//         console.log(`Cleaned vendor ${vendor._id}`);
//       }
//     }

//     console.log('Cleanup completed');
//     process.exit(0);
//   } catch (error) {
//     console.error('Cleanup failed:', error);
//     process.exit(1);
//   }
// };

// cleanVendorData();
