import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import BusModel from "./BusModel";

/** Ruhige Studio-Ansicht für die Entdecken-Sektion. Zoomt dezent je nach aktivem Punkt. */
export default function BusShowcase({ zoom = 0, active = true }: { zoom?: number; active?: boolean }) {
  return (
    <Canvas
      shadows
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.6]}
      gl={{ antialias: true }}
      camera={{ position: [24, 8, 24], fov: 30 }}
    >
      <color attach="background" args={["#ffffff"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[12, 18, 10]} intensity={2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <Suspense fallback={null}>
        <Environment resolution={128}>
          <Lightformer intensity={2.2} position={[0, 9, 0]} scale={[20, 10, 1]} rotation-x={Math.PI / 2} />
          <Lightformer intensity={1.1} color="#e6eaee" position={[-10, 4, -6]} rotation-y={Math.PI / 2} scale={[24, 4, 1]} />
        </Environment>
        <BusModel speed={0} />
        <ContactShadows position={[0, 0.004, 0]} opacity={0.4} scale={34} blur={2.2} far={8} resolution={512} color="#1a1c1f" />
      </Suspense>
      <Dolly zoom={zoom} />
    </Canvas>
  );
}

function Dolly({ zoom }: { zoom: number }) {
  const target = useRef(new THREE.Vector3(0, 1.9, 0));
  useFrame(({ camera }, delta) => {
    const base = new THREE.Vector3(24, 8, 24);
    const close = new THREE.Vector3(19, 6, 19);
    const want = base.clone().lerp(close, THREE.MathUtils.clamp(zoom, 0, 1));
    camera.position.lerp(want, 1 - Math.exp(-3.5 * Math.min(delta, 0.05)));
    camera.lookAt(target.current);
  });
  return null;
}
