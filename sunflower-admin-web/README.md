# Sunflower Admin Web

S9 阶段交付的管理后台 Web 工程骨架。

## 当前技术栈

- React 18 + TypeScript + Vite
- TDesign React
- React Router
- TanStack Query
- Axios
- Vitest + Testing Library

## 前置依赖

- Node.js `>= 20.19.0`
- npm `>= 10`

当前工作区已通过官方预编译包在 `$HOME/.local/node-v20.20.1-darwin-arm64` 安装 Node `v20.20.1`。如果系统默认 `node` 仍是旧版本，请在执行命令前先补 PATH：

```bash
export PATH="$HOME/.local/node-v20.20.1-darwin-arm64/bin:$PATH"
```

也可以直接使用本目录下的 `.nvmrc` 切换到 `20.20.1`。

## 启动

```bash
npm install
npm run dev
```

默认读取 `.env.development`，并通过 Vite proxy 把 `/api` 转发到 `http://localhost:8080`。

## 校验

```bash
npm run lint
npm run test
npm run build
```
