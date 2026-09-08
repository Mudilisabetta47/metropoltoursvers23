import { Suspense, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import BusModel from "./BusModel";

export interface ScrollRef {
  progress: number;
  busX?: number;
}

/** Kamera-Keyframes: ruhige Totale -> Push-In -> Detail -> Heck -> Beruhigung */
const KEYS: { p: number; pos: [number, number, number]; look: [number, number, number] }[] = [
  { p: 0.0, pos: [27, 9, 27], look: [0, 2.0, 0] },
  { p: 0.28, pos: [23, 7, 22], look: [1.5, 1.9, 0] },
  { p: 0.52, pos: [17, 4.2, 20], look: [3.5, 1.8, 0] },
  { p: 0.76, pos: [-19, 6.5, 21], look: [0, 2.0, 0] },
  { p: 1.0, pos: [27, 10, 29], look: [2, 2.1, 0] },
];

function sample(p: number) {
  const t = THREE.MathUtils.clamp(p, 0, 1);
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1].p) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const k = THREE.MathUtils.clamp((t - a.p) / (b.p - a.p), 0, 1);
  const e = k * k * (3 - 2 * k); // smoothstep
  const lerp3 = (x: number[], y: number[]) =>
    [x[0] + (y[0] - x[0]) * e, x[1] + (y[1] - x[1]) * e, x[2] + (y[2] - x[2]) * e] as [number, number, number];
  return { pos: lerp3(a.pos, b.pos), look: lerp3(a.look, b.look) };
}

function Rig({ scroll, reduced }: { scroll: MutableRefObject<ScrollRef>; reduced: boolean }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 1.9, 0));

  useFrame((_, delta) => {
    const { pos, look } = sample(scroll.current.progress);
    const bx = scroll.current.busX ?? 0;
    pos[0] += bx;
    look[0] += bx;
    const k = reduced ? 1 : 1 - Math.exp(-4.5 * Math.min(delta, 0.05));
    camera.position.lerp(new THREE.Vector3(...pos), k);
    target.current.lerp(new THREE.Vector3(...look), k);
    camera.lookAt(target.current);
  });
  return null;
}

function Bus({ scroll }: { scroll: MutableRefObject<ScrollRef> }) {
  const group = useRef<THREE.Group>(null);
  const prev = useRef(0);
  const speed = useRef(0);

  useFrame((_, delta) => {
    if (!group.current) return;
    const p = scroll.current.progress;
    // Bus fährt über den Verlauf wenige Meter nach vorne
    const x = THREE.MathUtils.smoothstep(p, 0.15, 0.85) * 7;
    const dt = Math.max(Math.min(delta, 0.05), 0.001);
    speed.current = (x - prev.current) / dt;
    prev.current = x;
    group.current.position.x = x;
    scroll.current.busX = x;
    // minimales Nicken bei Beschleunigung / Verzögerung
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z,
      THREE.MathUtils.clamp(-speed.current * 0.004, -0.02, 0.02),
      0.08
    );
  });

  return (
    <group ref={group}>
      <BusModel speed={speed.current} />
    </group>
  );
}

function Road() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[220, 14]} />
        <meshStandardMaterial color="#eceded" roughness={0.95} metalness={0} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, -0.01]}>
        <planeGeometry args={[220, 0.06]} />
        <meshBasicMaterial color="#d9dbdd" />
      </mesh>
      {[7, -7].map((z) => (
        <mesh key={z} rotation-x={-Math.PI / 2} position={[0, 0.002, z]}>
          <planeGeometry args={[220, 0.1]} />
          <meshBasicMaterial color="#d0d3d6" />
        </mesh>
      ))}
    </group>
  );
}

export default function BusScene({
  scroll,
  reduced = false,
  active = true,
}: {
  scroll: MutableRefObject<ScrollRef>;
  reduced?: boolean;
  active?: boolean;
}) {
  return (
    <Canvas
      shadows
      frameloop={active ? "always" : "never"}
      dpr={[1, reduced ? 1 : 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [27, 9, 27], fov: 30 }}
    >
      <color attach="background" args={["#f7f7f7"]} />
      <fog attach="fog" args={["#f7f7f7", 45, 130]} />
      <ambientLight intensity={0.9} />
      <directionalLight
        position={[14, 20, 12]}
        intensity={2.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <Suspense fallback={null}>
        <Environment resolution={128}>
          <Lightformer intensity={2.4} position={[0, 9, 0]} scale={[24, 10, 1]} rotation-x={Math.PI / 2} />
          <Lightformer intensity={1.2} color="#dfe4ea" position={[-12, 4, -6]} rotation-y={Math.PI / 2} scale={[30, 4, 1]} />
          <Lightformer intensity={1.0} color="#ffffff" position={[12, 4, 6]} rotation-y={-Math.PI / 2} scale={[30, 4, 1]} />
        </Environment>
        <Road />
        <Bus scroll={scroll} />
        <ContactShadows position={[0, 0.004, 0]} opacity={0.42} scale={40} blur={2.4} far={8} resolution={512} color="#1a1c1f" />
      </Suspense>
      <Rig scroll={scroll} reduced={reduced} />
    </Canvas>
  );
}
