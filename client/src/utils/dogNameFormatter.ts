import { Dog } from '@/types';

// Helper function to get kennel name from dog
const getKennelName = (dog: Dog | null, type: 'primary' | 'secondary'): string => {
  if (!dog) return '';
  
  if (type === 'primary') {
    if (dog.primary_kennel_name) return dog.primary_kennel_name;
    if (typeof dog.primary_kennel === 'string') return dog.primary_kennel;
    if (dog.primary_kennel && typeof dog.primary_kennel === 'object') {
      const kennel = dog.primary_kennel as { name?: string };
      return kennel.name || '';
    }
  } else {
    if (dog.secondary_kennel_name) return dog.secondary_kennel_name;
    if (typeof dog.secondary_kennel === 'string') return dog.secondary_kennel;
    if (dog.secondary_kennel && typeof dog.secondary_kennel === 'object') {
      const kennel = dog.secondary_kennel as { name?: string };
      return kennel.name || '';
    }
  }
  return '';
};

/**
 * Formats a dog's display name with champion prefix and kennel names
 * Format: "Champion Primary Kennel Dog Name of Secondary Kennel"
 * Examples:
 * - "Ch. Golden Kennels Max of Silver Kennels"
 * - "Gr. Ch. Golden Kennels Max"
 * - "Max" (if no champion and no kennels)
 */
export const formatDogDisplayName = (dog: Dog | null): string => {
  if (!dog || !dog.dog_name) return '';

  const parts: string[] = [];
  
  // Add champion prefix
  if (dog.champion === 'ch') {
    parts.push('Ch.');
  } else if (dog.champion === 'dual_ch') {
    parts.push('Dual Ch.');
  } else if (dog.champion === 'gr_ch') {
    parts.push('Gr. Ch.');
  } else if (dog.champion === 'dual_gr_ch') {
    parts.push('Dual Gr. Ch.');
  } else if (dog.champion === 'nw_gr_ch') {
    parts.push('NW. Gr. Ch.');
  } else if (dog.champion === 'inw_gr_ch') {
    parts.push('INW. Gr. Ch.');
  }
  
  // Add primary kennel
  const primaryKennel = getKennelName(dog, 'primary');
  if (primaryKennel) {
    parts.push(primaryKennel);
  }
  
  // Add dog name
  parts.push(dog.dog_name);
  
  // Add secondary kennel with "of" prefix
  const secondaryKennel = getKennelName(dog, 'secondary');
  if (secondaryKennel) {
    parts.push('of', secondaryKennel);
  }
  
  return parts.join(' ');
};


