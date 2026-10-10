# LAW 论文主页

**当前状态：私有协作仓库，GitHub Pages 未启用。** 网页预览继续保持私有；合著者的查看权限和仓库协作权限将在提供名单后分别邀请。

网站私有预览：https://law-agentic-physical-intelligence.nice-eft-8622.chatgpt.site

## 合著者协作

仓库访问权限和网页预览权限分别管理。收到名单后，维护者在 GitHub 邀请协作者，并按邮箱邀请私有预览查看者。

建议每位合著者从 `main` 建自己的修改分支，编辑文字、图片或视频后提交 Pull Request，由维护者审阅合并。网页源码位于 `dist/`，各文件用途见下表。GitHub 中的修改不会自动更新当前私有预览；确认修改后由维护者同步。


这是一个完整静态网页，不需要服务器程序、数据库或前端依赖安装。文字、框架图、实验图表和三项真机演示都已经包含在内。作者栏按当前要求省略。

## GitHub Pages 是什么

GitHub Pages 会把仓库里的 HTML、CSS、JavaScript、图片和视频文件变成一个网站。项目站点的地址通常是 `https://账号.github.io/仓库名/`。网站可以使用独立仓库，因此不需要为了展示论文而公开整个模型代码仓库。

当前已有私有审阅版。公开的 github.io 地址尚未创建；CogWAM 的可见性没有改变。代码按钮指向已提供的 CogWAM 仓库，并标明 release planned。

## 本地查看

在本目录运行：

```bash
python3 scripts/preview_server.py --port 8765
```

浏览器打开 `http://localhost:8765`。这个预览服务器支持视频 Range 请求。

## 发布到 GitHub Pages

1. 选择一个存放**网站文件**的 GitHub 仓库。若使用新的独立仓库，将本包中的 `dist/`、`scripts/`、`deployment/` 和本说明放入仓库根目录。
2. 仅在明确决定发布之后，将 `deployment/github-pages.yml` 复制为 `.github/workflows/pages.yml`，再打开该仓库 **Settings → Pages → Build and deployment → Source → GitHub Actions**。
3. 推送到 `main`，或在 Actions 手动运行 **Deploy LAW project page**。
4. 部署成功后，Actions 会给出真实网站地址。页面使用相对路径，支持 `github.io/仓库名/` 这样的项目路径。

发布模板当前位于 `deployment/`，不会被 GitHub Actions 运行。启用后的工作流只上传 `dist/`。`.openai/hosting.json` 是私有审阅托管的标识，GitHub Pages 无需这个文件；可移植 ZIP 已将它排除。GitHub 免费账号通常使用公开的网站源码仓库；私有仓库的 Pages 支持取决于账号方案。不要自动把 CogWAM 改为公开。

官方说明：[GitHub Pages 文档](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)、[自定义部署工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 文件与修改入口

| 文件 | 用途 |
| --- | --- |
| `dist/index.html` | 页面结构、正文、默认图表数字和资源链接 |
| `dist/styles.css` | 颜色、字体、间距、桌面和手机排版 |
| `dist/script.js` | 播放、图片放大、指标和场景切换 |
| `dist/assets/data/results.json` | 从最终稿逐项核对的交互图表数字 |
| `dist/assets/images/framework.png` | 最终稿主框架图，可直接替换 |
| `dist/assets/paper/LAW.pdf` | 22页最终稿的网页优化副本 |
| `dist/assets/videos/*-highlight.mp4` | 首页精选视频 |
| `dist/assets/videos/*-full.mp4` | 原始时间的完整视频 |
| `dist/assets/videos/manifest.json` | 公开视频时长、倍速与剪辑区间 |
| `deployment/github-pages.yml` | 尚未启用的 GitHub Pages 发布模板 |

修改数字时，同步修改 `results.json`、`index.html` 中的默认数字、证据栏和相关文字，再核对论文。作者信息确定后可在标题与资源按钮之间添加。公开代码后删除 Code 按钮中的 `release planned` 标签。

视频封面由真实原片取帧。Puzzle 精选为 **4×**，Domino 和 Organize 为 **6×**；精选含剪辑，完整视频保留未剪辑1×。网页不使用生成机械臂图片、不伪造任务成功或语义字幕。三个精选总计约3.84MB；整站媒体使用浏览器原生控件，无第三方视频服务。

## 内容范围

- RoboTwin主表：Fast-WAM 91.8%、LingBot-VA 2.0 93.6%、LAW + Fast-WAM 94.21%。完整Table 2可展开。
- OpenWAM-α扩展对比：93.60% → LAW + OpenWAM-α 95.56%，与默认配置明确区分。
- 真机三任务：成功率与Task score分别展示，均值65%和84.06；基线为π₀.₅和Fast-WAM。
- 2B是共享VLM尺寸；MoTE未来视频分支标明训练目标。
- RoboDojo展示任务分段实例和评测维度。原稿有待更新统计标记的数值未作为最终结果发布。
- 没有编造作者、arXiv、DOI、TPAMI接收状态或完整LAW模型2B的说法。

## 验证

```bash
python3 scripts/check-site.py
node --check dist/script.js
```

浏览器已检查三段精选播放、视频切换时暂停、完整视频的速度选择和Esc关闭、框架图放大、两组结果控制和RoboDojo切换。390px手机容器无横向溢出，指标切换正常。完整视频均全段解码验证通过。论文PDF保持22页；网页副本经过300dpi高质量图像压缩，文字和矢量保留。

字体在本地托管，授权文件位于 `dist/assets/fonts/`。网页部署不依赖字体CDN。
