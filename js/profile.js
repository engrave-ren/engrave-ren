// 星语铭 - GitHub Pages 个人主页 JavaScript

// ==================== 评论系统配置 ====================
// 使用 Giscus (推荐) 或 Utterances
// 详见: https://giscus.app 或 https://utteranc.es

const COMMENT_CONFIG = {
    // 评论系统: 'giscus' 或 'utterances'
    system: 'utterances',
    
    // Utterances 配置 (从 https://utteranc.es 获取)
    utterances: {
        repo: 'NatsukoYamamura/engrave-ren',
        issueTerm: 'url',
        label: 'comment',
        theme: 'github-light'
    },
    
    // 备用: Giscus 配置 (当前不使用)
    giscus: {
        repo: '',
        repoId: '',
        category: 'Comments',
        categoryId: '',
        mapping: 'pathname',
        theme: 'light',
        lang: 'zh-CN'
    }
};

// 获取URL参数
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// 获取人物ID (用于生成唯一标识)
function getProfileId() {
    const profileId = getUrlParam('id') || getUrlParam('name');
    return profileId ? profileId.toLowerCase().replace(/\s+/g, '-') : '';
}

// 渲染评论区域
function renderCommentsSection() {
    const profileId = getProfileId();
    
    // 如果未配置评论系统
    if (!COMMENT_CONFIG.giscus.repo && !COMMENT_CONFIG.utterances.repo) {
        return `
            <section class="memories-section" id="commentsSection">
                <h2 style="text-align: center; margin-bottom: 2rem;">回忆与祝福</h2>
                <div style="text-align: center; padding: 2rem;">
                    <p style="color: var(--text-light); margin-bottom: 1.5rem;">暂无回忆</p>
                    <p style="color: var(--text-light); font-size: 0.9rem;">请联系管理员配置评论系统</p>
                </div>
            </section>
        `;
    }
    
    // 生成唯一的 pageIdentifier (使用 profile id)
    const pageIdentifier = profileId || 'home';
    
    if (COMMENT_CONFIG.system === 'giscus') {
        return renderGiscusComments(pageIdentifier);
    } else {
        return renderUtterancesComments(pageIdentifier);
    }
}

// 渲染 Giscus 评论
function renderGiscusComments(pageIdentifier) {
    const config = COMMENT_CONFIG.giscus;
    
    return `
        <section class="memories-section" id="commentsSection">
            <h2 style="text-align: center; margin-bottom: 2rem;">回忆与祝福</h2>
            
            <script src="https://giscus.app/client.js"
                data-repo="${config.repo}"
                data-repo-id="${config.repoId}"
                data-category="${config.category}"
                data-category-id="${config.categoryId}"
                data-mapping="${config.mapping}"
                data-strict="0"
                data-reactions-enabled="${config.reactionsEnabled}"
                data-emit-metadata="${config.emitMetadata}"
                data-input-position="${config.inputPosition}"
                data-theme="${config.theme}"
                data-lang="${config.lang}"
                data-loading="lazy"
                crossorigin="anonymous"
                async>
            </script>
        </section>
    `;
}

// 渲染 Utterances 评论
function renderUtterancesComments(pageIdentifier) {
    const config = COMMENT_CONFIG.utterances;
    
    return `
        <section class="memories-section" id="commentsSection">
            <h2 style="text-align: center; margin-bottom: 2rem;">回忆与祝福</h2>
            <div id="utterances-container"></div>
        </section>
    `;
}

// 加载 Utterances 脚本
function loadUtterances() {
    const container = document.getElementById('utterances-container');
    if (!container) return;
    
    const config = COMMENT_CONFIG.utterances;
    
    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.setAttribute('repo', config.repo);
    script.setAttribute('issue-term', config.issueTerm);
    script.setAttribute('label', config.label);
    script.setAttribute('theme', config.theme);
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;
    
    container.appendChild(script);
}

// ==================== 页面渲染 ====================

// 加载个人资料
async function loadProfile() {
    const profileId = getUrlParam('id');
    
    if (!profileId) {
        showError('未指定人物');
        return;
    }
    
    try {
        const response = await fetch('/data/profiles.json');
        const profiles = await response.json();
        
        const profile = profiles.find(p => p.id === profileId || p.name === profileId);
        
        if (!profile) {
            showError('未找到该纪念人物');
            return;
        }
        
        await renderProfile(profile);
    } catch (error) {
        console.error('加载人物数据失败:', error);
        showError('加载失败，请稍后重试');
    }
}

