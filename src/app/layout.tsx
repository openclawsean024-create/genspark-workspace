import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Genspark AI Workspace',
  description: '全能 AI 工作平台，多模型切換、檔案處理、團隊協作',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">{children}</body>
    </html>
  );
}
