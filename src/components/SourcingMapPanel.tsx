import React, { useEffect, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { MapPin, Navigation } from 'lucide-react';
import { APP_SOURCING_HUBS, type HubCategory, type SourcingHubPin } from '../data/sourcingHubs';
import type { OperatingLocation } from '../utils/simulator';

interface SourcingMapPanelProps {
  activeLocation: OperatingLocation;
  requiresRawFabric: boolean;
}

const LOCATION_CENTER: Record<OperatingLocation, { lat: number; lng: number; zoom: number }> = {
  cairo_giza: { lat: 30.11, lng: 31.32, zoom: 10 },
  delta_mahalla: { lat: 30.97, lng: 31.17, zoom: 11 },
  alex_north: { lat: 31.08, lng: 29.75, zoom: 10 },
  canal_portsaid: { lat: 31.26, lng: 32.3, zoom: 12 },
  upper_egypt: { lat: 29.05, lng: 31.12, zoom: 11 },
  gulf_ksa_uae: { lat: 24.95, lng: 51.0, zoom: 5 },
  international_remote: { lat: 35.5, lng: 30.2, zoom: 4 },
};

const CATEGORY_COLORS: Record<HubCategory, { bg: string; border: string; glyph: string }> = {
  wholesale: { bg: '#0f766e', border: '#115e59', glyph: '#ffffff' },
  fabric: { bg: '#d97706', border: '#92400e', glyph: '#ffffff' },
  factory: { bg: '#1e293b', border: '#0f172a', glyph: '#ffffff' },
  trims: { bg: '#4f46e5', border: '#312e81', glyph: '#ffffff' },
};

const HubMarker: React.FC<{
  hub: SourcingHubPin;
  selected: boolean;
  onSelect: (hub: SourcingHubPin) => void;
  onClose: () => void;
}> = ({ hub, selected, onSelect, onClose }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const colors = CATEGORY_COLORS[hub.category];

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={hub.position}
        title={hub.nameAr}
        onClick={() => onSelect(hub)}
      >
        <Pin
          background={colors.bg}
          borderColor={colors.border}
          glyphColor={colors.glyph}
          scale={selected ? 1.2 : 1.0}
        />
      </AdvancedMarker>
      {selected && marker && (
        <InfoWindow anchor={marker} maxWidth={260} onCloseClick={onClose}>
          <div dir="rtl" className="p-1 text-right space-y-1 font-sans">
            <div className="text-xs font-bold text-slate-900">{hub.nameAr}</div>
            <div className="text-[11px] font-semibold text-teal-800">{hub.categoryLabelAr}</div>
            <div className="text-[11px] text-slate-700">{hub.priceGuideAr}</div>
            <p className="text-[11px] text-slate-600 leading-snug">{hub.bestForAr}</p>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export const SourcingMapPanel: React.FC<SourcingMapPanelProps> = ({
  activeLocation,
  requiresRawFabric,
}) => {
  const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';
  const [apiKey, setApiKey] = useState<string>(envKey);
  const [checkedRemoteKey, setCheckedRemoteKey] = useState<boolean>(Boolean(envKey));
  const [categoryFilter, setCategoryFilter] = useState<HubCategory | 'all'>('all');
  const [selectedHub, setSelectedHub] = useState<SourcingHubPin | null>(null);

  useEffect(() => {
    if (envKey) return;
    let active = true;
    fetch('/api/public-config')
      .then((res) => res.json())
      .then((data: { mapsApiKey?: string }) => {
        if (active && data.mapsApiKey) {
          setApiKey(data.mapsApiKey);
        }
      })
      .catch(() => {
        // Ignore if public config unavailable
      })
      .finally(() => {
        if (active) setCheckedRemoteKey(true);
      });
    return () => {
      active = false;
    };
  }, [envKey]);

  const filteredHubs = APP_SOURCING_HUBS.filter((hub) => {
    if (categoryFilter !== 'all' && hub.category !== categoryFilter) return false;
    return true;
  });

  const view = LOCATION_CENTER[activeLocation] || LOCATION_CENTER.cairo_giza;

  useEffect(() => {
    const firstMatch = APP_SOURCING_HUBS.find((h) => h.locationKey === activeLocation);
    if (firstMatch) {
      setSelectedHub(firstMatch);
    }
  }, [activeLocation]);

  return (
    <div className="mt-4 rounded-2xl border border-amber-200/90 bg-white p-4 shadow-xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-teal-700" />
          <h4 className="text-xs font-bold text-slate-900">
            خريطة مراكز الجملة والأقمشة والمصانع (Google Maps)
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'wholesale', label: 'مكاتب جملة / بلانكات' },
            { id: 'fabric', label: 'أسواق أقمشة' },
            { id: 'factory', label: 'مصانع CMT/FOB' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setCategoryFilter(btn.id as HubCategory | 'all')}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                categoryFilter === btn.id
                  ? 'bg-teal-700 text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {!apiKey && !checkedRemoteKey ? (
        <div className="flex h-[320px] items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-600">
          جاري تهيئة خريطة مراكز التصنيع والأسواق...
        </div>
      ) : !apiKey ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950 space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <MapPin className="h-4 w-4 text-amber-700" />
            <span>خريطة مراكز التوريد التفاعلية بانتظار توفر مفتاح Google Maps في البيئة</span>
          </div>
          <p className="text-slate-700">
            بمجرد تفعيل مفتاح الخرائط في البيئة ستظهر خريطة Google التفاعلية الكاملة هنا. في الوقت الحالي يمكنك استعراض النقاط الجغرافية مباشرة:
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filteredHubs.slice(0, 6).map((hub) => (
              <div key={hub.id} className="rounded-lg border border-amber-200 bg-white p-2.5">
                <div className="font-bold text-slate-900">{hub.nameAr}</div>
                <div className="text-[11px] text-teal-800">{hub.priceGuideAr}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="h-[340px] w-full overflow-hidden rounded-xl border border-slate-200">
            <APIProvider apiKey={apiKey} libraries={['marker']} language="ar" region="EG">
              <GoogleMap
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                defaultCenter={view}
                center={selectedHub ? selectedHub.position : view}
                defaultZoom={view.zoom}
                gestureHandling="greedy"
                style={{ width: '100%', height: '100%' }}
              >
                {filteredHubs.map((hub) => (
                  <HubMarker
                    key={hub.id}
                    hub={hub}
                    selected={selectedHub?.id === hub.id}
                    onSelect={setSelectedHub}
                    onClose={() => setSelectedHub(null)}
                  />
                ))}
              </GoogleMap>
            </APIProvider>
          </div>

          {/* Quick Hub Jump Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {filteredHubs.map((hub) => {
              const highlighted = !requiresRawFabric && hub.noRawFabricFriendly;
              const active = selectedHub?.id === hub.id;
              return (
                <button
                  key={hub.id}
                  type="button"
                  onClick={() => setSelectedHub(hub)}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${
                    active
                      ? 'border-teal-700 bg-teal-700 text-white font-semibold'
                      : highlighted
                        ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950 hover:border-teal-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{hub.nameAr}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
