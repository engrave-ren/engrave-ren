const DATA_URL = 'people-list.json';

let profilesData = [];

async function loadProfiles() {
    try {
        const response = await fetch(DATA_URL);
        profilesData = await response.json();
        renderProfiles(profilesData);
        
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', e => {
                e.preventDefault();
                performSearch();
            });
        }
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(performSearch, 300));
        }
    } catch (error) {
        console.error('加载失败:', error);
    }
}

function performSearch() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const filtered = profilesData.filter(p => {
        const nameMatch = p.name?.toLowerCase().includes(query);
        const descMatch = p.desc?.toLowerCase().includes(query);
        const infoValues = Object.values(p.info || {}).join(' ').toLowerCase();
        const infoMatch = infoValues.includes(query);
        return nameMatch || descMatch || infoMatch;
    });
    renderProfiles(filtered);
}

function renderProfiles(profiles) {
    const grid = document.getElementById('profilesGrid');
    if (!grid) return;
    
    if (!profiles || profiles.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--pure-white); border-radius: 12px; box-shadow: 0 4px 20px var(--shadow);">
            <h3 style="color: var(--text-light); margin-bottom: 1rem;">🌸 暂无纪念人物</h3>
        </div>`;
        return;
    }
    
    grid.innerHTML = profiles.map(p => {
        const avatar = p.profileUrl || 'css/default-avatar.svg';
        const desc = p.desc || generateInfoDesc(p.info);
        return `
        <div class="profile-card" onclick="window.location.href='people/${p.id}/index.html'">
            <img src="${avatar}" alt="${p.name}" class="profile-avatar" onerror="this.src='css/default-avatar.svg'">
            <div class="profile-name">${p.name}</div>
            <div class="profile-bio">${desc}</div>
        </div>
    `}).join('');
}

function generateInfoDesc(info) {
    if (!info) return '点击查看详情';
    const parts = [];
    if (info['地点'] || info['location']) parts.push(info['地点'] || info['location']);
    if (info['年龄'] || info['age']) parts.push((info['年龄'] || info['age']) + '岁');
    if (info['去世'] || info['died']) {
        const died = info['去世'] || info['died'];
        if (died && died.length >= 4) parts.push(died.substring(0, 4) + '年离开');
    }
    return parts.join(' · ') || '点击查看详情';
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
    }
});

window.addEventListener('scroll', () => {
    const btn = document.getElementById('scrollTop');
    if (!btn) {
        const b = document.createElement('button');
        b.id = 'scrollTop';
        b.innerHTML = '↑';
        b.style.cssText = 'position:fixed;bottom:30px;right:30px;width:50px;height:50px;border-radius:50%;background:linear-gradient(45deg,var(--sky-blue),var(--coral-pink));color:#fff;border:none;font-size:1.5rem;cursor:pointer;z-index:1000;opacity:0;transition:opacity 0.3s;';
        b.onclick = () => window.scrollTo({top: 0, behavior: 'smooth'});
        document.body.appendChild(b);
    }
    const b = document.getElementById('scrollTop');
    b.style.opacity = window.scrollY > 300 ? '1' : '0';
});

loadProfiles();
