# 디자인 규칙

흰 바탕에 검은 잉크와 무채색 회색만 쓰는 "실험 노트" 톤입니다. 읽는 글과 제목은 그로테스크 한 벌(Schibsted Grotesk), 기록에 해당하는 것(날짜, 학회, 섹션 라벨, 그림 번호, 코드)은 모노 한 벌(JetBrains Mono)로 씁니다.
링크는 글자와 같은 잉크색에 회색 실선 밑줄을 긋습니다. 홈 섹션은 잉크색 가는 선 아래 작은 모노 대문자 라벨로 시작합니다.
모든 페이지가 가운데 놓인 한 단(38rem)이고 글자는 왼쪽 정렬입니다. 날짜 칸, 상자, 그림자, 그라디언트, 아이콘은 쓰지 않습니다.
넓은 화면(1152px 이상)에서는 단 오른쪽 여백 한 칸을 곁주와 긴 그림의 캡션이 같이 씁니다.

- 스타일: `assets/site.css` 한 파일. 색은 모두 맨 위 `:root`의 변수입니다. 밝은 화면 한 가지만 있고(`color-scheme: light`), 방문자의 시스템이 어두운 모드여도 밝게 보입니다. 어두운 모드 규칙(`prefers-color-scheme: dark`)은 CSS에도 SVG 그림에도 넣지 않습니다.
- 글 템플릿: `blog/_template/index.html`. 아래 구성 요소가 자리 표시 글과 함께 들어 있습니다(검색 제외 `noindex`, 어디에서도 링크하지 않음).

## 글꼴

| 용도 | 글꼴 | 굵기 |
|---|---|---|
| 본문, 이름, 페이지·글 제목, 섹션 제목(글 안), 논문 제목 | Schibsted Grotesk (Google Fonts, 가변 굵기 400–800, 이탤릭 400–700) | 400 본문 · 550 내 이름(저자 줄) · 600 목록의 제목, 링크 글 제목, 그림 번호 · 650 글 `h3` · 700 이름, 페이지·글 제목, 글 `h2` |
| 기록: 날짜, 학회, 메타데이터 줄, 연락처, 내비게이션, 홈 섹션 라벨, 그림·표 번호, 표 머리, 꼬리말, 코드, 편집 줄, 로그 | JetBrains Mono (Google Fonts, 가변 굵기 400–600, 모든 페이지에서 불러옴), 합자 끔(`font-variant-ligatures: none`, `->`가 화살표로 바뀌지 않게) | 400 · 500 섹션 라벨, 표 머리 · 600 그림 번호 |

두 글꼴은 각 페이지 `<head>`의 Google Fonts `<link>` 한 줄로 같이 불러옵니다. CSS에서는 `--sans`, `--mono` 변수로만 씁니다(글 안 위젯 `joystick.css`도 이 변수를 씁니다).
글꼴을 못 받으면 `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial`로, 모노는 `ui-monospace, "SF Mono", Menlo, Consolas`로 넘어갑니다.
`<img>`로 넣은 SVG는 웹폰트를 못 쓰므로 SVG 안 글꼴은 시스템 글꼴(`system-ui` 등)로 보입니다.

### 글자 크기

