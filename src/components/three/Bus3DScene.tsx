import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

/* ─── Stylized low-poly bus ─── */
function BusModel() {
  const groupRef = useRef<THREE.Group>(null);
  const wheelFL = useRef<THREE.Mesh>(null);
  const wheelFR = useRef<THREE.Mesh>(null);
  const wheelBL = useRef<THREE.Mesh>(null);
  const wheelBR = useRef<THREE.Mesh>(null);

  const busMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#10b981"),
        metalness: 0.3,
        roughness: 0.4,
        emissive: new THREE.Color("#10b981"),
        emissiveIntensity: 0.15,
      }),
    []
  );

  const glassMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#67e8f9"),
        metalness: 0.9,
        roughness: 0.05,
        transparent: true,
        opacity: 0.4,
      }),
    []
  );

  const darkMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#1a1a2e"),
        metalness: 0.6,
        roughness: 0.3,
      }),
    []
  );

  const wheelMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#222222"),
        metalness: 0.5,
        roughness: 0.6,
      }),
    []
  );

  const headlightMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#ffffff"),
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 2,
      }),
    []
  );

  const taillightMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#ff3333"),
        emissive: new THREE.Color("#ff3333"),
        emissiveIntensity: 1.5,
      }),
    []
  );

  const accentMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#0d9468"),
        metalness: 0.4,
        roughness: 0.3,
      }),
    []
  );

  // Rotate wheels
  useFrame((_, delta) => {
    const speed = delta * 4;
    [wheelFL, wheelFR, wheelBL, wheelBR].forEach((w) => {
      if (w.current) w.current.rotation.x += speed;
    });
  });

  return (
    <group ref={groupRef}>
      {/* Main body */}
      <mesh position={[0, 0.55, 0]} material={busMaterial}>
        <boxGeometry args={[5.2, 1.6, 1.8]} />
      </mesh>

      {/* Upper body / roof section */}
      <mesh position={[0, 1.55, 0]} material={busMaterial}>
        <boxGeometry args={[4.8, 0.8, 1.7]} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 2.0, 0]} material={accentMaterial}>
        <boxGeometry args={[4.6, 0.12, 1.6]} />
      </mesh>

      {/* Dark stripe (side) */}
      <mesh position={[0, 0.85, 0.91]}>
        <boxGeometry args={[5.22, 0.15, 0.01]} />
        <meshStandardMaterial color="#0a7c55" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.85, -0.91]}>
        <boxGeometry args={[5.22, 0.15, 0.01]} />
        <meshStandardMaterial color="#0a7c55" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Windshield front */}
      <mesh position={[2.55, 1.3, 0]} rotation={[0, 0, 0.15]} material={glassMaterial}>
        <boxGeometry args={[0.05, 1.1, 1.5]} />
      </mesh>

      {/* Windshield rear */}
      <mesh position={[-2.55, 1.3, 0]} rotation={[0, 0, -0.15]} material={glassMaterial}>
        <boxGeometry args={[0.05, 1.0, 1.4]} />
      </mesh>

      {/* Side windows - left */}
      {[-1.6, -0.6, 0.4, 1.4].map((x, i) => (
        <mesh key={`wl-${i}`} position={[x, 1.5, 0.86]} material={glassMaterial}>
          <boxGeometry args={[0.7, 0.55, 0.03]} />
        </mesh>
      ))}

      {/* Side windows - right */}
      {[-1.6, -0.6, 0.4, 1.4].map((x, i) => (
        <mesh key={`wr-${i}`} position={[x, 1.5, -0.86]} material={glassMaterial}>
          <boxGeometry args={[0.7, 0.55, 0.03]} />
        </mesh>
      ))}

      {/* Bumper front */}
      <mesh position={[2.65, -0.05, 0]} material={darkMaterial}>
        <boxGeometry args={[0.15, 0.5, 1.9]} />
      </mesh>

      {/* Bumper rear */}
      <mesh position={[-2.65, -0.05, 0]} material={darkMaterial}>
        <boxGeometry args={[0.15, 0.5, 1.9]} />
      </mesh>

      {/* Headlights */}
      <mesh position={[2.73, 0.4, 0.65]} material={headlightMaterial}>
        <boxGeometry args={[0.05, 0.2, 0.3]} />
      </mesh>
      <mesh position={[2.73, 0.4, -0.65]} material={headlightMaterial}>
        <boxGeometry args={[0.05, 0.2, 0.3]} />
      </mesh>

      {/* Headlight glow */}
      <pointLight position={[3.5, 0.4, 0.65]} color="#ffffee" intensity={0.5} distance={5} />
      <pointLight position={[3.5, 0.4, -0.65]} color="#ffffee" intensity={0.5} distance={5} />

      {/* Taillights */}
      <mesh position={[-2.73, 0.4, 0.65]} material={taillightMaterial}>
        <boxGeometry args={[0.05, 0.2, 0.3]} />
      </mesh>
      <mesh position={[-2.73, 0.4, -0.65]} material={taillightMaterial}>
        <boxGeometry args={[0.05, 0.2, 0.3]} />
      </mesh>

      {/* Wheels */}
      {[
        { ref: wheelFL, pos: [1.7, -0.35, 1.0] as [number, number, number] },
        { ref: wheelFR, pos: [1.7, -0.35, -1.0] as [number, number, number] },
        { ref: wheelBL, pos: [-1.7, -0.35, 1.0] as [number, number, number] },
        { ref: wheelBR, pos: [-1.7, -0.35, -1.0] as [number, number, number] },
      ].map((w, i) => (
        <group key={i} position={w.pos}>
          <mesh ref={w.ref} rotation={[0, 0, Math.PI / 2]} material={wheelMaterial}>
            <cylinderGeometry args={[0.35, 0.35, 0.2, 16]} />
          </mesh>
          {/* Hub cap */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.15, 0.15, 0.22, 8]} />
            <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Undercarriage */}
      <mesh position={[0, -0.15, 0]} material={darkMaterial}>
        <boxGeometry args={[4.5, 0.3, 1.4]} />
      </mesh>

      {/* Green glow underneath */}
      <pointLight position={[0, -0.5, 0]} color="#10b981" intensity={1.5} distance={4} />
    </group>
  );
}

/* ─── Road / ground ─── */
function Road() {
  const roadRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (roadRef.current) {
      const map = (roadRef.current.material as THREE.MeshStandardMaterial).map;
      if (map) {
        map.offset.x -= delta * 0.3;
      }
    }
  });

  // Create a simple striped road texture
  const roadTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, 512, 64);
    // Dashed center line
    ctx.fillStyle = "#333";
    for (let x = 0; x < 512; x += 40) {
      ctx.fillRect(x, 28, 20, 8);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    return tex;
  }, []);

  return (
    <mesh ref={roadRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[30, 3]} />
      <meshStandardMaterial map={roadTexture} />
    </mesh>
  );
}

/* ─── Scene wrapper ─── */
export default function Bus3DScene() {
  return (
    <div className="absolute inset-0 opacity-40 pointer-events-none">
      <Canvas
        camera={{ position: [6, 3, 6], fov: 35 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} color="#ffffff" />
        <directionalLight position={[-3, 4, -2]} intensity={0.3} color="#10b981" />

        {/* Fog */}
        <fog attach="fog" args={["#030608", 8, 25]} />

        <Float speed={1.5} rotationIntensity={0.08} floatIntensity={0.3}>
          <group rotation={[0, -0.3, 0]} position={[0, 0, 0]}>
            <BusModel />
          </group>
        </Float>

        <Road />
      </Canvas>
    </div>
  );
}
