import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/**
 * Hochwertiger, technisch-sauberer Reisebus (Fernreisebus-Proportionen).
 * Rein prozedural, aber mit realistischen Maßen: 13,5 m x 2,55 m x 3,7 m.
 */

const BODY_L = 13.5;
const BODY_W = 2.55;
const BODY_H = 2.55; // Aufbau über Schürze
const FLOOR_Y = 1.15; // Unterkante Aufbau

const paint = { color: "#ffffff", metalness: 0.14, roughness: 0.42 } as const;
const glass = { color: "#10161c", metalness: 0.9, roughness: 0.08 } as const;
const trim = { color: "#1c1f24", metalness: 0.7, roughness: 0.35 } as const;
const chrome = { color: "#c9ced4", metalness: 1, roughness: 0.18 } as const;

function Wheel({ x, z, radius = 0.52 }: { x: number; z: number; radius?: number }) {
  return (
    <group position={[x, radius, z]} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius, 0.34, 40]} />
        <meshStandardMaterial color="#15181b" roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh position={[0, z > 0 ? 0.18 : -0.18, 0]}>
        <cylinderGeometry args={[radius * 0.62, radius * 0.62, 0.03, 32]} />
        <meshStandardMaterial {...chrome} />
      </mesh>
    </group>
  );
}

export interface BusModelProps {
  /** Radgeschwindigkeit in m/s – 0 = steht */
  speed?: number;
  accentColor?: string;
}

