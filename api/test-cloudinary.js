import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testCloudinary() {
  try {
    console.log('Testing Cloudinary connection...');
    console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    
    // Test connection
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful:', result);
    
    // List all folders
    console.log('\n📁 Checking folders...');
    const folders = await cloudinary.api.root_folders();
    console.log('Existing folders:', folders.folders.map(f => f.name));
    
    // List resources in each expected folder
    const expectedFolders = ['offers', 'ads', 'shops', 'rolls', 'coupons'];
    
    for (const folder of expectedFolders) {
      try {
        const resources = await cloudinary.api.resources({
          type: 'upload',
          prefix: folder,
          max_results: 5
        });
        console.log(`\n📂 ${folder}/ folder: ${resources.resources.length} files`);
        if (resources.resources.length > 0) {
          resources.resources.forEach(resource => {
            console.log(`  - ${resource.public_id}`);
          });
        }
      } catch (err) {
        console.log(`\n📂 ${folder}/ folder: No files or folder doesn't exist`);
      }
    }
    
  } catch (error) {
    console.error('❌ Cloudinary test failed:', error.message);
  }
}

testCloudinary();