import React from "react";

/**
 * 动态阴影效果工具函数
 * 为分类卡片提供交互式的阴影效果
 */

export interface ShadowEffectOptions {
  intensity?: number;
  color?: string;
  blur?: number;
  spread?: number;
}

export class ShadowEffectManager {
  private static instance: ShadowEffectManager;
  private activeElements: Map<HTMLElement, ShadowEffectOptions> = new Map();

  static getInstance(): ShadowEffectManager {
    if (!ShadowEffectManager.instance) {
      ShadowEffectManager.instance = new ShadowEffectManager();
    }
    return ShadowEffectManager.instance;
  }

  /**
   * 应用悬停阴影效果
   */
  applyHoverShadow(element: HTMLElement, options: ShadowEffectOptions = {}) {
    const { intensity = 0.1, color = "rgba(59, 130, 246, 0.3)", blur = 20, spread = 0 } = options;

    element.addEventListener("mouseenter", () => {
      this.setShadow(element, {
        x: 0,
        y: 20,
        blur,
        spread,
        color: `rgba(0, 0, 0, ${intensity})`,
        additional: `0 0 ${blur}px ${spread}px ${color}`,
      });
    });

    element.addEventListener("mouseleave", () => {
      this.resetShadow(element);
    });
  }

  /**
   * 应用点击阴影效果
   */
  applyClickShadow(element: HTMLElement, options: ShadowEffectOptions = {}) {
    const { intensity = 0.05, color = "rgba(59, 130, 246, 0.2)", blur = 10, spread = 0 } = options;

    element.addEventListener("mousedown", () => {
      this.setShadow(element, {
        x: 0,
        y: 2,
        blur: 4,
        spread: 0,
        color: `rgba(0, 0, 0, ${intensity})`,
        additional: `0 0 ${blur}px ${spread}px ${color}`,
      });
    });

    element.addEventListener("mouseup", () => {
      this.resetShadow(element);
    });
  }

  /**
   * 应用聚焦阴影效果
   */
  applyFocusShadow(element: HTMLElement, options: ShadowEffectOptions = {}) {
    const { intensity = 0.2, color = "rgba(59, 130, 246, 0.4)", blur = 15, spread = 2 } = options;

    element.addEventListener("focus", () => {
      this.setShadow(element, {
        x: 0,
        y: 0,
        blur: 0,
        spread: 3,
        color: "rgba(59, 130, 246, 0.5)",
        additional: `0 0 ${blur}px ${spread}px ${color}`,
      });
    });

    element.addEventListener("blur", () => {
      this.resetShadow(element);
    });
  }

  /**
   * 应用脉冲阴影效果
   */
  applyPulseShadow(element: HTMLElement, options: ShadowEffectOptions = {}) {
    const { intensity = 0.15, color = "rgba(59, 130, 246, 0.3)", blur = 25, spread = 0 } = options;

    element.classList.add("shadow-pulse");
    this.activeElements.set(element, options);
  }

  /**
   * 应用浮动阴影效果
   */
  applyFloatShadow(element: HTMLElement, options: ShadowEffectOptions = {}) {
    const { intensity = 0.1, color = "rgba(59, 130, 246, 0.2)", blur = 20, spread = 0 } = options;

    element.classList.add("shadow-float");
    this.activeElements.set(element, options);
  }

  /**
   * 应用发光阴影效果
   */
  applyGlowShadow(element: HTMLElement, options: ShadowEffectOptions = {}) {
    const { intensity = 0.3, color = "rgba(59, 130, 246, 0.4)", blur = 30, spread = 0 } = options;

    element.classList.add("shadow-glow");
    this.activeElements.set(element, options);
  }

  /**
   * 移除所有阴影效果
   */
  removeAllEffects(element: HTMLElement) {
    element.classList.remove("shadow-pulse", "shadow-float", "shadow-glow");
    this.resetShadow(element);
    this.activeElements.delete(element);
  }

  /**
   * 设置阴影样式
   */
  private setShadow(
    element: HTMLElement,
    shadow: {
      x: number;
      y: number;
      blur: number;
      spread: number;
      color: string;
      additional?: string;
    }
  ) {
    const shadowValue = `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`;
    const additionalShadow = shadow.additional ? `, ${shadow.additional}` : "";

    element.style.boxShadow = shadowValue + additionalShadow;
  }

  /**
   * 重置阴影样式
   */
  private resetShadow(element: HTMLElement) {
    element.style.boxShadow = "";
  }

  /**
   * 根据层级应用不同的阴影效果
   */
  applyLevelShadow(element: HTMLElement, level: number) {
    const levelColors = [
      "rgba(59, 130, 246, 0.2)", // 蓝色 - 一级
      "rgba(16, 185, 129, 0.2)", // 绿色 - 二级
      "rgba(139, 92, 246, 0.2)", // 紫色 - 三级
      "rgba(245, 158, 11, 0.2)", // 橙色 - 四级
      "rgba(239, 68, 68, 0.2)", // 红色 - 五级
    ];

    const color = levelColors[Math.min(level, levelColors.length - 1)];

    this.applyHoverShadow(element, { color });
    this.applyClickShadow(element, { color });
  }

  /**
   * 应用主题相关的阴影效果
   */
  applyThemeShadow(element: HTMLElement, theme: "light" | "dark") {
    if (theme === "dark") {
      // 暗色主题使用更亮的阴影
      this.applyHoverShadow(element, {
        intensity: 0.2,
        color: "rgba(255, 255, 255, 0.1)",
      });
    } else {
      // 明色主题使用标准阴影
      this.applyHoverShadow(element, {
        intensity: 0.1,
        color: "rgba(0, 0, 0, 0.1)",
      });
    }
  }
}

// 导出单例实例
export const shadowManager = ShadowEffectManager.getInstance();

// 工具函数
export const createShadowEffect = (
  element: HTMLElement,
  type: "hover" | "click" | "focus" | "pulse" | "float" | "glow",
  options?: ShadowEffectOptions
) => {
  switch (type) {
    case "hover":
      shadowManager.applyHoverShadow(element, options);
      break;
    case "click":
      shadowManager.applyClickShadow(element, options);
      break;
    case "focus":
      shadowManager.applyFocusShadow(element, options);
      break;
    case "pulse":
      shadowManager.applyPulseShadow(element, options);
      break;
    case "float":
      shadowManager.applyFloatShadow(element, options);
      break;
    case "glow":
      shadowManager.applyGlowShadow(element, options);
      break;
  }
};

// React Hook for shadow effects
export const useShadowEffect = (
  elementRef: React.RefObject<HTMLElement>,
  type: string,
  options?: ShadowEffectOptions
) => {
  React.useEffect(() => {
    if (elementRef.current) {
      createShadowEffect(elementRef.current, type as any, options);
    }
  }, [elementRef, type, options]);
};
