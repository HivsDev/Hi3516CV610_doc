# UART 透传

> 透传桥接 — UART (Universal Asynchronous Receiver/Transmitter) over BLE (Bluetooth Low Energy) — BLE GATT (Generic Attribute Profile) Notify/Write、UART 驱动、消息队列、双向透传

> 前置阅读：Hello BLE 基础入门三部曲（[Hello BLE](../basics/hello-connect.md)、[Hello Notify](../basics/hello-notify.md)、[Hello ReadWrite](../basics/hello-readwrite.md)）

## 学习目标

- 理解 BLE 双向透传的完整数据流
- 掌握消息队列在解耦 UART ISR (Interrupt Service Routine) 与 BLE 发送中的作用
- 理解 BLE MTU (Maximum Transmission Unit) 对吞吐量的影响
- 能够在两块 [CHIP_NAME] 之间实现双向串口透传

## 规格与功能

| 规格项 | Peripheral 端 | Central 端 |
|--------|:---:|:---:|
| 链路 A（P→C） | UART RX (Receive) → BLE Notify → Central | `notify_cb` → UART TX (Transmit) |
| 链路 B（C→P） | Write handler → UART TX | UART RX → BLE Write → Peripheral |
| UART 配置 | 115200 8N1 | 同 |
| BLE MTU | 247（BLE 4.2 最大） | 同 |
| 消息队列 | UART ISR → 队列 → BLE 发送任务 | 同 |

## 基本概念

### 双向数据流

```mermaid
flowchart LR
    subgraph PCA[PC_A]
    end
    subgraph P[[CHIP_NAME] Peripheral]
        PUART[UART]
    end
    subgraph C[[CHIP_NAME] Central]
        CUART[UART]
    end
    subgraph PCB[PC_B]
    end

    PCA <-->|串口| PUART
    CUART <-->|串口| PCB

    PUART -- "链路 A: BLE Notify" --> CUART
    CUART -- "链路 B: BLE Write" --> PUART
```

### BLE 透传的吞吐量限制

| 参数 | BLE | SLE (SparkLink Low Energy) |
|------|:---:|:---:|
| PHY (Physical Layer) 速率 | 1M | 1M/2M/4M |
| MTU | 247 | 520 |
| 典型连接间隔 | 30ms | 12.5ms |
| 有效吞吐量 | ~20-40 KB/s | ~80-100 KB/s |

> BLE 透传的吞吐量天然低于 SLE——PHY 上限低、MTU 小、连接间隔通常更长。如果应用对吞吐要求高，考虑用 SLE。

## 涉及 API

| API | 谁调用 | 用途 |
|-----|--------|------|
| `uapi_uart_init/write/register_rx_callback` | 双方 | UART 操作 |
| `gatts_notify()` | Peripheral | 推数据给 Central |
| `gattc_write()` | Central | 写数据给 Peripheral |
| `osal_msg_queue_create/write_copy/read_copy` | 双方 | 解耦 ISR 与任务（OS 基础） |

## 案例操作指导


PC_A 串口输入 → PC_B 显示，PC_B 串口输入 → PC_A 显示。

## 关键配置

- UART：115200 8N1
- BLE MTU：247
- BLE 连接间隔：建议 15~30ms
- 消息队列深度：8

## 代码详解

### Peripheral 端：UART RX → BLE Notify

```c
// UART ISR 中写消息队列
static void uart_rx_isr(uint8_t *data, uint16_t len)
{
    osal_msg_queue_write_copy(g_uart_queue_id, data, len, OSAL_MSGQ_NO_WAIT);
    osal_sem_up(&g_uart_sem);  // 通知发送任务
}

// 发送任务中取队列 → BLE Notify
static int ble_send_task_handler(void *data)
{
    uint8_t buf[247];
    unsigned int buf_size;
    while (1) {
        osal_sem_down(&g_uart_sem);
        buf_size = sizeof(buf);
        osal_msg_queue_read_copy(g_uart_queue_id, buf, &buf_size, OSAL_MSGQ_WAIT_FOREVER);
        gatts_notify(g_conn_id, g_data_char_handle, buf, buf_size);
    }
}
```

### Peripheral 端：Central Write → UART TX

```c
static void write_request_cb(uint16_t conn_id, uint16_t char_handle,
                              uint8_t *data, uint16_t len)
{
    // 直接 UART 输出（数据量小时可以；大量数据建议走队列）
    uapi_uart_write(g_uart_handle, data, len);
    gatts_send_response(conn_id, char_handle, NULL, 0);
}
```

### 连接状态守护

```c
static void conn_state_cb(uint16_t conn_id, bt_gap_conn_state_t state)
{
    if (state == DISCONNECTED) {
        g_conn_id = 0;
        // 清空未发送的队列数据，避免旧数据在重连后乱序发送
        flush_uart_queue();
    }
}

// 发送前检查
void ble_send(const uint8_t *data, uint16_t len)
{
    if (g_conn_id == 0) return;  // 未连接，丢弃
    gatts_notify(g_conn_id, g_data_char_handle, data, len);
}
```

---

