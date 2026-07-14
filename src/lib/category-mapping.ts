export const CATEGORY_MAPPINGS: Record<string, string[]> = {
  "Events & Venues": [
    "Auditorium",
    "Banquet hall",
    "Convention center",
    "Event",
    "Event venue",
    "Festival hall",
    "Function room facility",
    "Wedding venue",
  ],
  "Health & Medical": [
    "Dental",
    "Diabetes Care",
    "Physiotherapy",
  ],
  "Hospitality & Travel": [
    "Guest house",
    "Hospitality",
    "Hotel",
    "Lodging",
    "Resort hotel",
  ],
  "Real Estate & Housing": [
    "Housing complex",
    "Housing society",
    "Real Estate",
  ],
  "Community & Religion": [
    "Community",
    "Community center",
    "Cultural center",
    "Hindu temple",
    "Religious",
    "Youth organization",
  ],
  "Entertainment & Sports": [
    "Amusement park",
    "Club",
    "Recreation",
    "Sports",
    "Sports club",
  ],
  "Business & Services": [
    "Corporate office",
    "Jewelry store",
    "Wedding photographer",
    "Wedding planner",
    "Wedding service",
  ],
};

// Flatten to reverse mapping for quick lookup
const REVERSE_MAPPING: Record<string, string> = {};
for (const [broadCategory, granularCategories] of Object.entries(CATEGORY_MAPPINGS)) {
  for (const granular of granularCategories) {
    REVERSE_MAPPING[granular.toLowerCase()] = broadCategory;
  }
}

/**
 * Returns the broad category for a given granular category.
 * If no mapping exists, it returns the original category or "Other".
 */
export function getBroadCategory(granularCategory: string): string {
  if (!granularCategory) return "Other";
  return REVERSE_MAPPING[granularCategory.toLowerCase()] || "Other";
}

/**
 * Returns all granular categories that belong to a given broad category.
 */
export function getGranularCategories(broadCategory: string): string[] {
  return CATEGORY_MAPPINGS[broadCategory] || [];
}

/**
 * Converts a list of granular categories into a unique list of broad categories.
 */
export function getUniqueBroadCategories(granularCategories: string[]): string[] {
  const broadSet = new Set<string>();
  for (const cat of granularCategories) {
    broadSet.add(getBroadCategory(cat));
  }
  return Array.from(broadSet).sort();
}
