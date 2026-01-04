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

async function testUpload() {
  try {
    console.log('Testing Cloudinary upload...');
    
    // Create a test image file
    const testImagePath = path.join(process.cwd(), 'test-image.txt');
    fs.writeFileSync(testImagePath, 'This is a test file for Cloudinary upload');
    
    console.log('Test file created:', testImagePath);
    
    // Test upload
    const result = await cloudinary.uploader.upload(testImagePath, {
      resource_type: "raw",
      folder: "test",
      public_id: "test-upload"
    });
    
    console.log('✅ Upload successful:', {
      public_id: result.public_id,
      secure_url: result.secure_url,
      folder: result.folder
    });
    
    // Clean up
    fs.unlinkSync(testImagePath);
    console.log('Test file cleaned up');
    
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(result.public_id, { resource_type: "raw" });
    console.log('Test file deleted from Cloudinary');
    
  } catch (error) {
    console.error('❌ Upload test failed:', error.message);
    console.error('Error details:', error);
  }
}

testUpload();