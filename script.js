/**
 * ZINSIDEME - Integrated Logic Script
 * (Smart Header, History API, FullCalendar, Data Fetching)
 */

// 1. 전역 설정 및 상태 관리
const USERNAME = 'woozinius';
const REPO = 'zinsideme';
let allPosts = [];
let calendar;
let lastScrollY = window.scrollY;

// 2. 초기화: 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', async () => {
    initCalendar();      // 캘린더 설정
    initSmartHeader();   // 스크롤 감지 헤더 설정
    await loadPosts();   // posts.json 데이터 로드
    
    // [History] 초기 접속 시 주소창 해시(#) 확인 및 히스토리 초기화
    const initialPage = window.location.hash.replace('#', '') || 'home';
    history.replaceState({ page: initialPage }, '', `#${initialPage}`);
    showPage(initialPage, false); // 초기 페이지 로드 (히스토리 추가 안 함)
});

// 3. 스마트 헤더 로직 (스크롤 방향 감지)
function initSmartHeader() {
    const header = document.getElementById('main-header');
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        // 아래로 스크롤 시 숨김, 위로 스크롤 시 나타남
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.classList.add('header-hide');
        } else {
            header.classList.remove('header-hide');
        }
        lastScrollY = currentScrollY;
    }, { passive: true });
}

// 4. FullCalendar 초기화 (아날로그 감성 디자인 반영)
function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'eng',
        // 헤더 툴바: 제목 중앙, 버튼 우측 배치
        headerToolbar: {
            left: '',
            center: 'title',
            right: 'today prev,next'
        },
        // 일요일 빨간색 처리는 CSS에서 담당함
        eventClick: (info) => {
            showPostDetail(info.event.extendedProps.fileData);
        }
    });
    calendar.render();
}

// 5. 데이터 로드: posts.json 및 포스트 가공
async function loadPosts() {
    try {
        // GitHub API 대신 posts.json을 사용하여 403 에러 방지
        const response = await fetch('posts.json');
        if (!response.ok) throw new Error('posts.json not found');
        const data = await response.json();

        allPosts = data.map(post => ({
            ...post,
            // 텍스트 파일의 실제 내용을 가져오기 위한 주소 생성
            url: `https://raw.githubusercontent.com/${USERNAME}/${REPO}/main/posts/${encodeURIComponent(post.filename)}`
        }));

        const events = allPosts.map(post => ({
            title: `· ${post.title}`, // 이미지 속 메모 느낌 재현
            start: post.date,
            extendedProps: { fileData: post }
        }));

        calendar.removeAllEvents();
        calendar.addEventSource(events);
        renderIndex(); // 인덱스 리스트 생성

    } catch (e) {
        console.error("데이터를 불러올 수 없습니다. posts.json 파일과 Actions 설정을 확인하세요.");
    }
}

// 6. 글 상세 보기 (AJAX)
async function showPostDetail(post) {
    try {
        const res = await fetch(post.url);
        if (!res.ok) throw new Error('Content load failed');
        const text = await res.text();

        document.getElementById('detail-title').innerText = post.title;
        document.getElementById('detail-content').innerText = text; //
        
        // 상세 페이지 뷰로 전환 및 히스토리 기록
        showPage('detail');
    } catch (e) {
        alert("글 내용을 불러오는 중 오류가 발생했습니다.");
    }
}

// 7. SPA 페이지 전환 및 History API 관리 (뒤로가기 버튼 활성화)
function showPage(page, isPushState = true) {
    const views = ['home-view', 'detail-view', 'intro-view', 'index-view'];
    
    // 모든 섹션 숨기기
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.style.display = 'none';
    });

    // 타겟 섹션 보이기
    const targetView = document.getElementById(page + '-view');
    if (targetView) {
        targetView.style.display = 'block';
    }

    // [핵심] 브라우저 히스토리에 기록 추가
    if (isPushState) {
        history.pushState({ page: page }, '', `#${page}`);
    }

    // 캘린더 크기 업데이트
    if (page === 'home' && calendar) {
        calendar.updateSize();
    }

    window.scrollTo(0, 0);
}

