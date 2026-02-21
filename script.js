const USERNAME = 'woozinius';
const REPO = 'zinsideme';
let allPosts = [];
let calendar;

// --- 1. 스마트 헤더 로직 ---
let lastScrollTop = 0;
const header = document.getElementById('main-header');

window.addEventListener('scroll', () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // 아래로 스크롤 중 -> 헤더 숨김
        header.classList.add('header-hide');
    } else {
        // 위로 스크롤 중 -> 헤더 표시
        header.classList.remove('header-hide');
    }
    lastScrollTop = scrollTop;
});

// --- 2. 초기화 및 캘린더 설정 ---
document.addEventListener('DOMContentLoaded', async () => {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ko',
        headerToolbar: {
            left: '',
            center: 'title',
            right: 'today prev,next'
        },
        eventClick: (info) => showPostDetail(info.event.extendedProps.fileData)
    });
    calendar.render();
    await loadPosts();
});

// --- 3. 데이터 로드 ---
async function loadPosts() {
    try {
        const response = await fetch('posts.json');
        const data = await response.json();

        allPosts = data.map(post => ({
            ...post,
            url: `https://raw.githubusercontent.com/${USERNAME}/${REPO}/main/posts/${encodeURIComponent(post.filename)}`
        }));

        const events = allPosts.map(post => ({
            title: post.title,
            start: post.date,
            extendedProps: { fileData: post }
        }));

        calendar.addEventSource(events);
        renderIndex();
    } catch (e) {
        console.error("데이터를 불러올 수 없습니다.", e);
    }
}

// --- 4. 상세 보기 ---
async function showPostDetail(post) {
    const res = await fetch(post.url);
    const text = await res.text();
    document.getElementById('detail-title').innerText = post.title;
    document.getElementById('detail-content').innerText = text;
    showPage('detail');
}

// --- 5. 페이지 전환 ---
function showPage(page) {
    const views = ['home-view', 'detail-view', 'intro-view', 'index-view'];
    views.forEach(v => document.getElementById(v).style.display = 'none');
    document.getElementById(page + '-view').style.display = 'block';
    if(page === 'home') calendar.updateSize();
    window.scrollTo(0, 0);
}

// --- 6. 인덱스 및 랜덤 기능 ---
function renderIndex() {
    const list = document.getElementById('index-list');
    list.innerHTML = allPosts.map(post => `
        <a href="javascript:void(0)" class="index-item" onclick="showPostDetailByDate('${post.date}')">
            <span>${post.title}</span>
            <span style="color:#ccc;">${post.date}</span>
        </a>
    `).join('');
}

function showPostDetailByDate(date) {
    const post = allPosts.find(p => p.date === date);
    if (post) showPostDetail(post);
}

function showRandom() {
    if (allPosts.length > 0) showPostDetail(allPosts[Math.floor(Math.random() * allPosts.length)]);
}