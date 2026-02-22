// 星语铭 - GitHub Pages 主页面 JavaScript

// 全局缓存，避免重复请求
let cachedProfiles = [];

// 逝世时间范围过滤
let passDateFilter = {
    from: null,
    to: null
};

// 加载所有人物数据
async function loadAllProfiles() {
    // 如果已经加载过，直接返回缓存
    if (cachedProfiles.length > 0) return cachedProfiles;

    try {
        console.log('正在加载人物数据...');
        // 获取人物 ID 列表
        const listResponse = await fetch('/data/profiles.json');
        if (!listResponse.ok) throw new Error('无法获取 profiles.json');
        
        const profileIds = await listResponse.json();
        
        if (!Array.isArray(profileIds)) {
            console.error('profiles.json 格式错误');
            return [];
        }
        
        // 并行加载所有人物的基本信息
        const profilePromises = profileIds.map(async (id) => {
            if (!id) return null;
            try {
                const response = await fetch(`/data/people/${id}/info.json`);
                if (!response.ok) {
                    // 静默失败，不打印太多错误以免干扰
                    return null;
                }
                return await response.json();
            } catch (e) {
                return null;
            }
        });
        
        const profiles = await Promise.all(profilePromises);
        cachedProfiles = profiles.filter(p => p !== null && p.id);
        return cachedProfiles;
    } catch (error) {
        console.error('加载人物列表失败:', error);
        return [];
    }
}

// 执行搜索和渲染
async function loadProfiles() {
    // 1. 获取数据 (使用缓存)
    const profiles = await loadAllProfiles();
    
    // 2. 获取搜索参数
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search') || '';
    
    // 获取逝世时间范围参数
    const passDateFrom = urlParams.get('passDateFrom') || '';
    const passDateTo = urlParams.get('passDateTo') || '';
    
    // 更新搜索框显示
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value !== searchQuery) {
        searchInput.value = searchQuery;
    }
    
    // 更新日期选择器显示
    const passDateFromInput = document.getElementById('passDateFrom');
    const passDateToInput = document.getElementById('passDateTo');
    if (passDateFromInput && passDateFromInput.value !== passDateFrom) {
        passDateFromInput.value = passDateFrom;
    }
    if (passDateToInput && passDateToInput.value !== passDateTo) {
        passDateToInput.value = passDateTo;
    }
    
    // 设置全局日期过滤条件
    passDateFilter = {
        from: passDateFrom || null,
        to: passDateTo || null
    };
    
    // 4. 过滤 profiles
    const filteredProfiles = filterProfiles(profiles, searchQuery);
    
    // 5. 渲染
    renderProfiles(filteredProfiles);
}

// 核心过滤逻辑 (支持 ID 搜索)
function filterProfiles(profiles, query) {
    if (!query && !passDateFilter.from && !passDateFilter.to) return profiles;
    
    const lowerQuery = query ? query.toLowerCase().trim() : '';
    
    return profiles.filter(p => {
        if (!p) return false;
        
        // 文本搜索匹配
        let textMatch = true;
        if (lowerQuery) {
            const matchId = p.id && p.id.toLowerCase().includes(lowerQuery);
            const matchName = p.name && p.name.toLowerCase().includes(lowerQuery);
            const matchHandle = p.handle && p.handle.toLowerCase().includes(lowerQuery);
            const matchAliases = p.aliases && p.aliases.toLowerCase().includes(lowerQuery);
            textMatch = matchId || matchName || matchHandle || matchAliases;
        }
        
        // 逝世时间范围匹配
        let dateMatch = true;
        if (passDateFilter.from || passDateFilter.to) {
            if (!p.passDate) {
                dateMatch = false;
            } else {
                const passDate = new Date(p.passDate);
                if (passDateFilter.from) {
                    const fromDate = new Date(passDateFilter.from);
                    dateMatch = dateMatch && passDate >= fromDate;
                }
                if (passDateFilter.to) {
                    const toDate = new Date(passDateFilter.to);
                    dateMatch = dateMatch && passDate <= toDate;
                }
            }
        }
        
        return textMatch && dateMatch;
    });
}

