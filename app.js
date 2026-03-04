/**
 * app.js - 와이즈업 학원 공지사항 사용자 페이지 로직
 * localStorage에서 공지 목록을 읽어와 동적으로 렌더링합니다.
 */

const STORAGE_KEY = 'wiseup_notices';

// --- 배지 설정 ---
const BADGE_CONFIG = {
    new: { label: 'New', className: 'badge-new' },
    notice: { label: '공지', className: 'badge-normal' },
    important: { label: '중요', className: 'badge-important' },
};

/**
 * localStorage에서 공지사항 목록을 불러옵니다.
 */
function getNotices() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

/**
 * 날짜 문자열을 표시용 형식으로 변환합니다. (2026-03-04 → 2026.03.04)
 */
function formatDate(dateStr) {
    return dateStr ? dateStr.replace(/-/g, '.') : '';
}

/**
 * 공지사항 카드 HTML을 생성합니다.
 */
function createNoticeCard(notice, index) {
    const badge = BADGE_CONFIG[notice.badge] || BADGE_CONFIG.notice;
    const isFirst = index === 0;

    return `
        <article class="notice-card ${isFirst ? 'expanded' : ''}" data-id="${notice.id}">
            <div class="notice-header">
                <div class="notice-meta">
                    <span class="badge ${badge.className}">${badge.label}</span>
                    <span class="date">${formatDate(notice.date)}</span>
                </div>
                <h2 class="title">${notice.title}</h2>
                <div class="toggle-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
            <div class="notice-content">
                <div class="content-inner notice-html-content">
                    ${notice.content}
                </div>
            </div>
        </article>
    `;
}

/**
 * 공지사항이 없을 때 표시할 빈 상태 UI
 */
function createEmptyState() {
    return `
        <div class="empty-state">
            <div class="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
            </div>
            <p class="empty-title">등록된 공지사항이 없습니다.</p>
            <p class="empty-desc">관리자 페이지에서 새 공지를 등록해 주세요.</p>
        </div>
    `;
}

/**
 * 사이드바 공지 목록을 렌더링합니다.
 */
function renderSidebar(notices) {
    const sidebarList = document.getElementById('sidebarNoticeList');
    if (!sidebarList) return;

    if (notices.length === 0) {
        sidebarList.innerHTML = '<li class="sidebar-empty">등록된 공지가 없습니다.</li>';
        return;
    }

    sidebarList.innerHTML = notices.map((notice, index) => `
        <li>
            <a href="#" class="sidebar-item" data-index="${index}">
                <span class="sidebar-badge badge ${(BADGE_CONFIG[notice.badge] || BADGE_CONFIG.notice).className}">
                    ${(BADGE_CONFIG[notice.badge] || BADGE_CONFIG.notice).label}
                </span>
                <span class="sidebar-title">${notice.title}</span>
            </a>
        </li>
    `).join('');

    // 사이드바 항목 클릭 시 해당 카드로 스크롤
    sidebarList.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const index = parseInt(item.dataset.index);
            const cards = document.querySelectorAll('.notice-card');
            if (cards[index]) {
                cards[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
                // 닫혀있으면 열기
                if (!cards[index].classList.contains('expanded')) {
                    cards[index].classList.add('expanded');
                }
            }
            closeSidebar();
        });
    });
}

/**
 * 메인 공지사항 목록을 렌더링합니다.
 */
function renderNotices() {
    const noticeList = document.getElementById('noticeList');
    if (!noticeList) return;

    const notices = getNotices();

    if (notices.length === 0) {
        noticeList.innerHTML = createEmptyState();
    } else {
        noticeList.innerHTML = notices.map(createNoticeCard).join('');
        attachCardListeners();
    }

    renderSidebar(notices);
}

/**
 * 아코디언 카드의 클릭 이벤트를 연결합니다.
 */
function attachCardListeners() {
    document.querySelectorAll('.notice-card').forEach(card => {
        const header = card.querySelector('.notice-header');
        if (header) {
            header.addEventListener('click', () => {
                card.classList.toggle('expanded');
            });
        }
    });
}

// --- 사이드바 열기/닫기 ---
function openSidebar() {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebarOverlay')?.classList.add('visible');
}

function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('visible');
}

// --- 초기화 ---
document.addEventListener('DOMContentLoaded', () => {
    renderNotices();

    document.getElementById('menuToggle')?.addEventListener('click', openSidebar);
    document.getElementById('menuClose')?.addEventListener('click', closeSidebar);
    document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);
});
