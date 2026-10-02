# 点一下 +1，Compose 里到底发生了什么？

一支约 19 分钟的动画科普视频，以及生成它的全部源码。

一个最普通的计数器，点一下按钮，数字加一。视频基于 **Jetpack Compose 1.12.1**（默认的 GapComposer）源码，把这一下点击从头拆到尾：

| 章节 | 内容 |
| --- | --- |
| 开场 | 计数器、UI 树、哪些节点留下、哪些被替换 |
| 点击 | AndroidComposeView → 命中测试 → ClickableNode 三轮派发 |
| 状态 | `mutableIntStateOf`、快照写入、读写观察 |
| 调度 | Recomposer、作用域失效、等到下一帧 |
| 重组 | SlotTable 与 gap buffer、group 对照、跳过 |
| 修改清单 | ChangeList、Applier 修改 LayoutNode 树 |
| Modifier | CombinedModifier 的 outer / inner、foldIn 遍历、NodeChain 比较复用 |
| 布局与绘制 | 约束传递、测量放置、图层与 RenderNode |
| 回顾 · 彩蛋 | 全链路回顾；新的 LinkBuffer SlotTable 预告 |

> 动画是基于源码推演的教学示意，细节以官方源码为准。

## 它是怎么做出来的

整支视频由代码生成：文案、配音、字幕、动画、音乐和音效都来自同一份脚本，因此字幕和配音逐字一致，改一句文案，后面整条时间线会自动重新对齐。

```
script/full.json          文案（唯一来源）
   │  tools/tts.py         MiMo TTS 逐句合成（并发 + 按内容缓存）
   ▼
build/audio/*.wav
   │  tools/timing.py      排时间线；字幕按标点切分，并吸附到语音里真实的停顿
   ▼
build/timing.js           ─┐
anim/  (HTML + GSAP)      ─┤  一条暂停的 GSAP 主时间线，window.seek(t) 可确定地渲染任意一帧
   │  tools/render_all.py  ┘  Playwright 并行逐帧截图 → ffmpeg 编码
   │  tools/mix.py           程序化合成背景音乐与音效，按人声自动闪避，最后混音封装
   ▼
build/final_1080.mp4
```

- **动画**：`anim/scenes/*.js` 每章一个文件。动画用 `kw(cueId, '关键词')` 定位到"说到这个词"的时刻，所以重录配音后动画会跟着走。
- **朗读规范化**：`tools/tts.py` 里的 `speakable()` 只改送去合成的文字，不改字幕：驼峰词拆开（`SlotTable` → `Slot Table`），代码里的点读作"点"（`count.intValue` → `count 点 int Value`）。数字等也可以在脚本里用 `tts` 字段单独指定读法。
- **音乐和音效**：全部在 `tools/mix.py` 里用 numpy 程序化合成，没有外部素材。

## 运行

需要 Python 3.11+、Node.js、ffmpeg（在 PATH 中）以及一个 [MiMo](https://platform.xiaomimimo.com) API Key。

```bash
npm install                      # GSAP
pip install -r requirements.txt
playwright install chromium      # 没装的话会自动回退到本机的 Edge
cp .env.example .env             # 填入 MIMO_API_KEY
```

生成视频：

```bash
python tools/tts.py script/full.json          # 合成配音（--dry 只打印朗读规范化后的文字）
python tools/timing.py script/full.json       # 排时间线
python tools/render_all.py --w 960  --jobs 8  --out build/preview_full_960.mp4   # 快速预览
python tools/render_all.py --w 1920 --jobs 20 --out build/final_1080.mp4         # 正式版
```

`--jobs` 是并行渲染的浏览器数量，CPU 核心多可以开大一些。

检查个别画面：

```bash
python tools/render.py --stills 120,742:810:4 --w 1920   # 指定时刻 / 区间截图 → build/stills/
python tools/sheet.py 742 810                            # 拼成一张对照图 → build/sheet.png
```

浏览器里直接预览动画（无声）：用任意静态服务器打开仓库根目录，访问 `anim/index.html?play&t=60`。

## 配音工作台

```bash
python tools/studio.py           # → http://127.0.0.1:8765/studio/
```

一个本地网页：边看动画边听配音，点任意一句就能跳过去。听着不对的句子可以：

- **重新生成**：同一句再录一版，可以多点几次挑最好的；
- 修改 **朗读文本**（只改读法、不改字幕）、**本句语气** 或 **句后停顿**；
- 在 **历史版本** 里试听、切回任何一版。

每次改动都会写回 `script/full.json`，并立即重排时间线，后面的字幕和动画会自动跟着移动。快捷键：空格 播放/暂停，↑↓ 切换句子，Enter 试听本句，R 重新生成。改完可以直接在页面里导出 960p 预览。

服务只监听 `127.0.0.1`，没有鉴权，不要暴露到局域网或公网。

## 目录

```
anim/          动画页面：components.js（工具与组件）、main.js（字幕/章节卡/装配）、scenes/（各章）
script/        文案脚本 full.json
tools/         tts / timing / render / render_all / mix / sheet / studio
studio/        配音工作台前端
cover/         B 站封面（16:9 与 4:3），python cover/shoot.py 重新导出
ref/           源码全链路参考文档与示例 Counter.kt
build/         生成产物（不入库）
```
