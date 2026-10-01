# 快速开始指南

## 🚀 本地开发测试

### 1. 启动本地开发服务器

```bash
bun run dev
```

这将启动一个本地开发服务器，默认监听在 `http://localhost:8787`

### 2. 在浏览器中访问

打开浏览器访问：`http://localhost:8787`

你将看到一个简洁的登录界面：

- 输入联通手机号
- 输入服务密码（联通 APP 登录密码）
- 点击"登录并获取 Token"

### 3. 获取结果

登录成功后，你会看到：

```
账号#密码#token_online#ecs_token#appid
```

页面提供一键复制功能，方便保存。

---

## ☁️ 部署到 Cloudflare Workers

### 第一步：登录 Cloudflare

```bash
bunx wrangler login
```

这会打开浏览器，让你登录 Cloudflare 账号并授权。

### 第二步：部署

```bash
bun run deploy
```

部署成功后，会显示类似这样的信息：

```
Published unicom-token-generate (1.23 sec)
  https://unicom-token-generate.your-username.workers.dev
```

### 第三步：访问线上应用

使用上面显示的 `*.workers.dev` 域名访问你的应用。

---

## 🔧 配置说明

### wrangler.toml

主要配置文件，包含：

- `name`: Worker 的名称
- `main`: 入口文件（worker.ts）
- `compatibility_date`: 兼容性日期

### 自定义域名（可选）

如果你有自己的域名，可以在 Cloudflare Dashboard 中配置：

1. 进入 Workers & Pages
2. 选择你的 Worker
3. 点击 "Settings" → "Triggers" → "Add Custom Domain"
4. 输入你的域名（需要先在 Cloudflare 上托管该域名）

---

## 📝 工作原理

### RSA 加密流程

1. **导入联通公钥**：使用 Web Crypto API 导入联通官方公钥
2. **加密手机号**：直接加密手机号
3. **加密密码**：密码后添加 "000000" 后缀再加密
4. **分块加密**：每 117 字节为一块进行加密
5. **Base64 编码**：将加密结果编码为 Base64

### 登录流程

```
用户输入 → RSA加密 → 发送到联通API → 解析响应 → 显示Token
```

### 数据流向

```
浏览器 ←→ Cloudflare Worker ←→ 联通官方API (m.client.10010.com)
```

**重要**：所有数据仅在浏览器和联通官方服务器之间传输，Worker 仅作为中转，不存储任何数据。

---

## 🛡️ 安全说明

- ✅ 使用 HTTPS 加密传输
- ✅ 采用 RSA-OAEP 公钥加密
- ✅ 不存储任何用户信息
- ✅ 代码开源可审计
- ✅ 直连联通官方 API

---

## 🆚 与 Python 版本的对比

| 特性       | Python Flask | Cloudflare Worker |
| ---------- | ------------ | ----------------- |
| 部署难度   | 需要服务器   | 一键部署          |
| 运行成本   | 服务器费用   | 免费额度充足\*    |
| 冷启动时间 | 1-3 秒       | <10 毫秒          |
| 全球加速   | 需要配置 CDN | 内置全球 CDN      |
| 自动扩展   | 需要手动配置 | 自动无限扩展      |
| 维护成本   | 需要运维     | 零维护            |

\*Cloudflare Workers 免费套餐：

- 每天 100,000 次请求
- 每次请求 10ms CPU 时间
- 对于个人使用完全足够

---

## 🐛 故障排查

### 问题 1：本地开发启动失败

```bash
# 检查端口是否被占用
lsof -i :8787

# 使用其他端口
bunx wrangler dev worker.ts --port 8788
```

### 问题 2：部署失败

```bash
# 检查是否已登录
bunx wrangler whoami

# 重新登录
bunx wrangler login
```

### 问题 3：加密失败

确保使用的是现代浏览器，Web Crypto API 需要：

- Chrome 37+
- Firefox 34+
- Safari 11+
- Edge 12+

### 问题 4：获取 Token 失败

可能的原因：

- 手机号或密码错误
- 联通服务器限流
- 网络连接问题

---

## 📚 进阶使用

### 添加请求日志

在 `worker.ts` 中添加：

```typescript
console.log(`[${new Date().toISOString()}] Login attempt: ${phone}`)
```

在 Cloudflare Dashboard 的 "Logs" 标签中查看实时日志。

### 添加环境变量

在 `wrangler.toml` 中：

```toml
[vars]
MAX_REQUESTS_PER_IP = "10"
```

在代码中使用：

```typescript
const maxRequests = env.MAX_REQUESTS_PER_IP
```

### 添加速率限制

使用 Cloudflare Workers KV 存储请求计数，实现简单的速率限制。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
