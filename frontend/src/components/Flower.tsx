import type { GardenPlant, Growth, PlantType } from "@/lib/types";

/**
 * Original SVG botanical illustrations.
 *
 * Every species shares a stem and leaf system and differs in bloom geometry, so
 * the garden reads as one garden rather than a sticker sheet. Growth stage
 * controls how many petal layers are open.
 */

const STEM = "#7FBF95";
const LEAF = "#A8DBB8";
const LEAF_DARK = "#8CCB9F";

type Palette = {
  petals: string[];
  center: string;
  centerDark: string;
};

const PALETTES: Record<PlantType, Palette> = {
  sunflower: { petals: ["#F8CE63", "#F2B93F"], center: "#8A5524", centerDark: "#5E3612" },
  lavender: { petals: ["#C6B0F6", "#AE93EC"], center: "#8F76CF", centerDark: "#6E56AE" },
  rose: { petals: ["#F7B3CD", "#F094B8", "#E97CA6"], center: "#C4577F", centerDark: "#9C3D61" },
  sprout: { petals: ["#B9E6C6", "#9BD9B0"], center: "#7FBF95", centerDark: "#5E9E77" },
  bluebell: { petals: ["#A9CCF4", "#86B4E9"], center: "#5B87C0", centerDark: "#44699A" },
  lotus: { petals: ["#F6D3E2", "#EEB8CF"], center: "#FFE9B8", centerDark: "#D9B96A" },
  hibiscus: { petals: ["#F59A85", "#EE7E68"], center: "#FFD9A0", centerDark: "#C4694F" },
  moonflower: { petals: ["#E7E9FB", "#D2D7F3"], center: "#FFF0C4", centerDark: "#B7B9DA" },
  iris: { petals: ["#C3B1F4", "#A48CE4", "#8469CE"], center: "#FFE6A8", centerDark: "#8A72CE" },
  peony: { petals: ["#FBD3E1", "#F7BCD2", "#F2A5C2"], center: "#F8E2A8", centerDark: "#D8A66F" },
  blossom: {
    petals: ["#F7B3CD", "#F8CE63", "#C6B0F6", "#A9CCF4", "#B9E6C6"],
    center: "#FFE9B8",
    centerDark: "#E0B978",
  },
};

type BloomProps = {
  palette: Palette;
  growth: Growth;
  variant: number;
};

function ringLayers(growth: Growth): number {
  if (growth === "seedling") return 1;
  if (growth === "growing") return 2;
  return 3;
}

function EllipseRing({
  count,
  rx,
  ry,
  distance,
  fill,
  rotation = 0,
  opacity = 1,
}: {
  count: number;
  rx: number;
  ry: number;
  distance: number;
  fill: string;
  rotation?: number;
  opacity?: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <ellipse
          key={`${fill}-${index}`}
          cx={0}
          cy={-distance}
          rx={rx}
          ry={ry}
          fill={fill}
          opacity={opacity}
          transform={`rotate(${(360 / count) * index + rotation})`}
        />
      ))}
    </>
  );
}

function PointedRing({
  count,
  size,
  distance,
  fill,
  rotation = 0,
  opacity = 1,
}: {
  count: number;
  size: number;
  distance: number;
  fill: string;
  rotation?: number;
  opacity?: number;
}) {
  const path = `M0 ${-distance + size} Q ${size * 0.75} ${-distance} 0 ${-distance - size} Q ${-size * 0.75} ${-distance} 0 ${-distance + size} Z`;
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <path
          key={`${fill}-${index}`}
          d={path}
          fill={fill}
          opacity={opacity}
          transform={`rotate(${(360 / count) * index + rotation})`}
        />
      ))}
    </>
  );
}

function HeartRing({
  count,
  size,
  fill,
  rotation = 0,
  opacity = 1,
}: {
  count: number;
  size: number;
  fill: string;
  rotation?: number;
  opacity?: number;
}) {
  const path = `M0 ${-size * 0.15} C ${-size * 1.15} ${-size * 1.05} ${-size * 0.6} ${-size * 1.95} 0 ${-size * 1.2} C ${size * 0.6} ${-size * 1.95} ${size * 1.15} ${-size * 1.05} 0 ${-size * 0.15} Z`;
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <path
          key={`${fill}-${index}`}
          d={path}
          fill={fill}
          opacity={opacity}
          transform={`rotate(${(360 / count) * index + rotation})`}
        />
      ))}
    </>
  );
}

