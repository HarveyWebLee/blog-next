"use client";

interface ApiFilterTabsProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
}

const HTTP_METHODS = [
  { key: "all", label: "全部", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300" },
  { key: "GET", label: "GET", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  { key: "POST", label: "POST", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  { key: "PUT", label: "PUT", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  { key: "DELETE", label: "DELETE", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  { key: "PATCH", label: "PATCH", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
];

export function ApiFilterTabs({ selectedMethod, onMethodChange }: ApiFilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {HTTP_METHODS.map((method) => (
        <button
          key={method.key}
          onClick={() => onMethodChange(method.key)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            selectedMethod === method.key ? method.color : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {method.label}
        </button>
      ))}
    </div>
  );
}