| 자리 | 크기 | 줄 간격 | 굵기, 색 |
|---|---|---|---|
| 홈 본문 | 16px | 1.6 | 400 `--ink` |
| 홈 이름 (`h1`), 페이지 제목 | 40px (폰 34px) | 1.05 | 700, 자간 −0.02em, 낱말 간격 0.06em |
| 이름 아래 한 줄 | 18px | 1.4 | `--ink-2` |
| 연락처 | 14px 모노 | | 링크 |
| 내비게이션 | 13px 모노 | | `--ink-2`, 지금 페이지는 600 `--ink` + 주황 밑줄 |
| 홈 섹션 라벨 (`h2`) | 12px 모노, 대문자, 자간 0.08em | 1.5 | 500 `--ink`, 위에 잉크색 1px 선 |
| 하위 라벨 (`.sub`) | 12px 모노, 대문자 | | 500 `--muted` |
| 논문 제목 | 16px | 1.45 | 600 |
| 저자 | 15px | 1.5 | `--ink-2`, 내 이름만 550 `--ink` |
| 메타데이터 (날짜, 학회, 링크 줄) | 13px 모노 | 1.5 | `--muted` |
| 글 본문 | 18px (폰 17px) | 1.65 | 400 |
| 글 제목 | 42px (폰 32px) | 1.08 | 700, 자간 −0.026em |
| 부제 | 본문의 1.125배 (폰 1.0625배) | 1.45 | `--ink-2` |
| 저자·날짜 줄, 상태 줄 | 13px 모노 | 1.55 | `--muted` |
| 글 `h2` / `h3` | 본문의 1.3배 / 1.05배 | 1.25 / 1.35 | 700 / 650 |
| 그림·표 캡션 | 본문의 0.8125배 (여백 칸에 놓이면 0.75배) | 1.55 | `--ink-2`, 번호(`Figure 1.`)는 모노 대문자 600 `--ink` |
| 이전·다음 글의 방향 라벨 (`.dir`) | 12px 모노, 대문자 | | `--muted` |
| 코드 블록 | 본문의 0.78배 (약 14px) | 1.6 | JetBrains Mono |
| 인라인 코드 | 0.85em | | JetBrains Mono, `--code-bg` 바탕, 줄바꿈 없음 |
| 곁주 | 0.75em (폰에서 펼치면 0.8125em) | 1.5 | `--ink-2`, 번호는 모노 |
| 참고문헌 | 0.875em | 1.55 | `--ink-2` |

## 색

| 변수 | 값 | 쓰는 곳 |
|---|---|---|
| `--bg` | `#ffffff` | 페이지 바탕 |
| `--ink` | `#111111` | 본문, 제목, 링크 글자 (바탕 대비 18.9) |
| `--ink-2` | `#474747` | 저자, 요약문, 연구 계획 본문, 캡션, 참고문헌 (9.2) |
| `--muted` | `#696969` | 모노 메타데이터: 날짜, 학회, 라벨, 코드 주석 (5.5) |
| `--rule` | `#e2e2e2` | 가는 선: 표 줄, 글 안 `hr` |
| `--rule-2` | `#c4c4c4` | 회색 선: 인용 왼쪽 선, 열린 토글 |
| `--rule-ink` | `#111111` | 잉크색 선: 홈 섹션 위, 표 머리 아래, 참고문헌 위 |
| `--code-bg` | `#f3f3f3` | 코드 블록, 인라인 코드 |
| `--link` | `#111111` | 링크 글자(본문과 같은 잉크), 곁주 번호 |
| `--link-line` | `#8a8a8a` | 링크 밑줄 1px 실선 (마우스를 올리면 `--signal` 2px) |
| `--signal` | `#d06d00` | 마우스를 올린 링크의 밑줄, 지금 페이지·선택된 탭·열린 초록 같은 "지금 상태" 표시. 글자색으로는 쓰지 않음 (바탕 대비 3.6, 글자 아닌 표시에 필요한 3 이상) |
| `--tint` | `rgba(208,109,0,.13)` | 참고문헌 링크로 이동했을 때 그 줄 |
| `--select` | `rgba(17,17,17,.12)` | 글자 선택 |
| `--plate` | `#ffffff` | 논문 그림 뒤, `figure.plate` 그림 뒤 (흰 판) |

글자에는 강조색이 없습니다. 링크도 본문과 같은 잉크색이고 회색 밑줄로만 구별합니다. 주황 `#d06d00`(`--signal`)은 마우스를 올렸을 때와 지금 상태 표시에만 쓰고, 지금 페이지는 색만이 아니라 굵기(600)로도 드러냅니다.
페이지에서 진짜 색이 나오는 곳은 연구 시각 자료(로봇 3D 장면의 초록·주황, 그래프)뿐입니다. 색으로 뜻을 나타내야 하면(그래프 선 등) 그림 안에서 해결하고, 그림의 회색도 위 무채색 값에 맞춥니다.

