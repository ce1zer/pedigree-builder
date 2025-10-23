/**
 * Utility functions for date formatting and age calculation
 */

/**
 * Format a date string to a readable format
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "12/25/2023")
 */
export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Calculate age in years from birth date
 * @param birthDate - ISO date string of birth
 * @returns Age in years
 */
export const getAge = (birthDate: string): number => {
  try {
    const today = new Date();
    const birth = new Date(birthDate);
    
    // Check if birth date is valid
    if (isNaN(birth.getTime())) {
      throw new Error('Invalid birth date');
    }
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return Math.max(0, age); // Ensure non-negative age
  } catch (error) {
    console.error('Error calculating age:', error);
    return 0;
  }
};

/**
 * Format a date string to a more detailed format
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "December 25, 2023")
 */
export const formatDateDetailed = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting detailed date:', error);
    return 'Invalid Date';
  }
};

/**
 * Get relative time string (e.g., "2 days ago", "1 week ago")
 * @param dateString - ISO date string
 * @returns Relative time string
 */
export const getRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    
    return `${Math.floor(diffInDays / 365)} years ago`;
  } catch (error) {
    console.error('Error calculating relative time:', error);
    return 'Unknown';
  }
};