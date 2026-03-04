document.addEventListener('DOMContentLoaded', () => {
    // 모든 카드 요소를 선택
    const noticeCards = document.querySelectorAll('.notice-card');

    noticeCards.forEach(card => {
        // 카드의 헤더(클릭 가능한 영역) 선택
        const header = card.querySelector('.notice-header');

        if (header) {
            header.addEventListener('click', () => {
                // 클릭 시 현재 카드의 expanded 클래스 토글 (열기/닫기)
                const isExpanded = card.classList.contains('expanded');
                
                // (선택 사항) 다른 아코디언을 모두 닫고 싶다면 주석을 해제하세요
                // noticeCards.forEach(c => c.classList.remove('expanded'));

                // 방금 클릭한 카드의 상태 변경
                if (!isExpanded) {
                    card.classList.add('expanded');
                } else {
                    card.classList.remove('expanded');
                }
            });
        }
    });
});