## 간격

- 단 너비 `--measure: 38rem` (608px). 글 본문 한 줄은 약 70자. 넓은 그림 `--wide: 52rem`.
- 오른쪽 여백 칸: 너비 `--note: 13rem`, 단과의 간격 `--note-gap: 2.5rem`. 곁주와 `figure.side`의 캡션이 이 칸을 같이 씁니다.
- 페이지 가장자리 `--gutter`: 폰 1rem, 40rem(640px) 이상 1.5rem.
- 홈 섹션: 위 여백 3.5rem(폰 2.75rem) → 잉크색 1px 선 → 0.55rem → 모노 대문자 라벨(12px) → 1.5rem → 내용.
- 글 안의 세로 간격은 본문 크기 기준(em): 문단 아래 1.1em, `h2` 위 2.4em·아래 0.6em, 그림 위아래 2.25em, 인용 1.75em, 코드 1.5em, 참고문헌 묶음 위 3.5em.
- 반응 구간: 40rem(640px)에서 여백·날짜 배치, 48rem(768px)에서 글 글자 크기, 72rem(1152px)에서 곁주와 긴 그림의 캡션이 오른쪽 여백으로 나갑니다.

## 홈 (렌더러가 만드는 마크업)

홈과 블로그 목록의 내용은 `content/data.json`에서 나옵니다. `tools/build_home.py`와 `assets/site.js`가 **똑같은** 마크업을 만들어야 하므로 하나를 고치면 다른 하나도 고칩니다(`<html data-swapped="0">`이면 같음).

- 맨 위 오른쪽에 작은 내비게이션(Publications, Blog, CV). 그 아래 이름(`h1`), 한 줄(`p.dek`), 소개(`p.bio`), 연락처(`ul.contact`, 한 줄로).
- 섹션 순서: Education, Research plan, News, Publications, Blog, Experience, Awards and scholarships. 섹션마다 `section.sec` 위에 잉크색 가는 선과 모노 대문자 라벨.
- 날짜 칸은 없습니다.
  - 한 줄짜리 항목(뉴스, 수상, 글): 항목 뒤에 `<span class="meta">Nov 2026</span>`. 폰에서는 항목 아래로 내려갑니다.
  - 학력·경력: 제목 줄 `p.entry-title`(`span.t` 600 + `span.w`), 그 아래 회색 `p.meta`(기간, 세부가 한 줄이면 ` · `로 이어 붙임), 세부가 두 줄 이상이면 `ul.d`.
  - 논문: `h3.pub-title` → `p.pub-authors`(내 이름 `span.me`) → `p.pub-meta`(학회·연도·상태, PDF/arXiv/DOI 링크, `Abstract` 열기).
  - 연구 계획: data.json의 `research` 목록(`title`, `text`). 방향마다 `h3.plan-title`(16px 600) 아래 `p.plan-text`(15px `--ink-2`). `text`에 빈 줄을 넣으면 문단이 나뉩니다. 편집 페이지에는 이 탭이 없으니 data.json에서 고치고 `tools/build_home.py`를 돌립니다.
- 날짜 표기: data.json의 `2026.11`·`2026-11`은 `Nov 2026`, `2026-11-10`은 `Nov 10, 2026`으로 보여 줍니다. 그 밖의 형식(`Sep 2026 – Present`, `2024–25`)은 쓴 그대로입니다. 바꾸려면 두 렌더러의 `when()`을 같이 고칩니다.
- 초록은 스크립트 없이 열립니다(숨긴 체크박스 + `label.more`). 열면 그림(흰 판)과 초록이 나옵니다.

## 글 쓰는 방식

