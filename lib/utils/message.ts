// message.ts
import { addToast, closeToast } from "@heroui/toast";

/**
 * 消息类型枚举
 */
export type MessageType = "success" | "error" | "info" | "warning" | "loading";

/**
 * HeroUI Toast 支持的颜色类型
 */
export type ToastColor = "success" | "warning" | "danger" | "default" | "foreground" | "primary" | "secondary";

/**
 * 消息颜色映射
 */
const MESSAGE_COLOR_MAP: Record<MessageType, ToastColor> = {
  success: "success",
  error: "danger",
  info: "default",
  warning: "warning",
  loading: "default",
} as const;

/**
 * 消息选项接口
 */
export interface MessageOptions {
  /** 消息标题 */
  title?: string;
  /** 消息描述 */
  description?: string;
  /** 自动关闭延迟时间（毫秒） */
  timeout?: number;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 点击回调 */
  onClick?: () => void;
  /** 关闭回调 */
  onClose?: () => void;
  /** 唯一标识符，用于防止重复显示 */
  id?: string;
  /** 消息颜色 */
  color?: ToastColor;
}

/**
 * 消息配置接口
 */
export interface MessageConfig {
  /** 默认超时时间 */
  defaultTimeout?: number;
  /** 最大显示数量 */
  maxCount?: number;
}

/**
 * 消息工具类
 */
class MessageManager {
  private config: MessageConfig = {
    defaultTimeout: 3000,
    maxCount: 5,
  };

  /**
   * 设置消息配置
   */
  setConfig(config: Partial<MessageConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * 创建消息选项
   */
  private createOptions(msg: string | MessageOptions, type: MessageType): MessageOptions {
    const opts = typeof msg === "string" ? { title: msg } : msg;

    return {
      timeout: this.config.defaultTimeout,
      ...opts,
      color: MESSAGE_COLOR_MAP[type],
    };
  }

  /**
   * 显示成功消息
   */
  success(msg: string | MessageOptions): string {
    const options = this.createOptions(msg, "success");
    const result = addToast(options);
    return result || "";
  }

  /**
   * 显示错误消息
   */
  error(msg: string | MessageOptions): string {
    const options = this.createOptions(msg, "error");
    const result = addToast(options);
    return result || "";
  }

  /**
   * 显示信息消息
   */
  info(msg: string | MessageOptions): string {
    const options = this.createOptions(msg, "info");
    const result = addToast(options);
    return result || "";
  }

  /**
   * 显示警告消息
   */
  warning(msg: string | MessageOptions): string {
    const options = this.createOptions(msg, "warning");
    const result = addToast(options);
    return result || "";
  }

  /**
   * 显示加载消息
   */
  loading(msg: string | MessageOptions): string {
    const options = this.createOptions(msg, "loading");
    const result = addToast(options);
    return result || "";
  }

  /**
   * 关闭指定消息
   */
  close(key: string): void {
    closeToast(key);
  }

  /**
   * 关闭所有消息
   */
  closeAll(): void {
    // HeroUI Toast 没有直接的 closeAll 方法，需要遍历关闭
    // 这里可以根据实际需求实现
  }

  /**
   * 显示Promise消息
   * 自动处理loading、success、error状态
   */
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: Partial<MessageOptions>
  ): Promise<T> {
    const loadingId = this.loading(messages.loading);

    return promise
      .then((data) => {
        this.close(loadingId);
        const successMsg = typeof messages.success === "function" ? messages.success(data) : messages.success;
        this.success({ title: successMsg, ...options });
        return data;
      })
      .catch((error) => {
        this.close(loadingId);
        const errorMsg = typeof messages.error === "function" ? messages.error(error) : messages.error;
        this.error({ title: errorMsg, ...options });
        throw error;
      });
  }

  /**
   * 显示确认消息
   */
  confirm(title: string, description?: string, onConfirm?: () => void, onCancel?: () => void): string {
    return this.info({
      title,
      description,
      onClick: onConfirm,
      onClose: onCancel,
    });
  }
}

// 创建单例实例
const messageManager = new MessageManager();

// 导出消息工具对象
export const message = {
  success: messageManager.success.bind(messageManager),
  error: messageManager.error.bind(messageManager),
  info: messageManager.info.bind(messageManager),
  warning: messageManager.warning.bind(messageManager),
  loading: messageManager.loading.bind(messageManager),
  close: messageManager.close.bind(messageManager),
  closeAll: messageManager.closeAll.bind(messageManager),
  promise: messageManager.promise.bind(messageManager),
  confirm: messageManager.confirm.bind(messageManager),
  setConfig: messageManager.setConfig.bind(messageManager),
};

// 默认导出
export default message;
