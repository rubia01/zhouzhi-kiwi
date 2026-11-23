# 上线到公网 + 被搜索引擎收录

先说清楚：**放上去**和**搜得到**是两件事。放上去 30 分钟就够，搜得到要看域名、备案和内容被收录的运气，通常以周计。

---

## 一、先选路线

| | 路线 A：免费静态托管 | 路线 B：国内域名 + 备案 |
|---|---|---|
| 上线时间 | 10—30 分钟 | 2—4 周（备案卡着） |
| 花费 | 0 元 | 域名 30—60 元/年 + 服务器 100 元/年起 |
| 国内访问速度 | 一般，GitHub 时快时慢 | 快 |
| 百度收录 | 难（境外服务器、无备案） | 顺畅 |
| 适合 | 先给朋友看看、作品集 | 真要对公众宣传 |

**建议**：先用 A 跑起来看效果，确定要长期对外了再走 B。两条路不冲突，内容一样，换托管就是改个域名的事。

---

## 二、路线 A：免费上线

### A1. GitHub Pages（最省事，有 Git 就能上）

1. 在 GitHub 建一个 **Public** 仓库，比如 `zhouzhi-kiwi`。
2. 在 `D:\myproject\ZMT` 里执行：

```bash
git init
git add .
git commit -m "周至猕猴桃宣传站"
git branch -M main
git remote add origin https://github.com/<你的用户名>/zhouzhi-kiwi.git
git push -u origin main
```

3. 仓库 **Settings → Pages**，Source 选 `Deploy from a branch`，Branch 选 `main` / `/ (root)`，保存。
4. 等 1—2 分钟，地址是 `https://<你的用户名>.github.io/zhouzhi-kiwi/`。

> 仓库根目录没有构建步骤，直接托管静态文件，所以不需要 Actions。

### A2. Cloudflare Pages（速度比 GitHub 稳一点）

1. 注册 Cloudflare → **Workers & Pages → Create → Pages**。
2. 选 `Connect to Git` 关联仓库，或者直接 `Upload assets` 把整个 ZMT 目录拖上去。
3. 构建命令留空，输出目录填 `/`。
4. 得到 `https://<项目名>.pages.dev`，之后可绑自定义域名（不用备案，但国内速度取决于线路）。

### 注意：`.gitignore` 已经放好了

`.dsh-meow/`、`.dsh-pilot/` 这些目录**绝对不能传上去**——里面是本机的会话/记忆数据。仓库已经带了 `.gitignore`，`git add .` 时会被跳过，别手动改掉它。

---

## 三、路线 B：国内正式上线

### 成本和时间

- 域名：`.com` 约 55—80 元/年，`.cn` 约 30 元/年（阿里云 / 腾讯云）。
- 服务器：轻量应用服务器 2 核 2G 约 100—200 元/年，够了。
- 或者用对象存储 OSS / COS 静态托管，几块钱一个月，但绑自定义域名**同样要备案**。
- **ICP 备案**：免费，但要 7—20 个工作日。没有备案，国内云厂商会拦掉 80 端口。

### 步骤

1. 买域名，做实名认证。
2. 买服务器（备案要求服务器有效期 ≥ 3 个月）。
3. 在云厂商的备案系统提交 ICP 备案（个人备案：身份证、手机号、人脸核验）。
4. 备案通过后，解析域名到服务器，装个 Nginx 把 `ZMT` 目录丢进去：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/zhouzhi-kiwi;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    # 静态资源缓存
    location ~* \.(jpg|png|css|js|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

5. 顺手把 HTTPS 弄上（Let's Encrypt 免费证书，宝塔面板一键）。
6. **备案号必须挂在页脚**，这是硬性要求，比如「陕ICP备XXXXXXXX号」。

---

## 四、让搜索引擎收录

### 1. 先生成 sitemap.xml

这个站只有一个页面，`sitemap.xml` 就这么几行（把域名换成你的后放到根目录）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://你的域名/</loc>
    <lastmod>2026-11-24</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

同时把 `robots.txt` 最后那行 `Sitemap:` 的注释解开，域名换成你的。

### 2. 提交到各平台

| 平台 | 地址 | 门槛 |
|---|---|---|
| 百度搜索资源平台 | ziyuan.baidu.com | **域名必须已完成 ICP 备案**，个人也能提交 |
| Google Search Console | search.google.com/search-console | 无门槛 |
| Bing Webmaster | bing.com/webmasters | 无门槛 |
| 360 / 搜狗 | 各自站长平台 | 一般也要备案 |

流程都一样：验证域名所有权（DNS TXT 或 HTML 文件）→ 提交 sitemap → 用「URL 提交」把首页推一遍。

### 3. 加速收录的实用招

- **外链**：在知乎、小红书、微博、豆瓣、行业论坛里发内容时带上链接，蜘蛛顺着外链爬过来最快。
- **主动提交**：百度每次手动提交有配额，坚持每天推一次首页。
- **更新**：偶尔改点内容（比如换一版节气文案），搜索引擎会重新来抓。
- **耐心**：新站百度 2—8 周收录是常态，Google 几天到两周。

### 4. 单页站的天然短板

这个站所有内容在一个 URL 里，被收录的就是这一页。想让「翠香猕猴桃」「徐香猕猴桃」这类长尾词各自有排名，得拆成多页：

```
/index.html
/variety/cuixiang.html
/variety/xuxiang.html
/terroir.html
```

每页有独立的 title / description / 正文。这是下一步的事，现在的结构先把主词「周至猕猴桃」打出去就够。

---

## 五、站点侧已经准备好的

- `<title>`：30 字以内，主词前置。
- `<meta name="description">`：约 80 字，覆盖品种与产区。
- `<meta name="keywords">`、`author`、`robots`。
- Open Graph + Twitter Card（分享到微信/微博时有卡片）。
- **JSON-LD 结构化数据**：`WebSite` + `Product`，带品牌、产地、种植面积等。
- `robots.txt`。
- 语义化标签、唯一的 `<h1>`、所有图片有 `alt`。
- 正文全部是静态 HTML 文本，爬虫不执行 JS 也读得到。

## 六、你还需要改的

1. `index.html` 里搜 `example.com`，把 canonical 那行换成真域名并解除注释。
2. 生成 `sitemap.xml`，替换域名。
3. 页脚加备案号（国内服务器必须）。
4. 建议加一张 1200×630 的分享图（现在 `og:image` 指向的切面图是 1280×1023，比例不对，微信里会裁）。

## 七、两个必须提醒的事

**1. 名义问题。** 站里用了「中国猕猴桃之乡」「周至猕猴桃区域公用品牌」这些说法，它们背后有官方认定的主体。如果作为**个人作品 / 设计案例**发布，务必保留页脚「本页为宣传设计演示站」那句；如果要当真的宣传站对外引流，得先拿到周至县农业农村局或品牌运营方的授权，否则容易被认定为冒用或虚假宣传。

**2. 图片版权。** 现在五张图是 Wikimedia Commons 上的 CC BY-SA 和公有领域作品，页脚已按许可署名。非商业展示没问题；**一旦商用**（接广告、带货），要么换成自己拍的，要么严格遵守 CC BY-SA 的署名和相同方式共享条款。猕猴桃产品图最稳妥就是自己买一箱拍。
