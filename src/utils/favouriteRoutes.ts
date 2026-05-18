// src/utils/favouriteRoutes.ts

// This type defines what one saved favourite route looks like.
// It stores the origin, destination, and the time the route was saved.
export type FavouriteRoute = {
  id: string;
  origin: string;
  destination: string;
  createdAt: string;
};

// This is the localStorage key used by HushNav.
// All favourite routes will be saved under this key in the user's browser.
const FAVOURITE_ROUTES_KEY = "hushnav_favourite_routes";

/**
 * Safely creates a unique id for each saved route.
 * crypto.randomUUID() is preferred, but the fallback helps avoid issues
 * in older browsers or test environments.
 */
function createRouteId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `route-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Retrieves all favourite routes from localStorage.
 * If there are no saved routes, it returns an empty array.
 * If the stored data is corrupted, it also returns an empty array.
 */
export function getFavouriteRoutes(): FavouriteRoute[] {
  const storedRoutes = localStorage.getItem(FAVOURITE_ROUTES_KEY);

  if (!storedRoutes) {
    return [];
  }

  try {
    const parsedRoutes = JSON.parse(storedRoutes);

    if (!Array.isArray(parsedRoutes)) {
      return [];
    }

    return parsedRoutes as FavouriteRoute[];
  } catch {
    return [];
  }
}

/**
 * Saves a new favourite route to localStorage.
 * It prevents duplicate origin and destination pairs from being saved twice.
 */
export function saveFavouriteRoute(
  origin: string,
  destination: string,
): {
  routes: FavouriteRoute[];
  status: "saved" | "duplicate";
} {
  const trimmedOrigin = origin.trim();
  const trimmedDestination = destination.trim();

  const currentRoutes = getFavouriteRoutes();

  const alreadyExists = currentRoutes.some(
    (route) =>
      route.origin.trim().toLowerCase() === trimmedOrigin.toLowerCase() &&
      route.destination.trim().toLowerCase() === trimmedDestination.toLowerCase(),
  );

  if (alreadyExists) {
    return {
      routes: currentRoutes,
      status: "duplicate",
    };
  }

  const newRoute: FavouriteRoute = {
    id: createRouteId(),
    origin: trimmedOrigin,
    destination: trimmedDestination,
    createdAt: new Date().toISOString(),
  };

  const updatedRoutes = [newRoute, ...currentRoutes];

  localStorage.setItem(FAVOURITE_ROUTES_KEY, JSON.stringify(updatedRoutes));

  return {
    routes: updatedRoutes,
    status: "saved",
  };
}

/**
 * Removes a favourite route from localStorage.
 * This is useful if Emily no longer wants a saved route.
 */
export function removeFavouriteRoute(routeId: string): FavouriteRoute[] {
  const currentRoutes = getFavouriteRoutes();

  const updatedRoutes = currentRoutes.filter((route) => route.id !== routeId);

  localStorage.setItem(FAVOURITE_ROUTES_KEY, JSON.stringify(updatedRoutes));

  return updatedRoutes;
}