function Bloom({ plantType, palette, growth, variant }: { plantType: PlantType } & BloomProps) {
  const layers = ringLayers(growth);
  const rotation = variant * 11;

  if (plantType === "sunflower") {
    return (
      <g>
        <EllipseRing count={13} rx={7} ry={17} distance={21} fill={palette.petals[0]} rotation={rotation} />
        {layers > 1 ? (
          <EllipseRing count={13} rx={6} ry={13} distance={15} fill={palette.petals[1]} rotation={rotation + 13} />
        ) : null}
        <circle r={12} fill={palette.center} />
        <circle r={7.5} fill={palette.centerDark} opacity={0.6} />
        {layers > 2 ? (
          <>
            <circle r={3} cx={-3} cy={-2} fill="#FFE9B8" opacity={0.7} />
            <circle r={2} cx={4} cy={3} fill="#FFE9B8" opacity={0.6} />
          </>
        ) : null}
      </g>
    );
  }

  if (plantType === "lavender") {
    const beads = growth === "seedling" ? 5 : growth === "growing" ? 7 : 9;
    return (
      <g>
        {Array.from({ length: beads }).map((_, index) => {
          const offset = index * 6.4;
          const drift = Math.sin((index + variant) * 1.1) * 3;
          return (
            <ellipse
              key={index}
              cx={drift}
              cy={offset - 22}
              rx={6.5 - index * 0.28}
              ry={5 - index * 0.2}
              fill={index % 2 === 0 ? palette.petals[0] : palette.petals[1]}
              transform={`rotate(${drift * 1.4} ${drift} ${offset - 22})`}
            />
          );
        })}
        {layers > 2 ? (
          <circle cx={0} cy={-26} r={2.6} fill={palette.center} opacity={0.8} />
        ) : null}
      </g>
    );
  }

  if (plantType === "rose") {
    return (
      <g>
        <HeartRing count={6} size={13} fill={palette.petals[2]} rotation={rotation} />
        <HeartRing count={5} size={10} fill={palette.petals[1]} rotation={rotation + 24} />
        {layers > 1 ? (
          <HeartRing count={4} size={7} fill={palette.petals[0]} rotation={rotation + 52} />
        ) : null}
        <circle r={4} fill={palette.center} opacity={0.85} />
      </g>
    );
  }

  if (plantType === "sprout") {
    return (
      <g>
        <circle r={7} fill={palette.petals[0]} opacity={0.9} />
        <path d="M0 -4 C 3 -12 9 -14 12 -13 C 11 -7 6 -3 0 -4 Z" fill={LEAF_DARK} />
        {layers > 1 ? (
          <path d="M0 -2 C -4 -13 -11 -15 -14 -13 C -12 -6 -6 -1 0 -2 Z" fill={LEAF} />
        ) : null}
        {growth === "bloom" ? <circle cx={2} cy={-9} r={2.4} fill="#FFF0C4" /> : null}
      </g>
    );
  }

  if (plantType === "bluebell") {
    const bells = growth === "seedling" ? 2 : growth === "growing" ? 3 : 4;
    return (
      <g>
        {Array.from({ length: bells }).map((_, index) => {
          const x = (index - (bells - 1) / 2) * 8;
          const y = Math.abs(x) * 0.5;
          return (
            <g key={index} transform={`translate(${x} ${y})`}>
              <path
                d="M0 0 C 6 3 7 10 3 14 L -3 14 C -7 10 -6 3 0 0 Z"
                fill={index % 2 === 0 ? palette.petals[0] : palette.petals[1]}
              />
              <path d="M-3 14 L 3 14 L 0 18 Z" fill={palette.centerDark} opacity={0.5} />
            </g>
          );
        })}
      </g>
    );
  }

  if (plantType === "lotus") {
    return (
      <g>
        <PointedRing count={8} size={15} distance={13} fill={palette.petals[1]} rotation={rotation} />
        <PointedRing count={6} size={11} distance={9} fill={palette.petals[0]} rotation={rotation + 22} />
        {layers > 1 ? (
          <PointedRing count={4} size={8} distance={6} fill={palette.center} rotation={rotation + 40} opacity={0.85} />
        ) : null}
        <circle r={4} fill={palette.centerDark} opacity={0.5} />
      </g>
    );
  }

  if (plantType === "hibiscus") {
    return (
      <g>
        <EllipseRing count={5} rx={14} ry={16} distance={13} fill={palette.petals[0]} rotation={rotation + 20} />
        {layers > 1 ? (
          <EllipseRing count={5} rx={10} ry={12} distance={9} fill={palette.petals[1]} rotation={rotation + 56} opacity={0.9} />
        ) : null}
        <circle r={6} fill={palette.center} />
        <path d="M0 0 L 2 -18" stroke={palette.centerDark} strokeWidth={2.4} strokeLinecap="round" />
        <circle cx={2} cy={-19} r={2.6} fill={palette.centerDark} />
      </g>
    );
  }

  if (plantType === "moonflower") {
    return (
      <g transform={`translate(${6 + variant} 0)`}>
        <EllipseRing count={7} rx={9} ry={13} distance={11} fill={palette.petals[0]} rotation={rotation} />
        {layers > 1 ? (
          <EllipseRing count={6} rx={7} ry={9} distance={7} fill={palette.petals[1]} rotation={rotation + 30} opacity={0.9} />
        ) : null}
        <circle r={6} fill={palette.center} />
        {layers > 2 ? (
          <circle r={2.4} cx={2} cy={-2} fill={palette.centerDark} opacity={0.5} />
        ) : null}
      </g>
    );
  }

  if (plantType === "iris") {
    return (
      <g>
        <PointedRing count={3} size={17} distance={19} fill={palette.petals[0]} rotation={rotation} />
        <g transform={`rotate(${rotation})`}>
          <PointedRing count={3} size={13} distance={16} fill={palette.petals[2]} rotation={60} opacity={0.85} />
        </g>
        {layers > 1 ? (
          <PointedRing count={3} size={10} distance={10} fill={palette.petals[1]} rotation={rotation + 30} />
        ) : null}
        <circle r={3.4} fill={palette.center} />
      </g>
    );
  }

  if (plantType === "peony") {
    return (
      <g>
        <EllipseRing count={9} rx={11} ry={12} distance={12} fill={palette.petals[2]} rotation={rotation} opacity={0.95} />
        {layers > 1 ? (
          <EllipseRing count={8} rx={8.5} ry={9.5} distance={8.5} fill={palette.petals[1]} rotation={rotation + 19} />
        ) : null}
        {layers > 2 ? (
          <EllipseRing count={6} rx={6} ry={7} distance={5.5} fill={palette.petals[0]} rotation={rotation + 38} />
        ) : null}
        <circle r={4.5} fill={palette.center} />
        <circle r={2} fill={palette.centerDark} opacity={0.45} />
      </g>
    );
  }

  // blossom: five petals, each a different pastel, one stable palette per plant
  return (
    <g>
      {Array.from({ length: 5 }).map((_, index) => {
        const colour = palette.petals[(index + variant) % palette.petals.length];
        return (
          <ellipse
            key={index}
            cx={0}
            cy={-13}
            rx={9.5}
            ry={12}
            fill={colour}
            opacity={0.95}
            transform={`rotate(${72 * index + rotation})`}
          />
        );
      })}
      {layers > 1 ? (
        <EllipseRing count={5} rx={6} ry={8} distance={7} fill="#FFFFFF" opacity={0.55} rotation={rotation + 30} />
      ) : null}
      <circle r={5} fill={palette.center} />
      <circle r={2.2} fill={palette.centerDark} opacity={0.5} />
    </g>
  );
}

