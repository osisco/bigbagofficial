import Category from "../models/Category.js";

const formatCategory = (category) => ({
  id: category._id,
  name: category.name,
  icon: category.icon,
  color: category.color,
  createdBy: category.createdBy,
  isActive: category.isActive,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    const formatted = categories.map(formatCategory);

    res.status(200).json({
      success: true,
      data: formatted,
      message: "Categories retrieved successfully",
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Create new category (Admin only)
export const createCategory = async (req, res) => {
  try {
    const { name, icon, color } = req.body;

    if (!name || !icon || !color) {
      return res.status(400).json({
        success: false,
        message: "Name, icon, and color are required",
      });
    }

    const existingCategory = await Category.findOne({
      name: name.trim(),
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const newCategory = new Category({
      name: name.trim(),
      icon,
      color,
      createdBy: req.user.id,
    });

    await newCategory.save();

    res.status(201).json({
      success: true,
      data: formatCategory(newCategory),
      message: "Category created successfully",
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update category (Admin only)
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, color } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({
        name: name.trim(),
        _id: { $ne: id },
      });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Category name already exists",
        });
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        ...(name && { name: name.trim() }),
        ...(icon && { icon }),
        ...(color && { color }),
      },
      { new: true },
    ).populate("createdBy", "name");

    res.status(200).json({
      success: true,
      data: formatCategory(updatedCategory),
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// Delete category (Admin only)
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await Category.findByIdAndUpdate(id, { isActive: false });

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id).populate("createdBy", "name");

    if (!category || !category.isActive) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      data: formatCategory(category),
      message: "Category retrieved successfully",
    });
  } catch (error) {
    console.error("Get category by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
