import { useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import MapView, { Marker, Callout, Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import type { Ocorrencia } from "@/src/types/ocorrencia";
import { TIPO_CORES, TIPO_NOMES, TIPO_ICONES, TIPOS } from "@/src/constants/ocorrencia";

const C = {
  primary:       "#0A5CFF",
  surface:       "#FFFFFF",
  text:          "#1A1F36",
  textSecondary: "#5A6A7D",
  textMuted:     "#9AA5B4",
  border:        "#E8ECF0",
  background:    "#F5F7FA",
};

interface Props {
  ocorrencias: Ocorrencia[];
  height?: number;
}

const REGION_DEFAULT: Region = {
  latitude:       -15.7801,
  longitude:      -47.9292,
  latitudeDelta:  0.05,
  longitudeDelta: 0.05,
};

function calcularRegiao(ocorrencias: Ocorrencia[]): Region {
  const validas = ocorrencias.filter((o) => o.latitude != null && o.longitude != null);
  if (validas.length === 0) return REGION_DEFAULT;

  const lats = validas.map((o) => Number(o.latitude));
  const lngs = validas.map((o) => Number(o.longitude));

  return {
    latitude:       (Math.min(...lats) + Math.max(...lats)) / 2,
    longitude:      (Math.min(...lngs) + Math.max(...lngs)) / 2,
    latitudeDelta:  Math.max(Math.max(...lats) - Math.min(...lats), 0.01) * 1.4,
    longitudeDelta: Math.max(Math.max(...lngs) - Math.min(...lngs), 0.01) * 1.4,
  };
}

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

// ─── Filtro de tipos ──────────────────────────────────────────────────────────

function TipoFilterBar({
  selected,
  onToggle,
  counts,
}: {
  selected: Set<string>;
  onToggle: (tipo: string) => void;
  counts: Record<string, number>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScroll}
      contentContainerStyle={styles.filterContent}
    >
      {TIPOS.map((tipo) => {
        const ativo = selected.has(tipo);
        const cor   = TIPO_CORES[tipo];
        const count = counts[tipo] ?? 0;
        if (count === 0) return null; // esconde tipos sem ocorrência

        return (
          <Pressable
            key={tipo}
            style={[
              styles.filterChip,
              ativo && { backgroundColor: cor + "20", borderColor: cor },
            ]}
            onPress={() => onToggle(tipo)}
          >
            <Ionicons
              name={TIPO_ICONES[tipo] as any}
              size={13}
              color={ativo ? cor : C.textMuted}
            />
            <Text style={[styles.filterChipText, ativo && { color: cor, fontWeight: "600" }]}>
              {TIPO_NOMES[tipo]}
            </Text>
            <View style={[styles.filterChipBadge, ativo && { backgroundColor: cor }]}>
              <Text style={[styles.filterChipBadgeText, ativo && { color: "#FFF" }]}>
                {count}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function OcorrenciasMap({ ocorrencias, height = 320 }: Props) {
  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [tiposFiltro, setTiposFiltro] = useState<Set<string>>(new Set(TIPOS)); // todos ativos por padrão

  // Só pendentes e em_andamento, com coordenadas
  const visiveis = ocorrencias.filter(
    (o) =>
      o.latitude != null &&
      o.longitude != null &&
      (o.status === "pendente" || o.status === "andamento") &&
      tiposFiltro.has(o.tipo ?? "")
  );

  // Contagem por tipo (antes do filtro de tipo, pra mostrar quantos existem)
  const counts = TIPOS.reduce<Record<string, number>>((acc, tipo) => {
    acc[tipo] = ocorrencias.filter(
      (o) =>
        o.tipo === tipo &&
        o.latitude != null &&
        o.longitude != null &&
        (o.status === "pendente" || o.status === "andamento")
    ).length;
    return acc;
  }, {});

  const regiao = calcularRegiao(visiveis);

  function toggleTipo(tipo: string) {
    setTiposFiltro((prev) => {
      const next = new Set(prev);
      next.has(tipo) ? next.delete(tipo) : next.add(tipo);
      // nunca deixa vazio — se tentar remover o último, ignora
      return next.size === 0 ? prev : next;
    });
  }

  return (
    <View style={styles.wrapper}>
      {/* Filtros de tipo */}
      <TipoFilterBar
        selected={tiposFiltro}
        onToggle={toggleTipo}
        counts={counts}
      />

      {/* Mapa */}
      <View style={[styles.container, { height }]}>
        {visiveis.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={40} color={C.textMuted} />
            <Text style={styles.emptyText}>Nenhuma ocorrência no mapa</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={regiao}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {visiveis.map((oc) => {
              const cor      = TIPO_CORES[oc.tipo ?? ""] ?? "#6B7280";
              const tipoNome = TIPO_NOMES[oc.tipo ?? ""] ?? "Ocorrência";
              const selected = selectedId === oc.id;

              return (
                <Marker
                  key={oc.id}
                  coordinate={{
                    latitude:  Number(oc.latitude),
                    longitude: Number(oc.longitude),
                  }}
                  onPress={() => setSelectedId(selected ? null : oc.id)}
                >
                  <View style={[
                    styles.markerOuter,
                    { borderColor: cor },
                    selected && styles.markerOuterSelected,
                  ]}>
                    <View style={[styles.markerInner, { backgroundColor: cor }]} />
                  </View>

                  <Callout tooltip>
                    <View style={styles.callout}>
                      <View style={styles.calloutHeader}>
                        <View style={[styles.calloutDot, { backgroundColor: cor }]} />
                        <Text style={styles.calloutTipo}>{tipoNome}</Text>
                        <View style={[
                          styles.calloutStatus,
                          { backgroundColor: oc.status === "pendente" ? "#FEF3C7" : "#DBEAFE" },
                        ]}>
                          <Text style={[
                            styles.calloutStatusText,
                            { color: oc.status === "pendente" ? "#92400E" : "#1E40AF" },
                          ]}>
                            {oc.status === "pendente" ? "Pendente" : "Em andamento"}
                          </Text>
                        </View>
                      </View>

                      {!!oc.descricao && (
                        <Text style={styles.calloutDescricao} numberOfLines={2}>
                          {oc.descricao}
                        </Text>
                      )}

                      {!!oc.endereco && (
                        <View style={styles.calloutRow}>
                          <Ionicons name="location-outline" size={12} color={C.textMuted} />
                          <Text style={styles.calloutMeta} numberOfLines={1}>{oc.endereco}</Text>
                        </View>
                      )}

                      <View style={styles.calloutRow}>
                        <Ionicons name="calendar-outline" size={12} color={C.textMuted} />
                        <Text style={styles.calloutMeta}>{formatarData(oc.data_ocorrencia)}</Text>
                      </View>
                    </View>
                  </Callout>
                </Marker>
              );
            })}
          </MapView>
        )}

        {/* Contador */}
        {visiveis.length > 0 && (
          <View style={styles.counter}>
            <Ionicons name="alert-circle" size={13} color={C.primary} />
            <Text style={styles.counterText}>{visiveis.length} no mapa</Text>
          </View>
        )}

        {/* Centralizar */}
        {visiveis.length > 0 && (
          <Pressable
            style={styles.centerButton}
            onPress={() => mapRef.current?.animateToRegion(regiao, 500)}
          >
            <Ionicons name="contract-outline" size={18} color={C.text} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: { gap: 10 },

  // Filtros
  filterScroll:          { flexGrow: 0 },
  filterContent:         { gap: 8, paddingHorizontal: 2 },
  filterChip:            { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  filterChipText:        { fontSize: 12, color: C.textMuted },
  filterChipBadge:       { backgroundColor: C.border, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  filterChipBadgeText:   { fontSize: 10, fontWeight: "600", color: C.textSecondary },

  // Mapa
  container: { borderRadius: 16, overflow: "hidden" },
  map:       { flex: 1 },

  // Marcador
  markerOuter:         { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: C.surface },
  markerOuterSelected: { width: 26, height: 26, borderRadius: 13 },
  markerInner:         { width: 10, height: 10, borderRadius: 5 },

  // Callout
  callout:            { backgroundColor: C.surface, borderRadius: 12, padding: 12, minWidth: 200, maxWidth: 260, gap: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  calloutHeader:      { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  calloutDot:         { width: 10, height: 10, borderRadius: 5 },
  calloutTipo:        { fontSize: 14, fontWeight: "700", color: C.text },
  calloutStatus:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  calloutStatusText:  { fontSize: 10, fontWeight: "600" },
  calloutDescricao:   { fontSize: 12, color: C.textSecondary, lineHeight: 17 },
  calloutRow:         { flexDirection: "row", alignItems: "center", gap: 5 },
  calloutMeta:        { fontSize: 11, color: C.textMuted, flex: 1 },

  // Overlay
  counter:       { position: "absolute", top: 10, left: 10, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  counterText:   { fontSize: 12, fontWeight: "600", color: C.text },
  centerButton:  { position: "absolute", bottom: 10, right: 10, backgroundColor: C.surface, width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },

  // Empty
  empty:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.background },
  emptyText: { fontSize: 13, color: C.textMuted },
});