참고한 블로그의 분위기(깔끔함, 구체적인 숫자와 원문, 읽기 쉬움)는 가져오되 형식은 가져오지 않습니다.

- **첫 문단은 요약 목록이 아니라 실물로 시작합니다.** 첫 사건, 첫 편집 줄, 로봇이 실제로 한 일. TL;DR 상자, `Summary` 목록, 굵은 글씨 요약은 쓰지 않습니다.
- **제목은 질문이 아니라 짧은 서술**입니다. 진화 런처럼 시간축이 있는 글은 그 축을 제목의 뼈대로 씁니다(예: `Generation 27: upward speed from twelve tanh units`). `Experiment N` 같은 번호 머리는 쓰지 않습니다.
- 실험 설정은 표·상자(Setup)로 따로 빼지 않고, 그 내용이 처음 필요한 문단에 씁니다.
- 끝은 열린 질문 목록이 아니라 한 문단(`Still open` 등)으로 맺습니다. BibTeX 상자와 Copy 버튼은 없습니다. 참고문헌만 둡니다.
- 모델의 말은 고치지 않고 인용하고, 출처를 `footer`에 적습니다.

## 글 본문 마크업 규칙

새 글은 `blog/_template/`을 `blog/<slug>/`로 복사해서 시작합니다.

1. 모든 블록은 `<article class="post">`의 **바로 아래 자식**입니다: `header.post-head`, `p`, `h2`, `h3`, `ul`, `ol`, `figure`, `blockquote`, `pre`, `div.table-wrap`, `hr`, `section.post-end`. 여분의 `div`로 감싸지 않습니다(감싸면 단 너비 규칙이 안 걸림).
2. 아래에 적힌 클래스만 씁니다. `style=""`, 다른 클래스, 이모지, 색 상자, 아이콘은 넣지 않습니다.
3. 본문에 `h1`은 없습니다(제목은 `post-title` 하나). 섹션은 `h2`, 필요하면 `h3`.
4. `h2`와 그림, 참고문헌 항목에는 `id`를 붙입니다(짧은 영어 소문자, 하이픈).
5. 이미지에는 항상 `alt`, `width`, `height`를 넣습니다.
6. 숫자와 단위 사이는 `&nbsp;`(`0.797&nbsp;m/s`), `0.006 ± 0.005`도 `&nbsp;±&nbsp;`로 묶어 줄이 갈리지 않게 합니다. 쪽 범위 같은 숫자 범위는 `<span class="nowrap">1223–1247</span>`.

### 머리

```html
<header class="post-head">
  <h1 class="post-title">Weight-Space Programming for Robot Control</h1>
  <p class="post-subtitle">One sentence that says what happened, in plain words.</p>
  <p class="post-meta">Geonwoo Bang · <time datetime="2026-11-10">November 10, 2026</time></p>
  <p class="post-status">Optional. This run is still going. Numbers are as of generation 52 of 100.</p>
</header>
```

### 문단, 인라인 코드, 인용 링크, 곁주

```html
<p>Every change is a line such as <code>W1[52,0] = 0.7</code>.
<a class="cite-ref" href="#ref-takehi2026">Takehi et al. (2026)</a> call this Weight-Space Programming.</p>
```

- 인라인 코드는 줄 중간에서 갈리지 않습니다(`white-space: nowrap`). 그러니 **36자 이하**로 쓰고, 더 길면 `<pre>`로 뺍니다(폰 화면 폭을 넘으면 가로 스크롤이 생김).
- 곁주는 붙일 단어나 문장부호 **바로 뒤**(앞에 공백 없이)에 넣습니다. 한두 문장, 50단어 안쪽. 번호는 저절로 매겨집니다.

```html
…command times the clock.<span class="sn"><input class="sn-toggle" type="checkbox" id="sn-bias"><label class="sn-ref" for="sn-bias"></label><span class="sn-note">tanh(0.6585) = 1/√3.</span></span> So the stride…
```

