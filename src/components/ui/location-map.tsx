"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapLocation {
  id: string;
  name: string;
  stateName: string;
  latitude: number;
  longitude: number;
  assetCount: number;
  consumableCount: number;
  staffCount: number;
}

interface LocationMapProps {
  locations: MapLocation[];
  className?: string;
}

export function LocationMap({ locations, className = "" }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || locations.length === 0) return;

    // Destroy existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Calculate center from all locations
    const avgLat = locations.reduce((sum, l) => sum + l.latitude, 0) / locations.length;
    const avgLng = locations.reduce((sum, l) => sum + l.longitude, 0) / locations.length;

    const map = L.map(mapRef.current, {
      center: [avgLat, avgLng],
      zoom: 5,
      zoomControl: true,
      attributionControl: false,
    });

    // Clean, modern tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    // Custom marker icon
    const createIcon = (count: number) => {
      const size = count > 50 ? 44 : count > 20 ? 38 : 32;
      return L.divIcon({
        className: "",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<div style="
          width: ${size}px;
          height: ${size}px;
          background: #1F3DD9;
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: ${size > 38 ? 13 : 11}px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(31,61,217,0.4);
          cursor: pointer;
        ">${count}</div>`,
      });
    };

    // Add markers
    for (const loc of locations) {
      const totalItems = loc.assetCount + loc.consumableCount;
      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: createIcon(totalItems),
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; padding: 4px 0; min-width: 160px;">
          <p style="font-weight: 700; font-size: 14px; color: #292d34; margin: 0 0 2px 0;">${loc.name}</p>
          <p style="font-size: 11px; color: #8b8f96; margin: 0 0 8px 0;">${loc.stateName}</p>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; color: #6b7080;">Assets</span>
              <span style="font-size: 13px; font-weight: 600; color: #292d34;">${loc.assetCount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; color: #6b7080;">Supplies</span>
              <span style="font-size: 13px; font-weight: 600; color: #292d34;">${loc.consumableCount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; color: #6b7080;">Staff</span>
              <span style="font-size: 13px; font-weight: 600; color: #292d34;">${loc.staffCount}</span>
            </div>
          </div>
        </div>
      `, { closeButton: false, className: "custom-popup" });
    }

    // Fit bounds to show all markers
    if (locations.length > 1) {
      const bounds = L.latLngBounds(locations.map((l) => [l.latitude, l.longitude]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locations]);

  if (locations.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-shark-50 rounded-xl text-shark-400 text-sm ${className}`} style={{ minHeight: 300 }}>
        No locations with coordinates configured
      </div>
    );
  }

  return (
    <>
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          padding: 4px;
        }
        .custom-popup .leaflet-popup-tip {
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
      `}</style>
      <div ref={mapRef} className={`rounded-xl overflow-hidden ${className}`} style={{ minHeight: 300 }} />
    </>
  );
}
