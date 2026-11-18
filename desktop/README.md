# 精选改枪码桌面端（Electron）

把官网的「精选改枪码」页面单独做成桌面客户端，只读浏览 + 一键复制，不打包后台管理。

## 运行

```bash
cd desktop
npm install
npm start
```

默认接口地址为 `http://localhost:3000/api`（本地开发后端）。


> 如果启动时报「Electron 被当作 Node 运行」，说明当前终端设置了 `ELECTRON_RUN_AS_NODE=1`
> （从 Electron 应用内打开的终端会这样）。用 `env -u ELECTRON_RUN_AS_NODE npm start` 启动即可。

## 指定接口地址

三种方式，优先级从高到低：

```bash
# 1. 命令行参数
npm start -- --api-base=https://your-domain.com/api

# 2. 环境变量
DESKTOP_API_BASE=https://your-domain.com/api npm start

# 3. 直接改 main.js 里的默认值
```

接口地址会显示在窗口底部，方便排查。

## 登录与提交

- 点右上角「登录」，输入账号密码与图片验证码（验证码由后端 `/auth/captcha` 生成）
- 登录后顶部出现「提交改枪码」与「退出」，并解锁「我的提交」视图
- 提交表单：选择武器分类 → 枪械 → 填改枪码（必填）与备注 → 提交，成功后进入「我的提交」，状态为「待精选」
- 登录令牌只保存在主进程内存里，渲染进程拿不到；accessToken 过期会自动用 refreshToken 换新并重试一次
- 关闭应用后需要重新登录（未做「记住登录」）

## 打包

```bash
npm run dist:mac   # 产出 dmg
npm run dist:win   # 产出 nsis 安装包（需在 Windows 或 CI 上执行）
```

产物在 `desktop/release/`。

> 注意：macOS 未签名时首次打开会被 Gatekeeper 拦截，需右键「打开」或执行
> `xattr -dr com.apple.quarantine "/Applications/精选改枪码.app"`。
> 正式分发需要 Apple 开发者账号签名与公证。

## 实现要点

| 点 | 说明 |
|---|---|
| 请求走主进程 | 渲染进程通过 `window.desktop.request()` → IPC → 主进程 `fetch`，绕开 `file://` 的跨域限制，也不需要关闭 `webSecurity` |
| 复制走系统剪贴板 | `window.desktop.copy()` 直接调用 Electron `clipboard`，不受浏览器安全上下文限制 |
| 安全配置 | `contextIsolation: true`、`nodeIntegration: false`，preload 只暴露 3 个方法 |
| 数据来源 | 只调用两个公开接口：`/gun/code/options`（分类与枪械）、`/gun/code/featured`（精选码，服务端有 120 秒缓存） |
| 自动刷新 | 每 5 分钟拉一次，也可点右上角「刷新」 |

## 与网页版的关系

样式与网页版精选页保持一致，但**代码是独立的**（不依赖 admin 的 Vue 工程），
目的是让安装包保持轻量、只包含这一个页面。后续如果网页版改版，桌面端需要同步调整
`renderer/` 下的三个文件。
