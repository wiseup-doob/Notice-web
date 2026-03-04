/**
 * app.js - 와이즈업 학원 공지사항 사용자 페이지 (Firebase Firestore)
 */

// --- 배지 설정 ---
const BADGE_CONFIG = {
    new: { label: 'New', className: 'badge-new' },
    notice: { label: '공지', className: 'badge-normal' },
    important: { label: '중요', className: 'badge-important' },
};

/**
 * Firestore에서 공지사항 목록을 불러옵니다 (최신순 정렬).
 */
async function getNotices() {
    try {
        const snapshot = await db.collection('notices')
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (e) {
        console.error('공지사항 로드 실패:', e);
        return [];
    }
}

/**
 * 날짜 문자열을 표시용 형식으로 변환합니다.
 */
function formatDate(dateStr) {
    return dateStr ? dateStr.replace(/-/g, '.') : '';
}

/**
 * 빈 상태 UI 렌더링
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
 * 드롭다운(<select>) 메뉴 옵션을 렌더링합니다.
 */
function renderSelectOptions(notices) {
    const selectEl = document.getElementById('noticeSelect');
    if (!selectEl) return;

    if (notices.length === 0) {
        selectEl.innerHTML = '<option value="">등록된 공지가 없습니다</option>';
        selectEl.disabled = true;
        return;
    }

    selectEl.disabled = false;
    selectEl.innerHTML = notices.map(notice => {
        const badgeLabel = BADGE_CONFIG[notice.badge] ? `[${BADGE_CONFIG[notice.badge].label}]` : '';
        const title = `${badgeLabel} ${notice.title} (${formatDate(notice.date)})`;
        return `<option value="${notice.id}">${title}</option>`;
    }).join('');
}

/**
 * 선택된 특정 공지 내용을 뷰어에 렌더링합니다.
 */
function renderSelectedNotice(noticeId, notices) {
    const viewer = document.getElementById('noticeViewer');
    const header = document.getElementById('viewerHeader');

    if (!viewer || !header) return;

    if (!notices || notices.length === 0) {
        viewer.innerHTML = createEmptyState();
        header.style.display = 'none';
        return;
    }

    const selectedNotice = notices.find(n => n.id === noticeId);

    if (!selectedNotice) {
        viewer.innerHTML = '<div class="empty-state"><p class="empty-title">해당 공지를 찾을 수 없습니다.</p></div>';
        header.style.display = 'none';
        return;
    }

    // 배지와 날짜 렌더링
    const badgeConf = BADGE_CONFIG[selectedNotice.badge] || BADGE_CONFIG.notice;
    const badgeEl = document.getElementById('viewerBadge');
    if (badgeEl) {
        badgeEl.className = `badge ${badgeConf.className}`;
        badgeEl.textContent = badgeConf.label;
    }

    const dateEl = document.getElementById('viewerDate');
    if (dateEl) {
        dateEl.textContent = formatDate(selectedNotice.date);
    }

    header.style.display = 'flex';

    // HTML 본문 렌더링 (iframe으로 스타일 격리)
    viewer.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.className = 'notice-iframe';
    iframe.setAttribute('sandbox', 'allow-same-origin allow-popups');
    iframe.srcdoc = selectedNotice.content;
    viewer.appendChild(iframe);
}

/**
 * 메인 초기화 (Firestore에서 데이터 로딩)
 */
async function initViewer() {
    const notices = await getNotices();
    renderSelectOptions(notices);
    renderSidebar(notices);

    const selectEl = document.getElementById('noticeSelect');
    if (selectEl) {
        selectEl.addEventListener('change', (e) => {
            renderSelectedNotice(e.target.value, notices);
        });

        if (notices.length > 0) {
            selectEl.value = notices[0].id;
            renderSelectedNotice(notices[0].id, notices);
        } else {
            renderSelectedNotice(null, notices);
        }
    }
}

/**
 * 사이드바 렌더링
 */
function renderSidebar(notices) {
    const sidebarList = document.getElementById('sidebarNoticeList');
    if (!sidebarList) return;

    if (notices.length === 0) {
        sidebarList.innerHTML = '<li class="sidebar-empty">등록된 공지가 없습니다.</li>';
        return;
    }

    sidebarList.innerHTML = notices.map(notice => `
        <li>
            <a href="#" class="sidebar-item" data-id="${notice.id}">
                <span class="sidebar-badge badge ${(BADGE_CONFIG[notice.badge] || BADGE_CONFIG.notice).className}">
                    ${(BADGE_CONFIG[notice.badge] || BADGE_CONFIG.notice).label}
                </span>
                <span class="sidebar-title">${notice.title}</span>
            </a>
        </li>
    `).join('');

    sidebarList.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const id = item.dataset.id;
            const selectEl = document.getElementById('noticeSelect');
            if (selectEl) {
                selectEl.value = id;
                selectEl.dispatchEvent(new Event('change'));
            }
            closeSidebar();
        });
    });
}

// --- 사이드바 ---
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
    initViewer();
    document.getElementById('menuToggle')?.addEventListener('click', openSidebar);
    document.getElementById('menuClose')?.addEventListener('click', closeSidebar);
    document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);
});
