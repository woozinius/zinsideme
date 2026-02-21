import os
import json

def update_posts():
    posts_dir = 'posts'
    output_file = 'posts.json'
    posts_list = []

    # posts 폴더가 없으면 생성
    if not os.path.exists(posts_dir):
        os.makedirs(posts_dir)

    # 폴더 내의 모든 .txt 파일 스캔
    if os.path.exists(posts_dir):
        files = [f for f in os.listdir(posts_dir) if f.endswith('.txt')]
        
        for file_name in files:
            # 파일명 규칙 확인: YYYY-MM-DD_제목.txt
            if '_' in file_name:
                try:
                    # 첫 번째 '_'를 기준으로 날짜와 제목 분리
                    date_part, title_part = file_name.replace('.txt', '').split('_', 1)
                    posts_list.append({
                        "date": date_part.strip(),
                        "title": title_part.strip(),
                        "filename": file_name
                    })
                except ValueError:
                    continue
    
    # 최신 날짜순으로 정렬
    posts_list.sort(key=lambda x: x['date'], reverse=True)

    # posts.json 파일 생성/갱신 (UTF-8 인코딩)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(posts_list, f, ensure_ascii=False, indent=4)
    
    print(f"Successfully updated {output_file} with {len(posts_list)} posts.")

if __name__ == "__main__":
    update_posts()