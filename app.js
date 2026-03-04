/**
 * app.js - 와이즈업 공지사항 사용자 페이지 (Firebase + 미니멀)
 */

const BADGE_CONFIG = {
    new: { label: 'New', className: 'badge-new' },
    notice: { label: '공지', className: 'badge-normal' },
    important: { label: '중요', className: 'badge-important' },
};

/** Firestore에서 공지사항 목록을 불러옵니다. */
async function getNotices() {
    try {
        const snapshot = await db.collection('notices')
            .orderBy('createdAt', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error('공지사항 로드 실패:', e);
        return [];
    }
}

function formatDate(dateStr) {
    return dateStr ? dateStr.replace(/-/g, '.') : '';
}

/** 유튜브 URL에서 영상 ID 추출 */
function extractYouTubeId(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

/** 드롭다운 옵션 렌더링 */
function renderSelectOptions(notices) {
    const sel = document.getElementById('noticeSelect');
    if (!sel) return;

    if (notices.length === 0) {
        sel.innerHTML = '<option value="">등록된 공지가 없습니다</option>';
        sel.disabled = true;
        return;
    }

    sel.disabled = false;
    sel.innerHTML = notices.map(n => {
        const badge = BADGE_CONFIG[n.badge] ? `[${BADGE_CONFIG[n.badge].label}] ` : '';
        return `<option value="${n.id}">${badge}${n.title} (${formatDate(n.date)})</option>`;
    }).join('');
}

/** 선택된 공지를 뷰어에 표시 */
function renderNotice(noticeId, notices) {
    const viewer = document.getElementById('noticeViewer');
    const header = document.getElementById('viewerHeader');
    if (!viewer || !header) return;

    if (!notices || notices.length === 0) {
        viewer.innerHTML = `
            <div class="empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <p class="empty-title">등록된 공지사항이 없습니다.</p>
                <p class="empty-desc">관리자 페이지에서 새 공지를 등록해 주세요.</p>
            </div>`;
        header.style.display = 'none';
        return;
    }

    const notice = notices.find(n => n.id === noticeId);
    if (!notice) return;

    // 배지/날짜
    const badgeConf = BADGE_CONFIG[notice.badge] || BADGE_CONFIG.notice;
    document.getElementById('viewerBadge').className = `badge ${badgeConf.className}`;
    document.getElementById('viewerBadge').textContent = badgeConf.label;
    document.getElementById('viewerDate').textContent = formatDate(notice.date);
    header.style.display = 'flex';

    // 유튜브 임베드 (있는 경우 최상단에 삽입)
    viewer.innerHTML = '';
    const videoId = extractYouTubeId(notice.youtubeUrl);
    if (videoId) {
        const ytWrap = document.createElement('div');
        ytWrap.className = 'yt-embed';
        ytWrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?rel=0" 
            frameborder="0" allowfullscreen 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style="width:100%;aspect-ratio:16/9;border:none;max-height:400px;"></iframe>`;
        viewer.appendChild(ytWrap);
    }

    // HTML iframe
    const iframe = document.createElement('iframe');
    iframe.className = 'notice-iframe';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
    iframe.srcdoc = notice.content;
    viewer.appendChild(iframe);
}

/** 메인 초기화 */
async function init() {
    const notices = await getNotices();
    renderSelectOptions(notices);

    const sel = document.getElementById('noticeSelect');
    if (sel) {
        sel.addEventListener('change', e => renderNotice(e.target.value, notices));
        if (notices.length > 0) {
            sel.value = notices[0].id;
            renderNotice(notices[0].id, notices);
        } else {
            renderNotice(null, notices);
        }
    }
}

document.addEventListener('DOMContentLoaded', init);
