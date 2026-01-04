import { API_CONFIG } from "../config/constants.js";

/**
 * Calculate priority for sorting items based on user preferences
 */
export const calculateSortPriority = (item, favoriteShopIds, country, language) => {
  const isFavorite = favoriteShopIds.includes(item.shop._id.toString());
  const matchesCountry = country && item.shop.country === country;
  const matchesLanguage = language && item.shop.language === language;

  if (isFavorite && matchesCountry && matchesLanguage) return 1;
  if (isFavorite && matchesCountry) return 2;
  if (isFavorite && matchesLanguage) return 3;
  if (isFavorite) return 4;
  if (matchesCountry && matchesLanguage) return 5;
  if (matchesCountry) return 6;
  if (matchesLanguage) return 7;
  return 8;
};

/**
 * Sort and limit items based on priority and creation date
 */
export const sortAndLimitItems = (items, limit = API_CONFIG.DEFAULT_LIMIT) => {
  return items
    .sort((a, b) => {
      if (a.sortPriority !== b.sortPriority) {
        return a.sortPriority - b.sortPriority;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, limit)
    .map(item => {
      const { sortPriority, createdAt, ...itemWithoutPriority } = item;
      return itemWithoutPriority;
    });
};

/**
 * Get user's favorite shop IDs
 */
export const getUserFavoriteShopIds = async (userId) => {
  if (!userId) return [];
  
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId).select('favorites');
    return user?.favorites?.map(id => id.toString()) || [];
  } catch (error) {
    console.error('Error getting user favorites:', error);
    return [];
  }
};

/**
 * Transform coupon data for API response
 */
export const transformCoupon = (coupon, favoriteShopIds, country, language) => {
  const transformed = {
    id: coupon._id,
    shopId: coupon.shop._id,
    shopName: coupon.shop.name,
    code: coupon.code,
    description: coupon.description,
    discount: coupon.discount,
    expiryDate: coupon.expiryDate,
    isExpired: coupon.isExpired,
    sortPriority: calculateSortPriority(coupon, favoriteShopIds, country, language),
    createdAt: coupon.createdAt
  };
  
  return transformed;
};

/**
 * Transform offer data for API response
 */
export const transformOffer = (offer, favoriteShopIds, country, language) => {
  const transformed = {
    id: offer._id,
    shopId: offer.shop._id,
    shopName: offer.shop.name,
    title: offer.title,
    description: offer.description,
    discount: offer.discount,
    originalPrice: offer.originalPrice,
    salePrice: offer.salePrice,
    image: offer.image,
    expiryDate: offer.expiryDate,
    isLimited: offer.isLimited,
    sortPriority: calculateSortPriority(offer, favoriteShopIds, country, language),
    createdAt: offer.createdAt
  };
  
  return transformed;
};

/**
 * Handle Cloudinary upload with error handling
 */
export const handleCloudinaryUpload = async (file, folder, cloudinary) => {
  try {
    console.log(`Uploading ${folder} image to Cloudinary:`, file.path);
    console.log('File details:', { 
      name: file.filename, 
      size: file.size, 
      mimetype: file.mimetype 
    });
    
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      resource_type: "image",
      folder: folder,
      quality: "auto"
    });
    
    console.log('Cloudinary upload successful:', uploadResult.secure_url);
    
    // Clean up local file
    const fs = await import('fs');
    if (fs.default.existsSync(file.path)) {
      fs.default.unlinkSync(file.path);
      console.log('Local file cleaned up:', file.path);
    }
    
    return uploadResult.secure_url;
  } catch (uploadError) {
    console.error('Cloudinary upload error:', uploadError);
    console.error('File details:', file);
    throw new Error(`Failed to upload image to Cloudinary: ${uploadError.message}`);
  }
};