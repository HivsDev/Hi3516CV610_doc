---
hide:
  - toc
---

# [CHIP_NAME] 系列开发指南

<div class="hero-banner" markdown>

<div class="hero-left" markdown>

**Wi-Fi 6 + SLE (SparkLink Low Energy) 1.0 + BLE (Bluetooth Low Energy) 5.4 三模解决方案**

</div>

</div>

## 芯片介绍

[CHIP_NAME] 系列是一款高度集成的 2.4GHz Combo 芯片，同时支持 Wi-Fi 6、SLE 1.0、 BLE 5.4 三种无线协议，内置 32bit 处理器、硬件安全引擎及丰富外设。

### 关键参数

| 类别 | 参数 | [CHIP_NAME] | [CHIP_NAME]E |
|------|------|:---:|:---:|
| Wi-Fi | 协议 | 802.11b/g/n/ax（PHY (Physical Layer)），802.11d/e/i/k/v/r/w（MAC (Media Access Control)） | 同 [CHIP_NAME] |
| | 频宽 / 速率 | HT20/40 MCS7 150Mbps，HE20 MCS9 114.7Mbps | 同 [CHIP_NAME] |
| | 模式 | STA (Station) + SoftAP（最大 6 路 STA 接入） | 同 [CHIP_NAME] |
| | 安全 | WPA (Wi-Fi Protected Access) / WPA2 (Wi-Fi Protected Access 2) / WPA3 (Wi-Fi Protected Access 3) Personal、WPS2.0、WAPI (WLAN Authentication and Privacy Infrastructure) | 同 [CHIP_NAME] |
| BLE | 协议 | BLE 5.4 | 同 [CHIP_NAME] |
| | 速率 | 125K / 500K / 1M / 2Mbps，高功率 20dBm | 同 [CHIP_NAME] |
| | 特性 | 网关、多路广播 | 同 [CHIP_NAME] |
| SLE | 协议 | SLE 1.0 | 同 [CHIP_NAME] |
| | 频宽 / 速率 | 1 / 2 / 4 MHz，最大 12 Mbps，Polar 信道编码 | 同 [CHIP_NAME] |
| | 特性 | SLE 网关 | 同 [CHIP_NAME] |
| 处理器 | 内核 | 32bit，240MHz | 同 [CHIP_NAME] |
| 存储 | 内置 | SRAM (Static Random Access Memory) 606KB + ROM (Read-Only Memory) 300KB + 4MB Flash | 同 [CHIP_NAME] |
| 外设 | 接口 | 1×SPI (Serial Peripheral Interface)、1×QSPI (Quad Serial Peripheral Interface)、2×I2C (Inter-Integrated Circuit)、1×I2S (Inter-IC Sound)、3×UART (Universal Asynchronous Receiver/Transmitter)<br/>19×GPIO (General Purpose Input/Output)、6×ADC (Analog-to-Digital Converter)、8×PWM（复用） | 同 [CHIP_NAME] |
| 雷达 | 人体感知 | — | **支持** |
| 电源 | 输入 | 3.3V / 5V，IO 支持 1.8V / 3.3V，UART 5V tolerant | 同 [CHIP_NAME] |
| 封装 | 尺寸 | QFN-40，5mm × 5mm | 同 [CHIP_NAME] |
| 温度 | 范围 | -40°C ~ +85°C | 同 [CHIP_NAME] |


---

## 开发流程

从零开始开发 [CHIP_NAME] 应用，只需以下步骤：

<nav class="grid cards" markdown>

-   [**1. 开发板选型**](get-started/board-introduction.md)

    ---

    根据应用场景选择合适的芯片型号的开发板。

-   [**2. 环境搭建**](get-started/environment-setup.md)

    ---

    安装 VS Code + [Your Brand] Studio 插件，下载工具链和 SDK，完成开发环境配置。

-   [**3. 快速开始**](get-started/quick-start.md)

    ---

    使用 [Your Brand] Studio 插件新建工程开始，完成工程的创建、配置、编译、烧录，验证运行结果。

-   [**4. 参考案例**](samples/index.md)

    ---

    开发者可基于参考案例进一步开发所需功能。

-   [**5. 常见问题**](FAQ/index.md)

    ---

    开发过程中遇到问题？查看 FAQ (Frequently Asked Questions) 获取常见问题解答。

</nav>

---

## 应用案例

<nav class="grid cards" markdown>

-   [**AI 语音玩具方案**](#){ target=_blank }

    ---

    语音交互｜云端大模型｜星闪智联｜鸿蒙技术

    ---

    ![应用案例截图](#)

    星闪+鸿蒙技术，低时延高可靠，多模型兼容，智能对话强。润开鸿基于[CHIP_NAME]/[CHIP_NAME]E提供完整软硬件方案。

-   [**星闪红外遥控车**](#){ target=_blank }

    ---

    星闪红外双模控制 | 寻迹避障 | 远程云控 | 语音交互 | 鸿蒙系统

    ---

    ![应用案例截图](#)

    星闪红外双模控制，毫秒级指令响应。完整教学与自动巡线，高精度避障。华清远见基于[CHIP_NAME]提供硬件 + 软件 + 教学资料一体化方案。

-   [**星闪Mesh智能家居互联方案**](#){ target=_blank }

    ---

    无线组网 | 智慧联动 | 场景随心
    
    ---

    ![应用案例截图](#)

    即插即用，极简组网。远距离覆盖10000+节点，全程加密。问沧智能基于[CHIP_NAME]提供全屋无线智能网络方案

</nav>

[查看更多案例](#){ .md-button target=_blank  }
