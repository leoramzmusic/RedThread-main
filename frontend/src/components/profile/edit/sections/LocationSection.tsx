import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import useDebounce from "../../../../hooks/useDebounce";
import {
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Slider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  ClickAwayListener,
  alpha,
  Button,
  Chip,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  LocationOn,
  MyLocation,
  Lock,
  Star,
  Translate,
  RadarRounded,
  EmojiEvents,
  Public,
  Explore,
  Home,
  Flight,
  Terrain,
  InfoOutlined,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { Controller } from "react-hook-form";
import { BaseSectionProps } from "../types";
import apiClient from "../../../../services/api";
import { useSnackbar } from "notistack";

import AsyncLocationSelector from "../../../common/AsyncLocationSelector";
import { MapRegion } from "../../../common/LocationMap";
import {
  RADIUS_MIN,
  RADIUS_MAX,
  RADIUS_MARKS,
  RADIUS_STEP_HELP,
} from "../../../../utils/radius";

const LocationMap = dynamic(() => import("../../../common/LocationMap"), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: 400,
        bgcolor: "#f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 3,
      }}
    >
      <CircularProgress />
    </Box>
  ),
});

const CONTINENT_LAND_GEOJSON: any = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "América" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-168, 80],
            [-168, -56],
            [-34, -56],
            [-34, 80],
            [-168, 80],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Europa" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-25, 80],
            [-25, 35],
            [45, 35],
            [45, 80],
            [-25, 80],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "África" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-18, 35],
            [-18, -35],
            [51, -35],
            [51, 35],
            [-18, 35],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Asia" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [26, 80],
            [26, 1],
            [180, 1],
            [180, 80],
            [26, 80],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Oceanía" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [105, 0],
            [105, -48],
            [180, -48],
            [180, 0],
            [105, 0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Antártida" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-180, -60],
            [-180, -90],
            [180, -90],
            [180, -60],
            [-180, -60],
          ],
        ],
      },
    },
  ],
};

interface LocationSectionProps extends BaseSectionProps {
  citySearch: string;
  setCitySearch: (value: string) => void;
  userPlan?: "free" | "premium" | "vip";
  setLocationInfoOpen?: (open: boolean) => void;
}

