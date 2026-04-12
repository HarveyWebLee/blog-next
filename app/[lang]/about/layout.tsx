/** 关于页由内层区块自带 container，此处仅保留全宽容器避免与旧版双重嵌套冲突 */
export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <div className="w-full">{children}</div>;
}
