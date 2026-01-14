import React, {
  forwardRef,
  useState,
  useEffect,
  useImperativeHandle,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Share,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { colors, spacing } from "../styles/commonStyles";
import { Roll } from "../types";
import { router } from "expo-router";
import { rollsApi } from "../services/api";
import { useRollActions } from "../hooks/useRollActions";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// 👇 Adjust this to control video height
const VIDEO_HEIGHT = SCREEN_HEIGHT;

interface RollCardProps {
  roll: Roll;
  index?: number;
  isActive: boolean;
  height?: number;
  onDelete?: (rollId: string) => void;
}

export type RollCardHandle = {
  play: () => void;
  pause: () => void;
};

const RollCard = forwardRef<RollCardHandle, RollCardProps>(
  ({ roll, isActive, height, onDelete }, ref) => {
   
   
    const containerHeight = height ?? VIDEO_HEIGHT;


    /** ---------- VIDEO PLAYER HOOK ---------- */
    // Always create player but only load when active (better for first roll performance)
    const player = useVideoPlayer(
      roll.videoUrl ? { uri: roll.videoUrl } : null,
      (p) => {
        if (!p) return;
        p.loop = true;
        p.muted = false;
      }
    );

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [lastTap, setLastTap] = useState(0);
    const [userPaused, setUserPaused] = useState(false);
    const [isVideoLoading, setIsVideoLoading] = useState(true);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const rollActions = useRollActions(roll.id, {
      isLiked: roll.isLiked ?? false,
      isSaved: roll.isSaved ?? false,
      likes: roll.likes ?? 0,
      saves: roll.saves ?? 0
    });
    const [canDelete, setCanDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    /** ---------- Video Loading State ---------- */
    useEffect(() => {
      if (!player) {
        setIsVideoLoading(false);
        setIsVideoReady(false);
        return;
      }
      
      // Only check loading state when roll is active (optimize first roll)
      if (!isActive) {
        setIsVideoLoading(false);
        setIsVideoReady(false);
        return;
      }

      // Set initial loading state
      setIsVideoLoading(true);
      setIsVideoReady(false);

      // Check status immediately
      const checkStatus = () => {
        if (player.status?.isLoaded) {
          setIsVideoLoading(false);
          setIsVideoReady(true);
          return true;
        }
        return false;
      };

      // Check immediately
      if (checkStatus()) return;

      // Use event listeners for status changes (more efficient than polling)
      const handleStatusChange = () => {
        checkStatus();
      };

      const subscription = player.addListener('statusChange', handleStatusChange);

      // Fallback: show video after 2 seconds for first roll (faster UI)
      const timeout = setTimeout(() => {
        setIsVideoLoading(false);
        setIsVideoReady(true);
      }, 2000);

      return () => {
        subscription?.remove();
        clearTimeout(timeout);
      };
    }, [player, isActive]);

    /** ---------- Play / Pause controlled by parent ---------- */
    useEffect(() => {
      if (!player || !isVideoReady) return;
      if (isActive) {
        player.play();
        setIsPlaying(true);
        setUserPaused(false);
      } else {
        player.pause();
        setIsPlaying(false);
      }
    }, [isActive, player, isVideoReady]);

    /** ---------- Track progress ---------- */
    useEffect(() => {
      if (!player) return;
      const sub = player.addListener("timeUpdate", ({ currentTime }) => {
        const duration = player.duration;
        if (duration && duration > 0) {
          setProgress(currentTime / duration);
        }
      });
      return () => sub?.remove();
    }, [player]);

    /** ---------- Check delete permissions ---------- */
    useEffect(() => {
      const checkDeletePermission = async () => {
        try {
          const authState = await AsyncStorage.getItem('auth_state');
          if (authState) {
            const authData = JSON.parse(authState);
            const user = authData.user; // Get nested user object
            
            if (user) {
              // Admin can delete any roll, or user can delete their own rolls
              const isAdmin = user.role === 'admin';
              const isOwner = user.id === roll.createdBy || user._id === roll.createdBy;
              const canDeleteRoll = isAdmin || isOwner;
              
              setCanDelete(canDeleteRoll);
            }
          }
        } catch (error) {
          console.error('Error checking delete permission:', error);
        }
      };
      checkDeletePermission();
    }, [roll.createdBy]);

    /** ---------- Imperative Handle ---------- */
    useImperativeHandle(ref, () => ({
      play: () => player?.play(),
      pause: () => player?.pause(),
    }));

    /** ---------- Toggle playback / double tap ---------- */
    const togglePlayback = () => {
      if (!player) return;
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
        setUserPaused(true);
      } else {
        player.play();
        setIsPlaying(true);
        setUserPaused(false);
      }
    };

    const handleVideoPress = () => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      if (now - lastTap < DOUBLE_TAP_DELAY) {
        rollActions.handleLike();
      } else {
        togglePlayback();
      }
      setLastTap(now);
    };

    /** ---------- Like / Save / Share ---------- */
    const handleLike = () => {
      rollActions.handleLike();
    };

    const handleSave = () => {
      rollActions.handleSave();
    };

    const handleShare = async () => {
      const link = `https://bigbag.app/roll/${roll.id}`;
      await Share.share({ message: `${roll.caption ?? ""} ${link}` });
    };

    const handleDelete = async () => {
      Alert.alert(
        "Delete Roll",
        "Are you sure you want to delete this roll?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              setIsDeleting(true);
              try {
                const res = await rollsApi.delete(roll.id);
                if (res.success) {
                  onDelete?.(roll.id);
                }
              } catch (error) {
                console.error('Delete error:', error);
                Alert.alert('Error', 'Failed to delete roll');
              } finally {
                setIsDeleting(false);
              }
            },
          },
        ]
      );
    };

    /** ---------- RENDER ---------- */
    return (
      <View style={[styles.container, { height: containerHeight }]}>
        {/* VIDEO PLACEHOLDER/LOADING */}
        {isVideoLoading && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backgroundAlt, justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* VIDEO */}
        <TouchableOpacity
          style={styles.video}
          activeOpacity={1}
          onPress={handleVideoPress}
        >
          {isVideoReady && (
            <VideoView
              style={StyleSheet.absoluteFill}
              player={player}
              contentFit="cover"
              allowsFullscreen={false}
              allowsPictureInPicture={false}
              requiresLinearPlayback={false}
              showsTimecodes={false}
              nativeControls={false}
            />
          )}
        </TouchableOpacity>

        {/* PLAY BUTTON */}
        {!isPlaying && userPaused && (
          <View style={styles.playOverlay}>
            <Ionicons name="play" size={40} color={colors.white} />
          </View>
        )}

        {/* PROGRESS BAR */}
       <View style={styles.progressBar}>

          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* BOTTOM OVERLAY */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.65)"]}
