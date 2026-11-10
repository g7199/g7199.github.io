# g7199.github.io

방건우(Geonwoo Bang)의 개인 사이트입니다. 홈(소개, 학력, 연구 계획, 소식, 논문, 블로그 목록, 경력, 수상)과 블로그로 되어 있습니다.
빌드 단계 없이 정적 파일 그대로 GitHub Pages에 올라갑니다. 외부 자바스크립트는 쓰지 않고, 글꼴만 Google Fonts에서 받습니다.

## 파일

| 경로 | 내용 |
|---|---|
| `index.html` | 홈 |
| `blog/index.html` | 블로그 글 목록 |
| `blog/<slug>/index.html` | 글 한 편. 그림 파일도 같은 폴더에 둡니다 |
| `blog/_template/` | 새 글을 시작하는 템플릿 (검색 제외, 어디에서도 링크하지 않음) |
| `assets/site.css` | 모든 페이지의 스타일. 색은 맨 위 `:root` 변수. 밝은 화면만 있습니다(시스템이 어두운 모드여도 밝게) |
| `assets/site.js` | data.json으로 홈과 블로그 목록의 내용 블록을 다시 그리는 코드 |
| `content/data.json` | 홈과 블로그 목록에 나오는 모든 내용 (편집 페이지가 이 파일을 고칩니다) |
| `content/cv.pdf`, `content/images/` | CV와 논문 그림 |
| `tools/build_home.py` | data.json으로 `index.html`, `blog/index.html`의 내용 블록을 다시 쓰는 스크립트 (파이썬 표준 라이브러리만) |
| `admin.html`, `admin.js`, `admin.css` | 편집 페이지 |
| `DESIGN.md` | 글꼴, 색, 간격, 글 마크업 규칙 |

## 내 컴퓨터에서 미리 보기

```bash
python3 -m http.server 8000
```

그다음 http://localhost:8000 을 엽니다. 파일을 더블클릭해서 열어도 내용은 다 보이지만, data.json을 다시 읽는 부분과 편집 페이지는 서버가 있어야 동작합니다.

## 홈 내용이 채워지는 방식

`index.html`과 `blog/index.html`의 내용 블록은 `<!-- render:이름 -->`과 `<!-- /render:이름 -->` 사이에 있고, 두 군데서 같은 마크업을 만듭니다.

1. `tools/build_home.py`가 data.json을 읽어 블록을 HTML 안에 직접 씁니다. 그래서 자바스크립트가 꺼져 있어도, 검색 엔진에서도 내용이 보입니다.
2. `assets/site.js`가 브라우저에서 data.json을 다시 읽어 같은 블록을 만들고, 다를 때만 바꿉니다. 그래서 편집 페이지에서 저장한 내용이 빌드 없이 사이트에 나옵니다.

두 렌더러는 같은 마크업을 내야 합니다. 하나를 고치면 다른 하나도 고칩니다. 페이지를 열었을 때 `<html data-swapped="0">`이면 둘이 같다는 뜻입니다.
data.json을 손으로 고쳤거나 커밋하기 전에는 이렇게 돌립니다.

```bash
python3 tools/build_home.py          # 블록 다시 쓰기
python3 tools/build_home.py --check  # 확인만 (오래됐으면 종료 코드 1)
```

## 블로그 글 추가

1. `blog/_template/`을 `blog/<slug>/`로 복사합니다. `<head>`의 제목·설명·날짜·`citation_*`를 고치고 `noindex` 줄을 지웁니다.
2. 본문을 `<article class="post">` 바로 아래에 씁니다. 쓸 수 있는 구성 요소(그림, `figure.side`, 코드, 인용, 곁주, 표, 참고문헌)와 규칙은 `DESIGN.md`에 있습니다.
   첫 문단은 요약 목록 대신 실제로 일어난 일로 시작하고, 제목은 질문 대신 짧은 서술로 씁니다.
3. 그림 파일은 글 폴더에 둡니다. 쓰지 않는 파일은 지웁니다.
4. `content/data.json`의 `posts`에 `title`, `date`(`YYYY-MM-DD`), `url`(`blog/<slug>/`), `summary`를 넣습니다. 편집 페이지의 Blog 탭에서 해도 됩니다.
5. `python3 tools/build_home.py`를 돌립니다.
6. 글이 둘 이상이면 각 글 아래 `post-nav`에 이전/다음 글 링크를 넣습니다.

## 편집 페이지 (`/admin.html`)

지금도 그대로 동작합니다. 편집 페이지는 `content/data.json`만 읽고 고쳐서 GitHub에 커밋하고, 홈과 블로그 목록은 그 파일을 읽으므로 디자인을 바꿔도 영향이 없습니다(글 본문은 편집 페이지로 고치지 않습니다).

1. [GitHub → Fine-grained tokens](https://github.com/settings/personal-access-tokens/new)에서 이 저장소만, **Contents: Read and write** 권한으로 토큰을 만듭니다.
2. 편집 페이지에 GitHub 아이디, 저장소, 브랜치, 토큰, 비밀번호를 넣습니다. 토큰은 그 비밀번호로 암호화되어 그 브라우저에만 저장됩니다.
3. 다음부터는 비밀번호만 넣고, 고친 뒤 **Save**(⌘/Ctrl+S)를 누릅니다. 서버 없이 열면 저장 대신 data.json을 내려받습니다.

탭은 Profile, News, Papers, Blog, Education, Experience, Awards, Contact입니다. data.json에서 사이트가 쓰지 않는 값(`projects`, `skills`, 논문의 `selected`, `bibtex` 등)은 지우지 않고 남겨 둡니다.
홈의 연구 계획(`research`)은 탭이 없습니다. data.json에서 직접 고치고 `python3 tools/build_home.py`를 돌립니다. 편집 페이지에서 저장해도 이 값은 그대로 남습니다.

## GitHub Pages

저장소 **Settings → Pages**에서 Branch를 `main` / `(root)`로 둡니다. `.nojekyll` 파일은 지우지 않습니다.
