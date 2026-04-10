import Link from "next/link";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { ArrowLeft, Home } from "lucide-react";

export default function AuthNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-gray-600">404</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">页面未找到</h1>
            <p className="text-gray-600 mb-6">抱歉，您访问的认证页面不存在。</p>

            <div className="space-y-3">
              <Button as={Link} href="/auth/login" color="primary" size="lg" className="w-full font-medium">
                前往登录
              </Button>

              <Button
                as={Link}
                href="/"
                variant="light"
                size="lg"
                className="w-full"
                startContent={<Home className="w-4 h-4" />}
              >
                返回首页
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