// 8. 브라우저 뒤로가기/앞으로가기 감지
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page) {
        // 뒤로가기 시 추가 기록 없이 화면만 전환
        showPage(event.state.page, false);
    } else {
        showPage('home', false);
    }
});

// 9. 인덱스 목록 렌더링
function renderIndex() {
    const listContainer = document.getElementById('index-list');
    if (!listContainer) return;

    listContainer.innerHTML = allPosts.map(post => `
        <a href="javascript:void(0)" class="index-item" onclick="showPostDetailByDate('${post.date}')">
            <span>${post.title}</span>
            <span style="color:#aaa; font-size: 0.8rem;">${post.date}</span>
        </a>
    `).join('');
}

function showPostDetailByDate(date) {
    const post = allPosts.find(p => p.date === date);
    if (post) showPostDetail(post);
}

// 10. 랜덤 포스트 보기
function showRandom() {
    if (allPosts.length > 0) {
        const randomIndex = Math.floor(Math.random() * allPosts.length);
        showPostDetail(allPosts[randomIndex]);
    }
}


/**
 * 추가/수정될 전역 변수 및 로직
 */
const POSTS_PER_PAGE = 1; // 한 페이지에 보여줄 글 개수
let currentIndexPage = 1;  // 현재 인덱스 페이지 번호

// 기존 renderIndex 함수를 페이지네이션 지원용으로 수정
function renderIndex(page = 1) {
    currentIndexPage = page;
    const listContainer = document.getElementById('index-list');
    const paginationContainer = document.getElementById('pagination-container');
    
    // 1. 현재 페이지에 해당하는 데이터 슬라이스
    const startIndex = (page - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    const paginatedPosts = allPosts.slice(startIndex, endIndex);

    // 2. 목록 렌더링
    listContainer.innerHTML = paginatedPosts.map(p => `
        <a href="javascript:void(0)" class="index-item" onclick="showPostDetailByDate('${p.date}')">
            <span>${p.title}</span><span style="color:#aaa;">${p.date}</span>
        </a>
    `).join('');

    // 3. 페이지네이션 바 생성
    renderPagination(page);
}

// 이미지 형태를 재현하는 페이지네이션 생성 함수
function renderPagination(currentPage) {
    const container = document.getElementById('pagination-container');
    const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    let html = '';

    // [First, Prev] 버튼 표시 (1페이지가 아닐 때만 - image_cbe9bf.png 형태)
    if (currentPage > 1) {
        html += `<span class="pg-item" onclick="renderIndex(1)">« First</span>`;
        html += `<span class="pg-item" onclick="renderIndex(${currentPage - 1})">‹ Prev</span>`;
    }

    // [숫자들] 로직 (이미지 참고)
    // 1페이지일 때: 1 2 3 ...
    // 마지막 페이지일 때: ... 64 65 66
    
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);

    // 마지막 페이지 근처일 때 시작 페이지 조정
    if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - 2);
    }

    // 앞에 생략 표시
    if (startPage > 1) {
        html += `<span class="pg-item" onclick="renderIndex(1)">1</span>`;
        if (startPage > 2) html += `<span class="pg-dots">...</span>`;
    }

    // 숫자 반복
    for (let i = startPage; i <= endPage; i++) {
        html += `<span class="pg-item ${i === currentPage ? 'pg-active' : ''}" onclick="renderIndex(${i})">${i}</span>`;
    }

    // 뒤에 생략 표시
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="pg-dots">...</span>`;
        html += `<span class="pg-item" onclick="renderIndex(${totalPages})">${totalPages}</span>`;
    }

    // [Next, Last] 버튼 표시 (마지막 페이지가 아닐 때만 - image_cbe99e.png 형태)
    if (currentPage < totalPages) {
        html += `<span class="pg-item" onclick="renderIndex(${currentPage + 1})">Next ›</span>`;
        html += `<span class="pg-item" onclick="renderIndex(${totalPages})">Last »</span>`;
    }

    container.innerHTML = html;
}