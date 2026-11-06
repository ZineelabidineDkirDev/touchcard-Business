"use client";

import { useEffect, useRef } from "react";

type CityDemand = { city: string; count: number };

const cityLocations: Record<string, { lat: number; lng: number; region: string }> = {
  "tanger": { lat: 35.7595, lng: -5.8340, region: "Tanger-Tétouan-Al Hoceïma" },
  "tetouan": { lat: 35.5889, lng: -5.3626, region: "Tanger-Tétouan-Al Hoceïma" },
  "chefchaouen": { lat: 35.1688, lng: -5.2636, region: "Tanger-Tétouan-Al Hoceïma" },
  "al hoceima": { lat: 35.2446, lng: -3.9317, region: "Tanger-Tétouan-Al Hoceïma" },
  "oujda": { lat: 34.6814, lng: -1.9086, region: "Oriental" },
  "nador": { lat: 35.1681, lng: -2.9335, region: "Oriental" },
  "fes": { lat: 34.0331, lng: -5.0003, region: "Fès-Meknès" },
  "meknes": { lat: 33.8935, lng: -5.5473, region: "Fès-Meknès" },
  "rabat": { lat: 34.0209, lng: -6.8416, region: "Rabat-Salé-Kénitra" },
  "sale": { lat: 34.0531, lng: -6.7985, region: "Rabat-Salé-Kénitra" },
  "kenitra": { lat: 34.2610, lng: -6.5802, region: "Rabat-Salé-Kénitra" },
  "casablanca": { lat: 33.5731, lng: -7.5898, region: "Casablanca-Settat" },
  "el jadida": { lat: 33.2316, lng: -8.5007, region: "Casablanca-Settat" },
  "settat": { lat: 33.0010, lng: -7.6166, region: "Casablanca-Settat" },
  "beni mellal": { lat: 32.3373, lng: -6.3498, region: "Béni Mellal-Khénifra" },
  "khouribga": { lat: 32.8811, lng: -6.9063, region: "Béni Mellal-Khénifra" },
  "marrakech": { lat: 31.6295, lng: -7.9811, region: "Marrakech-Safi" },
  "safi": { lat: 32.2994, lng: -9.2372, region: "Marrakech-Safi" },
  "essaouira": { lat: 31.5085, lng: -9.7595, region: "Marrakech-Safi" },
  "ouarzazate": { lat: 30.9335, lng: -6.9370, region: "Drâa-Tafilalet" },
  "errachidia": { lat: 31.9314, lng: -4.4244, region: "Drâa-Tafilalet" },
  "agadir": { lat: 30.4278, lng: -9.5981, region: "Souss-Massa" },
  "taroudant": { lat: 30.4703, lng: -8.8769, region: "Souss-Massa" },
  "guelmim": { lat: 28.9870, lng: -10.0574, region: "Guelmim-Oued Noun" },
  "laayoune": { lat: 27.1536, lng: -13.2033, region: "Laâyoune-Sakia El Hamra" },
  "dakhla": { lat: 23.6848, lng: -15.9570, region: "Dakhla-Oued Ed-Dahab" },
};

function normalizeCity(value: string) {
  return value.trim().toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[-']/g, " ").replace(/\s+/g, " ");
}

export default function MoroccoProspectMap({ cities }: { cities: CityDemand[] }) {
  const mapElement = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: any;
    let cancelled = false;

    const loadLeaflet = async () => {
      if (!(window as any).L) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector<HTMLScriptElement>('script[data-leaflet="true"]');
          if (existing) {
            existing.addEventListener("load", () => resolve(), { once: true });
            if ((window as any).L) resolve();
            return;
          }
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.async = true;
          script.dataset.leaflet = "true";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Impossible de charger la bibliothèque cartographique."));
          document.head.appendChild(script);
        });
      }
      if (cancelled || !mapElement.current) return;

      const L = (window as any).L;
      map = L.map(mapElement.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      }).addTo(map);

      const bounds = L.latLngBounds([[21.0, -17.5], [36.2, -0.8]]);
      map.fitBounds(bounds, { padding: [14, 14] });

      const regionTotals = new Map<string, number>();
      cities.forEach(({ city, count }) => {
        const place = cityLocations[normalizeCity(city)];
        if (place) regionTotals.set(place.region, (regionTotals.get(place.region) ?? 0) + count);
      });

      cities.forEach(({ city, count }) => {
        const place = cityLocations[normalizeCity(city)];
        if (!place) return;
        const radius = Math.min(18, 7 + count * 2);
        const marker = L.circleMarker([place.lat, place.lng], {
          radius,
          color: "#ffffff",
          weight: 2,
          fillColor: "#4f46e5",
          fillOpacity: 0.88,
        }).addTo(map);
        marker.bindPopup(
          '<div style="font-family:Arial,sans-serif;min-width:150px">' +
          '<strong style="font-size:14px">' + city.replace(/[&<>"]/g, "") + '</strong>' +
          '<div style="margin-top:5px;color:#4f46e5;font-weight:700">' + count + ' demande(s)</div>' +
          '<div style="margin-top:3px;color:#64748b;font-size:12px">' + place.region + '</div></div>'
        );
        marker.bindTooltip(city + " · " + count, { direction: "top", offset: [0, -radius] });
      });
    };

    loadLeaflet().catch((error) => console.error(error));
    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [cities]);

  const knownRegions = new Map<string, number>();
  cities.forEach(({ city, count }) => {
    const place = cityLocations[normalizeCity(city)];
    if (place) knownRegions.set(place.region, (knownRegions.get(place.region) ?? 0) + count);
  });

  return (
    <div className="space-y-3">
      <div ref={mapElement} className="h-[360px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:h-[430px]" aria-label="Carte géographique réelle du Maroc avec les villes des prospects" />
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-indigo-600" /> Villes avec demandes</span>
        <span>· Taille du cercle proportionnelle au nombre de demandes</span>
      </div>
      {knownRegions.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {[...knownRegions.entries()].sort((a, b) => b[1] - a[1]).map(([region, count]) => (
            <span key={region} className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">{region} · {count}</span>
          ))}
        </div>
      )}
    </div>
  );
}
