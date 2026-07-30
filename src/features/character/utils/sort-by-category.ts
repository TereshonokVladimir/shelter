import type { CharacteristicCategory } from '@/types/common'
import { CHARACTERISTIC_CATEGORIES } from '@/lib/constants'

export function sortByCategory<T extends { category: CharacteristicCategory }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      CHARACTERISTIC_CATEGORIES.indexOf(a.category) - CHARACTERISTIC_CATEGORIES.indexOf(b.category),
  )
}
