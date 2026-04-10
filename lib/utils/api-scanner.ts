import fs from "fs";
import path from "path";

export interface ApiParameter {
  name: string;
  type: string;
  location: "query" | "path" | "header";
  required: boolean;
  description?: string;
}

export interface ApiRequestBody {
  type: string;
  required: boolean;
  description?: string;
  schema?: any;
  example?: any;
}

export interface ApiResponse {
  status: number;
  description: string;
  schema?: any;
  example?: any;
}

export interface ApiExample {
  name: string;
  description?: string;
  request?: {
    headers?: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    body: any;
  };
}

export interface ApiEndpoint {
  method: string;
  path: string;
  description?: string;
  parameters?: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses?: ApiResponse[];
  examples?: ApiExample[];
  tags?: string[];
  deprecated?: boolean;
  version?: string;
}

export interface ApiGroup {
  name: string;
  description: string;
  endpoints: ApiEndpoint[];
  lastUpdated: string;
}

export class ApiScanner {
  private apiDir: string;
  private cache: Map<string, { timestamp: number; data: any }> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5分钟缓存

  constructor(apiDir: string = "app/api") {
    this.apiDir = apiDir;
  }

  /**
   * 扫描所有API接口（带缓存）
   */
  async scanAllApis(forceRefresh: boolean = false): Promise<ApiGroup[]> {
    const cacheKey = "all-apis";
    const now = Date.now();

    // 检查缓存
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (now - cached.timestamp < this.cacheTimeout) {
        console.log("使用缓存的API数据");
        return cached.data;
      }
    }

    console.log("开始扫描API接口...");
    const groups: ApiGroup[] = [];

    try {
      const apiPath = path.join(process.cwd(), this.apiDir);
      const entries = fs.readdirSync(apiPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const group = await this.scanApiGroup(entry.name, apiPath);
          if (group) {
            groups.push(group);
          }
        }
      }

