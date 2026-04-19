"use client";

/**
 * 首页「玻璃雨景」：参考掘金《Three.js 玻璃雨景效果详解教程》思路
 * （正交相机全屏四边形 + GLSL 程序化雨滴 / 水痕 / 静态水珠），
 * 不采样页面纹理，用透明叠加把高光叠在真实 DOM 之上，避免 html2canvas。
 *
 * 仅浅色主题挂载；深色主题不渲染，首页继续只显示下雪（HomeDarkStarfield）。
 *
 * 性能：requestAnimationFrame、Tab 不可见跳过渲染、DPR 上限、reduced-motion 降强度。
 * （不与博客 WebGL 性能工具耦合，便于单独调整首页视觉效果。）
 */
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import * as THREE from "three";

/** 顶点着色器：全屏四边形，下传 vUv */
const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * 片元着色器：实现教程中的噪声、雨滴层与静态水珠；最终仅输出带 alpha 的雨膜高光，
 * 便于与下方页面内容合成（背景由真实页面提供）。
 */
const fragmentShader = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uDark;
uniform float uIntensity;
uniform float uStaticMotion;

varying vec2 vUv;

/* 距离场统一放大系数：数值越大雨滴越小（相对原教程约再缩小一半） */
const float kDropHalfSize = 2.0;

/* 教程：三维哈希噪声 N13 */
vec3 N13(float p) {
  vec3 p3 = fract(vec3(p) * vec3(.1031, .11369, .13787));
  p3 += dot(p3, p3.yzx + 19.19);
  return fract(vec3(
    (p3.x + p3.y) * p3.z,
    (p3.x + p3.z) * p3.y,
    (p3.y + p3.z) * p3.x
  ));
}

float S(float a, float b, float t) {
  return smoothstep(a, b, t);
}

/* 教程：锯齿波平滑，控制雨滴生命周期 */
float Saw(float b, float t) {
  return S(0., b, t) * S(1., b, t);
}

/*
 * 教程核心 DropLayer2：网格化雨滴 + 摆动 + 垂直流动 + 主滴与轨迹。
 * 返回 x 为遮罩强度，y 为轨迹强度（用于略提高边缘高光）。
 */
vec2 DropLayer2(vec2 uv, float t) {
  vec2 UV = uv;
  uv.y += t * 0.75;
  vec2 a = vec2(6.0, 1.0);
  vec2 grid = a * 2.0;
  vec2 id0 = floor(uv * grid);
  /* 列随机竖直偏移（教程中的 colShift） */
  float colShift = N13(id0.x * 73.156).x;
  uv.y += colShift;
  vec2 id = floor(uv * grid);
  vec3 n = N13(id.x * 35.2 + id.y * 2376.1);
  /* 每格独立：距离场乘数越大 → 主滴视觉上越小；区间拉开避免同屏完全一致 */
  vec3 nSize = N13(id.x * 19.1 + id.y * 47.7);
  float dropScale = mix(0.82, 1.48, nSize.y);
  float trailScale = mix(0.75, 1.28, nSize.z);
  vec2 st = fract(uv * grid) - vec2(0.5, 0.0);

  float x = n.x - 0.5;
  float y = UV.y * 20.0;
  float wiggle = sin(y + sin(y));
  x += wiggle * (0.5 - abs(x)) * (n.z - 0.5);
  x *= 0.7;

  float ti = fract(t + n.z);
  y = (Saw(0.85, ti) - 0.5) * 0.9 + 0.5;
  vec2 p = vec2(x, y);

  float d = length((st - p) * a.yx) * dropScale * kDropHalfSize;
  float mainDrop = S(0.38, 0.0, d);

  float r = sqrt(S(1.0, y, st.y));
  float cd = abs(st.x - x) * trailScale * kDropHalfSize;
  float trail = S(0.23 * r, 0.15 * r * r, cd);
  float trailFront = S(-0.02, 0.02, st.y - y);
  trail *= trailFront * r * r;

  y = UV.y;
  float trail2 = S(0.2 * r, 0.0, cd);
  float droplets =
    max(0.0, (sin(y * (1.0 - y) * 120.0) - st.y)) * trail2 * trailFront * n.z;
  y = fract(y * 10.0) + (st.y - 0.5);
  float dd = length(st - vec2(x, y)) * mix(0.88, 1.42, nSize.x) * kDropHalfSize;
  droplets = S(0.3, 0.0, dd);

  float m = mainDrop + droplets * r * trailFront;
  return vec2(m, trail);
}

