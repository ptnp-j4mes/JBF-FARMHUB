'use client';

import { useCallback, useState } from 'react';
import { USER_ASSIGNMENT_SECTION_TABS } from '../components/UserAssignmentSectionLayout';

export type UserAssignmentTabKey = (typeof USER_ASSIGNMENT_SECTION_TABS)[number]['key'];

export function useUserAssignmentTabs(initialTabKey: UserAssignmentTabKey = 'assignment') {
  const [activeTabKey, setActiveTabKey] = useState<UserAssignmentTabKey>(initialTabKey);

  const handleTabChange = useCallback((nextKey: string) => {
    const matchedTab = USER_ASSIGNMENT_SECTION_TABS.find((tab) => tab.key === nextKey);
    if (matchedTab) {
      setActiveTabKey(matchedTab.key);
    }
  }, []);

  return {
    activeTabKey,
    setActiveTabKey,
    handleTabChange,
  } as const;
}
