# TSensor

TSensor 是片内温度传感器，测量芯片结温（Junction Temperature），范围 -40°C ~ +125°C。支持三种采样模式：单次均值采样、周期均值采样、单点周期采样。

支持过温中断——可设置多级温度阈值，硬件自动触发保护回调。适用周期性温度采集和设备过热自动保护场景。使用前需从 eFuse (Electronic Fuse) 读取出厂校准参数。

**头文件清单**

```c
#include "include/driver/tsensor.h"
```

## 接口清单

| 接口名称 | 功能简述 |
| -------- | -------- |
| [uapi_tsensor_init](#uapi_tsensor_init) | 初始化Tsensor模块 |
| [uapi_tsensor_deinit](#uapi_tsensor_deinit) | 去初始化Tsensor模块 |
| [uapi_tsensor_start_inquire_mode](#uapi_tsensor_start_inquire_mode) | 启用Tsensor查询模式，配置采样模式与周期 |
| [uapi_tsensor_enable_outtemp_interrupt](#uapi_tsensor_enable_outtemp_interrupt) | 启用温度超出阈值中断模式 |
| [uapi_tsensor_enable_overtemp_interrupt](#uapi_tsensor_enable_overtemp_interrupt) | 启用过温中断模式 |
| [uapi_tsensor_enable_done_interrupt](#uapi_tsensor_enable_done_interrupt) | 启用温度采集完成中断模式 |
| [uapi_tsensor_get_current_temp](#uapi_tsensor_get_current_temp) | 获取当前温度值 |
| [uapi_tsensor_set_calibration_single_point](#uapi_tsensor_set_calibration_single_point) | 设置单点校准参数 |
| [uapi_tsensor_set_calibration_two_points](#uapi_tsensor_set_calibration_two_points) | 设置两点校准参数 |
| [uapi_tsensor_set_multilevel_threshold_value](#uapi_tsensor_set_multilevel_threshold_value) | 设置多级温度阈值 |
| [uapi_tsensor_set_multilevel_threshold_en](#uapi_tsensor_set_multilevel_threshold_en) | 设置多级温度阈值中断使能 |

## Functions

### uapi_tsensor_init <a id="uapi_tsensor_init"></a>

```c
errcode_t uapi_tsensor_init(void)
```

**头文件清单**

```c
#include "include/driver/tsensor.h"
```

**功能说明**

- 初始化Tsensor模块，注册HAL (Hardware Abstraction Layer) 层函数与中断处理
- 调用该接口后，Tsensor模块进入可用状态，可进行后续查询或中断模式配置
- 重复调用该接口将返回失败，模块不支持重复初始化

**前置条件**

- Tsensor模块未初始化，即尚未调用过 `uapi_tsensor_init`
- HAL层函数已注册就绪

**返回值**

- 返回类型：errcode_t

| 返回值 | 文字含义 | 触发场景 |
| -------- | -------- | -------- |
| ERRCODE_SUCC(0x0) | 执行成功 | 初始化成功 |
| Other | 其他错误码，参考errcode_t | 执行失败 |

**Kconfig配置**

| 配置项 | 宏类型 | 说明 | 默认值 |
| -------- | -------- | -------- | -------- |
| CONFIG_TSENSOR_USING_V150 | 特性宏 | 支持Tsensor V150电源与时钟分频配置特性 | y |

### uapi_tsensor_deinit <a id="uapi_tsensor_deinit"></a>

```c
errcode_t uapi_tsensor_deinit(void)
```

**头文件清单**

```c
#include "include/driver/tsensor.h"
```

**功能说明**

- 去初始化Tsensor模块，注销中断处理与HAL层函数
- 调用该接口后，Tsensor模块不再可用，需重新初始化后才能使用
- 去初始化将释放Tsensor占用的硬件资源

**前置条件**

- Tsensor模块已通过 `uapi_tsensor_init` 初始化完成

**返回值**

- 返回类型：errcode_t

| 返回值 | 文字含义 | 触发场景 |
| -------- | -------- | -------- |
| ERRCODE_SUCC(0x0) | 执行成功 | 去初始化成功 |
| Other | 其他错误码，参考errcode_t | 执行失败 |

**Kconfig配置**

| 配置项 | 宏类型 | 说明 | 默认值 |
| -------- | -------- | -------- | -------- |
| CONFIG_TSENSOR_USING_V150 | 特性宏 | 支持Tsensor V150电源与时钟分频配置特性 | y |

### uapi_tsensor_start_inquire_mode <a id="uapi_tsensor_start_inquire_mode"></a>

```c
errcode_t uapi_tsensor_start_inquire_mode(tsensor_samp_mode_t mode, uint32_t period)
```

**头文件清单**

```c
#include "include/driver/tsensor.h"
```

**功能说明**

- 配置Tsensor的采样模式并启动查询模式
- 支持16点平均单次上报、16点平均循环上报、单点循环上报三种采样模式
- 查询模式下可通过 `uapi_tsensor_get_current_temp` 主动读取温度值

**前置条件**

- Tsensor模块已通过 `uapi_tsensor_init` 初始化完成
- 入参mode取值在有效枚举范围内

**入参**

| 名称 | 参数类型 | 详细说明 | 约束取值范围 |
| ---- | ---- | ---- | ---- |
| mode | [tsensor_samp_mode_t](#enum_tsensor_samp_mode) | Tsensor采样模式 | TSENSOR_SAMP_MODE_AVERAGE_ONCE(0)、TSENSOR_SAMP_MODE_AVERAGE_CYCLE(1)、TSENSOR_SAMP_MODE_SINGLE_POINT_CYCLE(2) |
| period | uint32_t | Tsensor采样周期 | - |

**返回值**

- 返回类型：errcode_t

| 返回值 | 文字含义 | 触发场景 |
| -------- | -------- | -------- |
| ERRCODE_SUCC(0x0) | 执行成功 | 查询模式启动成功 |
| Other | 其他错误码，参考errcode_t | 执行失败 |

### uapi_tsensor_enable_outtemp_interrupt <a id="uapi_tsensor_enable_outtemp_interrupt"></a>

```c
errcode_t uapi_tsensor_enable_outtemp_interrupt(uapi_tsensor_callback_t callback, int8_t temp_threshold_low, int8_t temp_threshold_high)
```

**头文件清单**

```c
#include "include/driver/tsensor.h"
```

**功能说明**

- 启用温度超出阈值中断模式，当温度超出设定的上下限阈值时触发中断回调
- 温度下限最低为-40°C，温度上限最高为125°C
- 温度下限不得大于温度上限

**前置条件**

- Tsensor模块已通过 `uapi_tsensor_init` 初始化完成
- 入参温度阈值在硬件支持范围内（-40°C ~ 125°C）
- 入参temp_threshold_low不大于temp_threshold_high

**入参**

| 名称 | 参数类型 | 详细说明 | 约束取值范围 |
| ---- | ---- | ---- | ---- |
| callback | [uapi_tsensor_callback_t](#typedef_uapi_tsensor_callback_t) | 中断回调函数指针 | 非NULL |
| temp_threshold_low | int8_t | 温度下限阈值 | -40 ~ 125 |
| temp_threshold_high | int8_t | 温度上限阈值 | -40 ~ 125，且不小于temp_threshold_low |

**返回值**

- 返回类型：errcode_t

| 返回值 | 文字含义 | 触发场景 |
| -------- | -------- | -------- |
| ERRCODE_SUCC(0x0) | 执行成功 | 中断模式启用成功 |
| Other | 其他错误码，参考errcode_t | 执行失败 |

### uapi_tsensor_enable_overtemp_interrupt <a id="uapi_tsensor_enable_overtemp_interrupt"></a>

```c
errcode_t uapi_tsensor_enable_overtemp_interrupt(uapi_tsensor_callback_t callback, int8_t overtemp)
```

**头文件清单**

```c
#include "include/driver/tsensor.h"
```

**功能说明**

- 启用过温中断模式，当温度超过设定的过温阈值时触发中断回调
- 过温阈值最高为125°C
- 适用于硬件过温保护场景

**前置条件**

- Tsensor模块已通过 `uapi_tsensor_init` 初始化完成
- 入参过温阈值在硬件支持范围内（-40°C ~ 125°C）

**入参**

| 名称 | 参数类型 | 详细说明 | 约束取值范围 |
| ---- | ---- | ---- | ---- |
| callback | [uapi_tsensor_callback_t](#typedef_uapi_tsensor_callback_t) | 中断回调函数指针 | 非NULL |
| overtemp | int8_t | 过温阈值 | -40 ~ 125 |

**返回值**

- 返回类型：errcode_t

| 返回值 | 文字含义 | 触发场景 |
| -------- | -------- | -------- |
| ERRCODE_SUCC(0x0) | 执行成功 | 过温中断模式启用成功 |
| Other | 其他错误码，参考errcode_t | 执行失败 |

### uapi_tsensor_enable_done_interrupt <a id="uapi_tsensor_enable_done_interrupt"></a>

```c
errcode_t uapi_tsensor_enable_done_interrupt(uapi_tsensor_callback_t callback)
```

**头文件清单**

```c
#include "include/driver/tsensor.h"
```

**功能说明**

- 启用温度采集完成中断模式，当温度采集完毕时触发中断回调
- 适用于需要在温度采集完成后立即获取通知的场景

**前置条件**

- Tsensor模块已通过 `uapi_tsensor_init` 初始化完成

**入参**

| 名称 | 参数类型 | 详细说明 | 约束取值范围 |
| ---- | ---- | ---- | ---- |
| callback | [uapi_tsensor_callback_t](#typedef_uapi_tsensor_callback_t) | 中断回调函数指针 | 非NULL |

**返回值**

- 返回类型：errcode_t

| 返回值 | 文字含义 | 触发场景 |
| -------- | -------- | -------- |
| ERRCODE_SUCC(0x0) | 执行成功 | 采集完成中断模式启用成功 |
| Other | 其他错误码，参考errcode_t | 执行失败 |

### uapi_tsensor_get_current_temp <a id="uapi_tsensor_get_current_temp"></a>

```c
errcode_t uapi_tsensor_get_current_temp(int8_t *temp)
```

**头文件清单**

```c
#include "include/driver/tsensor.h"
```

**功能说明**

- 获取Tsensor当前温度值
- 温度通过输出参数返回，单位为摄氏度
- 温度值可能无效，需通过返回值判断是否获取成功

**前置条件**

- Tsensor模块已通过 `uapi_tsensor_init` 初始化完成
- 入参temp指针不为NULL

**入参**

| 名称 | 参数类型 | 详细说明 | 约束取值范围 |
| ---- | ---- | ---- | ---- |
| temp | int8_t * | 温度指针，输出参数 | 非NULL，指向有效内存空间 |

**出参**

| 名称 | 数据类型 | 输出说明 |
| ---- | ---- | ---- |
| temp | int8_t | 当前温度值，单位为摄氏度，获取成功时有效 |

**返回值**

- 返回类型：errcode_t

| 返回值 | 文字含义 | 触发场景 |
| -------- | -------- | -------- |
| ERRCODE_SUCC(0x0) | 获取温度成功，温度有效 | 温度采集成功 |
| ERRCODE_TSENSOR_GET_TEMP_INVALID(0x80001363) | 获取温度失败，温度无效 | 温度采集值无效 |
| Other | 其他错误码，参考errcode_t | 执行失败 |

### uapi_tsensor_set_calibration_single_point <a id="uapi_tsensor_set_calibration_single_point"></a>

```c
void uapi_tsensor_set_calibration_single_point(tsensor_calibration_point_t *point)
```

**头文件清单**

```c
#include "include/driver/tsensor.h"
```

**功能说明**

- 设置单点校准参数，通过传感器温度与真实环境温度的对应关系进行温度补偿
- 横坐标为传感器温度，纵坐标为真实环境温度

**前置条件**

- Tsensor模块已通过 `uapi_tsensor_init` 初始化完成
- 入参point指针不为NULL

**入参**

| 名称 | 参数类型 | 详细说明 | 约束取值范围 |
| ---- | ---- | ---- | ---- |
| point | [tsensor_calibration_point_t](#struct_tsensor_calibration_point) * | 校准参数指针，横坐标为传感器温度，纵坐标为环境温度 | 非NULL |

**Kconfig配置**

| 配置项 | 宏类型 | 说明 | 默认值 |
| -------- | -------- | -------- | -------- |
| CONFIG_TSENSOR_TEMP_COMPENSATION | 特性宏 | 支持Tsensor温度补偿功能 | y |

### uapi_tsensor_set_calibration_two_points <a id="uapi_tsensor_set_calibration_two_points"></a>

```c
void uapi_tsensor_set_calibration_two_points(const tsensor_calibration_point_t *point_first, const tsensor_calibration_point_t *point_second)
```

**头文件清单**

```c
#include "include/driver/tsensor.h"
```

**功能说明**

- 设置两点校准参数，通过两组传感器温度与真实环境温度的对应关系进行温度补偿
- 横坐标为传感器温度，纵坐标为真实环境温度

**前置条件**

- Tsensor模块已通过 `uapi_tsensor_init` 初始化完成
- 入参point_first和point_second指针不为NULL

**入参**

| 名称 | 参数类型 | 详细说明 | 约束取值范围 |
| ---- | ---- | ---- | ---- |
| point_first | const [tsensor_calibration_point_t](#struct_tsensor_calibration_point) * | 第一个校准参数指针 | 非NULL |
| point_second | const [tsensor_calibration_point_t](#struct_tsensor_calibration_point) * | 第二个校准参数指针 | 非NULL |

**Kconfig配置**

| 配置项 | 宏类型 | 说明 | 默认值 |
| -------- | -------- | -------- | -------- |
| CONFIG_TSENSOR_TEMP_COMPENSATION | 特性宏 | 支持Tsensor温度补偿功能 | y |

### uapi_tsensor_set_multilevel_threshold_value <a id="uapi_tsensor_set_multilevel_threshold_value"></a>

```c
errcode_t uapi_tsensor_set_multilevel_threshold_value(tsensor_multilevel_value_t level, int16_t temp)
```

**头文件清单**

```c
#include "include/driver/tsensor.h"
```

**功能说明**

- 设置多级温度阈值，用于多级温度区间划分
- 温度阈值取值范围为-40°C ~ 125°C
- [CHIP_NAME]/[CHIP_NAME]E当前未实现该接口底层支持，调用将触发空指针异常导致系统崩溃，请勿在[CHIP_NAME]/[CHIP_NAME]E平台上调用

**前置条件**

- Tsensor模块已通过 `uapi_tsensor_init` 初始化完成
- 入参level取值在有效枚举范围内
- 入参temp在硬件支持范围内（-40°C ~ 125°C）

**入参**

| 名称 | 参数类型 | 详细说明 | 约束取值范围 |
| ---- | ---- | ---- | ---- |
| level | [tsensor_multilevel_value_t](#enum_tsensor_multilevel_value) | 多级温度阈值级别 | TSENSOR_MULTILEVEL_VAL_0(0)、TSENSOR_MULTILEVEL_VAL_1(1)、TSENSOR_MULTILEVEL_VAL_2(2)、TSENSOR_MULTILEVEL_VAL_3(3) |
| temp | int16_t | 温度阈值 | -40 ~ 125 |

**返回值**

- 返回类型：errcode_t

| 返回值 | 文字含义 | 触发场景 |
| -------- | -------- | -------- |
| ERRCODE_SUCC(0x0) | 执行成功 | 阈值设置成功 |
| ERRCODE_TSENSOR_INVALID_PARAMETER(0x80001361) | 参数无效 | level超出有效范围 |
| Other | 其他错误码，参考errcode_t | 执行失败 |

**Kconfig配置**

| 配置项 | 宏类型 | 说明 | 默认值 |
| -------- | -------- | -------- | -------- |
| CONFIG_TSENSOR_MULTILEVEL | 特性宏 | 支持Tsensor多级温度功能（[CHIP_NAME]/[CHIP_NAME]E底层未实现，启用后接口不可用） | y |

### uapi_tsensor_set_multilevel_threshold_en <a id="uapi_tsensor_set_multilevel_threshold_en"></a>

```c
errcode_t uapi_tsensor_set_multilevel_threshold_en(tsensor_multilevel_en_t level, uapi_tsensor_callback_t callback)
```

**头文件清单**

```c
#include "include/driver/tsensor.h"
```

**功能说明**

- 设置多级温度阈值中断使能，当温度落入对应区间时触发中断回调
- 支持L-0、0-1、1-2、2-3、3-H共五个温度区间中断使能
- [CHIP_NAME]/[CHIP_NAME]E当前未实现该接口底层支持，调用将触发空指针异常导致系统崩溃，请勿在[CHIP_NAME]/[CHIP_NAME]E平台上调用

**前置条件**

- Tsensor模块已通过 `uapi_tsensor_init` 初始化完成
- 入参level取值在有效枚举范围内

**入参**

| 名称 | 参数类型 | 详细说明 | 约束取值范围 |
| ---- | ---- | ---- | ---- |
| level | [tsensor_multilevel_en_t](#enum_tsensor_multilevel_en) | 多级温度区间使能级别 | TSENSOR_MULTILEVEL_EN_LTO0(0)、TSENSOR_MULTILEVEL_EN_0TO1(1)、TSENSOR_MULTILEVEL_EN_1TO2(2)、TSENSOR_MULTILEVEL_EN_2TO3(3)、TSENSOR_MULTILEVEL_EN_3TOH(4) |
| callback | [uapi_tsensor_callback_t](#typedef_uapi_tsensor_callback_t) | 中断回调函数指针 | 非NULL |

**返回值**

- 返回类型：errcode_t

| 返回值 | 文字含义 | 触发场景 |
| -------- | -------- | -------- |
| ERRCODE_SUCC(0x0) | 执行成功 | 中断使能设置成功 |
| ERRCODE_TSENSOR_INVALID_PARAMETER(0x80001361) | 参数无效 | level超出有效范围 |
| Other | 其他错误码，参考errcode_t | 执行失败 |

**Kconfig配置**

| 配置项 | 宏类型 | 说明 | 默认值 |
| -------- | -------- | -------- | -------- |
| CONFIG_TSENSOR_MULTILEVEL | 特性宏 | 支持Tsensor多级温度功能（[CHIP_NAME]/[CHIP_NAME]E底层未实现，启用后接口不可用） | y |

## Type definitions

### uapi_tsensor_callback_t <a id="typedef_uapi_tsensor_callback_t"></a>

```c
typedef errcode_t (*uapi_tsensor_callback_t)(int8_t temp);
```

**使用说明**

- Tsensor中断回调函数类型，在 `uapi_tsensor_enable_outtemp_interrupt`、`uapi_tsensor_enable_overtemp_interrupt`、`uapi_tsensor_enable_done_interrupt`、`uapi_tsensor_set_multilevel_threshold_en` 接口中作为入参使用

## Enumerations

### tsensor_samp_mode_t <a id="enum_tsensor_samp_mode"></a>

```c
typedef enum tsensor_samp_mode {
    TSENSOR_SAMP_MODE_AVERAGE_ONCE,
    TSENSOR_SAMP_MODE_AVERAGE_CYCLE,
    TSENSOR_SAMP_MODE_SINGLE_POINT_CYCLE,
    TSENSOR_SAMP_MODE_MAX_NUM,
    TSENSOR_SAMP_MODE_NONE = TSENSOR_SAMP_MODE_MAX_NUM
} tsensor_samp_mode_t;
```

| 枚举成员 | 取值 | 描述 |
| ------- | ---- | ---- |
| TSENSOR_SAMP_MODE_AVERAGE_ONCE | 0 | 16点平均单次上报模式 |
| TSENSOR_SAMP_MODE_AVERAGE_CYCLE | 1 | 16点平均循环上报模式 |
| TSENSOR_SAMP_MODE_SINGLE_POINT_CYCLE | 2 | 单点循环上报模式 |
| TSENSOR_SAMP_MODE_MAX_NUM | 3 | 采样模式最大数量 |
| TSENSOR_SAMP_MODE_NONE | 3 | 无效采样模式 |

### tsensor_multilevel_en_t <a id="enum_tsensor_multilevel_en"></a>

```c
typedef enum tsensor_multilevel_en {
    TSENSOR_MULTILEVEL_EN_LTO0,
    TSENSOR_MULTILEVEL_EN_0TO1,
    TSENSOR_MULTILEVEL_EN_1TO2,
    TSENSOR_MULTILEVEL_EN_2TO3,
    TSENSOR_MULTILEVEL_EN_3TOH,
    TSENSOR_MULTILEVEL_EN_MAX
} tsensor_multilevel_en_t;
```

| 枚举成员 | 取值 | 描述 |
| ------- | ---- | ---- |
| TSENSOR_MULTILEVEL_EN_LTO0 | 0 | 温度降至L-0位置时使能中断 |
| TSENSOR_MULTILEVEL_EN_0TO1 | 1 | 温度降至0-1位置时使能中断 |
| TSENSOR_MULTILEVEL_EN_1TO2 | 2 | 温度降至1-2位置时使能中断 |
| TSENSOR_MULTILEVEL_EN_2TO3 | 3 | 温度降至2-3位置时使能中断 |
| TSENSOR_MULTILEVEL_EN_3TOH | 4 | 温度降至3-H位置时使能中断 |
| TSENSOR_MULTILEVEL_EN_MAX | 5 | 多级使能最大数量 |

### tsensor_multilevel_value_t <a id="enum_tsensor_multilevel_value"></a>

```c
typedef enum tsensor_multilevel_value {
    TSENSOR_MULTILEVEL_VAL_0,
    TSENSOR_MULTILEVEL_VAL_1,
    TSENSOR_MULTILEVEL_VAL_2,
    TSENSOR_MULTILEVEL_VAL_3,
    TSENSOR_MULTILEVEL_VAL_MAX
} tsensor_multilevel_value_t;
```

| 枚举成员 | 取值 | 描述 |
| ------- | ---- | ---- |
| TSENSOR_MULTILEVEL_VAL_0 | 0 | 设置0档温度阈值 |
| TSENSOR_MULTILEVEL_VAL_1 | 1 | 设置1档温度阈值 |
| TSENSOR_MULTILEVEL_VAL_2 | 2 | 设置2档温度阈值 |
| TSENSOR_MULTILEVEL_VAL_3 | 3 | 设置3档温度阈值 |
| TSENSOR_MULTILEVEL_VAL_MAX | 4 | 多级阈值最大数量 |

## Structures

### tsensor_calibration_point_t <a id="struct_tsensor_calibration_point"></a>

```c
typedef struct tsensor_calibration_point {
    int8_t tsensor_temp;
    int8_t environment_temp;
} tsensor_calibration_point_t;
```

**成员说明**

| 成员名称 | 数据类型 | 描述 |
| ------- | ------- | ---- |
| tsensor_temp | int8_t | 传感器温度值，范围-40 ~ 125 |
| environment_temp | int8_t | 真实环境温度值，范围-40 ~ 125 |

