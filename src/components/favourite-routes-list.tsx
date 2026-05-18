// src/components/favourite-routes-list.tsx

import { MapPin, Navigation, Star, Trash2 } from "lucide-react";
import type { FavouriteRoute } from "../utils/favouriteRoutes";

type FavouriteRoutesListProps = {
  favouriteRoutes: FavouriteRoute[];

  // Runs when Emily clicks a saved route.
  // This will auto-fill the origin and destination fields in map.tsx.
  onSelectRoute: (route: FavouriteRoute) => void;

  // Runs when Emily removes a saved route from favourites.
  onRemoveRoute: (routeId: string) => void;
};

export function FavouriteRoutesList({
  favouriteRoutes,
  onSelectRoute,
  onRemoveRoute,
}: FavouriteRoutesListProps) {
  if (favouriteRoutes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/90 p-4 text-center">
        <Star className="mx-auto mb-2 h-5 w-5 text-slate-400" />

        <p className="text-sm font-semibold text-slate-700">
          No favourite routes yet
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Save an origin and destination first, then the route will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {favouriteRoutes.map((route) => (
        <div
          key={route.id}
          className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-[#5A9A8E]"
        >
          <button
            type="button"
            onClick={() => onSelectRoute(route)}
            className="w-full text-left"
            aria-label={`Use saved route from ${route.origin} to ${route.destination}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-[#5A9A8E]/10 p-2">
                <Navigation className="h-4 w-4 text-[#5A9A8E]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <p className="truncate text-sm font-medium text-slate-800">
                    {route.origin}
                  </p>
                </div>

                <p className="ml-5 my-1 text-xs text-slate-400">to</p>

                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <p className="truncate text-sm font-medium text-slate-800">
                    {route.destination}
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-2 text-xs font-medium text-[#5A9A8E]">
              Click to fill search fields
            </p>
          </button>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => onRemoveRoute(route.id)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
              aria-label={`Remove saved route from ${route.origin} to ${route.destination}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}