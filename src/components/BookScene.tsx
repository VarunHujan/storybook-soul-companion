import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import { SRGBColorSpace } from "three";
import paper from "@/assets/paper.jpg";

function Pages({ colors }: { colors: { paper: string; cover: string } }) {
  const texture = useTexture(paper);
  const { size, camera } = useThree();
  useEffect(() => {
    camera.zoom = Math.min(size.width / 12, size.height / 7);
    camera.updateProjectionMatrix();
  }, [size, camera]);
  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
  }, [texture]);
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
    </>
  );
}
export function BookScene({ theme }: { theme: string }) {
  const colors = useStateColors(theme);
  return (
    <div className="book-canvas" aria-hidden="true">
      <Canvas
        orthographic
        frameloop="demand"
        camera={{ position: [0, 0, 15], zoom: 80 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <Pages colors={colors} />
        </Suspense>
      </Canvas>
    </div>
  );
}
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
  return colors;
}
