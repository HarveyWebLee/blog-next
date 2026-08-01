"use client";

/**
 * 博客前台深色氛围：「动态极光 + 星空」WebGL（`BlogAmbientEffects` 默认挂载 `BlogAuroraBackgroundWebGl`）。
 *
 * 纯 CSS 方案已移除；六根竖纹光柱快照备份见 `blog-aurora-pillar-field.tsx`（`BlogAuroraPillarField`）。
 *
 * 当前效果为「深空星云」：三团柔和冷色光晕（左上冰蓝 / 右上淡紫 / 顶部雾青）缓慢漂移呼吸，
 * 边缘经 fbm 域扭曲呈现有机蠕动，避免发光圆盘的塑料感；星点约 13% 粗网格格点落星（整屏 70+ 颗）。
 * 中央正文区刻意保持低亮度，避免干扰内容可读性。
 *
 * 性能：滚动隔帧 draw、Resize 合并 rAF、DPR 上限见 blog-webgl-performance。
 */
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import * as THREE from "three";

import {
  attachCoalescedResize,
  BLOG_GL_MAX_DPR,
  createBlogGlScrollBudget,
  runTabVisibleRafLoop,
} from "@/lib/utils/blog-webgl-performance";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * 星云着色：域扭曲柔光晕 + 内部织理 + 呼吸 + 程序化星点。
 */
const fragmentShader = /* glsl */ `
precision highp float;
#define STAR_GRID_X 32.0
#define STAR_GRID_Y 18.0

uniform float uTime;
uniform float uIntensity;
uniform float uFlowScale;
uniform float uStarStrength;

varying vec2 vUv;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= vec2(1.92, 2.06);
    a *= 0.52;
  }
  return v;
}

/* 离散星点：粗网格约 13% 格点落星（整屏 70+ 颗），小圆盘微闪，不做大光晕 */
float starsBrightness(vec2 uv, float t) {
  vec2 grid = uv * vec2(STAR_GRID_X, STAR_GRID_Y);
  vec2 gid = floor(grid);
  vec2 cell = fract(grid) - 0.5;

  float pick = hash21(gid + vec2(31.4, 67.9));
  float spawn = 1.0 - step(0.13, pick);

  vec2 ofs = vec2(hash21(gid + vec2(19.2, 7.7)), hash21(gid + vec2(3.3, 41.9))) - 0.5;
  float dist = length(cell - ofs * 0.44);

  float rad = mix(0.010, 0.022, hash21(gid + vec2(50.0, 9.0)));
  float disk = 1.0 - smoothstep(rad * 0.7, rad * 1.2, dist);

  float rnd = hash21(gid);
  float blinkFreq = 0.8 + rnd * 1.8;
  float blink = 0.35 + 0.65 * sin(t * blinkFreq + rnd * 48.7);

  float mask = smoothstep(0.0, 0.08, uv.y) * (1.0 - smoothstep(0.94, 0.995, uv.y));
  return disk * blink * mask * spawn;
}

void main() {
  vec2 uv = vUv;
  float t = uTime * uFlowScale;

  /* 全屏域扭曲：光晕边缘有机蠕动，避免「发光圆盘」塑料感 */
  vec2 warp = vec2(
    fbm(uv * 1.6 + vec2(t * 0.026, -t * 0.014)),
    fbm(uv * 1.6 + vec2(-t * 0.012, t * 0.030))
  );
  vec2 wuv = uv + (warp - 0.5) * 0.20;

  /* 三团柔和星云光晕：左上冰蓝 / 右上淡紫 / 顶部雾青，缓慢漂移 */
  vec2 c1 = vec2(0.15 + 0.09 * sin(t * 0.040), 0.24 + 0.08 * cos(t * 0.034));
  vec2 c2 = vec2(0.87 + 0.06 * cos(t * 0.029 + 2.4), 0.22 + 0.09 * sin(t * 0.044 + 1.1));
  vec2 c3 = vec2(0.50 + 0.13 * sin(t * 0.025 + 4.0), 0.92 + 0.04 * cos(t * 0.037));

  float d1 = length(wuv - c1);
  float d2 = length(wuv - c2);
  float d3 = length(wuv - c3);

  float g1 = 1.0 - smoothstep(0.06, 0.46, d1);
  float g2 = 1.0 - smoothstep(0.06, 0.40, d2);
  float g3 = 1.0 - smoothstep(0.05, 0.30, d3);

  /* 内部织理：轻微明暗起伏，打破纯色块 */
  float tex1 = fbm(wuv * 2.4 + t * 0.05);
  float tex2 = fbm(wuv * 2.8 - t * 0.05 + 7.3);
  float tex3 = fbm(wuv * 3.0 + t * 0.06 + 3.1);

  vec3 colIce = vec3(0.42, 0.60, 0.94);
  vec3 colLilac = vec3(0.60, 0.52, 0.90);
  vec3 colMist = vec3(0.38, 0.66, 0.80);

  vec3 rgb = vec3(0.0);
  rgb += colIce * g1 * (0.48 + 0.30 * tex1);
  rgb += colLilac * g2 * (0.44 + 0.26 * tex2);
  rgb += colMist * g3 * (0.40 + 0.24 * tex3);

  /* 整体呼吸：微明微暗 */
  float breathe = 0.90 + 0.10 * sin(t * 0.070);
  rgb *= breathe * uIntensity;

  float lum = max(rgb.r, max(rgb.g, rgb.b));
  float alpha = clamp(lum * 1.15, 0.0, 1.0);

  /* 星点：孤立小亮点，冷白/暖白混合 */
  float sb = starsBrightness(uv, t) * uStarStrength;
  vec2 starGid = floor(uv * vec2(STAR_GRID_X, STAR_GRID_Y));
  vec3 starTint =
    mix(vec3(1.0, 0.97, 0.92), vec3(0.82, 0.90, 1.0), hash21(starGid + vec2(99.0, 99.0)));
  vec3 starRgb = starTint * sb * 2.6;

  vec3 outRgb = rgb * alpha * 0.95 + starRgb;
  float alphaOut = clamp(alpha * 0.80 + sb * 0.85, 0.0, 1.0);
  gl_FragColor = vec4(outRgb, alphaOut);
}
`;

function BlogAuroraCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

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
        uIntensity: { value: 0.89 },
        uFlowScale: { value: 1 },
        /** 星点总增益（与着色器内 2.4 相乘）；reduced-motion 分支另调 */
        uStarStrength: { value: 1.05 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      /* 便于星光与极光直加后的 straight rgb 参与默认 SrcAlpha 混合 */
      blending: THREE.NormalBlending,
      toneMapped: false,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      stencil: false,
      depth: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, BLOG_GL_MAX_DPR));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    // THREE.Clock 已弃用，改为使用高精度时间戳驱动着色器时间。
    const startTime = performance.now();

    const resize = (w: number, h: number) => {
      if (!el || disposed) return;
      renderer.setSize(w, h, false);
    };

    const scrollBudget = createBlogGlScrollBudget();
    const { dispose: disposeResize } = attachCoalescedResize(el, resize);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      material.uniforms.uIntensity.value = 0.6;
      material.uniforms.uFlowScale.value = 0.35;
      material.uniforms.uStarStrength.value = 0.78;
    }

    const { dispose: disposeRaf } = runTabVisibleRafLoop({
      getDisposed: () => disposed,
      onFrame: () => {
        material.uniforms.uTime.value = (performance.now() - startTime) / 1000;
        if (!scrollBudget.shouldRenderFrame()) return;
        renderer.render(scene, camera);
      },
    });

    return () => {
      disposed = true;
      disposeRaf();
      scrollBudget.dispose();
      disposeResize();
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === el) {
        el.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="pointer-events-none fixed inset-0 z-[2] isolate overflow-hidden" aria-hidden />;
}

/** WebGL 极光入口（博客深色默认） */
export function BlogAuroraBackgroundWebGl() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || resolvedTheme !== "dark") {
    return null;
  }

  return <BlogAuroraCanvas />;
}