function Leaf({ x, y, flip = false, fill }: { x: number; y: number; flip?: boolean; fill: string }) {
  const d = `M ${x} ${y} C ${x - 15} ${y - 13} ${x - 26} ${y - 4} ${x - 23} ${y + 6} C ${x - 11} ${y + 9} ${x - 2} ${y + 4} ${x} ${y} Z`;
  return (
    <path
      d={d}
      fill={fill}
      transform={flip ? `translate(${x * 2} 0) scale(-1 1)` : undefined}
    />
  );
}

const CORE_Y: Partial<Record<PlantType, number>> = {
  sprout: 96,
  lavender: 66,
  bluebell: 92,
  moonflower: 88,
};

export function Flower({ plant }: { plant: GardenPlant }) {
  const palette = PALETTES[plant.plantType] ?? PALETTES.blossom;
  const coreY = CORE_Y[plant.plantType] ?? 80;
  const variant = plant.variant % 4;
  const sway = variant - 1.5;

  return (
    <svg
      viewBox="0 0 120 170"
      width={118}
      height={167}
      role="presentation"
      className="overflow-visible drop-shadow-[0_10px_10px_rgba(88,70,120,0.14)]"
    >
      <path
        d={`M60 166 C ${56 - sway} 142, ${66 + sway} 116, ${60 + sway * 2} ${coreY + 10}`}
        stroke={STEM}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
      <Leaf x={58 + sway} y={146} fill={LEAF} />
      <Leaf x={62 + sway} y={132} flip fill={LEAF_DARK} />
      {plant.growth !== "seedling" ? <Leaf x={59} y={154} fill={LEAF} /> : null}
      <g transform={`translate(${60 + sway * 2} ${coreY})`}>
        <Bloom
          plantType={plant.plantType}
          palette={palette}
          growth={plant.growth}
          variant={variant}
        />
      </g>
    </svg>
  );
}
