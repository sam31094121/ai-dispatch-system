# 統一指令規格

正式流程以後端快照為唯一來源，前端只渲染後端資料，不自行重算排名、分組、審計或公告。

## 正常流程

| API | 用途 |
| --- | --- |
| `GET /api/current` | 讀取目前正式快照 |
| `POST /api/audit` | 預覽審計與同步結果，輸入 `rawText` |
| `POST /api/save` | 儲存正式版本，輸入 `rawText` |
| `POST /api/unified/update` | 統一更新正式版本，輸入 `rawText` |
| `GET /api/broadcast/current` | 讀取播報快照 |
| `GET /api/line-output` | 讀取 LINE 輸出文字 |
| `GET /api/commands/spec` | 讀取後端統一指令規格 |

## 異常流程

| API | 用途 |
| --- | --- |
| `POST /api/smart-fix` | 僅提供格式或資料異常修復建議，輸入 `rawText` |

`smart-fix` 不是正式儲存入口；修復後仍需回到 `audit` 與 `save` 完成正式鎖定。
