import { apiClient } from '@/lib/api/client';
import {
  buildMenuGroupsFromTree,
  type MenuGroupConfig,
  type NavigationNodeDto,
} from './menu.config';


let menuTreePromise: Promise<NavigationNodeDto[] | null> | null = null;


async function fetchMenuTreeOnce(): Promise<NavigationNodeDto[] | null> {
  if (menuTreePromise) {
    return menuTreePromise;
  }

  menuTreePromise = apiClient
    .get<NavigationNodeDto[]>('/api/MenuModels/tree')
    .then((response) => {
      if (Array.isArray(response) && response.length > 0) {
        return response;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      menuTreePromise = null;
    });

  return menuTreePromise;
}

/**
 * Gets the menu group configuration from the backend database.
 * Returns an empty array if the database connection fails or the tree is empty.
 */
export async function getMenuGroupsCached(forceRefresh = false): Promise<MenuGroupConfig[]> {
  const CACHE_KEY = 'menu_tree_cache';
  
  // Refresh from DB every time for now to ensure consistency
  const tree = await fetchMenuTreeOnce();
  
  if (tree && tree.length > 0) {
    const result = buildMenuGroupsFromTree(tree);
    
    // Optional: Cache in local storage for performance, but keep it fresh for now
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ 
        data: result, 
        timestamp: Date.now() 
      }));
    } catch (e) {
      // Ignore storage errors
    }
    
    return result;
  }

  // If DB fails, return empty list (no fallback to hardcoded data)
  return [];
}
