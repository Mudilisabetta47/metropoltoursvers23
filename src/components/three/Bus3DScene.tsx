import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

/* ─── Realistic touring coach built from primitives ─── */
function CoachBus() {
  const wheelRefs = useRef<THREE.Mesh[]>([]);

  const mat = useMemo(() => ({
    body: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#0d9668"),
      metalness: 0.35,
      roughness: 0.25,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
    }),
    bodyDark: new THREE.MeshStandardMaterial({
      color: new THREE.Color("#085c40"),
      metalness: 0.4,
      roughness: 0.3,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#a3e0cf"),
      metalness: 0.1,
      roughness: 0.05,
      transparent: true,
      opacity: 0.35,
      transmission: 0.6,
    }),
    chrome: new THREE.MeshStandardMaterial({
      color: new THREE.Color("#e0e0e0"),
      metalness: 0.95,
      roughness: 0.05,
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: new THREE.Color("#1a1a1a"),
      metalness: 0.1,
      roughness: 0.9,
    }),
    hubcap: new THREE.MeshStandardMaterial({
      color: new THREE.Color("#888"),
      metalness: 0.8,
      roughness: 0.15,
    }),
    headlight: new THREE.MeshStandardMaterial({
      color: new THREE.Color("#fffde0"),
      emissive: new THREE.Color("#fffde0"),
      emissiveIntensity: 3,
    }),
    taillight: new THREE.MeshStandardMaterial({
      color: new THREE.Color("#ff2020"),
      emissive: new THREE.Color("#ff2020"),
      emissiveIntensity: 2,
    }),
    undercarriage: new THREE.MeshStandardMaterial({
      color: new THREE.Color("#111"),
      metalness: 0.3,
      roughness: 0.7,
    }),
    stripe: new THREE.MeshStandardMaterial({
      color: new THREE.Color("#ffffff"),
      metalness: 0.5,
      roughness: 0.2,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.1,
    }),
  }), []);

  useFrame((_, delta) => {
    wheelRefs.current.forEach((w) => {
      if (w) w.rotation.x += delta * 3;
    });
  });

  const wheelPositions: [number, number, number][] = [
    [2.0, -0.55, 1.05],
    [2.0, -0.55, -1.05],
    [-2.0, -0.55, 1.05],
    [-2.0, -0.55, -1.05],
  ];

  return (
    <group>
      {/* ── Main body shell ── */}
      {/* Lower body (luggage compartment area) */}
      <mesh position={[0, 0.15, 0]} material={mat.bodyDark}>
        <boxGeometry args={[6.0, 0.9, 2.0]} />
      </mesh>

      {/* Upper body */}
      <mesh position={[0, 0.95, 0]} material={mat.body}>
        <boxGeometry args={[5.8, 0.8, 1.95]} />
      </mesh>

      {/* Roof section — slightly rounded via thinner box */}
      <mesh position={[0, 1.45, 0]} material={mat.body}>
        <boxGeometry args={[5.6, 0.25, 1.85]} />
      </mesh>

      {/* Roof top (AC unit / smooth top) */}
      <mesh position={[0, 1.62, 0]} material={mat.bodyDark}>
        <boxGeometry args={[4.0, 0.1, 1.2]} />
      </mesh>

      {/* ── Chrome / accent stripe along the side ── */}
      <mesh position={[0, 0.62, 1.005]} material={mat.stripe}>
        <boxGeometry args={[5.85, 0.06, 0.01]} />
      </mesh>
      <mesh position={[0, 0.62, -1.005]} material={mat.stripe}>
        <boxGeometry args={[5.85, 0.06, 0.01]} />
      </mesh>

      {/* ── Windows ── */}
      {/* Windshield — large, angled */}
      <mesh position={[2.85, 1.0, 0]} rotation={[0, 0, 0.12]} material={mat.glass}>
        <boxGeometry args={[0.06, 0.9, 1.6]} />
      </mesh>

      {/* Rear window */}
      <mesh position={[-2.95, 0.95, 0]} rotation={[0, 0, -0.08]} material={mat.glass}>
        <boxGeometry args={[0.06, 0.75, 1.4]} />
      </mesh>

      {/* Side windows — left */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={`wl-${i}`} position={[-2.1 + i * 0.7, 1.0, 0.985]} material={mat.glass}>
          <boxGeometry args={[0.55, 0.55, 0.03]} />
        </mesh>
      ))}

      {/* Side windows — right */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={`wr-${i}`} position={[-2.1 + i * 0.7, 1.0, -0.985]} material={mat.glass}>
          <boxGeometry args={[0.55, 0.55, 0.03]} />
        </mesh>
      ))}

      {/* ── Front details ── */}
      {/* Front face */}
      <mesh position={[3.0, 0.5, 0]} material={mat.body}>
        <boxGeometry args={[0.05, 1.0, 2.0]} />
      </mesh>

      {/* Chrome bumper */}
      <mesh position={[3.05, -0.1, 0]} material={mat.chrome}>
        <boxGeometry args={[0.08, 0.35, 2.05]} />
      </mesh>

      {/* Headlights */}
      <mesh position={[3.06, 0.25, 0.7]} material={mat.headlight}>
        <boxGeometry args={[0.04, 0.18, 0.35]} />
      </mesh>
      <mesh position={[3.06, 0.25, -0.7]} material={mat.headlight}>
        <boxGeometry args={[0.04, 0.18, 0.35]} />
      </mesh>
      <pointLight position={[4, 0.3, 0.7]} color="#fffde0" intensity={0.8} distance={6} />
      <pointLight position={[4, 0.3, -0.7]} color="#fffde0" intensity={0.8} distance={6} />

      {/* ── Rear details ── */}
      <mesh position={[-3.0, 0.5, 0]} material={mat.bodyDark}>
        <boxGeometry args={[0.05, 1.0, 2.0]} />
      </mesh>

      {/* Taillights */}
      <mesh position={[-3.04, 0.35, 0.75]} material={mat.taillight}>
        <boxGeometry args={[0.04, 0.25, 0.25]} />
      </mesh>
      <mesh position={[-3.04, 0.35, -0.75]} material={mat.taillight}>
        <boxGeometry args={[0.04, 0.25, 0.25]} />
      </mesh>

      {/* Rear chrome bumper */}
      <mesh position={[-3.05, -0.1, 0]} material={mat.chrome}>
        <boxGeometry args={[0.08, 0.3, 2.05]} />
      </mesh>

      {/* ── Undercarriage ── */}
      <mesh position={[0, -0.35, 0]} material={mat.undercarriage}>
        <boxGeometry args={[5.5, 0.15, 1.6]} />
      </mesh>

      {/* ── Wheel wells ── */}
      {[2.0, -2.0].map((x) => (
        <group key={`well-${x}`}>
          <mesh position={[x, -0.15, 1.01]} material={mat.undercarriage}>
            <boxGeometry args={[0.9, 0.5, 0.04]} />
          </mesh>
          <mesh position={[x, -0.15, -1.01]} material={mat.undercarriage}>
            <boxGeometry args={[0.9, 0.5, 0.04]} />
          </mesh>
        </group>
      ))}

      {/* ── Wheels ── */}
      {wheelPositions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh
            ref={(el) => { if (el) wheelRefs.current[i] = el; }}
            rotation={[0, 0, Math.PI / 2]}
            material={mat.rubber}
          >
            <cylinderGeometry args={[0.4, 0.4, 0.22, 24]} />
          </mesh>
          {/* Hubcap */}
          <mesh rotation={[0, 0, Math.PI / 2]} material={mat.hubcap}>
            <cylinderGeometry args={[0.2, 0.2, 0.24, 12]} />
          </mesh>
        </group>
      ))}

      {/* ── Green underglow ── */}
      <pointLight position={[0, -0.6, 0]} color="#10b981" intensity={2} distance={4} />
      <pointLight position={[2, -0.6, 0]} color="#10b981" intensity={1} distance={3} />
      <pointLight position={[-2, -0.6, 0]} color="#10b981" intensity={1} distance={3} />

      {/* ── Side mirrors ── */}
      <mesh position={[2.4, 0.8, 1.15]} material={mat.chrome}>
        <boxGeometry args={[0.15, 0.1, 0.12]} />
      </mesh>
      <mesh position={[2.4, 0.8, -1.15]} material={mat.chrome}>
        <boxGeometry args={[0.15, 0.1, 0.12]} />
      </mesh>
    </group>
  );
}

