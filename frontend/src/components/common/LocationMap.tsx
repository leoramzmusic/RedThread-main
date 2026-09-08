import { Box, CircularProgress, Typography, alpha, Tooltip } from '@mui/material';
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, Tooltip as LeafletTooltip, GeoJSON, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue in Next.js/React
const icon = typeof window !== 'undefined' ? L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
}) : null;

export interface MapRegion {
    id: string;
    label: string;
    type: 'state' | 'country';
    geojson: any;
    isExclusion?: boolean;
    isAllSelection?: boolean;
}

interface LocationMapProps {
    lat: number | string;
    lng: number | string;
    radiusKm: number;
    zoom?: number;
    cityName?: string;
    regions?: MapRegion[];
    baseCountry?: string | null;
    onRegionClick?: (name: string, type: 'state' | 'country') => void;
    hasLocation?: boolean;
}

import apiClient from '../../services/api';

function MapEvents({ onRegionClick, baseCountry }: { onRegionClick?: (name: string, type: 'state' | 'country') => void, baseCountry?: string | null }) {
    const [clickPoint, setClickPoint] = useState<[number, number] | null>(null);
    const map = useMap();

    useMapEvents({
        dblclick: async (e) => {
            if (!onRegionClick) return;
            const { lat, lng } = e.latlng;
            setClickPoint([lat, lng]);

            try {
                // Use backend geocoding to avoid CORS and rate limits
                const resp = await apiClient.get('/profiles/geocode', {
                    params: { latitude: lat, longitude: lng }
                });

                const { city, state, country } = resp.data;

                if (country === baseCountry && state) {
                    const formattedState = `${state}, ${country}`;
                    onRegionClick(formattedState, 'state');
                } else if (country) {
                    onRegionClick(country, 'country');
                }
            } catch (err) {
                console.error("Error reverse geocoding via proxy:", err);
            } finally {
                setClickPoint(null);
            }
        }
    });

    return clickPoint ? (
        <Circle
            center={clickPoint}
            radius={500}
            pathOptions={{ color: '#FF3366', fillColor: '#FF3366', fillOpacity: 0.8 }}
        />
    ) : null;
}

function MapUpdater({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lng], zoom);
        map.setMaxBounds([[-85, -180], [85, 180]]);
        map.setMinZoom(2);
    }, [lat, lng, zoom, map]);
    return null;
}

export default function LocationMap({ lat, lng, radiusKm, zoom = 10, cityName, regions = [], onRegionClick, baseCountry, hasLocation }: LocationMapProps) {
    const numericLat = Number(lat);
    const numericLng = Number(lng);

    return (
        <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
            <style>
                {`
                    .region-transition {
                        transition: all 0.8s ease-in-out;
                        animation: fadeIn 1.2s ease-out;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; stroke-width: 0; }
                        to { opacity: 0.8; stroke-width: 4; }
                    }
                    /* Subtle pulse for Global scope */
                    path.leaflet-interactive[stroke="#FFD700"] {
                        animation: pulseGold 3s infinite ease-in-out;
                    }
                    @keyframes pulseGold {
                        0% { stroke-opacity: 0.6; fill-opacity: 0.1; }
                        50% { stroke-opacity: 0.9; fill-opacity: 0.2; }
                        100% { stroke-opacity: 0.6; fill-opacity: 0.1; }
                    }
                `}
            </style>
            <MapContainer
                center={[numericLat, numericLng]}
                zoom={zoom}
                style={{
                    height: '100%',
                    width: '100%',
                    backgroundColor: '#cbdced', // Oceanic blue background for contrast
                    transition: 'background-color 0.5s ease'
                }}
                scrollWheelZoom={true}
                maxBounds={[[-85, -180], [85, 180]]}
                minZoom={2}
                maxBoundsViscosity={1.0}
                worldCopyJump={false}
                doubleClickZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    noWrap={true}
                    bounds={[[-90, -180], [180, 180]]}
                    className="map-tiles" // Added class for potential CSS filtering
                />

                <MapEvents onRegionClick={onRegionClick} baseCountry={baseCountry} />

                {/* Main Location Marker - ONLY if location is actually set */}
                {icon && hasLocation && (
                    <Marker position={[numericLat, numericLng]} icon={icon}>
                        <LeafletTooltip permanent>
                            {cityName ? `${cityName.split(',')[0]}— tu punto de partida emocional.` : "Tu punto de partida emocional."}
                        </LeafletTooltip>
                    </Marker>
                )}

                {/* Radius Circle - ONLY if location is actually set */}
                {hasLocation && (
                    <Circle
                        center={[numericLat, numericLng]}
                        radius={radiusKm * 1000}
                        pathOptions={{
                            fillColor: '#FF3366',
                            color: '#FF3366',
                            fillOpacity: 0.15,
                            weight: 2
                        }}
                    />
                )}

                {/* Targeted Regions (States/Countries) */}
                {regions.map((region) => (
                    <GeoJSON
                        key={region.id}
                        data={region.geojson}
                        eventHandlers={{
                            dblclick: (e) => {
                                // For "All" selections (e.g. "Todo México"), let the event bubble to MapEvents
                                // so we can reverse geocode the specific state under the cursor.
                                if (region.isAllSelection) return;

                                L.DomEvent.stopPropagation(e);
                                if (onRegionClick) onRegionClick(region.label, region.type);
                            }
                        }}
                        style={{
                            fillColor: region.isExclusion
                                ? '#d32f2f' // Red for exclusion
                                : region.isAllSelection
                                    ? (region.type === 'country' ? '#FFD700' : '#9333EA')
                                    : (region.type === 'country' ? '#FFD700' : '#9333EA'),
                            color: region.isExclusion
                                ? '#d32f2f' // Red border for exclusion
                                : region.isAllSelection
                                    ? (region.type === 'country' ? '#FFD700' : '#9333EA')
                                    : (region.type === 'country' ? '#FFD700' : '#9333EA'),
                            weight: region.isExclusion
                                ? 2
                                : (region.isAllSelection && region.type === 'country' ? 4 : 2),
                            opacity: region.isExclusion ? 0.9 : 0.8,
                            fillOpacity: region.isExclusion ? 0.6 : 0.15, // More opaque red
                            dashArray: region.isExclusion ? '5, 5' : undefined,
                            className: 'region-transition'
                        }}
                    >
                        <LeafletTooltip sticky>
                            {region.isExclusion ? 'Excepto' : 'Seleccionado'}: {region.label}
                        </LeafletTooltip>
                    </GeoJSON>
                ))}

                <MapUpdater lat={numericLat} lng={numericLng} zoom={zoom} />
            </MapContainer>
        </Box>
    );
}
