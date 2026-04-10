"use client";

import { Badge } from "@/components/ui/badge";
import { ApiParameter } from "@/lib/utils/api-scanner";

interface ApiParametersProps {
  parameters: ApiParameter[];
}

export function ApiParameters({ parameters }: ApiParametersProps) {
  if (parameters.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">此接口无需参数</div>;
  }

  const getLocationColor = (location: string) => {
    const colors = {
      query: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      path: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      header: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    };
    return colors[location as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-sm text-foreground">参数列表</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3 font-medium text-muted-foreground">参数名</th>
              <th className="text-left py-2 px-3 font-medium text-muted-foreground">类型</th>
              <th className="text-left py-2 px-3 font-medium text-muted-foreground">位置</th>
              <th className="text-left py-2 px-3 font-medium text-muted-foreground">必需</th>
              <th className="text-left py-2 px-3 font-medium text-muted-foreground">描述</th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((param, index) => (
              <tr key={index} className="border-b last:border-b-0 hover:bg-muted/50">
                <td className="py-2 px-3">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{param.name}</code>
                </td>
                <td className="py-2 px-3">
                  <Badge variant="outline">{param.type}</Badge>
                </td>
                <td className="py-2 px-3">
                  <Badge className={getLocationColor(param.location)}>{param.location}</Badge>
                </td>
                <td className="py-2 px-3">
                  <Badge variant={param.required ? "destructive" : "secondary"}>{param.required ? "是" : "否"}</Badge>
                </td>
                <td className="py-2 px-3 text-muted-foreground">{param.description || "无描述"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