/* ─── Animated road ─── */
function Road() {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    // Asphalt
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, 1024, 128);
    // Edge lines
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, 1024, 4);
    ctx.fillRect(0, 124, 1024, 4);
    // Center dashes
    ctx.fillStyle = "#2a2a2a";
    for (let x = 0; x < 1024; x += 80) {
      ctx.fillRect(x, 58, 40, 12);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 1);
    return tex;
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      const m = (meshRef.current.material as THREE.MeshStandardMaterial).map;
      if (m) m.offset.x -= delta * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 0]}>
      <planeGeometry args={[40, 4]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

/* ─── Exported scene ─── */
export default function Bus3DScene() {
  return (
    <div className="absolute inset-0 opacity-50 pointer-events-none">
      <Canvas
        camera={{ position: [7, 3.5, 7], fov: 30 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[8, 10, 5]} intensity={1} color="#ffffff" castShadow />
        <directionalLight position={[-4, 6, -3]} intensity={0.4} color="#10b981" />
        <spotLight position={[0, 8, 0]} angle={0.4} penumbra={0.8} intensity={0.5} color="#ffffff" />

        <fog attach="fog" args={["#030608", 10, 30]} />

        <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.2}>
          <group rotation={[0, -0.35, 0]} position={[0, 0.3, 0]}>
            <CoachBus />
          </group>
        </Float>

        <Road />
      </Canvas>
    </div>
  );
}
