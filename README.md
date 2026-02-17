# 星语铭 (engrave.ren)

一个基于 GitHub Pages 的纪念网站，用于纪念那些已经离开的人。

## 网址

https://engrave.ren/

## 目录结构

```
/
├── index.html              # 首页 - 显示纪念人物列表
├── profile.html           # 个人纪念页面
├── about.html             # 关于页面
├── 404.html               # 404 错误页面
├── favicon.svg            # 网站图标
├── css/
│   └── style.css         # 样式文件
├── js/
│   ├── main.js           # 首页 JavaScript
│   └── profile.js        # 个人页面 JavaScript
├── images/
│   └── default-avatar.svg # 默认头像
└── data/
    ├── profiles.json     # 纪念人物 ID 列表
    └── people/
        └── [人物ID]/
            ├── info.json  # 基本信息
            ├── bio.md    # 生平介绍 (Markdown)
            └── avatar.jpg # 头像图片
```

## 添加新人物

1. 在 `data/people/` 下创建新文件夹，文件夹名称即为人物 ID（请使用全小写）
2. 创建 `info.json` - 基本信息
3. 创建 `bio.md` - 生平介绍（支持完整 Markdown 语法）
4. 添加 `avatar.jpg` - 头像图片（可选）

### info.json 格式

```json
{
  "id": "example",
  "name": "示例人物",
  "handle": "example",
  "aliases": "示例",
  "location": "示例地点",
  "birthDate": "2000-01-01",
  "passDate": "2024-01-01",
  "summary": "一言总结/引用语句",
  "websites": [
    "[网站名称](https://example.com)",
    "[B站](https://bilibili.com)",
    "[GitHub](https://github.com)"
  ]
}
```

**字段说明：**
- `id` - 人物唯一标识（文件夹名称）（请使用全小写）
- `name` - 姓名
- `handle` - 昵称/用户名
- `aliases` - 别名（多个用逗号分隔）
- `location` - 地点
- `birthDate` - 出生日期 (YYYY-MM-DD)
- `passDate` - 离开日期 (YYYY-MM-DD)
- `summary` - 一言总结/引用（显示在首页卡片）
- `websites` - 网站链接数组，格式：`[显示名称](链接)`

### 更新人物列表

在 `data/profiles.json` 中添加人物 ID：

```json
["example", "gqt", "zhangyubaka", "新人物ID"]
```

## 评论系统

使用 [Utterances](https://utteranc.es) 基于 GitHub Issues 提供评论功能。

配置位于 `js/profile.js` 中的 `COMMENT_CONFIG`。

## 部署

1. 将文件推送到 GitHub 仓库
2. 进入仓库 Settings → Pages
3. 选择 Source 为 `main` 分支
4. 保存后即可访问
