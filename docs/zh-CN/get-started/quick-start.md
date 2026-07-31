# 快速开始

本文档介绍如何快速完成 [CHIP_NAME] 系列开发板的工程创建、编译和烧录。

## 第一个程序：Hello World

本节默认当前用户已完成环境搭建，将引导用户从创建工程开始，完成编译、烧录，最终在串口输出 "hello world"。

> 安装 IDE (Integrated Development Environment)、插件、配置工具链、获取 SDK等必要环境配置步骤，请参考 [环境搭建](environment-setup.md){ target=_blank }。


### 新建工程 {#新建工程}

1. 打开 [Your Brand] Studio 插件，进入`欢迎使用`页面，然后单击`新建工程`

    ![[Your Brand] Studio 欢迎页面](figures/点击新建工程.png)

1. 在`新建工程`窗口配置参数：

    ![新建工程窗口](figures/新建工程配置.png)
    
    - **芯片**：选择 `[CHIP_NAME]`
    - **开发板**：选择芯片后会自动填充芯片的开发板名称
    - **工程类型**：选择`示例工程`
    - **工程名**：自定义工程名称（如 `HelloWorld`）
    - **工程路径**：选择工程存放目录
    - **软件包**：选择下载好的 `[CHIP_NAME] SDK` 文件夹根目录（需要选择到 `src` 目录）

3. 点击`完成`新建工程
4. 如弹出 `是否信任此文件夹中的文件的作者` 确认提示窗口，点击 `是，我信任此作者` 即可。

### 编译工程

1. 工程创建成功后，[Your Brand] Studio 会自动打开新创建的工程，重新点击[Your Brand] Studio图标，进入插件页面。

    ![新工程界面](figures/新工程界面.png)

    - **工程文件**：包含`src`目录下的所有文件，以及`include`目录下的头文件。
    - **命令**：包含编译、调试、烧录等操作按钮。
    - 底部快捷按钮：与`命令`面板中的按钮对应，方便快捷操作。

2. 点击`命令`面板中的`系统配置`按钮，弹出配置窗口，依次点击 `Application` -> `Enable Sample` -> `Enable the Sample of peripheral` -> `Support hello world Sample` -> `Save` 保存，保存成功后在配置窗口底部会提示\`Configuration saved to ...\`后关闭即可。

    ![select\_sample](figures/配置sample-helloworld.png)

3. 点击左侧 `命令` 面板的 `编译` 按钮，进行编译，也可以使用 `重编译` 先清理再编译，等待编译完成，终端窗口输出 `SUCCESS` 表示编译成功

    ![编译按钮](figures/编译helloworld-sample.png)


### 硬件连接

1. 打开设备管理器，可以使用快捷键 `Win + X`，选择 `设备管理器`

    ![设备管理器](figures/设备管理器-端口信息.png)

2. 使用 Type-C USB (Universal Serial Bus) 数据线连接开发板的 USB 端口和电脑的 USB 接口，确认开发板上电后电源指示灯亮起
3. 查看当前设备管理器显示的新设备，通常为 CH340 设备，如下图示的 `COM4`，是本文示例开发板的端口号，以实际显示的端口号为准。

    ![设备管理器显示新设备](figures/设备管理器-新设备端口.png)

### 配置烧录

1. 点击左侧 `命令` 面板的 `工程配置` 按钮，在弹出的配置窗口中选择 `程序加载` 选项卡

    ![工程配置入口](figures/sample-helloworld-工程配置.png)

2. 配置烧录参数：

    - **传输方式**：选择 `serial`（串口烧录）
    - **烧写文件**：默认即可（当前工程目录下的 `output\[CHIP_NAME]\fwpkg\[CHIP_NAME]-liteos-app\[CHIP_NAME]-liteos-app_all.fwpkg`）
    - **端口选择**：在设备管理器中查看 COM 口（通常为 CH340 设备）, 如 `COM4`
    - **波特率**：选择 `921600`

### 开始烧录

1. 点击左侧 `命令` 面板的 `烧录` 按钮触发烧录，当控制台显示的内容出现类似 `Reset the device...` 的提示时，

    ![烧录按钮入口](figures/烧录-复位提示.png)
  
2. 按下开发板上的 `RST` 复位按钮

    ![RST复位按钮](figures/bearpi-rst.png)

    > 示例使用的开发板为小熊派 [BearPi-Pico H3863](board-introduction.md#bearpi-pico-h3863)  开发板。 

2. 等待烧录完成，显示类似 `All images burnt successfully` 内容时表示烧录成功

    ![烧录成功](figures/烧录-成功.png)

### 验证结果

1. 点击左侧 `命令` 面板的 `命令行` 打开终端窗口，然后再选择 `监视器`，监视模式选择 `Serial`，根据单板连接后在设备管理器中实际显示的端口号选择端口 （如 `COM4`），设置波特率 `115200`，点击 `开始监视` 按钮。

    ![切换到监视器选项卡](figures/监视器-连接串口.png)

2. 串口输出如下图示：

    ![串口输出](figures/监视器-串口输出.png)    

每秒输出一行 `hello world`，表示程序运行成功！

### Sample 代码说明

本示例使用的源码位于 `src/application/samples/peripheral/helloworld/helloworld.c`，核心代码如下：

```c
#define DEFAULT_TASK_STACK_SIZE         0x1000
#define DEFAULT_TASK_PRIORITY           26
#define DELAYS_MS                       1000

static void *hw_task(const char *arg)
{
    unused(arg);
    osal_printk("start helloworld sample\r\n");
    for(;;){
        osal_printk("hello world\r\n");
        osal_msleep(DELAYS_MS);
    }
    return NULL;
}

static void helloworld_entry(void)
{
    osal_task *task_handle = NULL;
    osal_kthread_lock();
    task_handle = osal_kthread_create((osal_kthread_handler)hw_task, 0,
                                       "HW_Task", DEFAULT_TASK_STACK_SIZE);
    if (task_handle != NULL) {
        osal_kthread_set_priority(task_handle, DEFAULT_TASK_PRIORITY);
    }
    osal_kthread_unlock();
}

/* Run the helloworld_entry. */
app_run(helloworld_entry);
```

**代码解析：**

| 函数/宏                  | 说明                       |
| --------------------- | ------------------------ |
| `helloworld_entry`    | 程序入口，创建内核线程              |
| `osal_kthread_create` | 创建内核线程，执行 `hw_task`      |
| `hw_task`             | 任务主函数，循环打印 "hello world" |
| `osal_msleep(1000)`   | 每次打印后休眠 1000ms（1秒）       |
| `app_run`             | 注册程序入口，系统启动时自动调用         |


---

> 更多案例请参考[参考案例](../samples/index.md)
