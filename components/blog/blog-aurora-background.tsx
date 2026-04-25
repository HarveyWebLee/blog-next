"use client";

/**
 * 博客前台深色氛围：「动态极光 + 星空」WebGL（`BlogAmbientEffects` 默认挂载 `BlogAuroraBackgroundWebGl`）。
 *
 * 纯 CSS 方案已移除；六根竖纹光柱快照备份见 `blog-aurora-pillar-field.tsx`（`BlogAuroraPillarField`）。
 *
 * 配色 pastel：冰蓝、淡紫、堇青、玫瑰/珊瑚、雾白；星空粗网格离散星点。
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
 * 极光着色：多层高斯帷幕 + 垂直射线 + 气体分层色 + 程序化星空。
 */
const fragmentShader = /* glsl */ `
precision highp float;
#define STAR_GRID_X 23.0
#define STAR_GRID_Y 13.0

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

/*
 * 竖向遮罩：此前用 0.04→0.42 渐亮会把整屏星光乘到 0.3～0.7，肉眼像「没有星」。
 * 改为仅在贴底、贴顶极窄带渐隐，中间天区保持接近 1。
 */
float starSkyMask(vec2 uv) {
  float low = smoothstep(0.0, 0.1, uv.y);
  float high = 1.0 - smoothstep(0.92, 0.996, uv.y);
  return low * high;
}

/*
 * 极轻 UV 偏移：打破完全对齐的网格线即可，幅度过大易产生「碎斑」感。
 */
vec2 starWarpUv(vec2 uv) {
  vec2 w =
    vec2(hash21(uv * 4.18 + vec2(0.0, 12.7)), hash21(uv * 4.18 + vec2(37.2, 0.0))) -
    0.5;
  return uv + w * 0.018;
}

/*
 * 离散星点：粗网格 + 每格随机是否落星 + 格内小圆盘（无大光晕）→ 一颗颗闪烁，而非碎屑雾。
 */
float starsBrightness(vec2 uv, float t) {
  vec2 uvs = starWarpUv(uv);
  vec2 grid = uvs * vec2(STAR_GRID_X, STAR_GRID_Y);
  vec2 gid = floor(grid);
  vec2 cell = fract(grid) - 0.5;

  float pick = hash21(gid + vec2(31.4, 67.9));
  /* 约 3% 格点：整屏约十颗上下（随分辨率略变） */
  float spawn = 1.0 - step(0.03, pick);

  vec2 ofs = vec2(hash21(gid + vec2(19.2, 7.7)), hash21(gid + vec2(3.3, 41.9))) - 0.5;
  float dist = length(cell - ofs * 0.48);

  /* 小圆盘星核；略抗锯齿，禁止大块 halo 以免连成雾 */
  float rad = mix(0.010, 0.021, hash21(gid + vec2(50.0, 9.0)));
  float disk = 1.0 - smoothstep(rad * 0.65, rad * 1.05, dist);

  float rnd = hash21(gid);
  float blinkFreq = 1.5 + rnd * 2.6;
  float blink = 0.34 + 0.66 * sin(t * blinkFreq + rnd * 48.7);

  return disk * blink * starSkyMask(uv) * spawn;
}

void main() {
  vec2 uv = vUv;
  float t = uTime * uFlowScale;

  /* 活动范围呼吸略收，避免轮廓一会儿拉得太「实」 */
  float rangePulse = 0.82 + 0.14 * sin(t * 0.048 + uv.x * 1.9);
  float shiftY =
    sin(t * 0.036) * 0.065 + cos(t * 0.027 + uv.x * 3.8) * 0.042;

  vec2 drift = vec2(t * 0.042, -t * 0.028);
  float warpAmp = 0.09 + 0.045 * sin(t * 0.058 + uv.y * 4.0);
  float warp = (fbm(vec2(uv.x * 2.4, uv.y * 2.2) + drift) - 0.5) * warpAmp;

  float arc =
    uv.y +
    shiftY +
    sin(uv.x * 6.28318 + t * 0.055) * (0.055 + 0.028 * sin(t * 0.042)) +
    warp * 5.2;

  /*
   * σ 整体加大：高斯带更胖 → 边缘渐变更长，轮廓不那么「勒边」。
   * pow 指数略抬：压低峰背比，亮带更像薄雾而非硬边条。
   */
  float sigmaA = (0.36 + 0.18 * sin(t * 0.044 + uv.x * 2.6)) * rangePulse;
  float sigmaB = (0.45 + 0.20 * cos(t * 0.038 - uv.x * 2.0)) * rangePulse;
  float sigmaC = (0.54 + 0.16 * sin(t * 0.051 + uv.x * 1.7)) * rangePulse;

  float centerA = 0.33 + 0.09 * sin(t * 0.056 + uv.x * 2.9);
  float centerB = 0.56 + 0.085 * cos(t * 0.047 - uv.x * 2.15);
  float centerC = 0.74 + 0.075 * sin(t * 0.034 + uv.x * 1.55);

  float da = (arc - centerA) / max(sigmaA, 0.08);
  float db = (arc - centerB) / max(sigmaB, 0.08);
  float dc = (arc - centerC) / max(sigmaC, 0.08);

  float curtainA = pow(exp(-(da * da)), 0.82);
  float curtainB = pow(exp(-(db * db)), 0.82) * 0.42;
  float curtainC = pow(exp(-(dc * dc)), 0.85) * 0.36;

  float drapes = curtainA + curtainB + curtainC;

  float rayFreq = 28.0 + sin(uv.y * 13.5 + t * 0.042) * 9.0 + sin(t * 0.033) * 5.0;
  float raysRaw =
    sin((uv.x + warp * 8.2) * rayFreq + t * 0.078 + arc * 7.5 + sin(t * 0.025) * 2.0);
  raysRaw = raysRaw * 0.5 + 0.5;
  /* 抬高阈值 + 更高次幂：射线条纹变淡，与帷幕更融合 */
  float rays = smoothstep(0.32, 0.94, raysRaw);
  rays = pow(rays, 2.05);

  float breathe = 0.84 + 0.16 * sin(t * 0.074 + uv.x * 3.5 + arc * 6.0);

  float lum = drapes * mix(0.52, 0.88, rays) * breathe * 0.79;

  /* 竖向尽量铺满：仅最底一条做极渐隐，减轻压正文；顶缘宽渐隐 */
  float skyMask = smoothstep(0.0, 0.18, uv.y) * (1.0 - smoothstep(0.86, 1.0, uv.y));
  lum *= skyMask;

  /*
   *  pastel 极光：浅蓝 / 浅紫为主，辅以浅玫瑰、雾白、粉；避免高饱和氧绿主色。
   */
  float hueOsc = sin(t * 0.065 + uv.y * 6.0 + uv.x * 3.0) * 0.5 + 0.5;
  float hueOsc2 = cos(t * 0.052 + uv.x * 5.5) * 0.5 + 0.5;

  vec3 colIceBlue = vec3(0.58, 0.78, 0.96);
  vec3 colLilac = vec3(0.76, 0.68, 0.94);
  vec3 colPeri = vec3(0.64, 0.62, 0.93);
  vec3 colRose = vec3(0.94, 0.68, 0.78);
  vec3 colCoral = vec3(0.96, 0.74, 0.76);
  vec3 colPastelPink = vec3(0.96, 0.80, 0.90);
  vec3 colMistWhite = vec3(0.94, 0.95, 0.99);

  vec3 baseAurora = mix(colIceBlue, colLilac, mix(0.36, 0.74, hueOsc) * (0.42 + rays * 0.26));
  vec3 rgb = mix(baseAurora, colPeri, hueOsc2 * drapes * 0.16);

  float topRose =
    smoothstep(0.52, 0.95, uv.y) *
    drapes *
    (0.35 + rays * 0.38) *
    (0.55 + 0.45 * sin(t * 0.071 + uv.x * 2.2));
  rgb = mix(rgb, mix(colRose, colCoral, hueOsc * 0.35), clamp(topRose * 0.36, 0.0, 1.0));

  float n2Band =
    drapes *
    curtainA *
    smoothstep(0.12, 0.34, arc) *
    (1.0 - smoothstep(0.46, 0.64, arc)) *
    (0.42 + (1.0 - rays) * 0.28) *
    (0.65 + 0.35 * sin(t * 0.061));
  rgb = mix(rgb, mix(colPeri, colIceBlue, 0.45), clamp(n2Band * 0.34, 0.0, 1.0));

  float edgeX = smoothstep(0.0, 0.18, uv.x) * smoothstep(1.0, 0.82, uv.x);
  rgb =
    mix(
      rgb,
      colPastelPink,
      edgeX * drapes * (0.09 + 0.09 * sin(t * 0.048 + uv.y * 8.0))
    );

  float brightMix = smoothstep(0.78, 1.0, rays * breathe);
  rgb = mix(rgb, colMistWhite, brightMix * drapes * (0.09 + 0.07 * hueOsc));

  vec3 skyTintCool = vec3(0.10, 0.14, 0.28);
  rgb = mix(rgb, skyTintCool + colLilac * 0.08, skyMask * 0.08);

  float alpha = lum * uIntensity * 0.93;

  float sb = starsBrightness(uv, t) * uStarStrength;
  vec2 starGid = floor(starWarpUv(uv) * vec2(STAR_GRID_X, STAR_GRID_Y));
  vec3 starTint =
    mix(vec3(1.0, 0.97, 0.92), vec3(0.82, 0.90, 1.0), hash21(starGid + vec2(99.0, 99.0)));

  /*
   * 星点为孤立高亮，系数适中即可；过大易与极光糊成一片。
   */
  vec3 auroraRgb = rgb * alpha * 0.96;
  vec3 starRgb = starTint * sb * 2.55;
  vec3 outRgb = auroraRgb + starRgb;
  float alphaOut = clamp(alpha * 0.66 + sb * 0.72, 0.0, 0.96);
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
        /** 星空总增益（与着色器内 3.85 相乘）；reduced-motion 分支另调 */
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