export default function BusModel({ speed = 0, accentColor = "#00cc36" }: BusModelProps) {
  const wheels = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (wheels.current && speed !== 0) {
      wheels.current.children.forEach((w) => {
        w.rotation.y -= (speed / 0.52) * Math.min(delta, 0.05);
      });
    }
  });

  const halfW = BODY_W / 2;

  return (
    <group>
      {/* Hauptaufbau */}
      <RoundedBox
        args={[BODY_L, BODY_H, BODY_W]}
        radius={0.28}
        smoothness={6}
        position={[0, FLOOR_Y + BODY_H / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...paint} />
      </RoundedBox>

      {/* Dachaufbau, leicht schmaler */}
      <RoundedBox
        args={[BODY_L - 0.5, 0.42, BODY_W - 0.24]}
        radius={0.16}
        smoothness={5}
        position={[0, FLOOR_Y + BODY_H + 0.12, 0]}
        castShadow
      >
        <meshStandardMaterial {...paint} />
      </RoundedBox>

      {/* Klimaanlage auf dem Dach */}
      <RoundedBox args={[2.4, 0.18, 1.5]} radius={0.07} smoothness={4} position={[1.6, FLOOR_Y + BODY_H + 0.4, 0]} castShadow>
        <meshStandardMaterial color="#e9ebee" metalness={0.4} roughness={0.5} />
      </RoundedBox>

      {/* Schürze / Unterbau */}
      <RoundedBox args={[BODY_L - 0.4, 0.85, BODY_W - 0.1]} radius={0.14} smoothness={4} position={[0, FLOOR_Y - 0.42, 0]} castShadow>
        <meshStandardMaterial color="#20242a" metalness={0.5} roughness={0.5} />
      </RoundedBox>

      {/* Seitenfensterband */}
      {[1, -1].map((s) => (
        <mesh key={`glassband-${s}`} position={[0.6, FLOOR_Y + BODY_H - 0.72, s * (halfW - 0.02)]}>
          <boxGeometry args={[BODY_L - 3.1, 1.02, 0.06]} />
          <meshStandardMaterial {...glass} />
        </mesh>
      ))}

      {/* Fensterstege */}
      {Array.from({ length: 7 }).map((_, i) =>
        [1, -1].map((s) => (
          <mesh key={`pillar-${i}-${s}`} position={[-4.2 + i * 1.45, FLOOR_Y + BODY_H - 0.72, s * (halfW + 0.005)]}>
            <boxGeometry args={[0.09, 1.04, 0.03]} />
            <meshStandardMaterial {...paint} />
          </mesh>
        ))
      )}

      {/* Frontscheibe – geneigt */}
      <mesh position={[BODY_L / 2 - 0.32, FLOOR_Y + BODY_H - 0.6, 0]} rotation={[0, 0, -0.22]}>
        <boxGeometry args={[0.14, 1.45, BODY_W - 0.34]} />
        <meshStandardMaterial {...glass} />
      </mesh>

      {/* Heckscheibe */}
      <mesh position={[-BODY_L / 2 + 0.16, FLOOR_Y + BODY_H - 0.72, 0]}>
        <boxGeometry args={[0.12, 0.85, BODY_W - 0.6]} />
        <meshStandardMaterial {...glass} />
      </mesh>

      {/* Akzentlinie */}
      {[1, -1].map((s) => (
        <mesh key={`stripe-${s}`} position={[0, FLOOR_Y + 0.38, s * (halfW + 0.012)]}>
          <boxGeometry args={[BODY_L - 1.2, 0.09, 0.02]} />
          <meshStandardMaterial color={accentColor} metalness={0.3} roughness={0.4} />
        </mesh>
      ))}

      {/* Tür */}
      <mesh position={[BODY_L / 2 - 2.35, FLOOR_Y + 0.75, halfW + 0.008]}>
        <boxGeometry args={[0.92, 1.9, 0.02]} />
        <meshStandardMaterial {...trim} />
      </mesh>

      {/* Frontstoßstange + Scheinwerfer */}
      <RoundedBox args={[0.35, 0.5, BODY_W - 0.15]} radius={0.1} smoothness={4} position={[BODY_L / 2 - 0.06, FLOOR_Y - 0.35, 0]}>
        <meshStandardMaterial color="#20242a" metalness={0.5} roughness={0.5} />
      </RoundedBox>
      {[1, -1].map((s) => (
        <mesh key={`hl-${s}`} position={[BODY_L / 2 + 0.02, FLOOR_Y + 0.05, s * 0.85]}>
          <boxGeometry args={[0.08, 0.2, 0.55]} />
          <meshStandardMaterial color="#f2f5f7" emissive="#ffffff" emissiveIntensity={0.25} metalness={0.4} roughness={0.15} />
        </mesh>
      ))}
      {/* Rückleuchten */}
      {[1, -1].map((s) => (
        <mesh key={`tl-${s}`} position={[-BODY_L / 2 - 0.02, FLOOR_Y + 0.25, s * 0.85]}>
          <boxGeometry args={[0.06, 0.42, 0.5]} />
          <meshStandardMaterial color="#8e1420" emissive="#c81a28" emissiveIntensity={0.35} roughness={0.3} />
        </mesh>
      ))}

      {/* Außenspiegel */}
      {[1, -1].map((s) => (
        <group key={`mirror-${s}`} position={[BODY_L / 2 - 0.55, FLOOR_Y + BODY_H - 0.35, s * (halfW + 0.24)]}>
          <mesh>
            <boxGeometry args={[0.05, 0.05, 0.42]} />
            <meshStandardMaterial {...trim} />
          </mesh>
          <mesh position={[0, -0.18, s * 0.2]}>
            <boxGeometry args={[0.07, 0.42, 0.16]} />
            <meshStandardMaterial {...trim} />
          </mesh>
        </group>
      ))}

      {/* Räder */}
      <group ref={wheels}>
        <Wheel x={BODY_L / 2 - 2.1} z={halfW - 0.16} />
        <Wheel x={BODY_L / 2 - 2.1} z={-(halfW - 0.16)} />
        <Wheel x={-BODY_L / 2 + 3.4} z={halfW - 0.16} />
        <Wheel x={-BODY_L / 2 + 3.4} z={-(halfW - 0.16)} />
        <Wheel x={-BODY_L / 2 + 1.9} z={halfW - 0.16} />
        <Wheel x={-BODY_L / 2 + 1.9} z={-(halfW - 0.16)} />
      </group>
    </group>
  );
}
