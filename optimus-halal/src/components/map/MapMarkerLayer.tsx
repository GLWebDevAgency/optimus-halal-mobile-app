import React from "react";
import { storeTypeColors } from "@/theme/colors";

// Mapbox components are injected as props to avoid top-level require
// (the native module may not be available in all environments)
interface Props {
  ShapeSource: any;
  CircleLayer: any;
  SymbolLayer: any;
  geoJSON: any;
  selectedStoreId: string | null;
  isDark: boolean;
  primaryColor: string;
  onPress: (event: any) => void;
}

export const MapMarkerLayer = React.memo(function MapMarkerLayer({
  ShapeSource,
  CircleLayer,
  SymbolLayer,
  geoJSON,
  selectedStoreId,
  isDark,
  primaryColor,
  onPress,
}: Props) {
  return (
    <ShapeSource
      id="stores-source"
      shape={geoJSON}
      cluster
      clusterRadius={50}
      clusterMaxZoomLevel={14}
      onPress={onPress}
    >
      {/* Cluster circles */}
      <CircleLayer
        id="clusters"
        filter={["has", "point_count"]}
        style={{
          circleColor: primaryColor,
          circleRadius: [
            "step",
            ["get", "point_count"],
            18,
            10, 24,
            50, 32,
          ],
          circleOpacity: 0.85,
          circleStrokeWidth: 2,
          circleStrokeColor: "#ffffff",
        }}
      />

      {/* Cluster count text */}
      <SymbolLayer
        id="cluster-count"
        filter={["has", "point_count"]}
        style={{
          textField: ["get", "point_count_abbreviated"],
          textSize: 13,
          textColor: "#ffffff",
          textFont: ["DIN Pro Medium"],
          textAllowOverlap: true,
        }}
      />

      {/* Individual store markers — color-coded by type, sized by open status */}
      <CircleLayer
        id="store-markers"
        filter={["!", ["has", "point_count"]]}
        style={{
          circleColor: [
            "match", ["get", "storeType"],
            "butcher", storeTypeColors.butcher.base,
            "restaurant", storeTypeColors.restaurant.base,
            "supermarket", storeTypeColors.supermarket.base,
            "bakery", storeTypeColors.bakery.base,
            "abattoir", storeTypeColors.abattoir.base,
            "wholesaler", storeTypeColors.wholesaler.base,
            "online", storeTypeColors.online.base,
            storeTypeColors.other.base,
          ],
          circleRadius: [
            "case",
            ["==", ["get", "id"], selectedStoreId ?? ""],
            12,
            ["any",
              ["==", ["get", "openStatus"], "open"],
              ["==", ["get", "openStatus"], "closing_soon"],
            ],
            8,
            6.5,
          ],
          circleStrokeWidth: [
            "case",
            ["==", ["get", "id"], selectedStoreId ?? ""],
            3,
            2,
          ],
          circleStrokeColor: isDark ? "rgba(255,255,255,0.9)" : "#ffffff",
          circleStrokeOpacity: isDark ? 0.8 : 1,
          circleOpacity: [
            "case",
            ["==", ["get", "openStatus"], "closed"],
            0.5,
            0.95,
          ],
        }}
      />

      {/* Selected marker highlight ring — rendered AFTER markers for correct z-order */}
      <CircleLayer
        id="store-markers-ring"
        filter={["all",
          ["!", ["has", "point_count"]],
          ["==", ["get", "id"], selectedStoreId ?? ""],
        ]}
        style={{
          circleColor: "transparent",
          circleRadius: 22,
          circleStrokeWidth: 2.5,
          circleStrokeColor: primaryColor,
          circleStrokeOpacity: isDark ? 0.8 : 0.6,
        }}
      />
    </ShapeSource>
  );
});
