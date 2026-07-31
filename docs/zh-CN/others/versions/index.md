# 版本说明

本文档记录 [CHIP_NAME] 系列芯片 SDK (Software Development Kit) 的版本更新历史。

---

## [v1.10.107 Beta](https://gitcode.com/YourOrg/YourRepo[Your Brand]/fbb_[CHIP_NAME]/commit/e6990141) (2026-03)

- 新增 Matter 智能家居互联协议支持（`[CHIP_NAME]-liteos-matter`）
- 新增 FreeRTOS (Free Real-Time Operating System) / RT-Thread 内核支持

---

## [v1.10.106](https://gitcode.com/YourOrg/YourRepo[Your Brand]/fbb_[CHIP_NAME]/tree/1.10.106) (2025-12)

- 新增 SLE (SparkLink Low Energy) HID (Human Interface Device) 键盘及鼠标行业方案
- 新增 OTA (Over-The-Air) 固件升级功能
- 新增 BLE (Bluetooth Low Energy) Wi-Fi 配网功能
- 新增连接管理：RSSI (Received Signal Strength Indicator) 测距

---

## [v1.10.103](https://gitcode.com/YourOrg/YourRepo[Your Brand]/fbb_[CHIP_NAME]/tree/1.10.103) (2025-09)

- 新增 LVGL (Light and Versatile Graphics Library) 9.x 图形库集成及 LCD (Liquid Crystal Display) ST7789 示例
- 新增 BR (Basic Rate) 经典蓝牙音频：A2DP (Advanced Audio Distribution Profile) / AVRCP (Audio/Video Remote Control Profile) / HFP (Hands-Free Profile)
- 新增 HADM (High Accuracy Distance Measurement) 测距示例

---

## [v1.10.100](https://gitcode.com/YourOrg/YourRepo[Your Brand]/fbb_[CHIP_NAME]/commit/84dfa8f8) (2025-06)

- 首次发布 SLE 1.0 协议栈
- 新增 CHBA (Converged Host Bus Adapter) IP (Internet Protocol) 及 SLP (SparkLink Positioning) 低功耗定位
- 新增雷达探测功能（sub_6g / slp）

---

## [v1.0.0](https://gitcode.com/YourOrg/YourRepo[Your Brand]/fbb_[CHIP_NAME]/tree/1.0.0) (2025-03)

初始版本，提供以下功能：

- Wi-Fi 6（2.4 GHz）AP (Access Point) / STA (Station) 模式
- BLE 5.4 GAP (Generic Access Profile) / GATT (Generic Attribute Profile)
- 外设驱动：GPIO (General Purpose Input/Output)、UART (Universal Asynchronous Receiver/Transmitter)、SPI (Serial Peripheral Interface)、I2C (Inter-Integrated Circuit)、PWM (Pulse Width Modulation)、ADC (Analog-to-Digital Converter)、DMA (Direct Memory Access)、RTC (Real-Time Clock)、Watchdog、Timer
- 硬件安全引擎：Cipher、Hash、PKE (Public Key Engine)、TRNG (True Random Number Generator)、KM
- 存储：SFC (Serial Flash Controller) Flash、eFuse (Electronic Fuse)、NV (Non-Volatile)
- 网络协议栈：lwIP（TCP (Transmission Control Protocol) / UDP (User Datagram Protocol) / HTTP (HyperText Transfer Protocol) / MQTT (Message Queuing Telemetry Transport) / CoAP (Constrained Application Protocol)）
- 安全传输层：mbedTLS（TLS (Transport Layer Security) / DTLS (Datagram Transport Layer Security)）
- LiteOS (Huawei LiteOS) 实时操作系统
- [Your Brand] Studio IDE (Integrated Development Environment) 支持
- FBB (Firmware Boot Block) CLI (Command Line Interface) 构建与烧录工具