### 그림

```html
<figure id="fig-curve">
  <img src="fig_curve.svg" alt="What the figure shows, in words." width="480" height="372">
  <figcaption><span class="fig-label">Figure 4.</span> What to look at, and how it was measured.</figcaption>
</figure>
```

- 이미지는 단 가운데에 원래 크기로 놓이고 단보다 크면 줄어듭니다. 캡션은 단 왼쪽에 맞춥니다.
- `figure.side`: 세로로 긴 그림. 1152px 이상에서는 캡션이 오른쪽 여백 칸(곁주와 같은 칸)으로 가서 그림 꼭대기에 맞춰 놓입니다. 그보다 좁으면 그림 아래에 쌓입니다.
- `figure.wide`: 단보다 넓게(최대 52rem). 가로로 긴 그림에만.
- `figure.plate`: 투명 바탕에 검은 선인 그림 뒤에 흰 판을 깝니다. SVG 안에는 `prefers-color-scheme` 규칙을 넣지 않습니다. 넣으면 시스템이 어두운 모드인 방문자에게 흰 바탕 위 밝은 글씨로 보입니다.
- 큰 원본으로 연결: `<a href="full.png"><img src="strip.png" …></a>`. 이미지 여러 장은 한 `figure` 안에 차례로 넣으면 위아래로 쌓입니다.

### 코드와 편집 줄

```html
<figure id="fig-edits">
<pre><code><span class="c"># forward command (input 45) into units 1 to 4</span>
W1[45,1:5] = [0.45,<wbr>-0.45,<wbr>0.45,<wbr>-0.45]</code></pre>
  <figcaption><span class="fig-label">Figure 3.</span> Six of the 45 lines of Astra’s first trot. The comments are ours.</figcaption>
</figure>
```

- `<pre><code>` 안의 줄 바꿈과 공백은 그대로 나옵니다. `<`, `>`, `&`는 `&lt;`, `&gt;`, `&amp;`로 씁니다. 소스에서 들여쓰지 않습니다.
- 주석은 자기 줄에 `<span class="c">`(`--muted` 회색). 데스크톱에서 한 줄에 들어가게 60자 안쪽으로.
- 긴 숫자 목록은 쉼표 뒤에 `<wbr>`을 넣으면 숫자 가운데가 아니라 쉼표에서 접힙니다(복사한 글자에는 아무것도 더해지지 않음).
- 폰에서는 코드 상자가 화면 양끝까지 넓어집니다.

### 인용 (모델의 말)

```html
<blockquote>
  <p>Independently passing changes are NOT safely composable.</p>
  <footer>Astra’s notebook, end of generation 42</footer>
</blockquote>
```

### 표

```html
<div class="table-wrap">
  <table>
    <thead><tr><th>Trial</th><th class="num">Error (m/s)</th></tr></thead>
    <tbody><tr><td>Parent EQ36</td><td class="num">0.244</td></tr></tbody>
    <caption><span class="fig-label">Table 1.</span> What the numbers are and where they come from.</caption>
  </table>
</div>
```

숫자 칸은 `th`와 `td` 모두 `class="num"`. 음수는 진짜 빼기 기호 `−`(U+2212).

### 글 끝: 참고문헌

```html
<section class="post-end">
  <h2 id="references">References</h2>
  <ul class="refs">
    <li id="ref-takehi2026">Rikiya Takehi, Jayden Teoh, Alex Zhang and Omar Khattab. 2026. <a href="https://rikiyat.github.io/blog/weight-space-programming/">Sparks of Weight-Space Programming</a>. Blog post.</li>
  </ul>
</section>
```

첫 저자 성의 알파벳 순, `li id="ref-<성><연도>"`. 본문의 `cite-ref`가 이 `id`를 가리킵니다.

### 작업 중 표시

아직 덜 쓴 블록에 `class="todo"`를 붙이면 점선 테두리로 보입니다. 다 쓰면 지웁니다.
