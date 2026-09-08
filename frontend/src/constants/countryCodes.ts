// @ts-ignore
import countryCodes from 'country-codes-list';

export interface CountryType {
  code: string;
  label: string;
  phone: string;
  suggested?: boolean;
}

// Define priority countries to show at the top
const SUGGESTED_CODES = ['MX', 'US', 'ES', 'AR', 'CO', 'CL', 'PE'];

// Get raw data from library
// Format: { "MX": "Mexico|+52", ... }
const rawCountries = countryCodes.customList('countryCode', '{countryNameEn}|{countryCallingCode}');

// Transform to CountryType array
const allCountries: CountryType[] = Object.entries(rawCountries).map(([code, value]) => {
  const [label, phone] = (value as string).split('|');
  return {
    code,
    label,
    phone: phone.replace('+', ''), // Remove + if present, though library usually gives just number
    suggested: SUGGESTED_CODES.includes(code),
  };
});

// Sort: Suggested first, then alphabetical by label
export const COUNTRY_CODES: CountryType[] = allCountries.sort((a, b) => {
  if (a.suggested && !b.suggested) return -1;
  if (!a.suggested && b.suggested) return 1;
  return a.label.localeCompare(b.label);
});
