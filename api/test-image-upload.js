import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testImageUpload() {
  try {
    console.log('Testing image upload to ads folder...');
    
    // Create a simple test image file (text file as placeholder)
    const testImagePath = path.join(process.cwd(), 'test-ad-image.txt');
    fs.writeFileSync(testImagePath, 'This is a test ad image file');
    
    console.log('Test image file created:', testImagePath);
    
    // Test upload to ads folder
    const result = await cloudinary.uploader.upload(testImagePath, {
      resource_type: "raw", // Use raw for text file
      folder: "ads",
      public_id: "test-ad-image"
    });
    
    console.log('✅ Upload to ads folder successful:', {
      public_id: result.public_id,
      secure_url: result.secure_url,
      folder: result.folder
    });
    
    // Test upload to shops/logos folder
    const result2 = await cloudinary.uploader.upload(testImagePath, {
      resource_type: "raw",
      folder: "shops/logos",
      public_id: "test-shop-logo"
    });
    
    console.log('✅ Upload to shops/logos folder successful:', {
      public_id: result2.public_id,
      secure_url: result2.secure_url,
      folder: result2.folder
    });
    
    // Clean up local file
    fs.unlinkSync(testImagePath);
    console.log('Local test file cleaned up');
    
    // Clean up Cloudinary files
    await cloudinary.uploader.destroy(result.public_id, { resource_type: "raw" });
    await cloudinary.uploader.destroy(result2.public_id, { resource_type: "raw" });
    console.log('Cloudinary test files cleaned up');
    
  } catch (error) {
    console.error('❌ Image upload test failed:', error.message);
    console.error('Full error:', error);
  }
}

testImageUpload();