const LockedOverlay = ({
  label,
  planRequired,
  icon: Icon,
}: {
  label: string;
  planRequired: string;
  icon: any;
}) => (
  <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden" }}>
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(0,0,0,0.05)",
        backdropFilter: "blur(2px)",
        borderRadius: 2,
        border: "1px dashed",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          bgcolor: "background.paper",
          p: 1.5,
          px: 3,
          borderRadius: 4,
          boxShadow: 4,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          border: "1px solid",
          borderColor: "primary.main",
        }}
      >
        <Lock color="primary" fontSize="small" />
        <Typography variant="body2" fontWeight="700" color="primary">
          Exclusivo {planRequired}
        </Typography>
      </Box>
    </Box>
    <Box
      sx={{
        opacity: 0.3,
        pointerEvents: "none",
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Icon color="disabled" />
      <Typography variant="body1" color="text.disabled">
        {label}
      </Typography>
    </Box>
  </Box>
);

export default function LocationSection({
  control,
  setValue,
  watch,
  citySearch,
  setCitySearch,
  userPlan = "free",
  isDiscovery = false,
  setLocationInfoOpen = () => {},
}: LocationSectionProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation("common");
  // Display-only: 'Todos'/'Todo el mundo' sentinels and API-driven labels stay
  // in Spanish (matching logic depends on them); all static chrome is translated.
  const tone = (key: string, fallback: string) =>
    t(`profile.location.tone.${key}`, fallback);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDetected, setIsDetected] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [regions, setRegions] = useState<MapRegion[]>([]);
  const [baseCountry, setBaseCountry] = useState<string | null>(null);
  const [pendingContinentName, setPendingContinentName] = useState<
    string | null
  >(null);
  const prevCountry = useRef<string | null>(null);

  const location = watch("location");
  const radius =
    watch("distance_preference_km") ?? watch("search_radius_km") ?? 50;
  const searchStates = watch("search_states") || [];
  const searchCountries = watch("search_countries") || [];
  const excludedStates = watch("excluded_states") || [];
  const excludedCountries = watch("excluded_countries") || [];

  // Force numeric casting to avoid Leaflet issues and ensure exact mapping
  const lat = Number(location?.coordinates?.[1]) || 19.4326;
  const lng = Number(location?.coordinates?.[0]) || -99.1332;
  const cityName = location?.city || citySearch;

  const searchCache = useRef<Map<string, any[]>>(new Map());
  const regionCache = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (location?.country) {
      setBaseCountry(location.country);
    } else if (citySearch && citySearch.includes(",")) {
      const parts = citySearch.split(",");
      setBaseCountry(parts[parts.length - 1].trim());
    }
  }, [location, citySearch]);

  // Reset states if country changes (manual change)
  useEffect(() => {
    if (
      prevCountry.current &&
      baseCountry &&
      prevCountry.current !== baseCountry
    ) {
      setValue("search_states", []);
      setValue("excluded_states", []);
      enqueueSnackbar(
        t(
          "profile.location.statesReset",
          "Se han restablecido los estados al cambiar de país.",
        ),
        { variant: "info", autoHideDuration: 2000 },
      );
    }
    if (baseCountry) {
      prevCountry.current = baseCountry;
    }
  }, [baseCountry, setValue, enqueueSnackbar]);

  // Clear location object if search text is manually cleared
  useEffect(() => {
    if (!citySearch && location) {
      setValue("location", null);
      setIsDetected(false);
    }
  }, [citySearch, location, setValue]);

  // Helper to normalize strings (remove accents, lowercase)
  const normalize = (str: string) =>
    str
      ? str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
      : "";

  useEffect(() => {
    const fetchRegions = async () => {
      const newRegions: MapRegion[] = [];

      // Add pending continent feedback immediately
      if (pendingContinentName) {
        const normPending = normalize(pendingContinentName);
        const feature = CONTINENT_LAND_GEOJSON.features.find(
          (f: any) => normalize(f.properties.name) === normPending,
        );
        if (feature) {
          newRegions.push({
            id: `pending-${pendingContinentName}`,
            label: pendingContinentName,
            type: "country",
            geojson: feature,
            isAllSelection: true,
          });
        }
      }

      const fetchBatch = async (items: string[], type: "state" | "country") => {
        const excludedFieldName =
          type === "state" ? "excluded_states" : "excluded_countries";
        const exclusions = watch(excludedFieldName) || [];

        if (items.some((s: string) => s.startsWith("Todos"))) {
          const todosItem =
            items.find((s: string) => s.startsWith("Todos")) || "Todos";
          const targetCountry =
            type === "state" && todosItem.includes(":")
              ? todosItem.split(":")[1]
              : type === "state"
                ? baseCountry
                : "Todo el mundo";

          const parentName = targetCountry;
          const parentCacheKey = `negative-parent:${parentName}`;

          try {
            let parentRegion: MapRegion | null = null;

            if (regionCache.current.has(parentCacheKey)) {
              parentRegion = regionCache.current.get(parentCacheKey);
            } else if (parentName && parentName !== "Todo el mundo") {
              const resp = await apiClient.get(
                `/profiles/places/search?q=${parentName}&place_type=country&detailed=true&include_geojson=true`,
              );
              if (resp.data?.[0]?.geojson) {
                parentRegion = {
                  id: `${type}-all`,
                  label: `Todo ${parentName}`,
                  type,
                  geojson: resp.data[0].geojson,
                  isAllSelection: true,
                };
                regionCache.current.set(parentCacheKey, parentRegion);
              }
            } else if (parentName === "Todo el mundo") {
              parentRegion = {
                id: `${type}-all`,
                label: `Todo el mundo`,
                type,
                geojson: CONTINENT_LAND_GEOJSON,
                isAllSelection: true,
              };
              regionCache.current.set(parentCacheKey, parentRegion);
            }

            if (parentRegion) newRegions.push(parentRegion);

            // Fetch exclusions as negative overlays in parallel
            await Promise.all(
              exclusions.map(async (exName: string) => {
                const exCacheKey = `exclusion:${exName}`;
                if (regionCache.current.has(exCacheKey)) {
                  newRegions.push(regionCache.current.get(exCacheKey));
                  return;
                }
                try {
                  const resp = await apiClient.get(
                    `/profiles/places/search?q=${exName}&place_type=${type}&detailed=true&include_geojson=true`,
                  );
                  if (resp.data?.[0]?.geojson) {
                    const exRegion: MapRegion = {
                      id: `excl-${exName}`,
                      label: resp.data[0].label || exName,
                      type,
                      geojson: resp.data[0].geojson,
                      isExclusion: true,
                    };
                    regionCache.current.set(exCacheKey, exRegion);
                    newRegions.push(exRegion);
                  }
                } catch (e) {
                  console.error(
                    `Error fetching exclusion geojson for ${exName}:`,
                    e,
                  );
                }
              }),
            );
          } catch (e) {
            console.error("Error fetching 'Todos' negative overlay:", e);
          }
          return;
        }

        // Optimized logic for individual selections
        const missing = items.filter(
          (name) => !regionCache.current.has(`${type}:${name}`),
        );

        if (missing.length > 0) {
          try {
            if (missing.length > 3) {
              // Bulk Fetch for many regions
              const params = new URLSearchParams();
              missing.forEach((m) => params.append("q", m));
              params.append("place_type", type);

              const resp = await apiClient.get(
                `/profiles/places/bulk-search?${params.toString()}`,
              );
              resp.data.forEach((item: any) => {
                // Store regon even if GeoJSON is missing so the Chip appears
                const cacheKey = item.query || item.label;
                const region: MapRegion = {
                  id: `${type}-${cacheKey}`,
                  label: item.label,
                  type,
                  geojson: item.geojson,
                };
                regionCache.current.set(`${type}:${cacheKey}`, region);
              });
            } else {
              // Parallel Fetch for few regions
              await Promise.all(
                missing.map(async (name) => {
                  try {
                    const resp = await apiClient.get(
                      `/profiles/places/search?q=${name}&place_type=${type}&detailed=true&include_geojson=true`,
                    );
                    if (resp.data?.[0]) {
                      const region: MapRegion = {
                        id: `${type}-${name}`,
                        label: resp.data[0].label || name,
                        type,
                        geojson: resp.data[0].geojson,
                      };
                      regionCache.current.set(`${type}:${name}`, region);
                    }
                  } catch (e) {
                    console.error(
                      `Error fetching individual geojson for ${name}:`,
                      e,
                    );
                  }
                }),
              );
            }
          } catch (err) {
            console.error("Error in bulk/parallel fetch:", err);
          }
        }

        const results = items
          .map((name) => regionCache.current.get(`${type}:${name}`))
          .filter((r): r is MapRegion => !!r);

        newRegions.push(...results);
      };

      await fetchBatch(searchCountries, "country");
      await fetchBatch(searchStates, "state");
      setRegions(newRegions);
    };

    if (baseCountry || searchCountries.length > 0 || searchStates.length > 0) {
      fetchRegions();
    }
  }, [
    JSON.stringify(searchStates),
    JSON.stringify(searchCountries),
    JSON.stringify(excludedStates),
    JSON.stringify(excludedCountries),
    baseCountry,
    pendingContinentName,
    setValue,
  ]);

  // Sanitize values
  useEffect(() => {
    if (
      searchStates.some((s: string) => s.startsWith("Todos")) &&
      searchStates.length > 1
    ) {
      const todos = searchStates.find((s: string) => s.startsWith("Todos"));
      setValue("search_states", [todos]);
    }
  }, [JSON.stringify(searchStates), setValue]);

  useEffect(() => {
    if (searchCountries.includes("Todos") && searchCountries.length > 1) {
      setValue("search_countries", ["Todos"]);
    }
  }, [JSON.stringify(searchCountries), setValue]);

  const handleRegionToggle = async (
    name: string,
    type: "state" | "country",
  ) => {
    if (userPlan === "free") {
      enqueueSnackbar(
        t(
          "profile.location.premiumStates",
          "🌟 ¡Suscríbete a Premium para seleccionar estados o VIP para todo el mundo!",
        ),
        { variant: "info" },
      );
      return;
    }

    if (type === "country" && userPlan !== "vip") {
      enqueueSnackbar(
        t(
          "profile.location.vipOnly",
          "🌍 La selección internacional es exclusiva para miembros VIP.",
        ),
        { variant: "warning" },
      );
      return;
    }

    const config =
      userPlan === "premium" || userPlan === "vip"
        ? userPlan === "premium"
          ? { states: 10, countries: 0 }
          : { states: 20, countries: 20 }
        : { states: 0, countries: 0 };

    const limit = type === "state" ? config.states : config.countries;

    if (name.startsWith("Todo")) return;

    const fieldName = type === "state" ? "search_states" : "search_countries";
    const currentValue: string[] = watch(fieldName) || [];
    const excludedFieldName =
      type === "state" ? "excluded_states" : "excluded_countries";
    const excludedValue: string[] = watch(excludedFieldName) || [];

    if (currentValue.includes(name)) {
      setValue(
        fieldName,
        currentValue.filter((n: string) => n !== name),
      );
    } else if (
      currentValue.some((s: string) => s.startsWith("Todos")) &&
      !excludedValue.includes(name)
    ) {
      setValue(excludedFieldName, [...excludedValue, name]);
    } else if (
      currentValue.some((s: string) => s.startsWith("Todos")) &&
      excludedValue.includes(name)
    ) {
      setValue(
        excludedFieldName,
        excludedValue.filter((n: string) => n !== name),
      );
    } else {
      // Check limits for new individual selection
      if (currentValue.length >= limit && !currentValue.includes("Todos")) {
        enqueueSnackbar(
          t(
            "profile.location.limitReached",
            "⚠️ Límite de {{limit}} {{unit}} alcanzado para tu plan.",
            {
              limit,
              unit:
                type === "state"
                  ? t("profile.location.statesUnit", "estados")
                  : t("profile.location.countriesUnit", "países"),
            },
          ),
          { variant: "warning" },
        );
        return;
      }
      setValue(fieldName, [...currentValue, name]);
      if (excludedValue.includes(name)) {
        setValue(
          excludedFieldName,
          excludedValue.filter((n: string) => n !== name),
        );
      }
    }
  };

  const handleSelectAll = (type: "state" | "country") => {
    const fieldName = type === "state" ? "search_states" : "search_countries";
    const currentValue: string[] = watch(fieldName) || [];
    if (currentValue.some((s: string) => s.startsWith("Todos"))) {
      setValue(fieldName, []);
      setValue(type === "state" ? "excluded_states" : "excluded_countries", []);
    } else {
      const value =
        type === "state" ? `Todos:${baseCountry || "México"}` : "Todos";
      setValue(fieldName, [value]);
    }
  };

  const debouncedSearchTerm = useDebounce(citySearch, 500);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length <= 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      if (searchCache.current.has(debouncedSearchTerm)) {
        setSuggestions(searchCache.current.get(debouncedSearchTerm) || []);
        if (isFocused) setShowSuggestions(true);
        return;
      }
      try {
        const response = await apiClient.get(
          `/profiles/places/search?q=${debouncedSearchTerm}&detailed=true`,
        );
        searchCache.current.set(debouncedSearchTerm, response.data);
        setSuggestions(response.data);
        if (isFocused) setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };
    fetchSuggestions();
  }, [debouncedSearchTerm, isFocused]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert(
        t(
          "profile.location.noGeolocation",
          "Tu navegador no soporta geolocalización.",
        ),
      );
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setIsDetected(true);
        try {
          const response = await apiClient.get(
            `/profiles/geocode?latitude=${latitude}&longitude=${longitude}`,
          );
          if (response.data.formatted) {
            const cityLabel =
              response.data.city || response.data.formatted.split(",")[0];
            setCitySearch(response.data.formatted);
            setValue("location", {
              type: "Point",
              coordinates: [longitude, latitude],
              city: cityLabel,
              country: response.data.country,
            });
            enqueueSnackbar(
              t(
                "profile.location.setSuccess",
                "📍 Ubicación establecida: {{city}}",
                { city: cityLabel },
              ),
              { variant: "success" },
            );
          }
        } catch (error) {
          console.error("Error detecting location:", error);
        } finally {
          setLoadingLocation(false);
        }
      },
      () => {
        setLoadingLocation(false);
        alert(
          t(
            "profile.location.detectFailed",
            "No pudimos detectar tu ubicación.",
          ),
        );
      },
    );
  };

  const handleSelectSuggestion = (suggestion: any) => {
    setCitySearch(suggestion.label);
    setIsDetected(false);
    if (suggestion.lat && suggestion.lon) {
      setValue("location", {
        type: "Point",
        coordinates: [Number(suggestion.lon), Number(suggestion.lat)],
        city: suggestion.label,
      });
    }
    setShowSuggestions(false);
  };

  return (
    <Grid item xs={12}>
      <Accordion
        defaultExpanded
        sx={{
          position: "relative",
          border: isDiscovery
            ? "none"
            : (theme) => "1px solid " + theme.palette.divider,
          boxShadow: isDiscovery ? 0 : 1,
          backgroundImage: "none",
          bgcolor: isDiscovery ? "transparent" : "inherit",
          borderRadius: "12px !important",
          "&:before": { display: "none" },
        }}
      >
        {!isDiscovery && (
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ px: 3, py: 1 }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              width="100%"
              pr={2}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <LocationOn color="action" />
                <Typography variant="h6">
                  {t("profile.location.title", "Ubicación y Alcance")}
                </Typography>
              </Box>
              <Tooltip
                title={t("profile.location.infoModal.title", "¿Por qué pedimos tu ubicación?")}
              >
                <IconButton
                  size="small"
                  component="span"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocationInfoOpen(true);
                  }}
                >
                  <InfoOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </AccordionSummary>
        )}
        <AccordionDetails sx={{ px: isDiscovery ? 1 : 3, pb: 3, pt: 0 }}>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Box
                sx={{
                  height: isDiscovery ? 250 : 400,
                  borderRadius: 3,
                  overflow: "hidden",
                  border: isDiscovery ? "none" : "1px solid",
                  borderColor: "divider",
                  position: "relative",
                  mb: 2,
                }}
              >
                <LocationMap
                  lat={lat}
                  lng={lng}
                  radiusKm={radius}
                  zoom={isDiscovery ? 9 : 10}
                  cityName={cityName}
                  regions={regions.filter((r) => r.geojson)}
                  onRegionClick={handleRegionToggle}
                  baseCountry={baseCountry}
                  hasLocation={!!location}
                />
              </Box>
              {regions.length > 0 && (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                  {searchStates.some((s: string) => s.startsWith("Todos")) ? (
                    <>
                      <Chip
                        label={
                          searchStates[0].includes(":")
                            ? `Todos los estados (${searchStates[0].split(":")[1]})`
                            : `Todos los estados (${baseCountry})`
                        }
                        size="small"
                        onDelete={() => handleSelectAll("state")}
                        sx={{
                          bgcolor: alpha("#9333EA", 0.1),
                          color: "#9333EA",
                          fontWeight: 800,
                          border: "1px solid",
                          borderColor: alpha("#9333EA", 0.2),
                        }}
                      />
                      {excludedStates.map((exName: string) => (
                        <Chip
                          key={`excl-state-${exName}`}
                          label={
                            t("profile.location.exceptPrefix", "Excepto: ") +
                            exName
                          }
                          size="small"
                          variant="outlined"
                          onDelete={() => handleRegionToggle(exName, "state")}
                          sx={{
                            borderColor: "error.main",
                            color: "error.main",
                            fontWeight: 500,
                            bgcolor: alpha("#fff", 0.05),
                          }}
                        />
                      ))}
                    </>
                  ) : (
                    regions
                      .filter((r) => r.type === "state")
                      .map((r) => (
                        <Chip
                          key={r.id}
                          label={r.label}
                          size="small"
                          onDelete={() => handleRegionToggle(r.label, "state")}
                          sx={{
                            bgcolor: alpha("#9333EA", 0.1),
                            color: "#7B1FA2",
                            fontWeight: 600,
                          }}
                        />
                      ))
                  )}

                  {searchCountries.includes("Todos") ? (
                    <>
                      <Chip
                        label={t(
                          "profile.location.scopeGlobal",
                          "Ámbito: Global",
                        )}
                        size="small"
                        onDelete={() => handleSelectAll("country")}
                        sx={{
                          bgcolor: alpha("#FFD700", 0.1),
                          color: "#B8860B",
                          fontWeight: 800,
                          border: "1px solid",
                          borderColor: alpha("#FFD700", 0.2),
                        }}
                      />
                      {excludedCountries.map((exName: string) => (
                        <Chip
                          key={`excl-country-${exName}`}
                          label={
                            t("profile.location.exceptPrefix", "Excepto: ") +
                            exName
                          }
                          size="small"
                          variant="outlined"
                          onDelete={() => handleRegionToggle(exName, "country")}
                          sx={{
                            borderColor: "error.main",
                            color: "error.main",
                            fontWeight: 500,
                            bgcolor: alpha("#fff", 0.05),
                          }}
                        />
                      ))}
                    </>
                  ) : (
                    regions
                      .filter(
                        (r) =>
                          r.type === "country" && !r.id.startsWith("pending-"),
                      )
                      .map((r) => (
                        <Chip
                          key={r.id}
                          label={r.label}
                          size="small"
                          onDelete={() =>
                            handleRegionToggle(r.label, "country")
                          }
                          sx={{
                            bgcolor: alpha("#FFC107", 0.1),
                            color: "#B8860B",
                            fontWeight: 600,
                          }}
                        />
                      ))
                  )}
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography
                variant="subtitle1"
                fontWeight="700"
                gutterBottom
                display="flex"
                alignItems="center"
                gap={1}
                sx={{ color: isDiscovery ? "white" : "inherit" }}
              >
                <MyLocation
                  fontSize="small"
                  color={isDiscovery ? "inherit" : "primary"}
                  sx={{ color: isDiscovery ? "gold" : "inherit" }}
                />{" "}
                {t("profile.location.baseTitle", "📍 Tu ubicación base")}
              </Typography>
              <ClickAwayListener
                onClickAway={() => {
                  setShowSuggestions(false);
                  setIsFocused(false);
                }}
              >
                <Box position="relative">
                  <TextField
                    fullWidth
                    value={citySearch}
                    onFocus={() => {
                      setIsFocused(true);
                      if (citySearch.length > 2) setShowSuggestions(true);
                    }}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder={t(
                      "profile.location.cityPlaceholder",
                      "¿En qué ciudad vives?",
                    )}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: isDiscovery
                          ? "rgba(255,255,255,0.05)"
                          : alpha("#000", 0.02),
                        color: isDiscovery ? "white" : "inherit",
                        borderRadius: 2,
                        "& fieldset": {
                          borderColor: isDiscovery
                            ? "rgba(255,255,255,0.2)"
                            : "inherit",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: isDiscovery
                          ? "rgba(255,255,255,0.7)"
                          : "inherit",
                      },
                    }}
                    InputProps={{
                      sx: { borderRadius: 2 },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={detectLocation}
                            disabled={loadingLocation}
                            sx={{
                              color: isDetected
                                ? isDiscovery
                                  ? "gold"
                                  : "primary.main"
                                : isDiscovery
                                  ? "rgba(255,255,255,0.5)"
                                  : "default",
                            }}
                          >
                            {loadingLocation ? (
                              <CircularProgress size={24} color="inherit" />
                            ) : (
                              <MyLocation />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <Paper
                      elevation={12}
                      sx={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 10,
                        mt: 1.5,
                        maxHeight: 280,
                        overflow: "auto",
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        bgcolor: "background.paper",
                        borderRadius: 2,
                      }}
                    >
                      <List disablePadding>
                        {suggestions.map((suggestion, index) => (
                          <ListItemButton
                            key={index}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            sx={{
                              borderBottom: (theme) =>
                                `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                              py: 2,
                            }}
                          >
                            <ListItemText
                              primary={suggestion.label}
                              primaryTypographyProps={{
                                variant: "body2",
                                fontWeight: 600,
                              }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Paper>
                  )}
                </Box>
              </ClickAwayListener>
            </Grid>

            <Grid item xs={12}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="700"
                  display="flex"
                  alignItems="center"
                  gap={1}
                  sx={{ color: isDiscovery ? "white" : "inherit" }}
                >
                  <RadarRounded
                    fontSize="small"
                    color={isDiscovery ? "inherit" : "primary"}
                    sx={{ color: isDiscovery ? "gold" : "inherit" }}
                  />{" "}
                  {t("profile.location.radiusLabel", "Radio de exploración")}
                </Typography>
                <Chip
                  label={`${radius} km`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    borderRadius: 1.5,
                    bgcolor: isDiscovery
                      ? alpha("#FFD700", 0.2)
                      : "primary.main",
                    color: isDiscovery ? "gold" : "primary.contrastText",
                  }}
                />
              </Box>
              <Controller
                name="distance_preference_km"
                control={control}
                defaultValue={50}
                render={({ field }) => {
                  const val = field.value || 50;

                  // Emotional Tone Logic (labels resolve translated via tone())
                  let toneKey = "close";
                  let toneLabel = t(
                    "profile.location.tone.close.label",
                    "Cercanos",
                  );
                  let toneDescription = t(
                    "profile.location.tone.close.desc",
                    "Tono íntimo, encuentros presenciales.",
                  );
                  if (val <= 10) {
                    toneKey = "close";
                    toneLabel = t(
                      "profile.location.tone.close.label",
                      "Cercanos",
                    );
                    toneDescription = t(
                      "profile.location.tone.close.desc",
                      "Tono íntimo, encuentros presenciales.",
                    );
                  } else if (val <= 40) {
                    toneKey = "local";
                    toneLabel = t("profile.location.tone.local.label", "Local");
                    toneDescription = t(
                      "profile.location.tone.local.desc",
                      "Tono cotidiano, encuentros espontáneos.",
                    );
                  } else if (val <= 70) {
                    toneKey = "regional";
                    toneLabel = t(
                      "profile.location.tone.regional.label",
                      "Regional",
                    );
                    toneDescription = t(
                      "profile.location.tone.regional.desc",
                      "Tono exploratorio, sugerencias culturales.",
                    );
                  } else {
                    toneKey = "adventure";
                    toneLabel = t(
                      "profile.location.tone.adventure.label",
                      "Aventura",
                    );
                    toneDescription = t(
                      "profile.location.tone.adventure.desc",
                      "Tono curioso, progresión lenta.",
                    );
                  }

                  // Achievement status calculation
                  const isCercanos = val <= 10;
                  const isCurioso = val >= 50 && val <= 70;
                  const isAventurero = val >= 80;
                  const isExplorador =
                    searchStates.length > 0 &&
                    !searchStates.includes(baseCountry); // Simple heuristic for "other state" - user selects states manually
                  const isMochilero =
                    searchCountries.length > 0 ||
                    searchCountries.includes("Todos");

                  return (
                    <Box sx={{ px: 2, mt: 3 }}>
                      <Slider
                        {...field}
                        onChange={(_, value) => {
                          field.onChange(value);
                          setValue("search_radius_km", value as number);
                        }}
                        valueLabelDisplay="auto"
                        min={RADIUS_MIN}
                        max={RADIUS_MAX}
                        step={null}
                        marks={RADIUS_MARKS}
                        sx={{
                          height: 8,
                          color: isDiscovery ? "gold" : "primary.main",
                          "& .MuiSlider-markLabel": {
                            fontSize: "0.6rem",
                            color: isDiscovery
                              ? "rgba(255,255,255,0.5)"
                              : "inherit",
                          },
                          "& .MuiSlider-rail": {
                            bgcolor: isDiscovery
                              ? "rgba(255,255,255,0.1)"
                              : "inherit",
                          },
                        }}
                      />

                      <Typography
                        variant="caption"
                        display="block"
                        sx={{
                          color: isDiscovery
                            ? "rgba(255,255,255,0.5)"
                            : "text.secondary",
                          mt: 0.5,
                        }}
                      >
                        {RADIUS_STEP_HELP}
                      </Typography>

                      <Box
                        mt={3}
                        p={2}
                        borderRadius={2}
                        bgcolor={
                          isDiscovery
                            ? "rgba(255,215,0,0.05)"
                            : alpha("#9333EA", 0.05)
                        }
                        border="1px dashed"
                        borderColor={
                          isDiscovery
                            ? "rgba(255,215,0,0.2)"
                            : alpha("#9333EA", 0.3)
                        }
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          gutterBottom
                          sx={{ color: isDiscovery ? "gold" : "primary.main" }}
                        >
                          {tone(toneKey + ".label", toneLabel)} ·{" "}
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{
                              color: isDiscovery
                                ? "rgba(255,255,255,0.6)"
                                : "text.secondary",
                            }}
                          >
                            {tone(toneKey + ".desc", toneDescription)}
                          </Typography>
                        </Typography>

                        <Typography
                          variant="caption"
                          display="block"
                          sx={{
                            color: isDiscovery
                              ? "rgba(255,255,255,0.5)"
                              : "text.secondary",
                            mb: 1.5,
                            fontStyle: "italic",
                          }}
                        >
                          {t(
                            "profile.location.careSuggests",
                            '"CARE sugiere vínculos con tono {{tone}}."',
                            {
                              tone: tone(
                                toneKey + ".label",
                                toneLabel,
                              ).toLowerCase(),
                            },
                          )}
                        </Typography>

                        {/* Achievement Badges */}
                        <Box display="flex" gap={1.5} flexWrap="wrap">
                          <Tooltip
                            title={t(
                              "profile.location.badge.closeTip",
                              "Cercanos: Match dentro de 10 km",
                            )}
                            arrow
                          >
                            <Box
                              sx={{
                                opacity: isCercanos ? 1 : 0.3,
                                filter: isCercanos ? "none" : "grayscale(100%)",
                                transition: "all 0.3s",
                              }}
                            >
                              <Chip
                                icon={
                                  <Home sx={{ fontSize: "1rem !important" }} />
                                }
                                label={tone("close.label", "Cercanos")}
                                size="small"
                                color="success"
                                variant={isCercanos ? "filled" : "outlined"}
                              />
                            </Box>
                          </Tooltip>

                          <Tooltip
                            title={t(
                              "profile.location.badge.curiousTip",
                              "Curioso: Match entre 50-70 km",
                            )}
                            arrow
                          >
                            <Box
                              sx={{
                                opacity: isCurioso ? 1 : 0.3,
                                filter: isCurioso ? "none" : "grayscale(100%)",
                                transition: "all 0.3s",
                              }}
                            >
                              <Chip
                                icon={
                                  <Explore
                                    sx={{ fontSize: "1rem !important" }}
                                  />
                                }
                                label={t(
                                  "profile.location.badge.curious",
                                  "Curioso",
                                )}
                                size="small"
                                color="info"
                                variant={isCurioso ? "filled" : "outlined"}
                              />
                            </Box>
                          </Tooltip>

                          <Tooltip
                            title={t(
                              "profile.location.badge.adventureTip",
                              "Aventurero: Match a más de 80 km",
                            )}
                            arrow
                          >
                            <Box
                              sx={{
                                opacity: isAventurero ? 1 : 0.3,
                                filter: isAventurero
                                  ? "none"
                                  : "grayscale(100%)",
                                transition: "all 0.3s",
                              }}
                            >
                              <Chip
                                icon={
                                  <Terrain
                                    sx={{ fontSize: "1rem !important" }}
                                  />
                                }
                                label={t(
                                  "profile.location.badge.adventurer",
                                  "Aventurero",
                                )}
                                size="small"
                                color="warning"
                                variant={isAventurero ? "filled" : "outlined"}
                              />
                            </Box>
                          </Tooltip>

                          {/* Global/State achievements depend on other fields but are shown here for completeness */}
                          <Tooltip
                            title={t(
                              "profile.location.badge.explorerTip",
                              "Explorador: Match con otro estado (Requiere seleccionar estados)",
                            )}
                            arrow
                          >
                            <Box
                              sx={{
                                opacity: isExplorador ? 1 : 0.3,
                                filter: isExplorador
                                  ? "none"
                                  : "grayscale(100%)",
                                transition: "all 0.3s",
                              }}
                            >
                              <Chip
                                icon={
                                  <EmojiEvents
                                    sx={{ fontSize: "1rem !important" }}
                                  />
                                }
                                label={t(
                                  "profile.location.badge.explorer",
                                  "Explorador",
                                )}
                                size="small"
                                color="secondary"
                                variant={isExplorador ? "filled" : "outlined"}
                              />
                            </Box>
                          </Tooltip>

                          <Tooltip
                            title={t(
                              "profile.location.badge.backpackerTip",
                              "Mochilero: Match internacional (Requiere VIP)",
                            )}
                            arrow
                          >
                            <Box
                              sx={{
                                opacity: isMochilero ? 1 : 0.3,
                                filter: isMochilero
                                  ? "none"
                                  : "grayscale(100%)",
                                transition: "all 0.3s",
                              }}
                            >
                              <Chip
                                icon={
                                  <Flight
                                    sx={{ fontSize: "1rem !important" }}
                                  />
                                }
                                label={t(
                                  "profile.location.badge.backpacker",
                                  "Mochilero",
                                )}
                                size="small"
                                color="warning"
                                variant={isMochilero ? "filled" : "outlined"}
                              />
                            </Box>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>
                  );
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1" fontWeight="700">
                    {t("profile.location.statesTitle", "🌎 Estados")}
                  </Typography>
                  <Chip
                    label="PREMIUM"
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{ fontSize: "0.65rem", height: 18, fontWeight: 900 }}
                  />
                </Box>
                {["premium", "vip"].includes(userPlan) && (
                  <Button
                    size="small"
                    variant={
                      searchStates.some((s: string) => s.startsWith("Todos"))
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() => handleSelectAll("state")}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 700,
                    }}
                  >
                    {searchStates.some((s: string) => s.startsWith("Todos"))
                      ? t("profile.location.deselectAll", "Deseleccionar todos")
                      : t("profile.location.allStates", "Todos los estados")}
                  </Button>
                )}
              </Box>
              {["premium", "vip"].includes(userPlan) ? (
                <>
                  <Controller
                    name="search_states"
                    control={control}
                    defaultValue={[]}
                    render={({ field: { onChange, value } }) => (
                      <AsyncLocationSelector
                        label={
                          value.includes("Todos")
                            ? excludedStates.length > 0
                              ? t(
                                  "profile.location.allExcept",
                                  "Todos excepto {{first}}{{rest}}",
                                  {
                                    first: excludedStates[0],
                                    rest:
                                      excludedStates.length > 1
                                        ? t(
                                            "profile.location.andMore",
                                            " y {{count}} más",
                                            {
                                              count: excludedStates.length - 1,
                                            },
                                          )
                                        : "",
                                  },
                                )
                              : t(
                                  "profile.location.scopeNational",
                                  "Alcance: Nacional",
                                )
                            : t(
                                "profile.location.searchStates",
                                "Buscar en estados",
                              )
                        }
                        placeholder={
                          baseCountry
                            ? t(
                                "profile.location.statesOf",
                                "Estados de {{country}}...",
                                { country: baseCountry },
                              )
                            : t(
                                "profile.location.writeState",
                                "Escribe un estado...",
                              )
                        }
                        value={value || []}
                        onChange={(v: string[]) => {
                          if (v.includes("Todos") && !value.includes("Todos")) {
                            setValue("excluded_states", []);
                            onChange(["Todos"]);
                          } else if (v.includes("Todos") && v.length > 1) {
                            onChange(["Todos"]);
                          } else {
                            onChange(v);
                          }
                        }}
                        placeType="state"
                        forceCountry={baseCountry}
                        maxItems={userPlan === "vip" ? 20 : 10}
                      />
                    )}
                  />
                  {searchStates.some((s: string) => s.startsWith("Todos")) && (
                    <Box sx={{ mt: 2 }}>
                      <Controller
                        name="excluded_states"
                        control={control}
                        defaultValue={[]}
                        render={({ field }) => (
                          <AsyncLocationSelector
                            {...field}
                            label={t(
                              "profile.location.excludeStates",
                              "🚫 Excluir estados",
                            )}
                            placeholder={t(
                              "profile.location.excludeStatesPh",
                              "Ej. Tartaria...",
                            )}
                            placeType="state"
                            forceCountry={baseCountry}
                          />
                        )}
                      />
                    </Box>
                  )}
                </>
              ) : (
                <LockedOverlay
                  label={t(
                    "profile.location.lockedStates",
                    "Selecciona estados específicos",
                  )}
                  planRequired="Premium"
                  icon={Star}
                />
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1" fontWeight="700">
                    {t("profile.location.countriesTitle", "🌍 Países")}
                  </Typography>
                  <Chip
                    label="VIP"
                    size="small"
                    sx={{
                      fontSize: "0.65rem",
                      height: 18,
                      fontWeight: 900,
                      bgcolor: "warning.main",
                      color: "warning.contrastText",
                    }}
                  />
                </Box>
                {userPlan === "vip" && (
                  <Button
                    size="small"
                    variant={
                      searchCountries.includes("Todos")
                        ? "contained"
                        : "outlined"
                    }
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 700,
                      borderColor: "warning.main",
                      color: searchCountries.includes("Todos")
                        ? "white"
                        : "warning.main",
                      bgcolor: searchCountries.includes("Todos")
                        ? "warning.main"
                        : "transparent",
                    }}
                    onClick={() => handleSelectAll("country")}
                  >
                    {searchCountries.includes("Todos")
                      ? t("profile.location.deselectAll", "Deseleccionar todos")
                      : t("profile.location.allWorld", "Todo el mundo")}
                  </Button>
                )}
              </Box>
              {userPlan === "vip" ? (
                <>
                  <Controller
                    name="search_countries"
                    control={control}
                    defaultValue={[]}
                    render={({ field: { onChange, value } }) => (
                      <AsyncLocationSelector
                        label={
                          value.includes("Todos")
                            ? excludedCountries.length > 0
                              ? t(
                                  "profile.location.allWorldExcept",
                                  "Todo el mundo excepto {{first}}{{rest}}",
                                  {
                                    first: excludedCountries[0],
                                    rest:
                                      excludedCountries.length > 1
                                        ? t(
                                            "profile.location.andMore",
                                            " y {{count}} más",
                                            {
                                              count:
                                                excludedCountries.length - 1,
                                            },
                                          )
                                        : "",
                                  },
                                )
                              : t(
                                  "profile.location.scopeGlobal",
                                  "Alcance: Global",
                                )
                            : t(
                                "profile.location.searchCountries",
                                "Buscar en países",
                              )
                        }
                        placeholder={t(
                          "profile.location.countryPlaceholder",
                          "Escribe un país o continente...",
                        )}
                        value={value || []}
                        onChange={async (v: string[]) => {
                          if (v.includes("Todos") && !value.includes("Todos")) {
                            setValue("location_scope", {
                              mode: "countries",
                              selected_continent: null,
                              selected_countries: ["Todos"],
                              excluded_countries: [],
                              limit: 20,
                            });
                            setValue("excluded_countries", []);
                            onChange(["Todos"]);
                          } else if (v.includes("Todos") && v.length > 1) {
                            onChange(["Todos"]);
                          } else {
                            const newSelection = v.filter(
                              (x) => !value.includes(x),
                            )[0];
                            const isContinent =
                              newSelection &&
                              (newSelection.startsWith("Continente: ") ||
                                (newSelection.startsWith("🌎 ") &&
                                  newSelection.includes(
                                    "(Todo el continente)",
                                  )));

                            if (isContinent) {
                              const currentScope = watch("location_scope");
                              if (currentScope?.mode === "continent") {
                                enqueueSnackbar(
                                  t(
                                    "profile.location.oneContinent",
                                    "⚠️ Solo puedes seleccionar un continente completo a la vez. Si quieres abrir otro, primero deselecciona el actual.",
                                  ),
                                  { variant: "warning" },
                                );
                                return;
                              }

                              let continentName = "";
                              if (newSelection.startsWith("Continente: ")) {
                                continentName = newSelection.replace(
                                  "Continente: ",
                                  "",
                                );
                              } else {
                                continentName = newSelection.split(" ")[1];
                              }

                              setPendingContinentName(continentName);
                              try {
                                const resp = await apiClient.get(
                                  `/profiles/continents/${continentName}/countries`,
                                );
                                const continentCountries = resp.data || [];
                                if (continentCountries.length > 0) {
                                  setValue("location_scope", {
                                    mode: "continent",
                                    selected_continent: continentName,
                                    selected_countries: continentCountries,
                                    excluded_countries: [],
                                    limit: 20,
                                  });
                                  onChange(continentCountries);
                                  enqueueSnackbar(
                                    t(
                                      "profile.location.addedCountries",
                                      "✅ Se agregaron {{count}} países de {{name}}",
                                      {
                                        count: continentCountries.length,
                                        name: continentName,
                                      },
                                    ),
                                    { variant: "success" },
                                  );
                                } else {
                                  onChange(v);
                                }
                              } catch (err) {
                                console.error(
                                  "Error expanding continent:",
                                  err,
                                );
                                onChange(v);
                              } finally {
                                setPendingContinentName(null);
                              }
                            } else {
                              // individual selection
                              if (v.length > 20) {
                                enqueueSnackbar(
                                  t(
                                    "profile.location.countriesLimit",
                                    "⚠️ Has alcanzado el límite de 20 países. Elimina alguno para agregar otro.",
                                  ),
                                  { variant: "warning" },
                                );
                                return;
                              }
                              setValue("location_scope", {
                                mode: "countries",
                                selected_continent: null,
                                selected_countries: v,
                                excluded_countries: excludedCountries,
                                limit: 20,
                              });
                              onChange(v);
                            }
                          }
                        }}
                        placeType="country"
                        maxItems={20}
                      />
                    )}
                  />
                  {searchCountries.includes("Todos") && (
                    <Box sx={{ mt: 2 }}>
                      <Controller
                        name="excluded_countries"
                        control={control}
                        defaultValue={[]}
                        render={({ field }) => (
                          <AsyncLocationSelector
                            {...field}
                            label={t(
                              "profile.location.excludeCountries",
                              "🚫 Excluir países",
                            )}
                            placeholder={t(
                              "profile.location.excludeCountriesPh",
                              "Ej. Wakanda...",
                            )}
                            placeType="country"
                          />
                        )}
                      />
                    </Box>
                  )}
                </>
              ) : (
                <LockedOverlay
                  label="Conexiones internacionales"
                  planRequired="VIP"
                  icon={Translate}
                />
              )}
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}
