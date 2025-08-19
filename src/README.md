# 本地 Node 版目录说明

此目录仅为本地 Node 服务器骨架（不含实现代码），接口与部署到 Netlify Functions 时保持一致，便于后续迁移。

建议结构：
- `routes/`：路由定义（映射到 `/api/*`）
- `controllers/`：业务分发层
- `services/`：房间状态、回合、评分等核心逻辑
- `storage/`：本地 JSON 临时存储（与 Netlify 上的 JSON 方案对齐）
- `utils/`：通用工具函数（如校验、ID 生成等）

启动入口文件稍后再添加（实现代码阶段再写）。 