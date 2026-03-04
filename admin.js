/**
 * admin.js - 와이즈업 학원 공지사항 관리자 페이지 로직
 */

const STORAGE_KEY = 'wiseup_notices';
const DEFAULT_PIN = '0000'; // 초기 PIN 번호 (나중에 변경 가능)

let selectedFileContent = null;
let selectedFileName = null;

// ===========================
// PIN 인증
// ===========================

function checkPin() {
    const input = document.getElementById('pinInput').value.trim();
    const error = document.getElementById('pinError');

    if (input === DEFAULT_PIN) {
        document.getElementById('pinScreen').style.display = 'none';
        document.getElementById('adminMain').style.display = 'block';
        renderAdminNoticeList();
        initDateField();
    } else {
        error.style.display = 'block';
        document.getElementById('pinInput').value = '';
        document.getElementById('pinInput').focus();
    }
}

document.getElementById('pinSubmit')?.addEventListener('click', checkPin);
document.getElementById('pinInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkPin();
});

// ===========================
// 날짜 초기값 설정
// ===========================

function initDateField() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('noticeDate').value = `${yyyy}-${mm}-${dd}`;
}

// ===========================
// HTML 파일 업로드 처리
// ===========================

const fileUploadArea = document.getElementById('fileUploadArea');
const htmlFileInput = document.getElementById('htmlFileInput');

fileUploadArea?.addEventListener('click', () => htmlFileInput?.click());

fileUploadArea?.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('drag-over');
});

fileUploadArea?.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('drag-over');
});

fileUploadArea?.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
});

htmlFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
});

function handleFileSelect(file) {
    const allowedExtensions = ['.html', '.htm'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
        showFormError('HTML 파일(.html, .htm)만 업로드 가능합니다.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        // HTML 파일에서 body 안의 내용만 추출
        const parser = new DOMParser();
        const doc = parser.parseFromString(e.target.result, 'text/html');
        const bodyContent = doc.body ? doc.body.innerHTML : e.target.result;

        selectedFileContent = bodyContent;
        selectedFileName = file.name;

        // UI 업데이트
        document.getElementById('fileUploadContent').style.display = 'none';
        const preview = document.getElementById('filePreview');
        preview.style.display = 'flex';
        document.getElementById('filePreviewName').textContent = file.name;
        hideFormError();
    };
    reader.readAsText(file, 'UTF-8');
}

document.getElementById('fileClearBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    clearFileSelection();
});

function clearFileSelection() {
    selectedFileContent = null;
    selectedFileName = null;
    htmlFileInput.value = '';
    document.getElementById('fileUploadContent').style.display = 'flex';
    document.getElementById('filePreview').style.display = 'none';
}

// ===========================
// 공지 CRUD (localStorage)
// ===========================

function getNotices() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveNotices(notices) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notices));
}

function addNotice(notice) {
    const notices = getNotices();
    notices.unshift(notice); // 최신 순으로 맨 앞에 추가
    saveNotices(notices);
}

function deleteNotice(id) {
    const notices = getNotices().filter(n => n.id !== id);
    saveNotices(notices);
    renderAdminNoticeList();
    showToast('공지가 삭제되었습니다.');
}

// ===========================
// 공지 등록
// ===========================

document.getElementById('submitNotice')?.addEventListener('click', () => {
    const title = document.getElementById('noticeTitle').value.trim();
    const date = document.getElementById('noticeDate').value;
    const badge = document.getElementById('noticeBadge').value;

    if (!title) {
        showFormError('공지 제목을 입력해 주세요.');
        document.getElementById('noticeTitle').focus();
        return;
    }
    if (!date) {
        showFormError('날짜를 선택해 주세요.');
        return;
    }
    if (!selectedFileContent) {
        showFormError('공지 내용 HTML 파일을 업로드해 주세요.');
        return;
    }

    const notice = {
        id: String(Date.now()),
        title,
        date,
        badge,
        content: selectedFileContent,
    };

    addNotice(notice);
    resetForm();
    renderAdminNoticeList();
    showToast('공지가 성공적으로 등록되었습니다! ✅');
});

function resetForm() {
    document.getElementById('noticeTitle').value = '';
    initDateField();
    document.getElementById('noticeBadge').value = 'new';
    clearFileSelection();
    hideFormError();
}

// ===========================
// 관리자 공지 목록 렌더링
// ===========================

const BADGE_CONFIG = {
    new: { label: 'New', className: 'badge-new' },
    notice: { label: '공지', className: 'badge-normal' },
    important: { label: '중요', className: 'badge-important' },
};

function formatDate(dateStr) {
    return dateStr ? dateStr.replace(/-/g, '.') : '';
}

function renderAdminNoticeList() {
    const container = document.getElementById('adminNoticeList');
    if (!container) return;

    const notices = getNotices();
    if (notices.length === 0) {
        container.innerHTML = `
            <div class="admin-empty">
                <p>등록된 공지가 없습니다. 위에서 새 공지를 추가해 주세요.</p>
            </div>`;
        return;
    }

    container.innerHTML = notices.map(notice => {
        const badge = BADGE_CONFIG[notice.badge] || BADGE_CONFIG.notice;
        return `
            <div class="admin-notice-item">
                <div class="admin-notice-info">
                    <span class="badge ${badge.className}">${badge.label}</span>
                    <span class="admin-notice-title">${notice.title}</span>
                    <span class="admin-notice-date">${formatDate(notice.date)}</span>
                </div>
                <button class="btn-delete" data-id="${notice.id}" aria-label="공지 삭제">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                        <path d="M10 11v6"></path><path d="M14 11v6"></path>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                    </svg>
                </button>
            </div>
        `;
    }).join('');

    // 삭제 버튼 이벤트
    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('이 공지를 삭제하시겠습니까?')) {
                deleteNotice(btn.dataset.id);
            }
        });
    });
}

// ===========================
// UI 유틸리티
// ===========================

function showFormError(msg) {
    const el = document.getElementById('formError');
    el.textContent = msg;
    el.style.display = 'block';
}

function hideFormError() {
    document.getElementById('formError').style.display = 'none';
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.style.display = 'none', 400);
    }, 2500);
}
