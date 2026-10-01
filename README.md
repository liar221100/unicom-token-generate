# 联通 Token 获取工具 - Cloudflare Worker 版本

这是一个用于获取联通 Token 的工具，从 Python Flask 应用改写为 Cloudflare Worker 版本。
[参考文章](https://yaohuo.me/bbs-1495056.html)

## 功能特性

- ✅ RSA 加密（使用联通官方公钥）
- ✅ 密码加密登录
- ✅ 获取 token_online 和 ecs_token
- ✅ 现代化的 Web 界面
- ✅ 一键复制功能
- ✅ 无服务器架构（Cloudflare Worker）
- ✅ 全球 CDN 加速

## 技术栈

- **运行时**: Cloudflare Workers
- **语言**: TypeScript
- **加密**: Web Crypto API (RSA-OAEP)
- **部署**: Wrangler CLI

## 本地开发

### 1. 安装依赖

```bash
bun install
```

### 2. 启动开发服务器

```bash
bun run dev
```

这将启动本地开发服务器，默认地址是 `http://localhost:8787`

### 3. 访问应用

在浏览器中打开 `http://localhost:8787`，输入手机号和密码即可获取 Token。

## 部署到 Cloudflare

### 1. 登录 Cloudflare

```bash
bunx wrangler login
```

### 2. 部署应用

```bash
bun run deploy
```

部署成功后，你会获得一个 `*.workers.dev` 的域名。

### 3. 自定义域名（可选）

在 `wrangler.toml` 中配置自定义域名：

```toml
[[routes]]
pattern = "your-domain.com/*"
zone_name = "your-domain.com"
```

## 文件说明

- `worker.ts` - 主要的 Worker 代码，包含所有业务逻辑
- `wrangler.toml` - Cloudflare Worker 配置文件
- `package.json` - 项目依赖和脚本配置
- `tsconfig.json` - TypeScript 配置

## 核心实现

### RSA 加密

使用 Web Crypto API 实现 RSA-OAEP 加密，与 Python 版本的 PKCS1_v1_5 加密方式兼容：

```typescript
const encryptedData = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, data)
```

### 登录流程

1. RSA 加密手机号（不添加后缀）
2. RSA 加密密码（添加"000000"后缀）
3. 发送请求到联通官方 API
4. 解析返回的 token_online 和 ecs_token

### 数据安全

- ✅ 所有数据仅发送到联通官方服务器
- ✅ 不存储任何用户信息
- ✅ 加密在客户端完成
- ✅ 使用 HTTPS 加密传输

## 注意事项

1. **仅供学习使用**：请遵守联通服务条款
2. **数据安全**：请妥善保管获取的 Token
3. **有效期**：Token 有时效性，过期需重新获取
4. **频率限制**：避免频繁请求，可能被限制

## 与原 Python 版本的区别

| 特性     | Python Flask | Cloudflare Worker |
| -------- | ------------ | ----------------- |
| 运行环境 | 需要服务器   | 无服务器          |
| 启动时间 | 秒级         | 毫秒级            |
| 扩展性   | 手动扩展     | 自动扩展          |
| 全球部署 | 需要 CDN     | 内置 CDN          |
| 成本     | 服务器费用   | 免费额度充足      |
| 加密库   | PyCrypto     | Web Crypto API    |

## 开发工具

本项目使用 Bun 作为包管理器和运行时，也兼容 npm/pnpm。

```bash
# 使用 Bun（推荐）
bun install
bun run dev

# 或使用 npm
npm install
npm run dev
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
