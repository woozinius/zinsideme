// --- 설정 변수 ---
const USERNAME = 'woozinius';
const REPO = 'zinsideme';
const FOLDER_PATH = 'posts';

// --- GitHub API를 통해 파일 목록 가져오기 ---
async function loadPostsFromGithub() {
    const apiUrl = `https://api.github.com/repos/${USERNAME}/${REPO}/contents/${FOLDER_PATH}`;
    
    try {
        const response = await fetch(apiUrl);
        const files = await response.json();
        
        // .txt 파일만 필터링하고 데이터 파싱
        const postData = files
            .filter(file => file.name.endsWith('.txt'))
            .map(file => {
                // 파일명에서 날짜와 제목 추출 (2026-01-05_제목.txt)
                const fileName = file.name.replace('.txt', '');
                const parts = fileName.split('_');
                return {
                    date: parts[0],
                    title: parts[1] || '제목 없음',
                    path: file.path,
                    download_url: file.download_url
                };
            });
            
        return postData;
    } catch (error) {
        console.error("파일 목록을 가져오는 중 오류 발생:", error);
        return [];
    }
}

// --- 특정 파일의 텍스트 내용 읽어오기 ---
async function fetchFileContent(url) {
    const response = await fetch(url);
    const text = await response.text();
    return text;
}