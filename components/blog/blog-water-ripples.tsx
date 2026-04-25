"use client";

/**
 * 博客路由专用：浅色主题下的「动态水波纹」氛围层。
 *
 * 实现要点：
 * - Three.js 正交相机 + 全屏平面 + 片元着色器；多组漂移圆心上的衰减正弦波叠加，模拟水面同心涟漪；
 * - 另叠一层细密干涉纹理，增强液体感；
 * - 透明混合叠在页面渐变背景之上，不遮挡正文（pointer-events-none）。
 *
 * 性能：rAF、隐藏标签页跳过、DPR 上限、滚动窗口隔帧绘制、ResizeObserver 合并 rAF、
 * prefers-reduced-motion 降强度（见 lib/utils/blog-webgl-performance）。
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
 * 水波纹：4 组圆心缓慢漂移 + 各自相位；波纹强度随半径指数衰减。
 * 颜色：用振荡项 m 映射「相位」，区分波谷（偏灰青浊水影）、过渡（浅水青绿透光）、
 * 斜面（冷蓝的天光反射）、波峰（近冷白的镜面高光），避免单一浅蓝渐变塑料感。
 */
const fragmentShader = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uIntensity;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 p = (uv - 0.5) * aspect;

  float t = uTime * uSpeed;

  /* 四个漂移中心：略增大摆动半径，让干涉范围在画面上更「撑开」 */
  vec2 c0 = vec2(sin(t * 0.11) * 0.28, cos(t * 0.09) * 0.18);
  vec2 c1 = vec2(cos(t * 0.075 + 1.7) * 0.32, sin(t * 0.13) * 0.22);
  vec2 c2 = vec2(sin(t * 0.052 + 2.4) * 0.24, cos(t * 0.088) * 0.26);
  vec2 c3 = vec2(-sin(t * 0.068) * 0.30, sin(t * 0.095 + 0.9) * 0.20);

  vec2 centers[4];
  centers[0] = c0;
  centers[1] = c1;
  centers[2] = c2;
  centers[3] = c3;

  float m = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 cc = centers[i];
    float d = length(p - cc);
    /*
     * d * k：k 下调 → 波长更长、同心圆更疏（视觉上「波纹更大」）。
     * t * ω：ω 上调 → 相位扫过更快（起伏「频率」更高、动感更强）。
     */
    float ripple = sin(d * 34.0 - t * 5.85 + float(i) * 2.1);
    /* 衰减再放宽：单组涟漪可覆盖更大视域 */
    ripple *= exp(-d * 1.68);
    ripple *= 0.52 + 0.48 * sin(t * 0.48 + float(i) * 1.3);
    m += ripple * 0.38;
  }

  /* 细密交叉波纹：空间频率略降以匹配主纹；时间项略抬升 */
  float fine =
    sin(p.x * 62.0 + t * 3.15) * sin(p.y * 56.0 - t * 2.85) * 0.045 +
    sin((p.x + p.y) * 48.0 + t * 2.2) * 0.032;

  m += fine;

  float a = clamp(abs(m) * uIntensity * 0.62, 0.0, 1.0);

  /*
   * phase：由 signed 波纹 m 映射到 0–1；整组色相偏「青绿 / 绿松石」，与浅色主题灰白、浅蓝紫背景区分。
   * 波谷略浊绿、过渡浅水透青、反射带仍偏冷但绿分量抬高，高光带薄荷白而非纯冷蓝白。
   */
  float phase = clamp(m * 2.35 + 0.5, 0.0, 1.0);

  vec3 deepBody = vec3(0.26, 0.48, 0.50);
  vec3 shallowLit = vec3(0.40, 0.74, 0.68);
  vec3 skyGlint = vec3(0.46, 0.78, 0.76);
  vec3 specPeak = vec3(0.78, 0.94, 0.90);

  vec3 rgb = mix(deepBody, shallowLit, smoothstep(0.1, 0.46, phase));
  rgb = mix(rgb, skyGlint, smoothstep(0.33, 0.68, phase) * 0.58);
  rgb = mix(rgb, specPeak, smoothstep(0.65, 0.98, phase));

  /* 极细高光：薄荷白偏青，避免与背景的冷蓝高光糊成一片 */
  float glint = pow(clamp(abs(m) * 2.8, 0.0, 1.0), 3.2);
  rgb = mix(rgb, vec3(0.86, 0.97, 0.94), glint * 0.35);

  gl_FragColor = vec4(rgb, a * 0.44);
}
`;

function BlogWaterRipplesCanvas() {
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
        uResolution: { value: new THREE.Vector2(1, 1) },
        /** 默认略高于 1，配合 shader 内系数控制整体亮度 */
        uIntensity: { value: 1.28 },
        /** 全局时间缩放，与 shader 内 ω 一并抬高整体起伏节奏 */
        uSpeed: { value: 1.12 },
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
      material.uniforms.uResolution.value.set(w, h);
      renderer.setSize(w, h, false);
    };

    const scrollBudget = createBlogGlScrollBudget();
    const { dispose: disposeResize } = attachCoalescedResize(el, resize);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      material.uniforms.uIntensity.value = 0.58;
      material.uniforms.uSpeed.value = 0.22;
    }

    /* 隐藏标签页时不调度 rAF，减轻后台 CPU；前台仅 shouldRenderFrame 为真时才真正 draw */
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

  /**
   * fixed + 较高 z：叠在 blog layout 的 section 渐变之上，且低于 z-10 正文（与首页雨滴同级思路）。
   */
  return <div ref={mountRef} className="pointer-events-none fixed inset-0 z-[2] isolate overflow-hidden" aria-hidden />;
}

/** 入口：仅浅色主题挂载，深色由极光层接管 */
export function BlogWaterRipples() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || resolvedTheme !== "light") {
    return null;
  }

  return <BlogWaterRipplesCanvas />;
}