// 渲染纪念人物卡片
function renderProfiles(profiles) {
    const profilesGrid = document.getElementById('profilesGrid');
    
    if (!profilesGrid) return;
    
    if (profiles.length === 0) {
        profilesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--pure-white); border-radius: 12px; box-shadow: 0 4px 20px var(--shadow);">
                <h3 style="color: var(--text-light); margin-bottom: 1rem;">🌸 未找到相关记忆</h3>
                <p style="color: var(--text-light);">请尝试搜索其他关键词，或数据正在整理中...</p>
            </div>
        `;
        return;
    }
    
    profilesGrid.innerHTML = profiles.map(profile => `
        <div class="profile-card" onclick="window.location.href='/profile.html?id=${encodeURIComponent(profile.id)}'" style="cursor: pointer;">
            <img src="/data/people/${profile.id}/avatar.jpg" 
                 alt="${profile.name}" 
                 class="profile-avatar" 
                 onerror="this.src='/images/default-avatar.svg'">
            <div class="profile-name">${profile.name}</div>
            <div class="profile-bio">${generateBio(profile)}</div>
        </div>
    `).join('');
}

// 生成简介文字
function generateBio(profile) {
    if (!profile) return '点击查看详情';
    
    // 优先使用 summary
    if (profile.summary && profile.summary.trim()) {
        return profile.summary;
    }
    
    return '点击查看详情';
}

// 渲染今日生日
function renderBirthdays() {
    const birthdaySection = document.getElementById('birthdaySection');
    const birthdayGrid = document.getElementById('birthdayGrid');
    if (!birthdaySection || !birthdayGrid) return;
    
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    
    const todayProfiles = cachedProfiles.filter(p => {
        if (!p.birthDate) return false;
        const parts = p.birthDate.split('-');
        if (parts.length !== 3) return false;
        return parseInt(parts[1]) === month && parseInt(parts[2]) === day;
    });
    
    if (todayProfiles.length === 0) {
        birthdaySection.style.display = 'none';
        return;
    }
    
    birthdaySection.style.display = 'block';
    birthdayGrid.style.display = 'grid';
    birthdayGrid.innerHTML = todayProfiles.map(profile => `
        <div class="profile-card" onclick="window.location.href='/profile.html?id=${encodeURIComponent(profile.id)}'" style="cursor: pointer;">
            <img src="/data/people/${profile.id}/avatar.jpg" 
                 alt="${profile.name}" 
                 class="profile-avatar" 
                 onerror="this.src='/images/default-avatar.svg'">
            <div class="profile-name">${profile.name}</div>
            <div class="profile-bio">${generateBio(profile)}</div>
        </div>
    `).join('');
}

// 渲染今日祭日
function renderAnniversaries() {
    const anniversarySection = document.getElementById('anniversarySection');
    const anniversaryGrid = document.getElementById('anniversaryGrid');
    if (!anniversarySection || !anniversaryGrid) return;
    
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    
    const todayProfiles = cachedProfiles.filter(p => {
        if (!p.passDate) return false;
        const parts = p.passDate.split('-');
        if (parts.length !== 3) return false;
        return parseInt(parts[1]) === month && parseInt(parts[2]) === day;
    });
    
    if (todayProfiles.length === 0) {
        anniversarySection.style.display = 'none';
        return;
    }
    
    anniversarySection.style.display = 'block';
    anniversaryGrid.style.display = 'grid';
    anniversaryGrid.innerHTML = todayProfiles.map(profile => `
        <div class="profile-card" onclick="window.location.href='/profile.html?id=${encodeURIComponent(profile.id)}'" style="cursor: pointer;">
            <img src="/data/people/${profile.id}/avatar.jpg" 
                 alt="${profile.name}" 
                 class="profile-avatar" 
                 onerror="this.src='/images/default-avatar.svg'">
            <div class="profile-name">${profile.name}</div>
            <div class="profile-bio">${generateBio(profile)}</div>
        </div>
    `).join('');
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    
    // 1. 初始化加载数据
    loadProfiles().then(() => {
        // 2. 渲染今日生日（等待数据加载完成后执行）
        renderBirthdays();
        // 3. 渲染今日祭日
        renderAnniversaries();
    });
    
    // 3. 随机访问按钮
    const randomBtn = document.getElementById('randomBtn');
    if (randomBtn) {
        randomBtn.addEventListener('click', async function() {
            const profiles = await loadAllProfiles();
            if (profiles.length > 0) {
                const randomProfile = profiles[Math.floor(Math.random() * profiles.length)];
                window.location.href = '/profile.html?id=' + encodeURIComponent(randomProfile.id);
            }
        });
    }
    
    // 3. 绑定搜索表单提交事件 (修复按钮无法按下问题)
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault(); // 阻止表单默认提交刷新页面
            
            const query = searchInput.value.trim();
            
            // 更新 URL 参数 (不刷新页面，但改变地址栏，方便分享)
            const newUrl = new URL(window.location);
            if (query) {
                newUrl.searchParams.set('search', query);
            } else {
                newUrl.searchParams.delete('search');
            }
            window.history.pushState({}, '', newUrl);
            
            // 执行过滤和渲染
            const filtered = filterProfiles(cachedProfiles, query);
            renderProfiles(filtered);
        });
    }
    
    // 3.1 绑定逝世时间范围筛选按钮
    const filterByDateBtn = document.getElementById('filterByDateBtn');
    const clearDateFilterBtn = document.getElementById('clearDateFilterBtn');
    const passDateFromInput = document.getElementById('passDateFrom');
    const passDateToInput = document.getElementById('passDateTo');
    
    if (filterByDateBtn) {
        filterByDateBtn.addEventListener('click', function() {
            const fromDate = passDateFromInput ? passDateFromInput.value : '';
            const toDate = passDateToInput ? passDateToInput.value : '';
            
            // 更新 URL 参数
            const newUrl = new URL(window.location);
            if (fromDate) {
                newUrl.searchParams.set('passDateFrom', fromDate);
            } else {
                newUrl.searchParams.delete('passDateFrom');
            }
            if (toDate) {
                newUrl.searchParams.set('passDateTo', toDate);
            } else {
                newUrl.searchParams.delete('passDateTo');
            }
            window.history.pushState({}, '', newUrl);
            
            // 更新全局过滤条件
            passDateFilter = {
                from: fromDate || null,
                to: toDate || null
            };
            
            // 执行过滤和渲染
            const searchQuery = searchInput ? searchInput.value.trim() : '';
            const filtered = filterProfiles(cachedProfiles, searchQuery);
            renderProfiles(filtered);
        });
    }
    
    if (clearDateFilterBtn) {
        clearDateFilterBtn.addEventListener('click', function() {
            // 清空日期输入框
            if (passDateFromInput) passDateFromInput.value = '';
            if (passDateToInput) passDateToInput.value = '';
            
            // 更新 URL 参数
            const newUrl = new URL(window.location);
            newUrl.searchParams.delete('passDateFrom');
            newUrl.searchParams.delete('passDateTo');
            window.history.pushState({}, '', newUrl);
            
            // 更新全局过滤条件
            passDateFilter = {
                from: null,
                to: null
            };
            
            // 执行过滤和渲染
            const searchQuery = searchInput ? searchInput.value.trim() : '';
            const filtered = filterProfiles(cachedProfiles, searchQuery);
            renderProfiles(filtered);
        });
    }
    
    // 4. 添加返回顶部按钮
    window.addEventListener('scroll', function() {
        const scrollButton = document.getElementById('scrollToTop');
        if (!scrollButton) {
            const button = document.createElement('button');
            button.id = 'scrollToTop';
            button.innerHTML = '↑';
            button.style.cssText = `
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(45deg, var(--sky-blue), var(--coral-pink));
                color: var(--pure-white);
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                box-shadow: 0 4px 15px var(--shadow);
                transition: all 0.3s ease;
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
            `;
            button.addEventListener('click', function() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            document.body.appendChild(button);
        }
        
        const button = document.getElementById('scrollToTop');
        if (button) {
            if (window.pageYOffset > 300) {
                button.style.opacity = '1';
                button.style.visibility = 'visible';
            } else {
                button.style.opacity = '0';
                button.style.visibility = 'hidden';
            }
        }
    });
    
    // 5. 键盘导航
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        if (e.key === 'Escape') {
            if (searchInput) {
                searchInput.blur();
            }
        }
    });
});