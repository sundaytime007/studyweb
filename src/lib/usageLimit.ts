// Usage limit management for features

interface UsageRecord {
  count: number
  date: string
}

interface UsageLimits {
  [featureId: string]: UsageRecord
}

const DAILY_LIMIT = 200
const STORAGE_KEY = 'studyweb_usage_limits'

/**
 * Get current usage for a feature
 */
export function getUsage(featureId: string): { count: number; remaining: number } {
  const usageData = loadUsageData()
  const today = new Date().toISOString().split('T')[0]
  const featureUsage = usageData[featureId]

  // Reset if date is different (new day)
  if (!featureUsage || featureUsage.date !== today) {
    usageData[featureId] = { count: 0, date: today }
    saveUsageData(usageData)
    return { count: 0, remaining: DAILY_LIMIT }
  }

  return {
    count: featureUsage.count,
    remaining: Math.max(0, DAILY_LIMIT - featureUsage.count)
  }
}

/**
 * Check if usage is within limit
 */
export function checkUsageLimit(featureId: string): boolean {
  const { remaining } = getUsage(featureId)
  return remaining > 0
}

/**
 * Increment usage count
 */
export function incrementUsage(featureId: string): boolean {
  const usageData = loadUsageData()
  const today = new Date().toISOString().split('T')[0]
  const featureUsage = usageData[featureId]

  // Reset if date is different (new day)
  if (!featureUsage || featureUsage.date !== today) {
    usageData[featureId] = { count: 1, date: today }
    saveUsageData(usageData)
    return true
  }

  // Check if within limit
  if (featureUsage.count >= DAILY_LIMIT) {
    return false
  }

  // Increment count
  usageData[featureId] = {
    ...featureUsage,
    count: featureUsage.count + 1
  }
  saveUsageData(usageData)
  return true
}

/**
 * Load usage data from localStorage
 */
function loadUsageData(): UsageLimits {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

/**
 * Save usage data to localStorage
 */
function saveUsageData(data: UsageLimits): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Reset usage for all features (for testing)
 */
export function resetUsage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage errors
  }
}
