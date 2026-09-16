# 孤雪摄影

纯静态摄影网站，无前端依赖或构建服务。新版包含原比例影像集、分类计数与可分享分类地址，以及支持展开动画、切换、缩放、键盘、触摸滑动和减少动态效果偏好的看图器。

## 预览

在项目目录运行 `python -m http.server 8765 --bind 127.0.0.1`，打开 `http://127.0.0.1:8765/gallery.html`。

## 更新作品

1. 把 JPG 原片放进 `images/mood`（心情）、`images/landscape`（风景）、`images/travel`（旅行）或 `images/night`（夜景）。保留已有文件名可保持作品 ID 稳定。
2. 运行 `python scripts/build_gallery.py`。需要 Pillow；脚本根据真实文件生成 `js/photos.js` 与 `images/thumbs` 的 WebP 预览，不改写原片。文件编号可以不连续，也没有 24 张上限。
3. 如需自定义标题，可编辑生成后的 `js/photos.js` 中的 `title`。再次生成清单会重置这些标题，请先备份自定义内容。

## 发布

运行 `python scripts/prepare_publish.py`，将新版页面、脚本、样式和图片同步到原有 WorkBuddy 配置使用的 `__publish` 文件夹，再通过 WorkBuddy 原应用发布。准备发布文件不等于更新线上网站。

## 联系资料

首页保留原项目的邮箱和微信文字。原先指向 `#` 的小红书及 Instagram 空链接已移除；补齐真实主页地址后再添加。上线前请确认现有邮箱、微信与个人介绍准确。
