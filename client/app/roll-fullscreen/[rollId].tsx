import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Share,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { rollsApi, saveApi, handleApiError } from '../../services/api';
import { Roll } from '../../types';
import { colors, spacing } from '../../styles/commonStyles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_HEIGHT;

export default function RollFullscreenScreen() {
  const { rollId } = useLocalSearchParams<{ rollId: string }>();
  const [roll, setRoll] = useState<Roll | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likes, setLikes] = useState(0);
  const [saves, setSaves] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const player = useVideoPlayer(
    roll?.videoUrl ? { uri: roll.videoUrl } : null,
    (p) => {
      if (!p) return;
      p.loop = true;
      p.muted = false;
    }
  );

  const styles = StyleSheet.create({
    container: { width: SCREEN_WIDTH, height: VIDEO_HEIGHT, backgroundColor: colors.black },
    video: { width: "100%", height: "100%" },
    closeButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 20,
      padding: 10,
      zIndex: 1,
    },
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
    actionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.12)", justifyContent: "center", alignItems: "center" },
    actionText: { color: colors.white, marginTop: spacing.xs, fontSize: 12, fontWeight: "600" },
  });

  useEffect(() => {
    loadRoll();
  }, [rollId]);

  useEffect(() => {
    if (roll?.videoUrl && player) {
      player.play();
      setIsPlaying(true);
    }
  }, [roll, player]);

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

  const loadRoll = async () => {
    try {
      setIsLoading(true);
      const response = await rollsApi.getById(rollId);
      if (response.success && response.data) {
        setRoll(response.data);
        setIsLiked(response.data.isLiked || false);
        setIsSaved(response.data.isSaved || false);
        setLikes(response.data.likes || 0);
        setSaves(response.data.saves || 0);
      }
    } catch (err) {
      console.error('Error loading roll:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const Action = ({ icon, count, onPress, loading }: any) => (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
      <View style={styles.actionIcon}>
        {loading ? <ActivityIndicator color={colors.white} /> : <Ionicons name={icon} size={24} color={colors.white} />}
      </View>
      {typeof count === "number" && <Text style={styles.actionText}>{count}</Text>}
    </TouchableOpacity>
  );

  if (isLoading || !roll) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
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

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>

      {!isPlaying && (
        <View style={styles.playOverlay}>
          <Ionicons name="play" size={40} color={colors.white} />
        </View>
      )}

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.65)"]}
        style={[styles.overlay, { paddingBottom: spacing.lg }]}
      >
        <View style={styles.bottomRow}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={styles.shopInfo}
              onPress={() => router.push(`/shop/${roll.shopId}`)}
            >
              <Image source={{ uri: roll.shopLogo }} style={styles.shopLogo} />
              <Text style={styles.shopName}>{roll.shopName}</Text>
            </TouchableOpacity>
            <Text style={styles.caption}>{roll.caption}</Text>
          </View>

          <View style={styles.actions}>
            <Action icon={isLiked ? "heart" : "heart-outline"} count={likes || 0} onPress={handleLike} loading={isLiking} />
            <Action icon="chatbubble-outline" count={roll.commentsCount || 0} onPress={() => router.push(`/roll-comments/${roll.id}`)} />
            <Action icon="share-outline" onPress={handleShare} />
            <Action icon={isSaved ? "bookmark" : "bookmark-outline"} count={saves || 0} onPress={handleSave} loading={isSaving} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}