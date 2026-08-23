import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'

type Point = {
  id: string
  name: string
  latitude: number
  longitude: number
  kind: string
  description?: string | null
  date?: string | null
  imageUrl?: string | null
  visitCount?: number
}

export default function IslandMap({ points }: { points: Point[] }) {
  return (
    <MapContainer
      center={[34.4597, 133.9957]}
      zoom={13}
      scrollWheelZoom={false}
      className="island-map"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((point) => (
        <CircleMarker
          key={point.id}
          center={[point.latitude, point.longitude]}
          radius={8}
          pathOptions={{
            color: point.kind === 'MEMORY' ? '#ef735d' : '#328f97',
            fillOpacity: 0.8,
          }}
        >
          <Popup>
            <strong>{point.name}</strong>
            <br />
            {point.date ?? point.kind}
            {point.imageUrl ? (
              <>
                <br />
                <img src={point.imageUrl} alt={point.name} width="180" />
              </>
            ) : null}
            {point.description ? (
              <>
                <br />
                {point.description}
              </>
            ) : null}
            <br />
            訪問 {point.visitCount ?? 0}回
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
