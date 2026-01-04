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
import { rollsApi, saveApi } from "../services/api";

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
    const [isLiked, setIsLiked] = useState(roll.isLiked ?? false);
    const [isSaved, setIsSaved] = useState(roll.isSaved ?? false);
    const [likes, setLikes] = useState(roll.likes ?? 0);
    const [saves, setSaves] = useState(roll.saves ?? 0);
    const [isLiking, setIsLiking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [canDelete, setCanDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    /** ---------- Play / Pause controlled by parent ---------- */
    useEffect(() => {
      if (!player) return;
      if (isActive) {
        player.play();
        setIsPlaying(true);
      } else {
        player.pause();
        setIsPlaying(false);
      }
    }, [isActive, player]);

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
      } else {
        player.play();
        setIsPlaying(true);
      }
    };

    const handleVideoPress = () => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      if (now - lastTap < DOUBLE_TAP_DELAY) {
        handleLike();
      } else {
        togglePlayback();
      }
      setLastTap(now);
    };

    /** ---------- Like / Save / Share ---------- */
    const handleLike = async () => {
      if (isLiking) return;
      setIsLiking(true);
      try {
        const res = isLiked
          ? await rollsApi.unlike(roll.id)
          : await rollsApi.like(roll.id);
        if (res.success) {
          setIsLiked(!isLiked);
          setLikes(isLiked ? likes - 1 : likes + 1);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLiking(false);
      }
    };

    const handleSave = async () => {
      if (isSaving) return;
      setIsSaving(true);
      try {
        const res = isSaved
          ? await saveApi.unsaveRoll(roll.id)
          : await saveApi.saveRoll(roll.id);
        if (res.success) {
          setIsSaved(!isSaved);
          setSaves(isSaved ? saves - 1 : saves + 1);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSaving(false);
      }
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
        {/* VIDEO */}
        <TouchableOpacity
          style={styles.video}
          activeOpacity={1}
          onPress={handleVideoPress}
        >
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
        </TouchableOpacity>

        {/* PLAY BUTTON */}
        {!isPlaying && (
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
              <Action icon={isLiked ? "heart" : "heart-outline"} count={likes} onPress={handleLike} loading={isLiking} />
              <Action icon="chatbubble-outline" count={roll.commentsCount} onPress={() => router.push(`/roll-comments/${roll.id}`)} />
              <Action icon="share-outline" onPress={handleShare} />
              <Action icon={isSaved ? "bookmark" : "bookmark-outline"} count={saves} onPress={handleSave} loading={isSaving} />
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
