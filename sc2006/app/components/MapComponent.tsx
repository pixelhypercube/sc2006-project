"use client"
import { useState, useEffect } from "react";
// 1. Import React Leaflet components and the required CSS
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
    caregivers?: Array<{
        id: string;
        name: string;
        locationCoords: number[];
        price?: number;
        dailyRate?: number;
        rating?: number;
        imageUrl?: string;
    }> | any;
    userLocation?: number[];
    onMapClick?: (coords: [number, number]) => void;
    searchRadius?: number;
    minDistance?: number;
}

const customMarkerIcon = new L.DivIcon({
    className: 'bg-transparent',
    html: `<div style="background-color: #0d9488; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

//  FOR USER
const userMarkerIcon = new L.DivIcon({
    className: 'bg-transparent',
    html: `<div style="background-color: #b75b9e; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

// helper function for coords
function MapUpdater({ coordinates }: { coordinates?: number[] }) {
    const map = useMap();

    useEffect(() => {
        if (coordinates && coordinates.length === 2 && coordinates[0] !== 0 && coordinates[1] !== 0) {
            try {
                if (map && map.getContainer() && map.getCenter()) {
                    map.flyTo([coordinates[0], coordinates[1]], 14, {
                        animate: true,
                        duration: 1.5
                    });
                }
            } catch (error) {
                console.error('Map flyTo error:', error);
            }
        }
    }, [coordinates, map]);

    return null;
}

function MapClickHandler({ onClick }: { onClick?: (coords: [number, number]) => void }) {
    useMapEvents({
        click(e) {
            if (onClick) {
                // extracts the lat and lng from click event
                onClick([e.latlng.lat, e.latlng.lng]);
            }
        }
    });
    return null; // doesn't render UI, just listens for events
}

export default function MapComponent(
    {
        caregivers = [],
        userLocation,
        onMapClick,
        searchRadius = 5,
        minDistance = 0
    } : MapComponentProps
) {
    const [boundaries, setBoundaries] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchDataGovSgBoundaries() {
            try {
                const datasetId = "d_4765db0e87b9c86336792efe8a1f7a66";
                const pollUrl = `https://api-open.data.gov.sg/v1/public/api/datasets/${datasetId}/poll-download`;

                let downloadUrl: string | null = null;
                for (let attempt = 0; attempt < 10; attempt++) {
                    const pollRes = await fetch(pollUrl);
                    if (!pollRes.ok) throw new Error("Failed to connect to data.gov.sg API");

                    const pollData = await pollRes.json();
                    if (pollData.code === 0) {
                        downloadUrl = pollData.data.url;
                        break;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 3000));
                }

                if (!downloadUrl) throw new Error("Download link not ready after polling");
                const geoJsonRes = await fetch(downloadUrl);
                const geoJsonData = await geoJsonRes.json();
                
                setBoundaries(geoJsonData);
            } catch (error) {
                console.error("Error fetching from data.gov.sg:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchDataGovSgBoundaries();
    }, []);

    // 2. Styling for the boundary polygons (matching your Teal/Amber theme)
    const geoJsonStyle = {
        fillColor: '#0d9488', // teal-600
        weight: 2,
        opacity: 1,
        color: '#ffffff', // white borders
        fillOpacity: 0.2
    };

    const onEachFeature = (feature: any, layer: any) => {
        const areaName = feature.properties?.PLN_AREA_N || "Unknown Area";
        
        layer.bindTooltip(areaName, {
            permanent: false,
            direction: 'center',
            className: 'bg-white px-2 py-1 rounded shadow-md text-sm font-bold text-teal-900 border-none'
        });

        layer.on({
            mouseover: (e: any) => {
                const currentLayer = e.target;
                currentLayer.setStyle({
                    fillOpacity: 0.5,
                    weight: 3,
                });
            },
            mouseout: (e: any) => {
                const currentLayer = e.target;
                currentLayer.setStyle(geoJsonStyle);
            },
            click: () => {
                console.log(`User clicked on: ${areaName}`);
            }
        });
    };

    return (
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {isLoading ? (
                <div className="h-125 flex items-center justify-center bg-gray-50">
                    <p className="text-teal-600 font-bold animate-pulse">
                        Mapping Singapore boundaries...
                    </p>
                </div>
            ) : (
                <div className="h-125 w-full relative z-0">
                    <MapContainer 
                        center={[1.3521, 103.8198]}
                        zoom={12} 
                        scrollWheelZoom={false}
                        className="h-full w-full"
                    >
                        {/* location updater handler */}
                        <MapUpdater coordinates={userLocation} />
                        {/* click handler */}
                        <MapClickHandler onClick={onMapClick} />''

                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        
                        {boundaries && (
                            <GeoJSON 
                                data={boundaries} 
                                style={geoJsonStyle}
                                onEachFeature={onEachFeature}
                            />
                        )}
                        
                        {/* FOR CAREGIVERS - Only show if minDistance is set */}
                        {minDistance > 0 && caregivers.filter((cg: any) => cg.locationCoords?.[0] != null && cg.locationCoords?.[1] != null).map((cg : any) => {
                            const avatarIcon = new L.DivIcon({
                                className: 'bg-transparent',
                                html: cg.imageUrl
                                    ? `<div style="width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); overflow: hidden; background: white;"><img src="${cg.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" /></div>`
                                    : `<div style="background-color: #0d9488; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">${cg.name?.[0] || '?'}</div>`,
                                iconSize: [40, 40],
                                iconAnchor: [20, 20],
                            });

                            return (
                                <Marker
                                    key={cg.id}
                                    position={[cg.locationCoords[0], cg.locationCoords[1]]}
                                    icon={avatarIcon}
                                >
                                    <Popup className="rounded-xl overflow-hidden font-sans">
                                        <div className="text-center p-1">
                                            <h3 className="font-bold text-slate-900 text-sm m-0 leading-tight">{cg.name}</h3>
                                            <p className="text-teal-600 font-bold text-xs mt-1 mb-0">${cg.price || cg.dailyRate}/day</p>
                                            {cg.rating && <p className="text-amber-500 font-bold text-[10px] mt-0.5 mb-0">★ {cg.rating}</p>}
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}

                        {/* FOR USER & SEARCH RADIUS */}
                        {userLocation && userLocation[0] !== 0 && userLocation[1] !== 0 && (
                            <>
                                {/* The Circle needs its radius in meters, so we multiply by 1000 */}
                                <Circle 
                                    center={[userLocation[0], userLocation[1]]} 
                                    radius={searchRadius * 1000} 
                                    pathOptions={{ 
                                        color: '#87296e',
                                        fillColor: '#87296e',
                                        fillOpacity: 0.1,
                                        weight: 2,
                                        // dashArray: '5, 5'
                                    }} 
                                />
                                <Marker position={[userLocation[0], userLocation[1]]} icon={userMarkerIcon}>
                                    <Popup className="rounded-xl overflow-hidden font-sans">
                                        <div className="text-center p-1 font-bold text-[#87296e]">Your Search Location</div>
                                    </Popup>
                                </Marker>
                            </>
                        )}
                    </MapContainer>
                </div>
            )}
        </div>
    );
}