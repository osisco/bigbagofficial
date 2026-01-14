import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useColors,
  useCommonStyles,
  spacing,
  typography,
  borderRadius,
} from "../../styles/commonStyles";
import { Roll } from "../../types";
import RollCard from "../../components/RollCard";
import { router, useFocusEffect } from "expo-router";
import { useRollFeed } from "../../hooks/useRollFeed";
import { rollsApi, handleApiError } from "../../services/api";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const categories = [
  { id: "upload", name: "", icon: "add" },
  { id: "all", name: "All", icon: "apps-outline" },
  { id: "men", name: "Men", icon: "man-outline" },
  { id: "women", name: "Women", icon: "woman-outline" },
  { id: "kids", name: "Kids", icon: "happy-outline" },
];

// Validate roll data to prevent errors
const isValidReel = (roll: any): roll is Roll => {
  return (
    roll &&
    typeof roll === "object" &&
    typeof roll.id === "string" &&
    roll.id.length > 0 &&
    typeof roll.videoUrl === "string" &&
    roll.videoUrl.length > 0
  );
};

const RollsScreen = () => {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const insets = useSafeAreaInsets();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const {
    rolls,
    loading: isLoading,
    error,
    currentIndex: feedCurrentIndex,
    onViewableItemsChanged: feedOnViewableItemsChanged,
    refresh
  } = useRollFeed({ category: selectedCategory });
  const [currentRollIndex, setCurrentRollIndex] = useState<number>(0);
  const [isTabFocused, setIsTabFocused] = useState<boolean>(false);
  const flatListRef = useRef<FlatList>(null);
  const rollRefs = useRef<Record<string, any>>({});
  const playingIndexRef = useRef<number | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [categoriesHeight, setCategoriesHeight] = useState(0);
  const [rollHeight, setRollHeight] = useState(Math.max(200, SCREEN_HEIGHT - 200));
  

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.black,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.background,
    },
    uploadCategoryButton: {
      backgroundColor: colors.primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 0,
    },
    categoriesContainer: {
      backgroundColor: colors.background,
      paddingVertical: spacing.sm,
    },
    categoriesList: {
      paddingHorizontal: spacing.lg,
    },
    categoryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginRight: spacing.sm,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
    },
    categoryButtonActive: {
      backgroundColor: colors.primary,
    },
    categoryText: {
      ...typography.caption,
      color: colors.text,
      marginLeft: spacing.xs,
    },
    categoryTextActive: {
      color: colors.white,
    },
    rollsContainer: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.md,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.background,
    },
    errorText: {
      ...typography.body,
      color: colors.error,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    retryText: {
      ...typography.button,
      color: colors.primary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.background,
    },
    emptyStateText: {
      ...typography.h3,
      color: colors.text,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    emptyStateSubtext: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  // Create stable references for viewability config and callback
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 300,
  }).current;

  // Video player management with debouncing
  const pauseAllVideos = useCallback(() => {
    Object.values(rollRefs.current).forEach(ref => {
      if (ref?.pause) {
        try { ref.pause(); } catch (e) { console.warn('pause failed', e); }
      }
    });
    playingIndexRef.current = null;
  }, []);

  const playVideoAtIndex = useCallback((index: number) => {
    if (index < 0 || index >= rolls.length) return;
    
    const roll = rolls[index];
    if (!roll?.id) return;
    
    const ref = rollRefs.current[roll.id];
    if (ref?.play) {
      try {
        ref.play();
        playingIndexRef.current = index;
      } catch (e) {
        console.warn('play failed', e);
      }
    }
  }, [rolls]);

  // Debounced video control
  const videoControlTimeout = useRef<NodeJS.Timeout>();
  const handleVideoChange = useCallback((newIndex: number) => {
    if (videoControlTimeout.current) {
      clearTimeout(videoControlTimeout.current);
    }
    
    videoControlTimeout.current = setTimeout(() => {
      if (playingIndexRef.current !== newIndex) {
        pauseAllVideos();
        playVideoAtIndex(newIndex);
      }
    }, 100);
  }, [pauseAllVideos, playVideoAtIndex]);

  // Recalculate roll height when layout or insets change
  useEffect(() => {
  if (headerHeight === 0 || categoriesHeight === 0) return;

 const visibleHeight =
  SCREEN_HEIGHT -
  categoriesHeight -
  insets.top;


  setRollHeight(Math.max(200, visibleHeight));
}, [headerHeight, categoriesHeight, insets.top, insets.bottom]);

  // Tab focus management
  useFocusEffect(
    useCallback(() => {
      setIsTabFocused(true);
      if (rolls.length > 0) {
        playVideoAtIndex(currentRollIndex);
      }
      return () => {
        setIsTabFocused(false);
        pauseAllVideos();
      };
    }, [rolls.length, currentRollIndex, playVideoAtIndex, pauseAllVideos])
  );

  // Combined viewable items handler
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    feedOnViewableItemsChanged({ viewableItems });
    
    if (viewableItems && viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== null && newIndex !== undefined && newIndex !== currentRollIndex) {
        setCurrentRollIndex(newIndex);
        handleVideoChange(newIndex);
      }
    }
  }).current;

  // Momentum scroll end for final video control
  const onMomentumScrollEnd = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y || 0;
    const newIndex = Math.round(offsetY / rollHeight);
    
    if (newIndex !== playingIndexRef.current) {
      handleVideoChange(newIndex);
    }
  }, [rollHeight, handleVideoChange]);

  // Category change handler
  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentRollIndex(0);
    pauseAllVideos();
  }, [pauseAllVideos]);

  const handleUploadPress = useCallback(() => {
    router.push("/upload-roll");
  }, []);

  const renderCategory = useCallback(
    ({ item }: { item: (typeof categories)[0] }) => (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.categoryButton,
          selectedCategory === item.id && styles.categoryButtonActive,
          item.id === 'upload' && styles.uploadCategoryButton,
        ]}
        onPress={() => {
          if (item.id === 'upload') {
            router.push('/upload-roll');
          } else {
            handleCategoryChange(item.id);
          }
        }}
      >
        <Ionicons
          name={item.icon as any}
          size={16}
          color={selectedCategory === item.id ? colors.white : colors.white}
        />
        {item.name && (
          <Text
            style={[
              styles.categoryText,
              selectedCategory === item.id && styles.categoryTextActive,
            ]}
          >
            {item.name}
          </Text>
        )}
      </TouchableOpacity>
    ),
    [selectedCategory]
  );

  const renderRoll = useCallback(
    ({ item, index }: { item: Roll; index: number }) => {
      if (!isValidReel(item)) {
        console.log("Invalid roll item at index:", index);
        return (
          <View style={{ height: rollHeight, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.black }}>
            <Text style={{ color: colors.white }}>Invalid roll data</Text>
          </View>
        );
      }

      const isActiveRoll = isTabFocused && index === currentRollIndex;
      console.log(`Rendering roll ${index}, isActive: ${isActiveRoll}, videoUrl: ${item.videoUrl}`);

      return (
        <RollCard
          key={item.id}
          ref={(r) => { if (item?.id) rollRefs.current[item.id] = r; }}
          roll={item}
          index={index}
          isActive={isActiveRoll}
          height={rollHeight}
          width={SCREEN_WIDTH}
        />
      );
    },
    [isTabFocused, currentRollIndex]
  );

  const keyExtractor = useCallback((item: Roll, index: number) => {
    return item?.id ? `roll-${item.id}` : `roll-index-${index}`;
  }, []);

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: rollHeight,
      offset: rollHeight * index,
      index,
    }),
    [rollHeight]
  );

  const onScrollToIndexFailed = useCallback(
    (info: any) => {
      console.log("Scroll to index failed:", info);
      const wait = new Promise((resolve) => setTimeout(resolve, 500));
      wait.then(() => {
        if (flatListRef.current && rolls.length > 0) {
          const targetIndex = Math.min(info.index, rolls.length - 1);
          flatListRef.current?.scrollToIndex({
            index: targetIndex,
            animated: false,
          });
        }
      });
    },
    [rolls.length]
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyState}>
        <Ionicons
          name="play-circle-outline"
          size={80}
          color={colors.textSecondary}
        />
        <Text style={styles.emptyStateText}>No rolls found</Text>
        <Text style={styles.emptyStateSubtext}>
          {selectedCategory === "all"
            ? "Be the first to upload a roll!"
            : `No rolls in ${categories.find((c) => c.id === selectedCategory)?.name} category yet.`}
        </Text>
      </View>
    ),
    [selectedCategory]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
          <Text style={styles.title}>Rolls</Text>
          <TouchableOpacity
            style={styles.uploadButton }
            onPress={handleUploadPress}
          >
            <Ionicons name="add" size={16} color={colors.white} />
            <Text style={styles.uploadButtonText}>Upload</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading rolls...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
          <Text style={styles.title}>Rolls</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadPress}
          >
            <Ionicons name="add" size={16} color={colors.white} />
            <Text style={styles.uploadButtonText}>Upload</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={refresh}>
            Tap to retry
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.categoriesContainer} onLayout={(e) => setCategoriesHeight(e.nativeEvent.layout.height)}>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item, index) => `category-${item.id || index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

    <View style={styles.rollsContainer}>

        {rolls.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={rolls}
            renderItem={renderRoll}
            keyExtractor={keyExtractor}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={rollHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            onViewableItemsChanged={onViewableItemsChanged}
            onMomentumScrollEnd={onMomentumScrollEnd}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={getItemLayout}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            removeClippedSubviews={true}
            onScrollToIndexFailed={onScrollToIndexFailed}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </SafeAreaView>
  );
};

export default RollsScreen;
