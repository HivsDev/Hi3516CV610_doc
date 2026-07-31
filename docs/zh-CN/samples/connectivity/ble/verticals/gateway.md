# 网关

> BLE (Bluetooth Low Energy) Central（多连接）+ WiFi STA (Station) + 数据桥接

> 前置阅读：[Hello BLE](../basics/hello-connect.md)、[STA 连接](../../wifi/sta/sta-connect.md)

## 学习目标

- 理解 BLE 网关的架构——BLE Central 连接多个 Peripheral → 数据汇聚 → WiFi 上报云端
- 掌握 BLE 多连接管理
- 理解与 SLE (SparkLink Low Energy) 网关的异同（模型差异、实现差异）
- 能够在 [CHIP_NAME] 上实现一个连接多个传感器 + 上网的 BLE 网关

## 规格与功能

网关设备（[CHIP_NAME]）作为 BLE Central 同时连接多个 BLE Peripheral 传感器，汇聚数据通过 WiFi 上报云端，并接收云端指令下发。

```mermaid
flowchart LR
    subgraph Sensors[传感器设备]
        Temp[温湿度 Peripheral<br/>BLE]
        Light[光照 Peripheral<br/>BLE]
        Relay[继电器 Peripheral<br/>BLE]
    end
    subgraph GW[[CHIP_NAME] 网关]
        Central[BLE Central<br/>多连接]
        Bridge[数据桥接]
        WiFi[WiFi STA]
    end
    Cloud[云端 MQTT]

    Temp -->|Notify| Central
    Light -->|Notify| Central
    Central --> Bridge --> WiFi
    WiFi --> Cloud
    Cloud --> WiFi --> Bridge --> Central
    Central -->|Write| Relay
```

## 基本概念

### BLE 网关 vs SLE 网关

| | BLE 网关 | SLE 网关 |
|:---|:---|:---|
| 服务模型 | GATT（Characteristic + CCCD (Client Characteristic Configuration Descriptor)） | SSAP（Property + operate_indication） |
| 连接数 | 理论 8+，实际 ~4 | 最多 8 |
| 传感器接入 | 需要先写 CCCD 使能通知 | 直接接收 Notify/Indicate |
| 吞吐量 | ~20-40 KB/s per link | ~80-100 KB/s per link |
| 手机兼容 | ✓ 原生支持 | 需要 SLE 芯片 |

> 架构设计完全一致——差异在无线层。如果传感器是 BLE 设备，选 BLE 网关；如果是 SLE 设备，选 SLE 网关。

### 多连接管理

```c
#define MAX_PERIPHERALS 4

typedef struct {
    uint16_t conn_id;
    uint16_t data_char_handle;   // 数据通道 handle
    uint16_t ctrl_char_handle;   // 控制通道 handle
    uint8_t  online;
} peripheral_ctx_t;
```

## 涉及 API

| API | 用途 |
|-----|------|
| `gap_ble_connect_remote_device()` | BLE 多连接 |
| `gattc_discovery_service()` | 每个 Peripheral 的服务发现 |
| `gattc_write_req()` | 写 CCCD 使能通知 + 下发指令 |
| `gattc_register_callbacks()` | 接收多路 Notify |
| `wifi_sta_connect()` | WiFi 联网 |

## 案例操作指导


网关 + 多个 Peripheral 分别烧录 → Peripheral 先广播 → 网关后上电 → 逐一连接 + 写 CCCD → WiFi 联网 → 数据上报。

## 关键配置

| 参数 | 值 | 说明 |
|------|-----|------|
| BLE 连接数 | 3~4 | BLE 多连接稳定值 |
| CCCD 使能 | 连接后发现服务 + 写 CCCD=0x0001 | 每个 Peripheral 都要做 |
| 数据汇聚 | 消息队列 | 同 SLE 网关 |

## 代码详解

### 逐一连接 Peripheral

```c
static void connect_next_peripheral(void)
{
    if (g_conn_index < g_peripheral_count) {
        gap_ble_connect_remote_device(&g_peripheral_addr[g_conn_index]);
    } else {
        // 全部连接完成 → 启动 WiFi 数据上报
        start_cloud_upload();
    }
}

// 连接回调
static void conn_state_cb(uint16_t conn_id, bd_addr_t *addr,
                           gap_ble_conn_state_t state)
{
    if (state == CONNECTED) {
        // 服务发现 → 找到数据通道 → 写 CCCD
        gattc_discovery_service(g_client_id, conn_id, NULL);
    } else if (state == DISCONNECTED) {
        peripheral_ctx_t *ctx = find_by_conn_id(conn_id);
        ctx->online = false;
    }
}
```

### 数据汇聚

```c
static void notification_cb(uint8_t client_id, uint16_t conn_id,
                              gattc_handle_value_t *data, errcode_t status)
{
    peripheral_ctx_t *ctx = find_by_conn_id(conn_id);
    if (ctx == NULL) return;

    gateway_frame_t frame = {
        .source    = ctx->type,
        .conn_id   = conn_id,
        .data_len  = data->data_len,
    };
    memcpy(frame.data, data->data, data->data_len);

    osal_msg_queue_write_copy(g_upload_queue, &frame, sizeof(frame), 0);
}
```

---

