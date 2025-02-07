# 技术细节

本项目由两部分组成，编辑器 GUI 由 Tauri 开发，SV 插件由 Javascript 开发。二者通过剪贴板进行通讯。

GUI 负责对用户的输入进行处理，SV 插件负责将相关改动同步到 SV 中。

SV 插件代码位于 `src-sv/` 内。

技术栈：Tauri + Vue + TypeScript

## 构建

```sh
pnpm i
pnpm tauri build
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 通信细节 

由于 SV 插件脚本语言无法访问外部文件/网络，唯一与外界能够时刻更新接触的便是剪贴板，笔者通过剪贴板传输格式化文本，实现了一个类总线通信协议，暂命名为 **SVCC** *(SynthV Clipboard Communication) Version 1*。

参与 SVCC 通信的对象有且仅能有 2 个，分别为服务器和客户端。客户端负责发起请求，服务器负责处理并返回响应。服务器不能主动对客户端发起请求。

SVCC 是基于连接的。其通信格式为：

```html
!svCBM|v1|<type><synno>|<cmd>|<param>|
```

其中 `<param>|` 为可选项。

- `<type>` 为 `syn` 或 `ack`；
- `<synno>` 为一个非负整数，初始化为 `0`，并在每次通信中递增。`syn0` 的回复包为 `ack1`，`syn1` 的回复包为 `ack2`，如此递增；
- `<cmd>` 为命令，客户端向服务端发送命令就填在此处。在本项目中，定义了若干个命令，如：
    - `play`，播放
    - `fetchLyric`，获取歌词
    - `sync`，重置服务器端 `synno` 为本包所带 `synno`
    - ...

    对于 `ack` 包，存在两个命令：
    - `ok`，表示命令成功，`<param>` 为 JSON 格式响应体
    - `error`，表示命令失败，`<param>` 为字符串错误信息
- `<param>` 为参数，如果存在，需格式化为 JSON（除非 `<cmd>` 为 `error`）

服务器以固定的频率读取剪贴板，如果为 `syn` 包则进行回复；客户端则在发出 `syn` 包后以固定频率读取剪贴板，等待 `ack` 包。