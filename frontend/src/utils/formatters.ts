/**
 * Format height from centimeters to meters and feet/inches
 * @param cm - Height in centimeters
 * @returns Formatted string like "1.70 m (5'7")"
 */
export function formatHeight(cm: number | null | undefined): string {
  if (!cm || cm <= 0) return '';
  
  const meters = (cm / 100).toFixed(2);
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  
  return `${meters} m (${feet}'${inches}")`;
}

/**
 * Parse height input - accepts cm, meters, or feet'inches format
 * @param input - Height as string or number
 * @returns Height in centimeters
 */
export function parseHeightInput(input: string | number): number | null {
  if (typeof input === 'number') return input;
  if (!input) return null;
  
  const str = input.toString().trim();
  
  // Check for feet'inches format (e.g., "5'7" or 5'7)
  const feetInchesMatch = str.match(/^(\d+)'(\d+)"?$/);
  if (feetInchesMatch) {
    const feet = parseInt(feetInchesMatch[1]);
    const inches = parseInt(feetInchesMatch[2]);
    const totalInches = feet * 12 + inches;
    return Math.round(totalInches * 2.54);
  }
  
  // Check for meters format (e.g., "1.70" or 1.70)
  const metersMatch = str.match(/^(\d+\.?\d*)$/);
  if (metersMatch) {
    const value = parseFloat(metersMatch[1]);
    // If value is less than 3, assume it's in meters
    if (value < 3) {
      return Math.round(value * 100);
    }
    // Otherwise assume it's in cm
    return Math.round(value);
  }
  
  return null;
}