style={[styles.overlay, { paddingBottom: spacing.lg }]}
        >
          <View style={styles.bottomRow}>
            {/* LEFT */}
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={styles.shopInfo}
                onPress={() => router.push(`/shop/${roll.shopId}`)}
              >
                <Image 
                  source={{ uri: roll.shopLogo || 'https://via.placeholder.com/40x40/cccccc/ffffff?text=S' }} 
                  style={styles.shopLogo} 
                />
                <Text style={styles.shopName}>{roll.shopName}</Text>
              </TouchableOpacity>

              <Text style={styles.caption}>{roll.caption}</Text>
            </View>

            {/* RIGHT */}
            <View style={styles.actions}>
              <Action icon={rollActions.isLiked ? "heart" : "heart-outline"} count={rollActions.likes || 0} onPress={handleLike} loading={rollActions.isLiking} />
              <Action icon="chatbubble-outline" count={roll.commentsCount || 0} onPress={() => router.push(`/roll-comments/${roll.id}`)} />
              <Action icon="share-outline" onPress={handleShare} />
              <Action icon={rollActions.isSaved ? "bookmark" : "bookmark-outline"} count={rollActions.saves || 0} onPress={handleSave} loading={rollActions.isSaving} />
              {canDelete && (
                <Action 
                  icon="trash-outline" 
                  onPress={handleDelete} 
                  loading={isDeleting}
                  color={colors.error}
                />
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }
);

const Action = ({ icon, count, onPress, loading, color }: any) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
    <View style={styles.actionIcon}>
      {loading ? <ActivityIndicator color={colors.white} /> : <Ionicons name={icon} size={24} color={color || colors.white} />}
    </View>
    {typeof count === "number" && <Text style={styles.actionText}>{count}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { width: SCREEN_WIDTH, height: VIDEO_HEIGHT, backgroundColor: colors.black },
  video: { width: "100%", height: "100%" },
  playOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -32 }, { translateY: -32 }],
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressBar: { position: "absolute", bottom: 0, height: 3, width: "100%", backgroundColor: "rgba(255,255,255,0.25)" },
  progressFill: { height: "100%", backgroundColor: colors.white },
  overlay: { position: "absolute", bottom: 0, width: "100%", paddingHorizontal: spacing.lg },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  shopInfo: { flexDirection: "row", alignItems: "center", marginBottom: spacing.xs },
  shopLogo: { width: 40, height: 40, borderRadius: 20, marginRight: spacing.xs },
  shopName: { color: colors.white, fontWeight: "bold", fontSize: 13 },
  caption: { color: colors.white, fontSize: 13, lineHeight: 16, maxWidth: SCREEN_WIDTH * 0.65, marginBottom: spacing.xs },
  actions: { alignItems: "center", gap: spacing.lg, paddingLeft: spacing.md },
  actionBtn: { alignItems: "center" },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  actionText: { color: colors.white, marginTop: spacing.xs, fontSize: 12, fontWeight: "600" },
});

export default RollCard;
