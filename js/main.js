// 星语铭 - GitHub Pages 主页面 JavaScript

// 加载所有人物数据
async function loadAllProfiles() {
    try {
        // 获取人物ID列表
        const listResponse = await fetch('/data/profiles.json');
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
                    console.error(`加载 ${id} 失败: HTTP ${response.status}`);
                    return null;
                }
                return await response.json();
            } catch (e) {
                console.error(`加载 ${id} 失败:`, e);
                return null;
            }
        });
        
        const profiles = await Promise.all(profilePromises);
        return profiles.filter(p => p !== null && p.id);
    } catch (error) {
        console.error('加载人物列表失败:', error);
        return [];
    }
}

// 加载纪念人物列表
async function loadProfiles() {
    const profiles = await loadAllProfiles();
    
    // 获取搜索参数
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search') || '';
    
    // 过滤 profiles
    let filteredProfiles = profiles;
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredProfiles = profiles.filter(p => 
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.handle && p.handle.toLowerCase().includes(query)) ||
            (p.aliases && p.aliases.toLowerCase().includes(query))
        );
    }
    
    renderProfiles(filteredProfiles);
}

// 渲染纪念人物卡片
function renderProfiles(profiles) {
    const profilesGrid = document.getElementById('profilesGrid');
    
    if (!profilesGrid) return;
    
    if (profiles.length === 0) {
        profilesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--pure-white); border-radius: 12px; box-shadow: 0 4px 20px var(--shadow);">
                <h3 style="color: var(--text-light); margin-bottom: 1rem;">🌸 暂无纪念人物</h3>
                <p style="color: var(--text-light);">数据正在整理中...</p>
            </div>
        `;
        return;
    }
    
    profilesGrid.innerHTML = profiles.map(profile => `
        <div class="profile-card" onclick="window.location.href='/profile.html?id=${encodeURIComponent(profile.id)}'">
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

// 搜索功能
document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    
    // 恢复搜索框内容
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search') || '';
    if (searchInput) {
        searchInput.value = searchQuery;
    }
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `/?search=${encodeURIComponent(query)}`;
            } else {
                window.location.href = '/';
            }
        });
    }
    
    // 添加返回顶部按钮
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
        if (window.pageYOffset > 300) {
            button.style.opacity = '1';
            button.style.visibility = 'visible';
        } else {
            button.style.opacity = '0';
            button.style.visibility = 'hidden';
        }
    });
    
    // 键盘导航
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        if (e.key === 'Escape') {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.blur();
            }
        }
    });
});
