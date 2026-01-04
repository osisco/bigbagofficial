import Comment from "../models/Comment.js";
import Roll from "../models/Roll.js";
import User from "../models/User.js";

export const createComment = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { rollId, comment } = req.body;

    if (!comment || !rollId) {
      return res.status(400).json({
        success: false,
        message: "Missing comment or rollId",
      });
    }

    const roll = await Roll.findById(rollId);
    if (!roll) {
      return res.status(404).json({
        success: false,
        message: "Roll not found",
      });
    }

    const newComment = new Comment({
      roll: rollId,
      user: req.user.id,
      comment: comment.trim(),
    });

    await newComment.save();

    roll.commentsCount = (roll.commentsCount || 0) + 1;
    await roll.save();

    await newComment.populate("user", "name email");

    const transformedComment = {
      id: newComment._id,
      rollId: newComment.roll,
      userId: newComment.user._id,
      userName: newComment.user.name,
      userAvatar: newComment.user.avatar || null,
      comment: newComment.comment,
      createdAt: newComment.createdAt,
      likes: newComment.likesCount || 0,
      isLiked: false,
    };

    res.status(200).json({
      success: true,
      data: transformedComment,
      message: "Comment created successfully",
    });
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getCommentsByReel = async (req, res) => {
  try {
    const { rollId } = req.params;
    const userId = req.user?.id;

    const comments = await Comment.find({ roll: rollId })
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 });

    const transformedComments = comments.map((comment) => ({
      id: comment._id,
      rollId: comment.roll,
      userId: comment.user._id,
      userName: comment.user.name,
      userAvatar: comment.user.avatar || null,
      comment: comment.comment,
      createdAt: comment.createdAt,
      likes: comment.likesCount || 0,
      isLiked: userId ? comment.likes?.includes(userId) || false : false,
    }));

    res.status(200).json({
      success: true,
      data: transformedComments,
      message: "Comments retrieved successfully",
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const isLiked = comment.likes && comment.likes.includes(userId);
    if (isLiked) {
      return res.status(400).json({
        success: false,
        message: "Comment already liked",
      });
    }

    if (!comment.likes) comment.likes = [];
    comment.likes.push(userId);
    comment.likesCount = (comment.likesCount || 0) + 1;
    await comment.save();

    res.status(200).json({
      success: true,
      data: {
        isLiked: true,
        likesCount: comment.likesCount,
      },
      message: "Comment liked successfully",
    });
  } catch (error) {
    console.error("Like comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const unlikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const isLiked = comment.likes && comment.likes.includes(userId);
    if (!isLiked) {
      return res.status(400).json({
        success: false,
        message: "Comment not liked yet",
      });
    }

    comment.likes = comment.likes.filter((like) => like.toString() !== userId);
    comment.likesCount = Math.max(0, (comment.likesCount || 0) - 1);
    await comment.save();

    res.status(200).json({
      success: true,
      data: {
        isLiked: false,
        likesCount: comment.likesCount,
      },
      message: "Comment unliked successfully",
    });
  } catch (error) {
    console.error("Unlike comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    const existingComment = await Comment.findById(commentId);
    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (existingComment.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this comment",
      });
    }

    existingComment.comment = comment.trim();
    await existingComment.save();

    res.status(200).json({
      success: true,
      data: existingComment,
      message: "Comment updated successfully",
    });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    await Comment.findByIdAndDelete(commentId);

    await Roll.findByIdAndUpdate(comment.roll, {
      $inc: { commentsCount: -1 },
    });

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
