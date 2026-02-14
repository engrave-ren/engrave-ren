import fs from 'fs';
import path from 'path';
import url from 'url';
import yaml from 'js-yaml';
import { marked } from 'marked';
import moment from 'moment';

const projectRoot = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
const peopleDir = path.join(projectRoot, 'people');
const publicDir = path.join(projectRoot, 'public');

const languages = ['', '.zh_hant', '.en'];

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function readPeople() {
    return fs.readdirSync(peopleDir).filter(f => {
        const stat = fs.statSync(path.join(peopleDir, f));
        return stat.isDirectory();
    });
}

function loadInfo(dirname) {
    const infoPath = path.join(peopleDir, dirname, 'info.yml');
    if (!fs.existsSync(infoPath)) return null;
    return yaml.load(fs.readFileSync(infoPath, 'utf-8'));
}

function loadPage(dirname, lang) {
    const pagePath = path.join(peopleDir, dirname, `page${lang}.md`);
    if (!fs.existsSync(pagePath)) return null;
    return fs.readFileSync(pagePath, 'utf-8');
}

function parsePageMarkdown(markdown) {
    const parts = markdown.split(/^---$/m);
    if (parts.length >= 3) {
        const meta = yaml.load(parts[1]);
        const content = parts.slice(2).join('---');
        return { meta, content };
    }
    return { meta: {}, content: markdown };
}

function calculateAge(born, died) {
    if (!born || !died) return null;
    try {
        return Math.abs(moment(died).diff(moment(born), 'years', false));
    } catch (e) {
        return null;
    }
}

function renderMarkdown(content) {
    return marked(content);
}

function buildPeopleList() {
    const peopleList = [];
    
    const people = readPeople();
    
    for (const dirname of people) {
        const info = loadInfo(dirname);
        if (!info) continue;
        
        const page = loadPage(dirname, '');
        if (!page) continue;
        
        const { meta, content } = parsePageMarkdown(page);
        
        info.name = meta.name || info.id;
        info.desc = meta.desc || '';
        
        if (info.info?.born && info.info?.died) {
            info.age = calculateAge(info.info.born, info.info.died);
        }
        
        const personData = {
            id: dirname,
            name: info.name,
            desc: info.desc,
            profileUrl: info.profileUrl?.replace('${path}', `people/${dirname}/photos`) || '',
            info: info.info,
            websites: info.websites,
            sortKey: info.info?.died || '0'
        };
        
        peopleList.push(personData);
    }
    
    peopleList.sort((a, b) => String(b.sortKey).localeCompare(String(a.sortKey)));
    
    fs.writeFileSync(path.join(projectRoot, 'people-list.json'), JSON.stringify(peopleList, null, 2));
    console.log(`Built people-list.json with ${peopleList.length} entries`);
}

function buildPersonPage(dirname) {
    const info = loadInfo(dirname);
    if (!info) return;
    
    const personDir = path.join(projectRoot, 'people', dirname);
    ensureDir(personDir);
    ensureDir(path.join(personDir, 'photos'));
    
    const srcPhotosDir = path.join(peopleDir, dirname, 'photos');
    if (fs.existsSync(srcPhotosDir)) {
        fs.readdirSync(srcPhotosDir).forEach(file => {
            fs.copyFileSync(
                path.join(srcPhotosDir, file),
                path.join(personDir, 'photos', file)
            );
        });
    }
    
    for (const lang of languages) {
        const page = loadPage(dirname, lang);
        if (!page) continue;
        
        const { meta, content } = parsePageMarkdown(page);
        
        const data = {
            id: dirname,
            name: meta.name || info.id,
            profileUrl: info.profileUrl?.replace('${path}', `photos`) || '',
            info: info.info,
            websites: info.websites,
            bio: renderMarkdown(content),
            desc: meta.desc || ''
        };
        
        fs.writeFileSync(
            path.join(personDir, `info${lang}.json`),
            JSON.stringify(data, null, 2)
        );
    }
    
    const personHtml = buildPersonHtml(dirname, info, languages[0]);
    fs.writeFileSync(path.join(personDir, 'index.html'), personHtml);
    
    console.log(`Built page for ${dirname}`);
}

