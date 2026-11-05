# Research Bento 🍱

도시락 한 상으로 보여 주는 연구 포트폴리오예요. GitHub Pages에 그대로 올리면 돼요.

## 파일 구성
- `index.html`, `style.css`: 페이지 틀
- `bento.js`: 도시락 그림 (SVG로 그려요)
- `main.js`: 내용 불러오기, 세부 페이지
- `content/data.json`: **모든 내용** (편집 페이지가 이 파일을 고쳐요)
- `content/images/`: 편집 페이지에서 올린 사진
- `admin.html`, `admin.js`, `admin.css`: 편집 페이지

## GitHub Pages에 올리기
1. GitHub에서 새 저장소를 만들어요. 주소를 `아이디.github.io`로 하면 `https://아이디.github.io`가 돼요.
2. 이 폴더를 그 저장소에 push해요.
3. 저장소 **Settings → Pages**에서 Branch를 `main` / `(root)`로 고르고 Save해요.
4. 1~2분 뒤 사이트가 열려요.

## 편집하기 (나만 수정 가능)
사이트 맨 아래 ✎ 표시, 또는 `/admin.html`로 들어가요.

**처음 한 번만**
1. [GitHub → Fine-grained tokens](https://github.com/settings/personal-access-tokens/new)에서 토큰을 만들어요.
   - Repository access: **Only select repositories** → 이 사이트 저장소
   - Permissions → Repository → **Contents: Read and write**
2. 편집 페이지에 GitHub 아이디, 저장소 이름, 토큰, 사용할 비밀번호를 넣어요.
3. 토큰은 비밀번호로 암호화되어 **이 브라우저에만** 저장돼요.

**다음부터**
- 비밀번호만 넣으면 열려요.
- 고친 뒤 **Save**(또는 ⌘/Ctrl+S)를 누르면 GitHub에 저장되고, 약 1분 뒤 사이트에 반영돼요.
- 논문과 프로젝트는 사진 업로드, 대표 사진 지정, 본문 작성을 할 수 있어요. 본문에서 `## 제목`, `**굵게**`, `- 목록`, `[링크](주소)`가 돼요.

**안전한 이유**
사이트는 누구나 볼 수 있지만, 저장하려면 이 저장소에 쓸 수 있는 GitHub 토큰이 필요해요. 그래서 편집 페이지를 열어도 다른 사람은 아무것도 바꿀 수 없어요. 다른 기기에서 편집하려면 그 기기에서 한 번 더 설정하면 돼요.

## 내 컴퓨터에서 미리 보기
```bash
python3 -m http.server 8000
```
그다음 http://localhost:8000 을 열어요. 편집 페이지의 "Edit locally" 모드로 고치면 `data.json`을 내려받을 수 있어요.
