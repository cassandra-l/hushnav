const handleAddSafeSpaceStop = async (safeSpace: SafeSpace) => {
  if (!routeData || !API_BASE_URL) return;

  try {
    setLoading(true);

    const requestBody = {
      start: {
        lat: routeData.start.lat,
        lng: routeData.start.lng,
      },
      end: {
        lat: routeData.end.lat,
        lng: routeData.end.lng,
      },

      // 🔥 NEW PART (stopover)
      stop: {
        lat: safeSpace.lat,
        lng: safeSpace.lng,
      },

      startQuery: routeData.start.input,
      endQuery: routeData.end.input,
    };

    const response = await fetch(`${API_BASE_URL}/plan-route`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    setRouteData(data);
    setIsSafeSpacesOpen(false);

  } catch (err) {
    console.error("Failed to add stop:", err);
  } finally {
    setLoading(false);
  }
};