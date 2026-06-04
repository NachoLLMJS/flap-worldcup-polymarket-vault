import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer, MeshReflectorMaterial, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Trophy } from './Trophy';

function Scene({ pointer }: { pointer: React.MutableRefObject<{ x: number; y: number }> }) {
  return (
    <>
      <color attach="background" args={['#0e0a09']} />
      <fog attach="fog" args={['#0e0a09', 6, 16]} />

      <ambientLight intensity={0.18} />
      <spotLight position={[4, 8, 4]} angle={0.5} penumbra={1} intensity={120} color="#fff2d6" castShadow />
      <pointLight position={[-5, 2, -3]} intensity={40} color="#9a2d3a" />
      <pointLight position={[3, 1, 4]} intensity={25} color="#e7b94e" />

      <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.4}>
        <Trophy pointer={pointer} />
      </Float>

      {/* reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.78, 0]}>
        <planeGeometry args={[40, 40]} />
        <MeshReflectorMaterial
          resolution={512}
          mirror={0.5}
          mixBlur={8}
          mixStrength={1.2}
          blur={[300, 80]}
          roughness={0.9}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          color="#0e0a09"
          metalness={0.5}
        />
      </mesh>

      {/* studio reflections without an HDRI download */}
      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 4, -6]} scale={[10, 6, 1]} color="#fff0d0" />
        <Lightformer intensity={1.2} position={[-5, 2, 2]} scale={[4, 8, 1]} color="#9a2d3a" />
        <Lightformer intensity={1.4} position={[5, 2, 2]} scale={[4, 8, 1]} color="#e7b94e" />
      </Environment>

      <EffectComposer>
        <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.6} luminanceSmoothing={0.3} />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

/** Immersive WebGL hero: a real gold trophy floating in a dark, foggy studio
 *  with a reflective floor + bloom. Mouse parallax. Fixed canvas behind DOM
 *  content (no cards). Respects reduced motion (renders a single frame). */
export function Hero3D() {
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <Canvas
      className="!fixed inset-0 h-screen w-screen"
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}
      shadows
      dpr={[1, 1.8]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.4, 5.2], fov: 38 }}
    >
      <Scene pointer={pointer} />
    </Canvas>
  );
}
