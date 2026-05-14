"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export function DiceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const cssColor = (v: string) => {
      const c = getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "#0F1B7B";
      return new THREE.Color(c);
    };

    const geo = new THREE.IcosahedronGeometry(1.4, 0);
    const edges = new THREE.EdgesGeometry(geo);
    const lineMat = new THREE.LineBasicMaterial({ color: cssColor("--ink-2"), transparent: true, opacity: 0.95 });
    const wireframe = new THREE.LineSegments(edges, lineMat);

    const fillMat = new THREE.MeshBasicMaterial({ color: cssColor("--ink-2"), transparent: true, opacity: 0.03, side: THREE.DoubleSide });
    const inner = new THREE.Mesh(geo, fillMat);

    const dice = new THREE.Group();
    dice.add(inner);
    dice.add(wireframe);
    scene.add(dice);

    const PARTICLE_COUNT = 220;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 1.8 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      speeds[i] = 0.2 + Math.random() * 0.5;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const pCanvas = document.createElement("canvas");
    pCanvas.width = pCanvas.height = 64;
    const pCtx = pCanvas.getContext("2d")!;
    const grad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.4, "rgba(255,255,255,0.4)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 64, 64);

    const particleMat = new THREE.PointsMaterial({
      color: cssColor("--ink-2"),
      size: 0.08,
      map: new THREE.CanvasTexture(pCanvas),
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    let mouseX = 0, mouseY = 0, targetRotY = 0, targetRotX = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) - 0.5;
      mouseY = (e.clientY / window.innerHeight) - 0.5;
    };
    window.addEventListener("mousemove", onMouseMove);

    const refreshColors = () => {
      const c = cssColor("--ink-2");
      lineMat.color.copy(c);
      fillMat.color.copy(c);
      particleMat.color.copy(c);
    };
    const observer = new MutationObserver(refreshColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const W = parent.clientWidth, H = parent.clientHeight;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize);
    resize();

    const clock = new THREE.Clock();
    let animId: number;

    const loop = () => {
      animId = requestAnimationFrame(loop);
      const t = clock.getElapsedTime();
      clock.getDelta();

      dice.rotation.y += 0.0035;
      dice.rotation.x += 0.0018;

      targetRotY += (mouseX * 0.4 - targetRotY) * 0.04;
      targetRotX += (-mouseY * 0.3 - targetRotX) * 0.04;
      dice.rotation.z = targetRotY * 0.15;
      camera.position.x = targetRotY * 0.6;
      camera.position.y = targetRotX * 0.6;
      camera.lookAt(0, 0, 0);

      const pos = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const idx = i * 3;
        pos[idx + 1] += Math.sin(t * speeds[i] + phases[i]) * 0.0015;
        pos[idx]     += Math.cos(t * speeds[i] * 0.7 + phases[i]) * 0.0012;
      }
      particleGeo.attributes.position.needsUpdate = true;
      particles.rotation.y += 0.0008;

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
      observer.disconnect();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}
