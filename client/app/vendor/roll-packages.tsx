import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useColors,
  useCommonStyles,
  spacing,
  typography,
  borderRadius,
} from "../../styles/commonStyles";
import { useAuth } from "../../hooks/useAuth";
import { vendorApi, handleApiError } from "../../services/api";


const packages = [
  {
    id: "25",
    price: 25,
    rolls: 5,
    bonus: 0,
    popular: false,
  },
  {
    id: "50",
    price: 50,
    rolls: 10,
    bonus: 2,
    popular: false,
  },
  {
    id: "100",
    price: 100,
    rolls: 20,
    bonus: 5,
    popular: true,
  },
  {
    id: "500",
    price: 500,
    rolls: 100,
    bonus: 30,
    popular: false,
  },
];

export default function ReelPackagesScreen() {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const { user, isVendor } = useAuth();

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
    title: {
      ...typography.h2,
      color: colors.text,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    currentBalance: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    balanceTitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    balanceAmount: {
      ...typography.h1,
      color: colors.primary,
      fontWeight: 'bold',
      marginBottom: spacing.sm,
    },
    balanceSubtext: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    note: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
    },
    noteText: {
      ...typography.body,
      color: colors.text,
      lineHeight: 22,
    },
  });

  useEffect(() => {
    loadVendorProfile();
  }, []);

  const loadVendorProfile = async () => {
    try {
      const response = await vendorApi.getProfile();
      if (response.success && response.data) {
        setVendorProfile(response.data);
      }
    } catch (err) {
      console.error("Error loading vendor profile:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handlePurchasePackage = async (
    packageType: "25" | "50" | "100" | "500"
  ) => {
    if (!user || !isVendor()) {
      Alert.alert("Error", "Only vendors can purchase roll packages");
      return;
    }

    const packageInfo = packages.find((p) => p.id === packageType);
    if (!packageInfo) return;

    Alert.alert(
      "Confirm Purchase",
      `Purchase ${packageInfo.rolls}${packageInfo.bonus > 0 ? ` + ${packageInfo.bonus} bonus` : ""} rolls for $${packageInfo.price}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Purchase",
          onPress: async () => {
            setIsLoading(true);
            try {
              const response = await vendorApi.purchaseRollPackage(packageType);
              if (response.success) {
                console.log("Package purchased:", response.data);
                Alert.alert("Success", "Roll package purchased successfully!");
                // Reload profile to update available rolls
                loadVendorProfile();
              } else {
                Alert.alert(
                  "Error",
                  response.message || "Failed to purchase package"
                );
              }
            } catch (error) {
              console.error("Purchase error:", error);
              const errorMessage = handleApiError(error);
              Alert.alert("Error", errorMessage);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!user || !isVendor()) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Roll Packages</Text>
        </View>
        <View
          style={[
            styles.content,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text style={styles.subtitle}>
            Only vendors can access roll packages
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoadingProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Roll Packages</Text>
        </View>
        <View
          style={[
            styles.content,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.subtitle, { marginTop: spacing.md }]}>
            Loading...
          </Text>
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
        <Text style={styles.title}>Roll Packages</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>
          Roll packages are coming soon! For now, share the app to earn free rolls.
        </Text>

        <View style={styles.currentBalance}>
          <Text style={styles.balanceTitle}>Available Rolls</Text>
          <Text style={styles.balanceAmount}>
            {vendorProfile?.availableRolls || 0}
          </Text>
          <Text style={styles.balanceSubtext}>
            Share the app daily to earn more rolls!
          </Text>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            <Text style={{ fontWeight: "600" }}>Coming Soon:</Text> Premium roll packages will be available for purchase.{"\n\n"}
            <Text style={{ fontWeight: "600" }}>For Now:</Text> Share the app with friends to earn 1 free roll per day. Go to Account → Share & Earn Rolls to get started!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
