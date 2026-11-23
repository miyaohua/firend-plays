<div align="center">

# 改枪坊

**可云旗下平台 · 玩家改枪码分享社区**

官网 + 管理后台 + 服务端 + 桌面客户端

![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-33-47848F?logo=electron&logoColor=white)
![license](https://img.shields.io/badge/license-MIT-green)

</div>

---

## 项目简介

**改枪坊** 是一个面向游戏玩家的改枪码分享社区。玩家按「武器分类 → 枪械 → 改枪码」浏览社区方案，管理员从投稿中挑选精选，客户端支持一键复制、收藏与投稿。

仓库包含四个部分：

| 模块 | 目录 | 说明 |
|---|---|---|
| 官网 | `apps/admin/src/views/site` | 品牌首页、客户端下载入口、登录 / 注册 / 重置密码 |
| 管理后台 | `apps/admin` | 改枪码与精选、用户反馈、广告位、系统管理（用户 / 角色 / 菜单 / 字典 / 参数 / 日志 / 监控） |
| 服务端 | `apps/server` | NestJS + TypeORM + MySQL + Redis + BullMQ，提供官网与客户端接口 |
| 桌面客户端 | `desktop` | Electron 独立客户端，浏览、搜索、收藏、投稿与账号安全 |

## 功能一览

### 官网

- 改枪坊品牌首页：功能亮点、精选预览、客户端下载、三步上手
- 客户端下载入口（地址可用 `VITE_DOWNLOAD_URL` 配置）
- 手机号注册、密码 / 短信双模式登录、忘记密码

### 桌面客户端

- 顶部导航：精选改枪码（登录后追加我的提交、我的收藏）
- 精选用户：独立页面展示精选用户的头像与名称，点击查看该用户下的全部改枪码
- 精选改枪码浏览：左侧武器分类、枪械筛选、分类内模糊搜索
- 一键复制改枪码到系统剪贴板
- 我的收藏：卡片星标收藏 / 取消，收藏列表
- 我的投稿：提交、编辑、删除，精选码被编辑后自动取消精选
- 精选码「反馈无效」：未登录也可提交，记录为匿名反馈
- 个人主页：资料、投稿 / 收藏统计、投稿与收藏列表
- 账号安全：修改密码（已绑手机仅需短信验证码）、更换手机（原手机 + 新手机两步双重验证）
- 广告位轮播：后台配置多条图片 / 文字广告，支持排期、曝光与点击统计
- 公告栏：展示后台启用的公告，支持富文本与图片，应用启动时自动弹出
- 登录方式：账号 / 手机号 + 密码、手机号 + 短信验证码、应用内注册与忘记密码
- 主题：浅色界面，底部版本号点开可查看接口地址

### 管理后台

| 模块 | 能力 |
|---|---|
| 枪械管理 | 改枪码列表 / 新增 / 编辑 / 删除、设为精选、用户反馈处理 |
| 运营管理 | 广告位增删改、图片上传、排期、启停、曝光 / 点击统计；公告管理（富文本 + 图片、启停、排序） |
| 系统管理 | 用户（含精选用户标记）、角色、菜单、部门、字典、参数、文件、系统图标 |
| 系统监控 | 在线用户、定时任务、服务监控、缓存监控、登录锁定、操作 / 登录日志 |
| 系统工具 | 项目文档、接口文档、效果案例 |

### 认证与账号安全

- 注册：手机号必填，短信验证码校验，默认「普通用户」角色
- 登录：账号或手机号 + 密码（图片验证码）；手机号 + 短信验证码
- 忘记密码：手机号验证后可重置
- 修改密码：已绑手机仅校验手机验证码；未绑定手机的老账号降级为原密码
- 更换手机：已绑定时需「原手机验证 → 票据 → 新手机验证」两步，24 小时内限一次
- 重置 / 改密 / 换绑成功后，其他设备会话下线，当前设备保留

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3.5 · Vite 8 · TypeScript · Element Plus · Pinia · Vue Router |
| 服务端 | NestJS 12 · TypeORM · MySQL 8 · Redis 7 · BullMQ · JWT · Argon2 |
| 桌面端 | Electron 33 · electron-builder |
| 短信 | 阿里云短信（RPC 签名，无需额外 SDK） |

## 目录结构

```
.
├── apps/
│   ├── admin/                 # 前端：官网 + 管理后台
│   │   └── src/
│   │       ├── views/site/    # 官网（首页 / 注册 / 重置密码）
│   │       ├── views/gun/     # 改枪码管理与用户反馈
│   │       ├── views/ad/      # 广告位管理
│   │       └── ...
│   └── server/                # 后端：NestJS
│       ├── src/modules/       # auth / gun / ad / system / monitor ...
│       ├── src/database/      # 迁移文件
│       └── scripts/init-db.mjs
├── desktop/                   # Electron 桌面客户端
│   ├── main.js                # 主进程：接口代理、会话、广告图片转 data URL
│   ├── preload.js
│   ├── renderer/              # 无框架渲染层（HTML/CSS/JS）
│   └── build/                 # 应用图标（icns / ico / png）
├── init.sql                   # 种子数据（菜单、权限、字典、演示数据）
├── docker-compose.yml         # 仅编排后端服务
├── Dockerfile.server
├── docs/                      # 开发约定与参考文档
└── resource/                  # 静态资源
```

## 快速开始

### 环境要求

- Node.js ≥ 24
- pnpm 12（`package.json` 的 `packageManager` 已锁定）
- MySQL 8
- Redis 7

### 1. 启动 MySQL 与 Redis

本机没有现成实例时可用 Docker：

```bash
docker run -d --name gun-mysql -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=123456 \
  mysql:8 --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

docker run -d --name gun-redis -p 6379:6379 redis:7
```

### 2. 配置后端环境变量

```bash
cp apps/server/.env.example apps/server/.env
```

按需修改 `MYSQL_*`、`REDIS_*`、`JWT_SECRET`。本地个性化配置建议放在 `apps/server/.env.local`（已被 `.gitignore` 忽略，优先级高于 `.env`）。

### 3. 安装依赖

```bash
pnpm install
```

### 4. 初始化数据库

```bash
pnpm --filter server db:init
```

该命令会：创建数据库（utf8mb4）→ 执行全部 TypeORM 迁移 → 导入 `init.sql` 种子数据（菜单、权限、字典、演示账号等）。

> `MYSQL_SYNCHRONIZE` 必须保持 `false`：表结构只由迁移管理，`init.sql` 只作为种子数据。

### 5. 启动

```bash
pnpm dev:server   # 后端 http://localhost:3000/api
pnpm dev:admin    # 前端 http://localhost:5173（开发代理已指向 3000）
```

默认管理员：**admin / 123456**（请登录后尽快修改密码）。

### 可选：Docker 运行后端

在仓库根目录创建 `.env`（供 compose 读取）：

```bash
MYSQL_HOST=127.0.0.1
MYSQL_PASSWORD=123456
MYSQL_DATABASE=gun_code
REDIS_HOST=127.0.0.1
JWT_SECRET=change-me
```

```bash
docker compose up -d --build
```

## 短信（阿里云）

注册、登录、重置密码、更换手机均使用阿里云短信。在 `apps/server/.env`（或 `.env.local`）中配置：

| 变量 | 说明 |
|---|---|
| `ALIYUN_SMS_ACCESS_KEY_ID` / `ALIYUN_SMS_ACCESS_KEY_SECRET` | 具备短信发送权限的 AccessKey |
| `ALIYUN_SMS_SIGN_NAME` | 已审核通过的短信签名 |
| `ALIYUN_SMS_TEMPLATE_REGISTER` | 注册模板，默认 `SMS_505150173` |
| `ALIYUN_SMS_TEMPLATE_LOGIN` | 登录模板，默认 `SMS_504745513` |
| `ALIYUN_SMS_TEMPLATE_RESET` | 重置 / 修改密码模板，默认 `SMS_504865505` |
| `ALIYUN_SMS_TEMPLATE_BIND` | 更换手机号（新号）模板，默认 `SMS_512683868` |
| `ALIYUN_SMS_TEMPLATE_BIND_OLD` | 更换手机号（原号）模板，默认 `SMS_512683868` |

> 密钥建议放在 `apps/server/.env.local`（已被 git 忽略），不要提交到仓库。

**本地无密钥时**：

```bash
# apps/server/.env.local
SMS_MOCK=true
```

验证码不会真实发送，会写入后端日志并在发送接口响应中返回 `mockCode`，便于联调。上线前务必设为 `false`。

频控：同一手机号 + 场景 60 秒冷却、单号每日 10 条、验证码错误 5 次作废；阿里云新账号默认有账号级「1 条/分钟」流控，上线前建议在短信控制台申请提额。

## 桌面客户端

### 开发运行

```bash
cd desktop
npm install
npm start
```

默认接口地址 `http://localhost:3000/api`，可通过以下方式覆盖：

```bash
npm start -- --api-base=https://your-domain.com/api
# 或
DESKTOP_API_BASE=https://your-domain.com/api npm start
```

> 如果报「Electron 被当作 Node 运行」，说明终端存在 `ELECTRON_RUN_AS_NODE=1`，用
> `env -u ELECTRON_RUN_AS_NODE npm start` 启动。

### 打包

```bash
cd desktop

npm run dist:mac   # macOS dmg
npm run dist:win   # Windows NSIS 安装包
```

产物位于 `desktop/release/`：

| 平台 | 产物 |
|---|---|
| macOS | `改枪坊-1.0.0-arm64.dmg`、`release/mac-arm64/改枪坊.app` |
| Windows | `改枪坊-1.0.0-win-x64.exe`、`release/win-unpacked/` |

说明：

- Windows 包可在 macOS 上交叉构建（electron-builder 25 无需 wine），首次会下载 Windows 版 Electron
- 未配置代码签名时，macOS 首次打开需右键「打开」，Windows 会提示「未知发布者」
- 正式分发建议配置代码签名：`CSC_LINK`、`CSC_KEY_PASSWORD`
- 安装包与 `node_modules` 已在 `.gitignore` 中，不会入库

## 数据库与迁移

```bash
cd apps/server

# 生成迁移（修改实体后）
pnpm typeorm migration:generate src/database/migrations/<name>

# 执行 / 回滚
pnpm migration:run
pnpm migration:revert
```

约束：

- 所有表结构变更必须通过迁移提交
- `init.sql` 只放种子数据（菜单、权限、字典、演示数据），随功能迭代同步维护
- `pnpm --filter server db:init` 用于全新库初始化，已有表的库会中止；`--force` 会删库重建

## 部署

### 前端

```bash
cd apps/admin
pnpm build
# 产物：apps/admin/dist
```

Nginx 示例（history 路由 + 接口与上传目录反代）：

```nginx
server {
  listen 80;
  server_name your-domain.com;

  root /var/www/gun-code/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    client_max_body_size 20m;
  }
}
```

### 后端

```bash
cd apps/server
pnpm build
NODE_ENV=production node dist/main
```

或使用仓库根目录的 `docker-compose.yml` 构建镜像运行（上传与日志已挂载为卷）。

部署检查清单：

- `MYSQL_SYNCHRONIZE=false`
- 修改默认管理员密码
- 配置真实的 `JWT_SECRET` 与阿里云短信密钥
- 前端 `VITE_DOWNLOAD_URL` 指向真实安装包地址
- 备份 `uploads/` 与数据库

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev:server` | 启动后端（watch） |
| `pnpm dev:admin` | 启动前端开发服务器 |
| `pnpm --filter server db:init` | 初始化数据库（建库 + 迁移 + 种子） |
| `pnpm --filter admin build` | 构建前端 |
| `pnpm --filter server build` | 构建后端 |
| `pnpm format` | Prettier 格式化 |
| `cd desktop && npm start` | 启动桌面客户端 |
| `cd desktop && npm run dist:win` | 打包 Windows 安装包 |

## 文档

- [开发约定](./AGENTS.md)
- [代码风格](./docs/代码风格.md)
- [桌面客户端说明](./desktop/README.md)
- [接口文档](https://docs.apipost.net/docs/detail/61e0debdacca000?target_id=0)（模板示例，按实际部署替换）

## 常见问题

**登录一直提示验证码错误？**
检查 `sys.account.captchaEnabled` 参数与系统时间；开发环境确认 Redis 可用。

**短信发送失败？**
确认 AccessKey 权限、签名与模板编码一致；新账号注意「1 条/分钟」账号级流控；本地可先用 `SMS_MOCK=true`。

**改枪码编辑后为什么不精选了？**
内容被修改的精选码会自动取消精选，需要管理员重新精选。

**上传的图片打不开？**
后端静态资源路径为 `/api/uploads/...`，部署时需让 Nginx 把 `/api/` 反代到后端，并保证 `uploads/` 持久化。

## License

[MIT](./LICENSE)
