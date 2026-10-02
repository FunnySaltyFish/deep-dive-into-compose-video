# 点一下 +1，Compose 里到底发生了什么？

一个代码生成的视频仓库，每支视频可以有独立的中英文版本。

`compose-click` 从一个计数器按钮出发，基于 **Jetpack Compose 1.12.1** 的默认 GapComposer 实现，解释从点击到屏幕刷新的全过程。中文版约 19 分钟，英文版约 22 分钟。

| 章节 | 内容 |
| --- | --- |
| 开场 | 计数器、UI 树、节点保留与替换 |
| 点击 | AndroidComposeView、命中测试、ClickableNode 三轮派发 |
| 状态 | mutableIntStateOf、快照写入、读写观察 |
| 调度 | Recomposer、作用域失效、等待下一帧 |
| 重组 | 编译器改写、remember、调用位置 |
| SlotTable | groups、slots、gap buffer |
| 比较 | ReusableContent、分支替换、跳过 |
| 应用 | ChangeList、Applier、LayoutNode 树 |
| Modifier | CombinedModifier、遍历顺序、NodeChain 比较与复用 |
| 布局与绘制 | 约束、测量、放置、图层、RenderNode |
| 回顾与彩蛋 | 全链路、延迟读取、LinkBuffer |

> 动画是基于源码推演的教学示意，细节以官方源码为准。

## 目录与复用

```text
tools/                           所有视频共用的制作工具
studio/                          共用配音工作台
videos/
  compose-click/
    video.json                   视频信息
    anim/                        本视频共享的动画逻辑、组件和样式
    ref/                         源码参考文档、Counter.kt
    locales/
      zh-CN/
        script.json              中文旁白、字幕、章节标题、配音设置
        labels.json              中文画面标签
        cover/                   中文封面及导出脚本
      en-US/
        script.json              英文旁白、字幕、章节标题、配音设置
        labels.json              英文画面标签
        strings.json             完整英文短句与 HTML 标签的翻译
build/
  compose-click/
    zh-CN/                       中文生成产物
    en-US/                       英文生成产物
```

**中英文文案分别维护。** 两版保留一致的 cue ID 与章节结构，便于对照和共享动画；每版可以独立调整表达、读法、语气和停顿。字幕来自对应语言的脚本，不在运行时翻译。

动画、代码示例、音乐、音效逻辑共用。`tools/prepare.py` 根据语言资源生成对应的动画页面，完整英文短句优先于片段翻译。共享动画中的中文标签也是语言资源的查找键；英文生成页面会替换显示文字，保留代码中的 API 名称。

英文脚本的 `segments` 表示动画用的语义分段，连接后必须等于 `text`。字幕可以进一步按单词长度切分，但不会改变动画引用的分段编号。`anchors` 把共享动画的关键词映射到英文旁白里的实际短语。修改英文文案时，要同时检查分段与关键词；只修改发音可以使用 `tts` 字段。

新视频放入 `videos/<video-id>/`，准备本视频的 `anim/`、`video.json` 和语言资源即可。工具使用 `--video`、`--lang` 选择目标；默认是 `compose-click`、`zh-CN`。配音缓存、录音历史、时间线、截图、混音和视频产物都按视频和语言隔离。

## 安装

