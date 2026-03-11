# 每日状态表

一个适合手机使用的极简记录网站：
- 喝水量
- 吃饭内容
- 身体情况
- 情绪
- 运动

每项都支持：
- 自我描述
- 0–10 分评分
- 长期趋势查看

## 本地运行

先安装 Node.js（建议 18 或 20）。

```bash
npm install
npm run dev
```

## 打包

```bash
npm run build
```

## 部署到 Vercel

1. 把整个项目上传到 GitHub
2. 登录 Vercel
3. New Project
4. 选择 GitHub 仓库
5. 点击 Deploy

## 可修改文件

- `src/App.jsx`：功能和页面结构
- `src/styles.css`：皮肤、配色、圆角、排版

## 数据说明

默认使用浏览器本地存储（localStorage）。
同一台设备同一浏览器里会保留；更换设备不会自动同步。