/* 教程：静态小水珠 + 轻微闪烁 */
float StaticDrops(vec2 uv, float t) {
  uv *= 40.0;
  vec2 id = floor(uv);
  uv = fract(uv) - 0.5;
  vec3 n = N13(id.x * 107.45 + id.y * 3543.654);
  vec2 p = (n.xy - 0.5) * mix(0.55, 0.82, n.z);
  float staticScale = mix(0.78, 1.38, N13(id.x * 3.1 + id.y * 91.2).x);
  float d = length(uv - p) * staticScale * kDropHalfSize;
  float fade = Saw(0.025, fract(t * uStaticMotion + n.z));
  float c = S(0.28, 0.0, d) * fract(n.z * 10.0) * fade;
  return c;
}

float Drops(vec2 uv, float t) {
  float sd = StaticDrops(uv, t);
  vec2 l1 = DropLayer2(uv, t);
  vec2 l2 = DropLayer2(uv * 1.25 + vec2(7.54, 3.1), t * 1.07);
  float m = l1.x + l2.x * 0.65 + sd * 0.45;
  float tr = max(l1.y, l2.y) * 0.35;
  return clamp(m + tr, 0.0, 1.0);
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 uvA = (uv - 0.5) * aspect + 0.5;

  float t = uTime;
  float w = Drops(uvA, t);

  /* 数值微分制造「玻璃边缘高光」，弱化依赖 textureLod 的折射 */
  vec2 px = vec2(1.2 / max(uResolution.x, 1.0), 1.2 / max(uResolution.y, 1.0)) * aspect;
  float wx = Drops(uvA + vec2(px.x, 0.0), t);
  float wy = Drops(uvA + vec2(0.0, px.y), t);
  float grad = abs(w - wx) + abs(w - wy);
  float spec = pow(clamp(grad * 6.0, 0.0, 1.0), 1.8);

  float a = clamp(w * 0.62 * uIntensity + spec * 0.28 * uIntensity, 0.0, 1.0);
  vec3 cool = mix(vec3(0.78, 0.88, 1.0), vec3(0.55, 0.72, 0.95), uDark);
  vec3 warm = vec3(0.95, 0.97, 1.0);
  vec3 rgb = mix(cool, warm, spec);

  gl_FragColor = vec4(rgb, a * 0.42);
}
`;

const MAX_DPR = 1.75;

/** 实际 Three.js 画布；仅在浅色主题下挂载 */
function HomeGlassRainCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let disposed = false;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        /* 仅浅色主题使用，固定为浅色滴配色 */
        uDark: { value: 0 },
        uIntensity: { value: 1 },
        uStaticMotion: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const clock = new THREE.Clock();

    const resize = () => {
      if (!el || disposed) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      material.uniforms.uResolution.value.set(w, h);
      renderer.setSize(w, h, false);
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(el);
    resize();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      material.uniforms.uIntensity.value = 0.35;
      material.uniforms.uStaticMotion.value = 0.0;
    }

    const animate = () => {
      if (disposed) return;
      rafRef.current = requestAnimationFrame(animate);
      if (document.visibilityState === "hidden") return;

      material.uniforms.uTime.value = clock.getElapsedTime() * (reduceMotion ? 0.15 : 1.0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === el) {
        el.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="pointer-events-none fixed inset-0 z-[8] overflow-hidden" aria-hidden />;
}

/**
 * 入口：与 HomeLightMist 一致，仅 resolvedTheme === "light" 时挂载子树，避免深色下占用 WebGL。
 */
export function HomeGlassRain() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || resolvedTheme !== "light") {
    return null;
  }

  return <HomeGlassRainCanvas />;
}
