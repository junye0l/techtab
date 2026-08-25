import { useEffect, useRef } from "react";
import * as THREE from "three";
import { configureTextBuilder, Text } from "troika-three-text";

// 확장 프로그램의 기본 CSP가 blob: 워커 생성을 막아서 워커 대신 메인 스레드에서 처리
configureTextBuilder({ useWorker: false });

const TEXT = "TechTab";
const FONT_URL = "/fonts/press-start-2p.ttf";
const FONT_SIZE = 1;
const FOV = 45;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function syncText(text: Text): Promise<void> {
  return new Promise((resolve) => text.sync(resolve));
}

export default function LogoIntroCanvas({ color = "#171717" }: { color?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let frameId: number;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.z = 5;

    function resize() {
      if (!container) return;
      const { clientWidth, clientHeight } = container;
      camera.aspect = clientWidth / clientHeight || 1;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    }
    resize();
    window.addEventListener("resize", resize);

    const letterMeshes: Text[] = [];
    let letters: {
      mesh: Text;
      delay: number;
      duration: number;
      initialRotY: number;
      initialRotX: number;
      initialZ: number;
    }[] = [];

    (async () => {
      const chars = [...TEXT].map((ch) => {
        const t = new Text();
        t.text = ch;
        t.font = FONT_URL;
        t.fontSize = FONT_SIZE;
        t.color = color;
        t.anchorX = "center";
        t.anchorY = "middle";
        return t;
      });
      // 폰트 sync 완료 전에 언마운트되더라도 cleanup에서 dispose할 수 있도록 먼저 등록
      letterMeshes.push(...chars);

      await Promise.all(chars.map(syncText));
      if (disposed) return;

      const widths = chars.map((t) => {
        const b = t.textRenderInfo?.blockBounds;
        return b ? b[2] - b[0] : FONT_SIZE * 0.6;
      });
      const totalWidth = widths.reduce((a, b) => a + b, 0);
      const flyInZ = -camera.position.z * 0.8;

      let cursor = -totalWidth / 2;
      const group = new THREE.Group();

      letters = chars.map((mesh, i) => {
        const w = widths[i];
        const finalX = cursor + w / 2;
        cursor += w;

        const initialRotY = Math.PI * (2 + Math.random() * 2) * (Math.random() < 0.5 ? 1 : -1);
        const initialRotX = (Math.random() - 0.5) * Math.PI;

        mesh.position.set(finalX, 0, flyInZ);
        mesh.rotation.y = initialRotY;
        mesh.rotation.x = initialRotX;

        group.add(mesh);
        return { mesh, delay: i * 90, duration: 900, initialRotY, initialRotX, initialZ: flyInZ };
      });

      const visibleHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(FOV) / 2);
      const visibleWidth = visibleHeight * camera.aspect;
      const fitScale = Math.min(1, (visibleWidth * 0.85) / totalWidth);
      group.scale.setScalar(fitScale);

      scene.add(group);
    })();

    const startTime = performance.now();
    function animate() {
      const elapsedMs = performance.now() - startTime;

      for (const { mesh, delay, duration, initialRotY, initialRotX, initialZ } of letters) {
        const t = Math.min(Math.max((elapsedMs - delay) / duration, 0), 1);
        const eased = easeOutCubic(t);
        mesh.position.z = THREE.MathUtils.lerp(initialZ, 0, eased);
        mesh.rotation.y = THREE.MathUtils.lerp(initialRotY, 0, eased);
        mesh.rotation.x = THREE.MathUtils.lerp(initialRotX, 0, eased);
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      for (const mesh of letterMeshes) mesh.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [color]);

  return <div ref={containerRef} className="logo-intro-canvas" aria-hidden="true" />;
}
