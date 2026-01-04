// controllers/favorite.js
import User from "../models/User.js";
import Shop from "../models/Shop.js";

export const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shopId } = req.body;

    if (!shopId || shopId === "undefined" || shopId === "null") {
      return res.status(400).json({
        success: false,
        message: "Shop ID is required",
      });
    }

    if (!/^[0-9a-fA-F]{24}$/.test(shopId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid shop ID format: ${shopId}`,
      });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isFavorite = user.favorites.includes(shopId);

    if (isFavorite) {
      user.favorites.pull(shopId);
      await user.save();
      return res.status(200).json({
        success: true,
        data: { isFavorite: false, favorites: user.favorites },
        message: "Removed from favorites",
      });
    } else {
      user.favorites.push(shopId);
      await user.save();
      return res.status(200).json({
        success: true,
        data: { isFavorite: true, favorites: user.favorites },
        message: "Added to favorites",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate("favorites");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const transformedFavorites = user.favorites.map((shop) => ({
      ...shop.toObject(),
      id: shop._id.toString(),
    }));

    return res.status(200).json({
      success: true,
      data: transformedFavorites,
      message: "Favorites retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