function buildPersonHtml(dirname, info, lang) {
    const page = loadPage(dirname, lang) || '';
    const { meta, content } = parsePageMarkdown(page);
    
    const name = meta.name || info.id;
    const profileUrl = info.profileUrl?.replace('${path}', 'photos') || 'css/default-avatar.svg';
    
    let infoHtml = '';
    if (info.info) {
        for (const [key, value] of Object.entries(info.info)) {
            if (value) {
                infoHtml += `<div class="profile-info-item"><strong>${key}：</strong>${value}</div>`;
            }
        }
    }
    
    const bio = renderMarkdown(content);
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} - 星语铭</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <nav>
            <div class="logo">星语铭</div>
            <ul class="nav-links">
                <li><a href="../../index.html">主页</a></li>
                <li><a href="../../about.html">关于我们</a></li>
            </ul>
        </nav>
    </header>
    <main>
        <div class="container">
            <section class="profile-header">
                <img src="${profileUrl}" alt="${name}" class="profile-avatar-large" onerror="this.src='../../css/default-avatar.svg'">
                <h1>${name}</h1>
                <div class="profile-info">${infoHtml}</div>
            </section>
            <section class="profile-bio-section">
                <h2 style="text-align: center; margin-bottom: 2rem;">生平介绍</h2>
                <div style="line-height: 1.8;">${bio}</div>
            </section>
            <section class="memories-section">
                <h2 style="text-align: center; margin-bottom: 2rem;">回忆与祝福</h2>
                <div id="commentsList"></div>
                <div class="add-memory-form">
                    <h3 style="margin-bottom: 1rem;">发表回忆</h3>
                    <p style="margin-bottom: 1rem; color: var(--text-light);">
                        由于是静态网站，评论功能需要 GitHub 账号
                    </p>
                    <a href="https://github.com/NatsukoYamamura/engrave-ren/discussions/new?category=general&title=${encodeURIComponent('【纪念】' + name)}" 
                       target="_blank" 
                       class="btn">
                        💬 在 GitHub 发表评论
                    </a>
                </div>
            </section>
            <section class="prevention-section">
                <h3>🌟 请记住</h3>
                <p>如果您正在经历困难时期，请不要犹豫寻求帮助。</p>
                <p>全国心理援助热线：<strong>400-161-9995</strong></p>
            </section>
        </div>
    </main>
    <footer>
        <p>&copy; 2025 星语铭 | 由 <a href="https://novihare.cn/">Novi的导航站</a> 提供技术支持</p>
    </footer>
    <script>
    const REPO_OWNER = 'NatsukoYamamura';
    const REPO_NAME = 'engrave-ren';
    const PERSON_NAME = '${name}';
    
    async function loadComments() {
        const list = document.getElementById('commentsList');
        try {
            const response = await fetch(\`https://api.github.com/repos/\${REPO_OWNER}/\${REPO_NAME}/issues?labels=纪念&\`);
            if (!response.ok) throw new Error('Failed to load');
            const issues = await response.json();
            const filtered = issues.filter(i => i.title.includes(PERSON_NAME));
            
            if (filtered.length === 0) {
                list.innerHTML = '<p style="color: var(--text-light); text-align: center;">暂无回忆，快来发表第一条吧！</p>';
                return;
            }
            
            list.innerHTML = filtered.map(issue => \`
                <div class="memory-item">
                    <p>\${issue.body}</p>
                    <small style="color: var(--text-light);">
                        —— \${issue.user.login} · \${new Date(issue.created_at).toLocaleDateString('zh-CN')}
                    </small>
                </div>
            \`).join('');
        } catch (e) {
            list.innerHTML = '<p style="color: var(--text-light); text-align: center;">加载评论失败，请直接在 GitHub 发表评论</p>';
        }
    }
    loadComments();
    </script>
</body>
</html>`;
}

function buildHomePage() {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>星语铭 - engrave.ren</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <nav>
            <div class="logo">星语铭</div>
            <ul class="nav-links">
                <li><a href="index.html">主页</a></li>
                <li><a href="about.html">关于我们</a></li>
            </ul>
        </nav>
    </header>
    <main>
        <div class="container">
            <section class="intro-section">
                <h2>星语铭 · 自介</h2>
                <div class="intro-content">你好。我们是「星语铭」（engrave.ren）——一座以星光为墨、以记忆为碑的数字花园。
                    铭，是雕刻时光的温柔抵抗。
                    当现实中的痕迹随风雨淡去，我们选择将那些珍贵的存在，一寸一寸铭刻进永恒。不是用大理石，而是用你我共同的记忆；不是刻在墓碑上，而是刻进每一次被想起的微光里。engrave.ren——"人"在此相聚，"仁"在此长存。每一个名字，都值得被郑重镌刻；每一段生命，都配得上不被遗忘的尊严。
                    星语，是逝者化作星辰后的低语。
                    他们或许已隐入夜空，却从未真正离去。当月光漫过窗台，当风铃轻响，当某段旋律忽然浮现——那是他们在星海彼端，以光年为尺，向我们传递的絮语。尤其是那些因世界尚未温柔而早逝的跨性别同伴，那些以盟友之名默默守护的同行者：现实中的墓碑或许未能刻下他们认同的名字，但在这里，每一颗星辰都将以本真的模样闪耀，每一句低语都将被完整聆听。
                    我们相信：
                    存在，从不取决于肉身是否在场；
                    联结，亦无需地理或血缘的证明。
                    若一段对话曾照亮你的长夜，若一个笑容曾抚平你的褶皱——这份温暖本身，已是生命最真实的印记。
                    作为守夜人，我们以克莱因蓝的静谧为底色，轻轻拂去时光的尘埃，让每一段故事安然栖居。这里没有哀恸的挽歌，只有月光下的轻声叙说；没有黑暗的终点，只有星光铺就的归途。
                    请记住：
                    你怀念的，从未消失；
                    你铭刻的，终将永恒。
                    当万千星辰低语，我们在此回应——
                    "我听见了。我一直记得。"
                    —— 星语铭纪念计划 · 守夜人
                    愿所有灵魂，终将在没有黑暗的地方重逢</div>
            </section>
            <div class="warning-box">
                <h3>⚠ 重要声明与使用须知</h3>
                <h4>一、内容性质与用户责任</h4>
                <p>本网站（engrave.ren）为非营利性数字纪念平台，所有内容均基于公开渠道整理，旨在为逝者留存人文记忆。您在浏览或提交内容前，请知悉并同意：</p>
                <ul>
                    <li>部分逝者生平涉及性暴力、家庭暴力、药物滥用、自残、自杀等创伤性经历，相关内容可能引发强烈情绪反应。若您感到不适，请立即停止浏览并寻求专业心理支持（文末提供援助资源）。</li>
                    <li>未成年人请在监护人陪同下访问本页。监护人应评估内容适宜性并承担监护责任。</li>
                    <li>您提交的回忆、照片等内容，须确保已获得相关权利人授权或属于合理使用范畴。因内容侵权引发的纠纷由提交者自行承担法律责任。</li>
                </ul>
                <h4>二、内容来源与版权说明</h4>
                <p>本页内容整理原则如下：</p>
                <ul>
                    <li>所有资料均来源于新闻媒体、社交媒体等长期可公开检索的渠道，不涉及未公开的隐私信息或需特别授权的敏感数据。</li>
                    <li>人物生平介绍经多方信源交叉验证，但无法保证100%准确。若您发现事实性错误，请联系我们修正。</li>
                    <li>肖像及文字内容的使用遵循《中华人民共和国著作权法》第二十四条关于"为介绍、评论某一作品或说明某一问题"的合理使用原则。权利人如需删除/修改内容，请提供身份证明及权属证明联系我们，我们将在48小时内响应。</li>
                </ul>
                <h4>三、平台立场声明</h4>
                <ul>
                    <li>本页仅为纪念空间，不对逝者生前行为进行道德评判或法律定性，亦不构成对其行为的背书、鼓励或美化。</li>
                    <li>我们尊重每一位逝者的人格尊严，尤其关注因性别认同、性取向等遭受不公的群体。页面呈现的姓名、代称均以逝者生前公开表达或亲友确认为准。</li>
                    <li>平台严格遵守中国法律法规，所有内容均通过人工审核。如监管部门要求删除特定内容，我们将依法配合处理。</li>
                </ul>
            </div>
            <section class="search-section">
                <form class="search-form" id="searchForm">
                    <input type="text" class="search-input" id="searchInput" placeholder="搜索姓名、昵称...">
                    <button type="submit" class="btn">搜索</button>
                </form>
            </section>
            <section class="profiles-grid" id="profilesGrid"></section>
            <section class="prevention-section">
                <h3>🌟 自杀预防与心理援助资源</h3>
                <p>如果您正在经历困难时期，请记住您不是一个人。以下资源可以为您提供帮助：</p>
                <div class="prevention-resources">
                    <div class="resource-card">
                        <h4>📞 紧急热线</h4>
                        <p>全国心理援助热线：<strong>400-161-9995</strong></p>
                        <p>北京心理危机研究与干预中心：<strong>800-810-1117</strong></p>
                    </div>
                    <div class="resource-card">
                        <h4>🏥 医疗帮助</h4>
                        <p>请及时就医，寻求专业心理咨询师或精神科医生的帮助</p>
                    </div>
                    <div class="resource-card">
                        <h4>👥 社区支持</h4>
                        <p>联系当地心理健康中心、社区服务中心或宗教组织</p>
                    </div>
                </div>
            </section>
            <section class="intro-section">
                <h3>🤝 如何贡献</h3>
                <p>如果您希望为星语铭贡献内容或提供帮助，请通过以下方式联系我：</p>
                <p style="text-align: center; margin-top: 1.5rem;">
                    <a href="https://qm.qq.com/q/46Lb5fAm36" class="btn" style="margin: 0 1rem;">QQ联系</a>
                    <a href="https://x.com/novihare" class="btn" style="margin: 0 1rem;">推特联系</a>
                </p>
            </section>
        </div>
    </main>
    <footer>
        <p>&copy; 2025 星语铭 | 由 <a href="https://novihare.cn/">Novi的导航站</a> 提供技术支持</p>
    </footer>
    <script src="js/main.js"></script>
</body>
</html>`;
    
    fs.writeFileSync(path.join(projectRoot, 'index.html'), html);
    console.log('Built index.html');
}

function copyPublic() {
    console.log('Copying public files from:', publicDir);
    console.log('Public dir exists:', fs.existsSync(publicDir));
    if (fs.existsSync(publicDir)) {
        const files = fs.readdirSync(publicDir);
        console.log('Files in public:', files);
        for (const file of files) {
            const srcPath = path.join(publicDir, file);
            const destPath = path.join(projectRoot, file);
            if (fs.statSync(srcPath).isDirectory()) {
                copyDirRecursive(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
        console.log('Copied public files');
    } else {
        console.log('Public dir does not exist, skipping');
    }
}

function copyDirRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function main() {
    console.log('Starting build...');
    
    buildHomePage();
    buildPeopleList();
    
    const people = readPeople();
    for (const dirname of people) {
        buildPersonPage(dirname);
    }
    
    copyPublic();
    
    console.log('Build complete!');
}

main();
