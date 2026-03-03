import { useState, useCallback } from 'react';

export function useIncomeCategoryAccordion() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback((category: string) => {
    return expandedCategories.has(category);
  }, [expandedCategories]);

  return { expandedCategories, setExpandedCategories, toggleCategory, isExpanded };
}
