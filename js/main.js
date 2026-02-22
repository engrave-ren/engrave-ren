// 星语铭 - GitHub Pages 主页面 JavaScript

// 全局缓存
let cachedProfiles = [];

// 筛选状态
let passDateFilter = { from: null, to: null };
let currentCharFilter = 'special'; // ⭐ 默认只显示特殊字符 &

// 字符分类定义（仅英文/数字/特殊字符）
const SPECIAL_CHARS = '&@#$%';
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';

/**
 * 提取 profile 的首字符分类
 * 优先级: handle > id > name
 */
function getFirstChar(profile) {
    if (!profile) return 'other';

    const text = (profile.handle || profile.id || profile.name || '').toString().trim().toLowerCase();
    if (!text) return 'other';

    const first = text.charAt(0);

    if (SPECIAL_CHARS.includes(first)) return 'special';
    if (LETTERS.includes(first)) return first;      // 返回具体字母 a-z
    if (NUMBERS.includes(first)) return 'numbers';

    return 'other'; // 中文或其他
}

/**
 * 加载所有人物数据（带缓存）
 */
async function loadAllProfiles() {
    if (cachedProfiles.length > 0) return cachedProfiles;

    try {
        const listResponse = await fetch('/data/profiles.json');
        if (!listResponse.ok) throw new Error('无法获取 profiles.json');

        const profileIds = await listResponse.json();
        if (!Array.isArray(profileIds)) return [];

        const profilePromises = profileIds.map(async (id) => {
            if (!id) return null;
            try {
                const response = await fetch(`/data/people/${id}/info.json`);
                if (!response.ok) return null;
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

/**
 * 综合过滤函数：文本搜索 + 日期范围 + 首字符
 */
function filterProfiles(profiles, query) {
    const lowerQuery = query ? query.toLowerCase().trim() : '';

    return profiles.filter(p => {
        if (!p) return false;

        // 1. 文本搜索
        let textMatch = true;
        if (lowerQuery) {
            const matchId = p.id && p.id.toLowerCase().includes(lowerQuery);
            const matchName = p.name && p.name.toLowerCase().includes(lowerQuery);
            const matchHandle = p.handle && p.handle.toLowerCase().includes(lowerQuery);
            const matchAliases = p.aliases && p.aliases.toLowerCase().includes(lowerQuery);
            textMatch = matchId || matchName || matchHandle || matchAliases;
        }

        // 2. 逝世时间范围
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

        // 3. 首字符筛选 ⭐
        let charMatch = true;
        if (currentCharFilter) {
            charMatch = getFirstChar(p) === currentCharFilter;
        }

        return textMatch && dateMatch && charMatch;
    });
}

/**
 * 渲染人物卡片
 */
function renderProfiles(profiles) {
    const profilesGrid = document.getElementById('profilesGrid');
    if (!profilesGrid) return;

    if (profiles.length === 0) {
        profilesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--pure-white); border-radius: 12px; box-shadow: 0 4px 20px var(--shadow);">
                <h3 style="color: var(--text-light); margin-bottom: 1rem;">🌸 该分类下暂无记录</h3>
                <p style="color: var(--text-light);">点击上方其他字符按钮，或尝试搜索关键词...</p>
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

/**
 * 生成简介文字
 */
function generateBio(profile) {
    if (!profile) return '点击查看详情';
    if (profile.summary && profile.summary.trim()) {
        return profile.summary;
    }
    return '点击查看详情';
}

/**
 * ⭐ 渲染首字符筛选按钮（目录）⭐
 */
function renderCharFilterButtons(profiles) {
    const container = document.getElementById('charFilterContainer');
    if (!container) return;

    // 统计实际出现的字符
    const availableChars = new Set();
    profiles.forEach(p => {
        const c = getFirstChar(p);
        availableChars.add(c);
    });

    let buttonsHTML = '';

    // 1. 特殊字符按钮 &
    if (availableChars.has('special')) {
        const isActive = currentCharFilter === 'special' ? 'active' : '';
        buttonsHTML += `<button type="button" class="char-filter-btn ${isActive}" data-char="special">&amp;</button>`;
    }

    // 2. 字母 a-z
    for (const letter of LETTERS) {
        if (availableChars.has(letter)) {
            const isActive = currentCharFilter === letter ? 'active' : '';
            buttonsHTML += `<button type="button" class="char-filter-btn ${isActive}" data-char="${letter}">${letter.toUpperCase()}</button>`;
        }
    }

    // 3. 数字按钮 #
    if (availableChars.has('numbers')) {
        const isActive = currentCharFilter === 'numbers' ? 'active' : '';
        buttonsHTML += `<button type="button" class="char-filter-btn ${isActive}" data-char="numbers">#</button>`;
    }

    // 4. 其他（中文等，备用）
    if (availableChars.has('other')) {
        const isActive = currentCharFilter === 'other' ? 'active' : '';
        buttonsHTML += `<button type="button" class="char-filter-btn ${isActive}" data-char="other">★</button>`;
    }

    container.innerHTML = buttonsHTML;

    // 绑定点击事件
    container.querySelectorAll('.char-filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            currentCharFilter = this.dataset.char;

            // 更新 URL
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('char', currentCharFilter);
            window.history.pushState({}, '', newUrl);

            // 重新渲染
            applyFilters();
        });
    });
}

/**
 * 统一应用所有筛选条件
 */
function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.trim() : '';

    const filtered = filterProfiles(cachedProfiles, query);
    renderProfiles(filtered);
    renderCharFilterButtons(cachedProfiles); // 更新按钮状态
}

/**
 * 主加载函数
 */
async function loadProfiles() {
    const profiles = await loadAllProfiles();

    // 读取 URL 参数
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search') || '';
    const passDateFrom = urlParams.get('passDateFrom') || '';
    const passDateTo = urlParams.get('passDateTo') || '';
    const charParam = urlParams.get('char');

    // 更新搜索框
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value !== searchQuery) {
        searchInput.value = searchQuery;
    }

    // 更新日期选择器
    const passDateFromInput = document.getElementById('passDateFrom');
    const passDateToInput = document.getElementById('passDateTo');
    if (passDateFromInput && passDateFromInput.value !== passDateFrom) {
        passDateFromInput.value = passDateFrom;
    }
    if (passDateToInput && passDateToInput.value !== passDateTo) {
        passDateToInput.value = passDateTo;
    }

    // 更新筛选状态
    passDateFilter = { from: passDateFrom || null, to: passDateTo || null };
    if (charParam) {
        currentCharFilter = charParam; // 从 URL 恢复筛选状态
    }
    // ⭐ 如果没有 char 参数，保持默认的 'special'

    // 渲染
    applyFilters();
}

/**
 * 渲染今日生日
 */
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

/**
 * 渲染今日祭日
 */
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

// ========== 页面初始化 ==========
document.addEventListener('DOMContentLoaded', function () {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');

    // 1. 加载数据 + 渲染
    loadProfiles().then(() => {
        renderBirthdays();
        renderAnniversaries();
    });

    // 2. 随机访问按钮
    const randomBtn = document.getElementById('randomBtn');
    if (randomBtn) {
        randomBtn.addEventListener('click', async function () {
            const profiles = await loadAllProfiles();
            if (profiles.length > 0) {
                const randomProfile = profiles[Math.floor(Math.random() * profiles.length)];
                window.location.href = '/profile.html?id=' + encodeURIComponent(randomProfile.id);
            }
        });
    }

    // 3. 搜索表单提交
    if (searchForm) {
        searchForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const query = searchInput.value.trim();

            const newUrl = new URL(window.location);
            if (query) {
                newUrl.searchParams.set('search', query);
            } else {
                newUrl.searchParams.delete('search');
            }
            window.history.pushState({}, '', newUrl);

            applyFilters();
        });
    }

    // 4. 日期筛选按钮
    const filterByDateBtn = document.getElementById('filterByDateBtn');
    const clearDateFilterBtn = document.getElementById('clearDateFilterBtn');
    const passDateFromInput = document.getElementById('passDateFrom');
    const passDateToInput = document.getElementById('passDateTo');

    if (filterByDateBtn) {
        filterByDateBtn.addEventListener('click', function () {
            const fromDate = passDateFromInput ? passDateFromInput.value : '';
            const toDate = passDateToInput ? passDateToInput.value : '';

            const newUrl = new URL(window.location);
            if (fromDate) newUrl.searchParams.set('passDateFrom', fromDate);
            else newUrl.searchParams.delete('passDateFrom');
            if (toDate) newUrl.searchParams.set('passDateTo', toDate);
            else newUrl.searchParams.delete('passDateTo');
            window.history.pushState({}, '', newUrl);

            passDateFilter = { from: fromDate || null, to: toDate || null };
            applyFilters();
        });
    }

    if (clearDateFilterBtn) {
        clearDateFilterBtn.addEventListener('click', function () {
            if (passDateFromInput) passDateFromInput.value = '';
            if (passDateToInput) passDateToInput.value = '';

            const newUrl = new URL(window.location);
            newUrl.searchParams.delete('passDateFrom');
            newUrl.searchParams.delete('passDateTo');
            window.history.pushState({}, '', newUrl);

            passDateFilter = { from: null, to: null };
            applyFilters();
        });
    }

    // 5. 返回顶部按钮
    window.addEventListener('scroll', function () {
        let scrollButton = document.getElementById('scrollToTop');
        if (!scrollButton) {
            scrollButton = document.createElement('button');
            scrollButton.id = 'scrollToTop';
            scrollButton.innerHTML = '↑';
            scrollButton.style.cssText = `
                position: fixed; bottom: 30px; right: 30px;
                width: 50px; height: 50px; border-radius: 50%;
                background: linear-gradient(45deg, var(--sky-blue), var(--coral-pink));
                color: var(--pure-white); border: none; font-size: 1.5rem;
                cursor: pointer; box-shadow: 0 4px 15px var(--shadow);
                transition: all 0.3s ease; z-index: 1000;
                opacity: 0; visibility: hidden;
            `;
            scrollButton.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            document.body.appendChild(scrollButton);
        }

        if (window.pageYOffset > 300) {
            scrollButton.style.opacity = '1';
            scrollButton.style.visibility = 'visible';
        } else {
            scrollButton.style.opacity = '0';
            scrollButton.style.visibility = 'hidden';
        }
    });

    // 6. 键盘快捷键
    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (searchInput) searchInput.focus();
        }
        if (e.key === 'Escape' && searchInput) {
            searchInput.blur();
        }
    });
});