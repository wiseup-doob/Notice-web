/**
 * admin.js - 와이즈업 학원 관리자 페이지 (Firebase Firestore)
 */

const DEFAULT_PIN = '0000';

// --- PIN 인증 ---
function initPinAuth() {
    const pinScreen = document.getElementById('pinScreen');
    const adminMain = document.getElementById('adminMain');
    const pinInput = document.getElementById('pinInput');
    const pinSubmit = document.getElementById('pinSubmit');
    const pinError = document.getElementById('pinError');

    function attemptLogin() {
        const pin = pinInput.value.trim();
        if (pin === DEFAULT_PIN) {
            pinScreen.style.display = 'none';
            adminMain.style.display = 'block';
            loadNoticeList();
        } else {
            pinError.style.display = 'block';
            pinInput.value = '';
            pinInput.focus();
        }
    }

    pinSubmit.addEventListener('click', attemptLogin);
    pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') attemptLogin();
    });
}

// --- 파일 업로드 ---
let uploadedHtmlContent = '';
let uploadedFileType = 'html'; // 'html' or 'pdf'

function initFileUpload() {
    const fileInput = document.getElementById('htmlFileInput');
    const uploadArea = document.getElementById('fileUploadArea');
    const uploadContent = document.getElementById('fileUploadContent');
    const preview = document.getElementById('filePreview');
    const previewName = document.getElementById('filePreviewName');
    const clearBtn = document.getElementById('fileClearBtn');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFile(fileInput.files[0]);
        }
    });

    clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearFile();
    });

    function handleFile(file) {
        const isHtml = file.name.match(/\.(html|htm)$/i);
        const isPdf = file.name.match(/\.pdf$/i);
        if (!isHtml && !isPdf) {
            showError('HTML 또는 PDF 파일만 업로드 가능합니다.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedHtmlContent = e.target.result;
            uploadedFileType = isPdf ? 'pdf' : 'html';
            uploadContent.style.display = 'none';
            preview.style.display = 'flex';
            previewName.textContent = file.name;
        };
        if (isPdf) {
            reader.readAsDataURL(file); // PDF: base64
        } else {
            reader.readAsText(file); // HTML: 텍스트
        }
    }

    function clearFile() {
        uploadedHtmlContent = '';
        uploadedFileType = 'html';
        fileInput.value = '';
        uploadContent.style.display = 'flex';
        preview.style.display = 'none';
    }
}

// --- 공지 등록 (Firestore에 저장) ---
function initNoticeForm() {
    const submitBtn = document.getElementById('submitNotice');

    submitBtn.addEventListener('click', async () => {
        const title = document.getElementById('noticeTitle').value.trim();
        const date = document.getElementById('noticeDate').value;
        const badge = document.getElementById('noticeBadge').value;
        const youtubeUrl = (document.getElementById('youtubeUrl')?.value || '').trim();

        // 검증
        if (!title) { showError('공지 제목을 입력해 주세요.'); return; }
        if (!date) { showError('날짜를 선택해 주세요.'); return; }
        if (!uploadedHtmlContent) { showError('HTML 또는 PDF 파일을 업로드해 주세요.'); return; }

        hideError();
        submitBtn.disabled = true;
        submitBtn.textContent = '등록 중...';

        try {
            // Firestore에 공지 추가
            await db.collection('notices').add({
                title: title,
                date: date,
                badge: badge,
                content: uploadedHtmlContent,
                fileType: uploadedFileType,
                youtubeUrl: youtubeUrl,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 폼 초기화
            document.getElementById('noticeTitle').value = '';
            document.getElementById('noticeDate').value = '';
            document.getElementById('noticeBadge').value = 'new';
            if (document.getElementById('youtubeUrl')) document.getElementById('youtubeUrl').value = '';
            uploadedHtmlContent = '';
            document.getElementById('htmlFileInput').value = '';
            document.getElementById('fileUploadContent').style.display = 'flex';
            document.getElementById('filePreview').style.display = 'none';

            showToast('공지가 성공적으로 등록되었습니다!');
            loadNoticeList(); // 목록 새로고침
        } catch (e) {
            console.error('공지 등록 실패:', e);
            showError('공지 등록에 실패했습니다. 다시 시도해 주세요.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '공지 등록하기';
        }
    });
}

// --- 공지 목록 로드 (Firestore에서 읽기) ---
async function loadNoticeList() {
    const listContainer = document.getElementById('adminNoticeList');
    if (!listContainer) return;

    listContainer.innerHTML = '<p class="admin-empty">로딩 중...</p>';

    try {
        const snapshot = await db.collection('notices')
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            listContainer.innerHTML = '<p class="admin-empty">등록된 공지가 없습니다.</p>';
            return;
        }

        listContainer.innerHTML = snapshot.docs.map(doc => {
            const notice = doc.data();
            return `
                <div class="admin-notice-item">
                    <div class="admin-notice-info">
                        <span class="admin-notice-title">${notice.title}</span>
                        <span class="admin-notice-date">${notice.date ? notice.date.replace(/-/g, '.') : ''}</span>
                    </div>
                    <button class="btn-delete" data-id="${doc.id}" aria-label="삭제">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');

        // 삭제 버튼 이벤트 바인딩
        listContainer.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                if (confirm('정말 이 공지를 삭제하시겠습니까?')) {
                    try {
                        await db.collection('notices').doc(id).delete();
                        showToast('공지가 삭제되었습니다.');
                        loadNoticeList();
                    } catch (e) {
                        console.error('삭제 실패:', e);
                        showError('삭제에 실패했습니다. 다시 시도해 주세요.');
                    }
                }
            });
        });

    } catch (e) {
        console.error('목록 로드 실패:', e);
        listContainer.innerHTML = '<p class="admin-empty">목록을 불러오는 데 실패했습니다.</p>';
    }
}

// --- 헬퍼 함수: 오류 표시 ---
function showError(msg) {
    const el = document.getElementById('formError');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function hideError() {
    const el = document.getElementById('formError');
    if (el) { el.style.display = 'none'; }
}

// --- 헬퍼 함수: 토스트 알림 ---
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    requestAnimationFrame(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => { toast.style.display = 'none'; }, 300);
        }, 2500);
    });
}

// --- 초기화 ---
document.addEventListener('DOMContentLoaded', () => {
    initPinAuth();
    initFileUpload();
    initNoticeForm();

    // 오늘 날짜 자동 설정
    const dateInput = document.getElementById('noticeDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
});
