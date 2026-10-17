import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { DoubleSide, PlaneGeometry, SRGBColorSpace, type Group } from "three";
import paper from "@/assets/paper.jpg";

function Pages({ turn, colors }: { turn: number; colors: { paper: string; cover: string } }) {
  const texture = useTexture(paper);
  const pivot = useRef<Group>(null);
  const progress = useRef(1);
  const { size, camera } = useThree();
  const { geometry, baseX } = useMemo(() => {
    const geo = new PlaneGeometry(5.7, 6.5, 16, 2);
    geo.translate(2.85, 0, 0);
    const pos = geo.attributes["position"]!;
    const xs = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) xs[i] = pos.getX(i);
    return { geometry: geo, baseX: xs };
  }, []);
  useEffect(() => {
    camera.zoom = Math.min(size.width / 12, size.height / 7);
    camera.updateProjectionMatrix();
  }, [size, camera]);
  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
  }, [texture]);
  useEffect(() => {
    if (turn) progress.current = 0;
  }, [turn]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, delta) => {
    if (progress.current >= 1) return;
    progress.current = Math.min(1, progress.current + Math.min(delta, 0.05) / 0.85);
    const t = progress.current;
    if (pivot.current) {
      pivot.current.visible = t < 1;
      pivot.current.rotation.y = -(t * t * (3 - 2 * t)) * Math.PI;
      const pos = geometry.attributes["position"];
      if (pos) {
        const arr = pos.array as Float32Array;
        const bend = Math.sin(t * Math.PI) * 0.65;
        for (let i = 0; i < pos.count; i++)
          arr[i * 3 + 2] = Math.sin((baseX[i]! / 5.7) * Math.PI) * bend;
        pos.needsUpdate = true;
      }
    }
  });
  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight position={[-3, 5, 10]} intensity={2} />
      <Environment resolution={64}>
        <Lightformer position={[0, 0, 5]} intensity={1} scale={[10, 10, 1]} />
      </Environment>
      <mesh position={[0, -0.05, -0.16]}>
        <boxGeometry args={[11.85, 6.8, 0.22]} />
        <meshStandardMaterial color={colors.cover} roughness={0.9} />
      </mesh>
      {[-2.9, 2.9].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[5.8, 6.5, 0.15]} />
          <meshStandardMaterial map={texture} color={colors.paper} roughness={1} />
        </mesh>
      ))}
      <group ref={pivot} position={[0, 0, 0.2]} visible={false}>
        <mesh geometry={geometry}>
          <meshStandardMaterial
            map={texture}
            color={colors.paper}
            side={DoubleSide}
            roughness={1}
          />
        </mesh>
      </group>
    </>
  );
}
export function BookScene({ turn, theme }: { turn: number; theme: string }) {
  const [colors, setColors] = useStateColors(theme);
  return (
    <div className="book-canvas" aria-hidden="true">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 15], zoom: 80 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <Pages turn={turn} colors={colors} />
        </Suspense>
      </Canvas>
    </div>
  );
}
import { useState } from "react";
function useStateColors(theme: string) {
  const [colors, setColors] = useState({ paper: "white", cover: "darkolivegreen" });
  useEffect(() => {
    const style = getComputedStyle(
      document.querySelector(".folio-app") ?? document.documentElement,
    );
    setColors({
      paper: style.getPropertyValue("--scene-paper").trim(),
      cover: style.getPropertyValue("--scene-cover").trim(),
    });
  }, [theme]);
  return [colors, setColors] as const;
}
