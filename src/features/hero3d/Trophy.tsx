import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** A revolved gold trophy cup (LatheGeometry) with two handles. Slowly turns
 *  and tilts toward the pointer. No external model required. */
export function Trophy({ pointer }: { pointer: React.MutableRefObject<{ x: number; y: number }> }) {
  const group = useRef<THREE.Group>(null);

  const cupGeo = useMemo(() => {
    // profile (radius x, height y) from foot to rim
    const p = [
      [0.0, 0.0],
      [0.62, 0.0],
      [0.62, 0.12],
      [0.4, 0.18],
      [0.2, 0.24],
      [0.16, 0.62],
      [0.2, 0.78],
      [0.5, 0.96],
      [0.66, 1.45],
      [0.62, 1.46],
      [0.5, 1.05],
      [0.18, 0.82],
      [0.14, 0.8],
      [0.0, 0.8],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(p, 96);
  }, []);

  const gold = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#e7b94e'),
        metalness: 1,
        roughness: 0.22,
        envMapIntensity: 1.4,
      }),
    [],
  );

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += dt * 0.25;
    // parallax tilt toward pointer
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, pointer.current.y * 0.18, 0.05);
    g.position.x = THREE.MathUtils.lerp(g.position.x, pointer.current.x * 0.25, 0.05);
  });

  return (
    <group ref={group} position={[0, -0.75, 0]} scale={1.15}>
      <mesh geometry={cupGeo} material={gold} castShadow />
      {/* handles */}
      {[1, -1].map((s) => (
        <mesh key={s} material={gold} position={[s * 0.62, 0.62, 0]} rotation={[0, 0, s * -0.5]}>
          <torusGeometry args={[0.26, 0.05, 16, 40, Math.PI * 1.1]} />
        </mesh>
      ))}
      {/* base ring */}
      <mesh material={gold} position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.66, 0.7, 0.12, 64]} />
      </mesh>
    </group>
  );
}
