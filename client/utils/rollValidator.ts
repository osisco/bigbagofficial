
import { Roll } from '../types';

/**
 * Validates if a roll object has all required properties
 */
export const isValidReel = (roll: any): roll is Roll => {
  if (!roll || typeof roll !== 'object') {
    console.error('Roll validation failed: not an object', roll);
    return false;
  }

  if (typeof roll.id !== 'string' || roll.id.length === 0) {
    console.error('Roll validation failed: invalid id', roll);
    return false;
  }

  if (typeof roll.videoUrl !== 'string' || roll.videoUrl.length === 0) {
    console.error('Roll validation failed: invalid videoUrl', roll);
    return false;
  }

  if (typeof roll.shopId !== 'string' || roll.shopId.length === 0) {
    console.error('Roll validation failed: invalid shopId', roll);
    return false;
  }

  if (typeof roll.shopName !== 'string') {
    console.error('Roll validation failed: invalid shopName', roll);
    return false;
  }

  return true;
};

/**
 * Validates an array of rolls and returns only valid ones
 */
export const validateReels = (rolls: any[]): Roll[] => {
  if (!Array.isArray(rolls)) {
    console.error('validateReels: input is not an array', rolls);
    return [];
  }

  const validRolls = rolls.filter(isValidReel);
  const invalidCount = rolls.length - validRolls.length;

  if (invalidCount > 0) {
    console.warn(`Found ${invalidCount} invalid rolls out of ${rolls.length} total`);
  }

  return validRolls;
};

/**
 * Safely gets a roll by ID with validation
 */
export const getReelById = (rolls: Roll[], id: string): Roll | null => {
  if (!Array.isArray(rolls) || typeof id !== 'string') {
    console.error('getReelById: invalid parameters', { rolls, id });
    return null;
  }

  const roll = rolls.find(r => r.id === id);
  
  if (roll && !isValidReel(roll)) {
    console.error('getReelById: found roll but it is invalid', roll);
    return null;
  }

  return roll || null;
};

/**
 * Filters rolls by category with validation
 */
export const filterReelsByCategory = (
  rolls: Roll[],
  category: string
): Roll[] => {
  if (!Array.isArray(rolls)) {
    console.error('filterReelsByCategory: rolls is not an array', rolls);
    return [];
  }

  if (typeof category !== 'string') {
    console.error('filterReelsByCategory: category is not a string', category);
    return rolls;
  }

  if (category === 'all') {
    return rolls;
  }

  return rolls.filter(roll => {
    if (!isValidReel(roll)) {
      return false;
    }
    return roll.category === category;
  });
};
