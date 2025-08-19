# 本地 Node 版 API 约定（与 Netlify Functions 一致）

所有接口前缀约定为 `/api`。

## 1. 加入/退出房间
- POST `/api/join-room`
  - body: `{ roomId, playerId, playerName }`
  - resp: `{ ok, roomId, players, state }`
- POST `/api/leave-room`
  - body: `{ roomId, playerId }`
  - resp: `{ ok }`

## 2. 房间状态与轮询
- GET `/api/state?roomId=xxx&since=optionalTimestamp`
  - resp: `{ ok, room: { ...房间JSON... }, serverTime }`

## 3. 回合与出题
- POST `/api/start-round`
  - body: `{ roomId, starterId, word | wordId }`
  - resp: `{ ok, roundId }`

## 4. 上传画作（整张图片/数据）
- POST `/api/post-drawing`
  - body: `{ roomId, playerId, roundId, imageBase64 }`
  - resp: `{ ok }`

## 5. 猜题
- POST `/api/submit-answer`
  - body: `{ roomId, playerId, roundId, answerText }`
  - resp: `{ ok, correct, scoreDelta }`

---

## 房间 JSON（示例字段）
```json
{
  "roomId": "r-123",
  "players": [{"id":"p1","name":"A"},{"id":"p2","name":"B"}],
  "scores": {"p1": 2, "p2": 1},
  "stage": "idle|drawing|guessing",
  "currentRound": {
    "roundId": "rnd-1",
    "drawerId": "p1",
    "word": "苹果", // 仅在需要处可选返回
    "imageBase64": "data:image/png;base64,...",
    "answers": [{"playerId":"p2","text":"苹果","correct":true}]
  },
  "lastActivity": 1710000000000
}
```

## 存储
- 路径：`src/storage/rooms/<roomId>.json`
- 清理：`lastActivity` 超过设定 TTL（如 30 分钟）可删除房间文件

## 轮询建议
- 客户端每 2-5 秒请求一次 `/api/state`
- 可带上 `since` 降低返回体体积（实现时再决定） 