      // 更新缓存
      this.cache.set(cacheKey, { timestamp: now, data: groups });
      console.log(
        `扫描完成，发现 ${groups.length} 个API组，共 ${groups.reduce((sum, g) => sum + g.endpoints.length, 0)} 个接口`
      );
    } catch (error) {
      console.error("扫描API目录失败:", error);
    }

    return groups;
  }

  /**
   * 扫描单个API组
   */
  private async scanApiGroup(groupName: string, basePath: string): Promise<ApiGroup | null> {
    const groupPath = path.join(basePath, groupName);
    const endpoints: ApiEndpoint[] = [];

    try {
      await this.scanDirectory(groupPath, groupName, endpoints);
    } catch (error) {
      console.error(`扫描API组 ${groupName} 失败:`, error);
      return null;
    }

    if (endpoints.length === 0) {
      return null;
    }

    return {
      name: groupName,
      description: this.getGroupDescription(groupName),
      endpoints,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * 递归扫描目录（支持更多文件类型）
   */
  private async scanDirectory(dirPath: string, baseGroup: string, endpoints: ApiEndpoint[]): Promise<void> {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // 递归扫描子目录
        await this.scanDirectory(fullPath, baseGroup, endpoints);
      } else if (this.isApiFile(entry.name)) {
        // 支持多种API文件格式
        const apiPath = this.getApiPath(fullPath, baseGroup);
        const fileEndpoints = await this.parseApiFile(fullPath, apiPath);
        if (fileEndpoints && fileEndpoints.length > 0) {
          endpoints.push(...fileEndpoints);
        }
      }
    }
  }

  /**
   * 判断是否为API文件
   */
  private isApiFile(fileName: string): boolean {
    const apiFilePatterns = ["route.ts", "route.js", "index.ts", "index.js", "api.ts", "api.js"];
    return apiFilePatterns.includes(fileName);
  }

  /**
   * 解析API文件
   */
  private async parseApiFile(filePath: string, apiPath: string): Promise<ApiEndpoint[]> {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const endpoints: ApiEndpoint[] = [];

      // 解析HTTP方法
      const httpMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];

      for (const method of httpMethods) {
        const methodRegex = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`, "g");
        if (methodRegex.test(content)) {
          const endpoint = this.parseEndpoint(content, method, apiPath, filePath);
          if (endpoint) {
            endpoints.push(endpoint);
          }
        }
      }

      return endpoints;
    } catch (error) {
      console.error(`解析文件 ${filePath} 失败:`, error);
      return [];
    }
  }

  /**
   * 解析单个接口（增强版）
   */
  private parseEndpoint(content: string, method: string, apiPath: string, filePath: string): ApiEndpoint | null {
    // 首先尝试使用预定义的描述映射
    let description: string | undefined = this.getEndpointDescription(method, apiPath);

    let tags: string[] = [];
    let deprecated = false;
    let version: string | undefined;

    // 如果没有预定义描述，尝试提取注释中的描述
    if (!description) {
      const methodRegex = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`, "g");
      const methodMatch = methodRegex.exec(content);

      if (methodMatch) {
        // 查找该函数前的注释
        const beforeMethod = content.substring(0, methodMatch.index);
        const commentMatch = beforeMethod.match(/\/\*\*([\s\S]*?)\*\/\s*$/m);
        if (commentMatch) {
          const commentInfo = this.extractCommentInfo(commentMatch[1]);
          description = commentInfo.description;
          tags = commentInfo.tags;
          deprecated = commentInfo.deprecated;
          version = commentInfo.version;
        }
      }

      // 如果仍然没有找到描述，使用智能描述生成
      if (!description) {
        description = this.generateSmartDescription(method, apiPath, filePath);
      }
    }

    // 提取参数信息
    const parameters = this.extractParameters(content, apiPath);

    // 提取请求体信息
    const requestBody = this.extractRequestBody(content);

    // 提取响应信息
    const responses = this.extractResponses(content);

    // 提取示例信息
    const examples = this.extractExamples(content, method, apiPath);

    return {
      method,
      path: apiPath,
      description,
      parameters,
      requestBody,
      responses,
      examples,
      tags,
      deprecated,
      version,
    };
  }

  /**
   * 提取注释信息
   */
  private extractCommentInfo(comment: string): {
    description?: string;
    tags: string[];
    deprecated: boolean;
    version?: string;
  } {
    const lines = comment.split("\n").map((line) => line.trim().replace(/^\*\s?/, ""));
    let description: string | undefined;
    const tags: string[] = [];
    let deprecated = false;
    let version: string | undefined;

    for (const line of lines) {
      if (line.startsWith("@")) {
        const [tag, ...value] = line.substring(1).split(" ");
        if (tag === "tag") {
          tags.push(value.join(" "));
        } else if (tag === "deprecated") {
          deprecated = true;
        } else if (tag === "version") {
          version = value.join(" ");
        }
      } else if (line && !line.startsWith("@")) {
        description = line;
      }
    }

    return { description, tags, deprecated, version };
  }

  /**
   * 生成智能描述
   */
  private generateSmartDescription(method: string, apiPath: string, filePath: string): string {
    const pathSegments = apiPath.split("/").filter(Boolean);

    // 查找资源名称：如果最后一个段是动态参数，使用前一个段
    let resourceSegment = pathSegments[pathSegments.length - 1];
    if (resourceSegment && resourceSegment.startsWith("{") && resourceSegment.endsWith("}")) {
      // 如果最后一个段是动态参数，使用前一个段作为资源名称
      resourceSegment = pathSegments[pathSegments.length - 2] || resourceSegment;
    }

    const actionMap: Record<string, string> = {
      GET: "获取",
      POST: "创建",
      PUT: "更新",
      DELETE: "删除",
      PATCH: "部分更新",
    };

    const action = actionMap[method] || method;
    const resource = this.getResourceName(resourceSegment);

    // 如果是动态路由参数，调整描述
    const isDynamicRoute =
      pathSegments[pathSegments.length - 1]?.startsWith("{") && pathSegments[pathSegments.length - 1]?.endsWith("}");
    if (isDynamicRoute) {
      if (method === "GET") {
        return `获取指定${resource}`;
      } else if (method === "PUT") {
        return `更新指定${resource}`;
      } else if (method === "DELETE") {
        return `删除指定${resource}`;
      } else if (method === "PATCH") {
        return `部分更新指定${resource}`;
      }
    }

    return `${action}${resource}`;
  }

  /**
   * 获取资源名称
   */
  private getResourceName(segment: string): string {
    const resourceMap: Record<string, string> = {
      posts: "文章",
      categories: "分类",
      tags: "标签",
      users: "用户",
      comments: "评论",
      media: "媒体",
      settings: "设置",
      auth: "认证",
      "api-docs": "API文档",
      seed: "数据",
      "test-db": "数据库",
      "test-env": "环境",
      proxy: "代理",
      notifications: "通知",
    };

    return resourceMap[segment] || segment;
  }

  /**
   * 提取参数信息
   */
  private extractParameters(content: string, apiPath: string): ApiParameter[] {
    const parameters: ApiParameter[] = [];

    // 从路径中提取路径参数
    const pathParams = apiPath.match(/\{([^}]+)\}/g);
    if (pathParams) {
      pathParams.forEach((param) => {
        const paramName = param.slice(1, -1);
        parameters.push({
          name: paramName,
          type: "string",
          location: "path",
          required: true,
          description: `${paramName}参数`,
        });
      });
    }

    // 从代码中提取查询参数
    const queryParamRegex = /searchParams\.get\(['"`]([^'"`]+)['"`]\)/g;
    let match;
    while ((match = queryParamRegex.exec(content)) !== null) {
      const paramName = match[1];
      if (!parameters.some((p) => p.name === paramName && p.location === "query")) {
        parameters.push({
          name: paramName,
          type: "string",
          location: "query",
          required: false,
          description: `${paramName}查询参数`,
        });
      }
    }

    return parameters;
  }

  /**
   * 提取请求体信息
   */
  private extractRequestBody(content: string): ApiRequestBody | undefined {
    // 查找请求体解析
    const bodyRegex = /await\s+request\.json\(\)/;
    if (bodyRegex.test(content)) {
      return {
        type: "application/json",
        required: true,
        description: "JSON格式的请求体",
        example: {},
      };
    }

    return undefined;
  }

  /**
   * 提取响应信息
   */
  private extractResponses(content: string): ApiResponse[] {
    const responses: ApiResponse[] = [];

    // 查找状态码
    const statusRegex = /status:\s*(\d+)/g;
    let match;
    while ((match = statusRegex.exec(content)) !== null) {
      const status = parseInt(match[1]);
      responses.push({
        status,
        description: this.getStatusDescription(status),
        example: this.getStatusExample(status),
      });
    }

    // 如果没有找到状态码，添加默认响应
    if (responses.length === 0) {
      responses.push({
        status: 200,
        description: "成功响应",
        example: { success: true, message: "操作成功" },
      });
    }

    return responses;
  }

  /**
   * 获取状态码描述
   */
  private getStatusDescription(status: number): string {
    const descriptions: Record<number, string> = {
      200: "成功",
      201: "创建成功",
      400: "请求错误",
      401: "未授权",
      403: "禁止访问",
      404: "未找到",
      500: "服务器错误",
    };
    return descriptions[status] || "响应";
  }

  /**
   * 获取状态码示例
   */
  private getStatusExample(status: number): any {
    const examples: Record<number, any> = {
      200: { success: true, message: "操作成功", data: {} },
      201: { success: true, message: "创建成功", data: { id: 1 } },
      400: { success: false, message: "请求参数错误" },
      401: { success: false, message: "未授权访问" },
      403: { success: false, message: "禁止访问" },
      404: { success: false, message: "资源未找到" },
      500: { success: false, message: "服务器内部错误" },
    };
    return examples[status] || { success: true, message: "响应" };
  }

  /**
   * 提取示例信息
   */
  private extractExamples(content: string, method: string, apiPath: string): ApiExample[] {
    const examples: ApiExample[] = [];

    // 生成基本示例
    const basicExample: ApiExample = {
      name: "基本示例",
      description: `${method} ${apiPath} 的基本使用示例`,
      response: {
        status: 200,
        body: {
          success: true,
          message: "操作成功",
          timestamp: new Date().toISOString(),
        },
      },
    };

    examples.push(basicExample);

    return examples;
  }

  /**
   * 获取API路径（修复版本）
   */
  private getApiPath(filePath: string, baseGroup: string): string {
    const relativePath = path.relative(path.join(process.cwd(), this.apiDir), filePath);
    const pathParts = relativePath.split(path.sep);

    // 移除文件名，只保留路径部分
    pathParts.pop();

    // 构建API路径，添加 /api 前缀
    let apiPath = "/api/" + pathParts.join("/");

    // 处理动态路由参数
    apiPath = apiPath.replace(/\[([^\]]+)\]/g, "{$1}");

    return apiPath;
  }

  /**
   * 获取组描述（增强版）
   */
  private getGroupDescription(groupName: string): string {
    const descriptions: Record<string, string> = {
      auth: "用户认证相关接口",
      posts: "文章管理相关接口",
      categories: "分类管理相关接口",
      tags: "标签管理相关接口",
      comments: "评论管理相关接口",
      media: "媒体文件管理相关接口",
      users: "用户管理相关接口",
      settings: "系统设置相关接口",
      proxy: "代理接口",
      seed: "数据填充接口",
      "test-db": "数据库测试接口",
      "test-env": "环境测试接口",
      "api-docs": "API文档接口",
      notifications: "通知管理相关接口",
    };

    return descriptions[groupName] || `${groupName}相关接口`;
  }

  /**
   * 获取端点描述（增强版）
   */
  private getEndpointDescription(method: string, apiPath: string): string | undefined {
    const descriptions: Record<string, Record<string, string>> = {
      "/api/api-docs": {
        GET: "获取API文档",
      },
      "/api/auth/forgot-password": {
        POST: "忘记密码",
      },
      "/api/auth/login": {
        POST: "用户登录",
      },
      "/api/auth/register": {
        POST: "用户注册",
      },
      "/api/auth/reset-password": {
        POST: "重置密码",
      },
      "/api/categories": {
        GET: "获取分类列表",
        POST: "创建分类",
      },
      "/api/categories/{id}": {
        GET: "获取分类详情",
        PUT: "更新分类",
        DELETE: "删除分类",
      },
      "/api/posts": {
        GET: "获取文章列表",
        POST: "创建文章",
      },
      "/api/posts/{id}": {
        GET: "获取文章详情",
        PUT: "更新文章",
        DELETE: "删除文章",
        PATCH: "部分更新文章",
      },
      "/api/posts/{id}/view": {
        POST: "记录文章浏览",
      },
      "/api/proxy/{...path}": {
        GET: "代理请求",
      },
      "/api/seed": {
        GET: "数据填充",
      },
      "/api/tags": {
        GET: "获取标签列表",
        POST: "创建标签",
      },
      "/api/tags/{id}": {
        GET: "获取标签详情",
        PUT: "更新标签",
        DELETE: "删除标签",
      },
      "/api/test-db": {
        GET: "测试数据库连接",
      },
      "/api/test-env": {
        GET: "测试环境变量",
      },
      "/api/notifications": {
        GET: "获取通知列表",
        POST: "创建通知",
      },
      "/api/notifications/{id}": {
        GET: "获取通知详情",
        PUT: "更新通知",
        DELETE: "删除通知",
      },
    };
    return descriptions[apiPath]?.[method];
  }
}
