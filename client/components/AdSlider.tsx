
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useColors, useCommonStyles, spacing, typography, borderRadius } from '../styles/commonStyles';
import { Ad } from '../types';
import { adsApi, handleApiError } from '../services/api';

const { width } = Dimensions.get('window');
const AD_WIDTH = width - spacing.lg * 2;
const AD_HEIGHT = 180;
const ITEM_WIDTH = AD_WIDTH + spacing.md; 

interface AdSliderProps {
  onLoadComplete?: () => void;
}

const AdSlider: React.FC<AdSliderProps> = ({ onLoadComplete }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const colors = useColors();
  const commonStyles = useCommonStyles();

  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.lg,
    },
    listContent: {
      paddingHorizontal: 0,
    },
    adContainer: {
      width: AD_WIDTH,
      height: AD_HEIGHT,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
    },
    adImage: {
      width: '100%',
      height: '100%',
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      marginHorizontal: 4,
    },
    activeDot: {
      backgroundColor: colors.primary,
      width: 24,
    },
    loadingContainer: {
      height: AD_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    skeletonContainer: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    skeletonAd: {
      width: AD_WIDTH,
      height: AD_HEIGHT,
      backgroundColor: colors.border,
      borderRadius: borderRadius.lg,
      opacity: 0.6,
    },
  });

  useEffect(() => {
    const loadAds = async () => {
      try {
        const response = await adsApi.getActive();
        
        if (response.success && response.data) {
          setAds(response.data);
        }
      } catch (err) {
        console.error('Error loading ads:', err);
      } finally {
        setIsLoading(false);
        onLoadComplete?.();
      }
    };

    const timer = setTimeout(loadAds, 200);
    return () => clearTimeout(timer);
  }, [onLoadComplete]);

  useEffect(() => {
    if (ads.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % ads.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [ads.length]);

  const handleAdPress = useCallback((ad: Ad) => {
    console.log('Ad pressed:', ad.title);
    if (ad.linkType === 'internal' && ad.linkUrl) {
      router.push(ad.linkUrl as any);
    } else if (ad.linkType === 'external' && ad.linkUrl) {
      // Handle external link
      console.log('External link:', ad.linkUrl);
    }
  }, []);

  const renderAd = useCallback(({ item }: { item: Ad }) => (
    <View style={{ width: width, justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity
        style={styles.adContainer}
        onPress={() => handleAdPress(item)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.adImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    </View>
  ), [handleAdPress]);

  const renderDot = useCallback((index: number) => (
    <View
      key={`dot-${index}`}
      style={[
        styles.dot,
        index === currentIndex && styles.activeDot,
      ]}
    />
  ), [currentIndex]);

  if (isLoading) {
    return (
      <View style={styles.skeletonContainer}>
        <View style={styles.skeletonAd} />
      </View>
    );
  }

  if (ads.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={ads}
        renderItem={renderAd}
        keyExtractor={(item, index) => item.id || `ad-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={width}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />
      {ads.length > 1 && (
        <View style={styles.pagination}>
          {ads.map((_, index) => renderDot(index))}
        </View>
      )}
    </View>
  );
};

export default AdSlider;
