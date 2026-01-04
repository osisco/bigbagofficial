import { VendorProfile } from '../types';

export interface RollConsumptionStatus {
  canUpload: boolean;
  availableRolls: number;
  totalRollsUsed: number;
  message?: string;
  requiresPackagePurchase: boolean;
}

export const checkRollConsumptionStatus = (vendorProfile: VendorProfile | null): RollConsumptionStatus => {
  if (!vendorProfile) {
    return {
      canUpload: false,
      availableRolls: 0,
      totalRollsUsed: 0,
      message: 'Vendor profile not found. Please create a vendor profile first.',
      requiresPackagePurchase: true,
    };
  }

  if (!vendorProfile.shopId) {
    return {
      canUpload: false,
      availableRolls: vendorProfile.availableRolls,
      totalRollsUsed: vendorProfile.totalRollsUsed,
      message: 'You must have an approved shop to upload rolls. Please create a shop request first.',
      requiresPackagePurchase: false,
    };
  }

  if (vendorProfile.availableRolls <= 0) {
    return {
      canUpload: false,
      availableRolls: 0,
      totalRollsUsed: vendorProfile.totalRollsUsed,
      message: 'You have no available rolls. Please purchase a roll package to continue uploading.',
      requiresPackagePurchase: true,
    };
  }

  return {
    canUpload: true,
    availableRolls: vendorProfile.availableRolls,
    totalRollsUsed: vendorProfile.totalRollsUsed,
    message: `You have ${vendorProfile.availableRolls} roll${vendorProfile.availableRolls === 1 ? '' : 's'} available.`,
    requiresPackagePurchase: false,
  };
};

export const getRollPackageRecommendation = (totalRollsUsed: number): string => {
  if (totalRollsUsed < 10) {
    return '50'; // Basic package for new users
  } else if (totalRollsUsed < 50) {
    return '100'; // Pro package for regular users
  } else {
    return '500'; // Business package for heavy users
  }
};

export const formatRollCount = (count: number): string => {
  if (count === 0) return 'No rolls';
  if (count === 1) return '1 roll';
  return `${count} rolls`;
};