需要 Python 3.11+、Node.js、ffmpeg 和一个 [MiMo API Key](https://platform.xiaomimimo.com)。

```powershell
npm install
pip install -r requirements.txt
playwright install chromium
Copy-Item .env.example .env
```

在 `.env` 填入 `MIMO_API_KEY`。Chromium 不可用时，渲染会尝试本机 Edge。

## 生成视频

以英文版为例：

```powershell
python tools/tts.py --video compose-click --lang en-US
python tools/timing.py --video compose-click --lang en-US
python tools/review.py --video compose-click --lang en-US
python tools/render_all.py --video compose-click --lang en-US --w 960 --jobs 12
```

输出为 `build/compose-click/en-US/preview_960.mp4`，包含英文画面、旁白、字幕、音乐和音效。将 `--lang` 改成 `zh-CN` 即可生成中文版。正式导出可以指定：

```powershell
python tools/render_all.py --lang en-US --w 1920 --jobs 12 --out build/compose-click/en-US/final_1080.mp4
```

`--jobs` 控制并行浏览器数量；`--fps` 默认 30。配音按内容、音色、风格和录音版本缓存，未修改的句子不重复合成。

`timing.py` 根据真实音频中的停顿排时间线，同时生成独立字幕 `captions.srt` 和可预览的 `anim/index.html`。关键词定位仍是基于字幕字符位置的估计，并非逐词强制对齐；Preview 用于检查术语发音、字幕切换和动作节奏。

英文配音使用 **MiMo v2.5 TTS · 白桦 · Friendly**：温暖、有交流感，节奏轻快，语调小幅变化，重音克制。英文朗读规范化把驼峰名称拆成词、代码的点读作 dot、小数点读作 point；特殊名称和尺寸可用 `tts` 明确读法。

## 检查画面

```powershell
python tools/render.py --lang en-US --stills 120,742:810:4 --w 1920
python tools/sheet.py --lang en-US 742 810
python tools/review.py --lang en-US
```

截图位于对应语言的 `stills/`，拼图为 `sheet.png`。`review.py` 检查每句的三个时间点，生成 `review/report.json` 和每章三帧的 `review/chapters.jpg`。检查包括初始化错误、残留中文和文字超出画布；画面内部的重叠仍需查看截图。

运行任意静态服务器后，可以打开 `build/compose-click/en-US/anim/index.html?play&t=60` 预览无声动画。页面支持 `window.seek(t)` 确定地定位任意一帧，配音工作台提供有声预览。

## 配音工作台

```powershell
python tools/studio.py --video compose-click --lang en-US
```

打开 `http://127.0.0.1:8765/studio/`，边看动画边听英文配音。可以逐句试听、重新生成、调整字幕、朗读文本、语气和句后停顿，也可以从历史版本切回旧录音。编辑中文版时使用 `--lang zh-CN`。

修改会写回所选语言的 `script.json`，并重新对齐时间线。英文字幕需要同时修改分段，每行一段，保持原有段数与顺序，合起来与字幕一致。动画引用的关键词也需要保留。快捷键：空格播放/暂停，↑↓ 切换句子，Enter 试听本句，R 重新生成。

**替换音频：** 选中一句，先保存文案，再选择 WAV、MP3 或 M4A 并点击“导入并使用”。文件最大 50 MB，录音不超过 5 分钟。导入的录音会转为单声道 24 kHz WAV，保存在对应语言的 `audio/`，脚本的 `audio` 字段指向它；旧录音保留在历史版本中。只改停顿或分段会继续使用导入录音，修改字幕、朗读文本、语气或点击“重新生成”则使用新合成配音。导入音频应读出本句字幕，字幕时间仍按音频停顿估计。

工作台修改后，需重新导出 Preview 才会更新 MP4。`build/` 不纳入 Git，录音及历史请单独备份；脚本中引用的导入音频也需要一起保留。

服务仅监听 `127.0.0.1`。页面导出使用当前视频和语言的独立产物目录。

工作台的音频导入、录音切换和字幕分段校验可通过 `python -m unittest discover -s tests -v` 验证，测试不会请求配音服务。

## 许可证

- 代码，包括动画、工具、工作台和封面脚本：[MIT](LICENSE)。
- 视频、文案、参考文档、画面翻译和封面图片：[CC BY-NC 4.0](LICENSE-CONTENT)，允许署名转载和改编，不得商用。

参考文档引用的 Jetpack Compose 源码版权归 The Android Open Source Project 所有，采用 Apache License 2.0。
