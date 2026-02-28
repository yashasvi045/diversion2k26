"use client";

/**
 * GlobeScene.tsx
 * --------------
 * Animated 3D globe built with React Three Fiber + Drei.
 * - Rotating sphere with subtle green/dark aesthetic
 * - Wireframe grid overlay
 * - Atmospheric glow halo
 * - Glowing city pin markers
 *
 * Designed for use in the landing page hero.
 * Must be dynamically imported with ssr: false.
 */

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ── Explicit lat/lon grid lines ───────────────────────────────────────────────
function GlobeGrid({ radius = 1.002, segments = 64, color = "#16a34a", opacity = 0.45 }) {
  const lines = useMemo(() => {
    const geo: THREE.BufferGeometry[] = [];

    // Latitude circles (parallels) — evenly spaced, drawn as closed rings
    const latSteps = 24; // number of parallels (excluding poles)
    for (let i = 1; i < latSteps; i++) {
      const lat = -90 + (180 / latSteps) * i;
      const phi = (90 - lat) * (Math.PI / 180);
      const y = radius * Math.cos(phi);
      const r = radius * Math.sin(phi);
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= segments; j++) {
        const theta = (j / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)));
      }
      geo.push(new THREE.BufferGeometry().setFromPoints(pts));
    }

    // Longitude lines (meridians) — evenly spaced vertical great circles
    const lonSteps = 36; // number of meridians
    for (let i = 0; i < lonSteps; i++) {
      const lon = (i / lonSteps) * Math.PI * 2;
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= segments; j++) {
        const phi = (j / segments) * Math.PI;
        const x = radius * Math.sin(phi) * Math.cos(lon);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(lon);
        pts.push(new THREE.Vector3(x, y, z));
      }
      geo.push(new THREE.BufferGeometry().setFromPoints(pts));
    }

    return geo;
  }, [radius, segments]);

  return (
    <>
      {lines.map((geo, i) => (
        <line key={i}>
          <primitive object={geo} attach="geometry" />
          <lineBasicMaterial color={color} transparent opacity={opacity} />
        </line>
      ))}
    </>
  );
}

// ── Helper: lat/lon → 3D position on sphere surface ──────────────────────────
function latLonToVec3(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

// ── Pin marker at a lat/lon ────────────────────────────────────────────────────
function CityPin({ lat, lon }: { lat: number; lon: number }) {
  const pinRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const pos = latLonToVec3(lat, lon, 1.02);

  useFrame(({ clock }) => {
    if (glowRef.current) {
      // Pulsing glow
      const s = 1 + 0.35 * Math.abs(Math.sin(clock.getElapsedTime() * 1.8));
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group position={pos}>
      {/* Core dot */}
      <mesh ref={pinRef}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      {/* Pulsing halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshBasicMaterial color="#86efac" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ── Connecting arc line between two points ─────────────────────────────────────
function Arc({ from, to }: { from: [number, number]; to: [number, number] }) {
  const points = useMemo(() => {
    const start = new THREE.Vector3(...latLonToVec3(from[0], from[1], 1.02));
    const end = new THREE.Vector3(...latLonToVec3(to[0], to[1], 1.02));
    const mid = start.clone().add(end).normalize().multiplyScalar(1.35);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(48);
  }, [from, to]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial color="#4ade80" transparent opacity={0.4} />
    </line>
  );
}

// ── Main globe mesh ────────────────────────────────────────────────────────────
function Globe() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.22;
    }
  });

  // Cities: approximate lat/lon
  const cities: [number, number][] = [
    [22.57, 88.36],   // Kolkata
    [51.5, -0.12],    // London
    [40.71, -74.0],   // New York
    [35.68, 139.69],  // Tokyo
    [1.35, 103.82],   // Singapore
    [-33.87, 151.21], // Sydney
  ];

  const arcs: [[number, number], [number, number]][] = [
    [[22.57, 88.36], [51.5, -0.12]],
    [[22.57, 88.36], [1.35, 103.82]],
    [[51.5, -0.12], [40.71, -74.0]],
    [[40.71, -74.0], [35.68, 139.69]],
  ];

  return (
    <group ref={groupRef}>
      {/* ── Explicit lat/lon grid ── */}
      <GlobeGrid />

      {/* ── Atmospheric glow shell ── */}
      {/* glow removed */}

      {/* ── Outer glow ring ── */}
      {/* glow removed */}

      {/* ── City pins ── */}
      {cities.map(([lat, lon], i) => (
        <CityPin key={i} lat={lat} lon={lon} />
      ))}

      {/* ── Arcs ── */}
      {arcs.map(([from, to], i) => (
        <Arc key={i} from={from} to={to} />
      ))}
    </group>
  );
}

// ── Exported scene wrapper ─────────────────────────────────────────────────────
export default function GlobeScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-4, -2, -4]} intensity={0.3} color="#86efac" />

        <Globe />

        {/* Subtle manual orbit — no zoom, limited pan */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          minPolarAngle={Math.PI * 0.3}
          maxPolarAngle={Math.PI * 0.7}
        />
      </Canvas>
    </div>
  );
}
