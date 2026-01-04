
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useCommonStyles, spacing, typography,  borderRadius } from '../../styles/commonStyles';
import { useLocalSearchParams, router } from 'expo-router';
import { commentsApi, handleApiError } from '../../services/api';
import { ReelComment } from '../../types';
import { useAuth } from '../../hooks/useAuth';


export default function ReelCommentsScreen() {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: spacing.sm,
      marginRight: spacing.sm,
    },
    headerTitle: {
      ...typography.h2,
      color: colors.text,
    },
    commentsList: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    commentItem: {
      flexDirection: 'row',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    commentAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: spacing.sm,
    },
    commentContent: {
      flex: 1,
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    commentUserName: {
      ...typography.bodyBold,
      color: colors.text,
      marginRight: spacing.sm,
    },
    commentTime: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    commentText: {
      ...typography.body,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    commentActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    commentAction: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: spacing.lg,
    },
    commentActionText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    emptyStateText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    commentInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...typography.body,
      color: colors.text,
      maxHeight: 100,
      marginRight: spacing.sm,
    },
    sendButton: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.lg,
      padding: spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: colors.border,
    },
  });

  useEffect(() => {
    loadComments();
  }, [id]);

  const loadComments = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      if (!id) {
        setError('Roll ID not found');
        return;
      }

      console.log('Loading comments for roll:', id);
      const response = await commentsApi.getByRoll(id);
      
      if (response.success && response.data) {
        setComments(response.data);
        console.log('Comments loaded:', response.data.length);
      } else {
        console.log('No comments found');
        setComments([]);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !id) return;

    if (!user) {
      Alert.alert('Error', 'Please sign in to comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await commentsApi.create(id, newComment.trim());
      
      if (response.success && response.data) {
        setComments(prev => [...prev, response.data]);
        setNewComment('');
        console.log('Comment added successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to add comment');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      const errorMessage = handleApiError(err);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await commentsApi.unlike(commentId);
      } else {
        await commentsApi.like(commentId);
      }
      
      // Update local state
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          };
        }
        return comment;
      }));
    } catch (err) {
      console.error('Error liking comment:', err);
      Alert.alert('Error', 'Failed to like comment');
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d`;
    }
  };

  const renderComment = ({ item }: { item: ReelComment }) => (
    <View style={styles.commentItem}>
      <Image
        source={{ uri: item.userAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop' }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUserName}>{item.userName}</Text>
          <Text style={styles.commentTime}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{item.comment}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.commentAction}
            onPress={() => handleLikeComment(item.id, item.isLiked)}
          >
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={16}
              color={item.isLiked ? colors.error : colors.textSecondary}
            />
            {item.likes > 0 && (
              <Text style={styles.commentActionText}>{item.likes}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.commentAction}>
            <Text style={styles.commentActionText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubble-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyStateText}>
        No comments yet.{'\n'}Be the first to comment!
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
        </View>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptyStateText}>Loading comments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{error}</Text>
          <TouchableOpacity onPress={loadComments}>
            <Text style={[styles.emptyStateText, { color: colors.primary, marginTop: spacing.md }]}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {comments.length > 0 ? (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            style={styles.commentsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          renderEmptyState()
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textSecondary}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
            editable={!isSubmitting}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newComment.trim() || isSubmitting) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendComment}
            disabled={!newComment.trim() || isSubmitting}
          >
            <Ionicons name={isSubmitting ? 'hourglass' : 'send'} size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