// 渲染个人资料页面
async function renderProfile(profile) {
    document.getElementById('pageTitle').textContent = `${profile.name} - 星语铭`;
    
    let ageText = profile.age || '';
    if (profile.birthDate && profile.passDate && !profile.age) {
        ageText = calculateAge(profile.birthDate, profile.passDate);
    }
    
    const avatar = profile.avatar || '/images/default-avatar.svg';
    
    const content = document.getElementById('profileContent');
    content.innerHTML = `
        <section class="profile-header">
            <img src="${avatar}" alt="${profile.name}" class="profile-avatar-large" 
                 onerror="this.src='/images/default-avatar.svg'">
            <h1>${profile.name}</h1>
            <p style="color: var(--text-light); font-size: 1.2rem;">${profile.handle || ''}</p>
            
            <div class="profile-info">
                ${profile.aliases ? `<div class="profile-info-item"><strong>别名：</strong>${profile.aliases}</div>` : ''}
                ${profile.location ? `<div class="profile-info-item"><strong>地点：</strong>${profile.location}</div>` : ''}
                <div class="profile-info-item">
                    <strong>出生日期：</strong>${profile.birthDate || '不详'}
                </div>
                <div class="profile-info-item">
                    <strong>已离开：</strong>${profile.passDate || '不详'}
                </div>
                ${ageText ? `<div class="profile-info-item"><strong>年龄：</strong>${ageText}</div>` : ''}
                ${profile.website ? `<div class="profile-info-item"><strong>网站：</strong><a href="${profile.website}" target="_blank" style="color: var(--sky-blue);">${profile.website}</a></div>` : ''}
            </div>
        </section>

        <section class="profile-bio-section">
            <h2 style="text-align: center; margin-bottom: 2rem;">生平介绍</h2>
            <div style="line-height: 1.8;">${parseMarkdown(profile.bio || '')}</div>
            
            ${profile.contributor ? `
                <div style="margin-top: 2rem; padding: 1rem; background: var(--light-gray); border-radius: 8px; text-align: center;">
                    <em>本条目贡献者：${profile.contributor}</em>
                </div>
            ` : ''}
        </section>

        ${renderCommentsSection()}
        
        <section class="prevention-section">
            <h3>🌟 请记住</h3>
            <p>如果您正在经历困难时期，请不要犹豫寻求帮助。每个人都有获得支持和关怀的权利。</p>
            <div class="prevention-resources">
                <div class="resource-card">
                    <h4>📞 紧急热线</h4>
                    <p>全国心理援助热线：<strong>400-161-9995</strong></p>
                </div>
                <div class="resource-card">
                    <h4>💬 在线支持</h4>
                    <p>您也可以通过我们网站的联系方式寻求帮助</p>
                </div>
            </div>
        </section>
    `;
    
    // 加载 Utterances 评论
    loadUtterances();
}

// 计算年龄
function calculateAge(birthDate, passDate) {
    try {
        const birth = new Date(birthDate);
        const pass = new Date(passDate);
        
        if (isNaN(birth.getTime()) || isNaN(pass.getTime())) {
            return '';
        }
        
        let age = pass.getFullYear() - birth.getFullYear();
        const monthDiff = pass.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && pass.getDate() < birth.getDate())) {
            age--;
        }
        
        return age > 0 ? `${age}岁` : '';
    } catch (e) {
        return '';
    }
}

// 简单的 Markdown 解析
function parseMarkdown(text) {
    if (!text) return '';
    
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    html = html.replace(/^\&gt; (.*$)/gim, '<blockquote>$1</blockquote>');
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[123]>)/g, '$1');
    html = html.replace(/(<\/h[123]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
    html = html.replace(/<p>(<li>)/g, '$1');
    html = html.replace(/(<\/li>)<\/p>/g, '$1');
    
    return html;
}

// 显示错误
function showError(message) {
    const content = document.getElementById('profileContent');
    document.getElementById('pageTitle').textContent = '错误 - 星语铭';
    content.innerHTML = `
        <div class="error-container">
            <h1>404</h1>
            <p>${message}</p>
            <a href="/" class="btn">返回首页</a>
        </div>
    `;
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', loadProfile);
