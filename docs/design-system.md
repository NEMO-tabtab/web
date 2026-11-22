# 디자인 시스템

원칙 번호는 [principles.md](principles.md)를 봅니다. 이 문서는 **규칙**만 담습니다. 값과 부품의 실제 모습은 아래 두 곳이 원본이고, 여기에 다시 적지 않습니다.

- 토큰 값: `tailwind.config.ts` (주석에 쓰임이 적혀 있음)
- 부품과 사용 예: 앱 안의 `/design-system` 화면 (`src/app/design-system/`)

## 시각 언어 한 줄

손그림 흑백 라인아트. 흰 바탕에 먹선, 포인트는 볼터치 색 하나. 강조는 색이 아니라 채움과 선으로 만든다.

## 지금 있는 토큰

| 종류 | 이름 | 비고 |
|---|---|---|
| 색 7개 | `paper`, `cream`, `ink`, `ink-soft`, `line`, `cheek`, `danger` | `cheek`는 정서적 강조에만, `danger`는 삭제·오류에만 |
| 글꼴 2개 | `font-display`(Gaegu, 제목 1~3단계), `font-sans`(Noto Sans KR) | 숫자는 늘 `font-sans` |
| 모서리 2개 | `rounded-nemo`, `rounded-full` | 쓰인 곳 28 : 32, 그 밖의 값은 1곳 |
| 포커스 링 | `outline-3` (3px) | |
| 손그림 장치 | `.sticker`, `.field`, `.scribble`, `.wavy-edge`, `.paste-grid` | `src/app/globals.css` |
| 아이콘 | `Icon` (`@/components/common`), 카테고리는 `categoryIcon()` | 먹선 2px·손그림 필터. 목록은 `/design-system/icons` |

## 규칙

**U1. 색·모서리·글꼴은 토큰만 쓴다**
- 규칙: 화면 코드에 색 코드(`#…`), Tailwind 기본 색(`gray-200` 등), `rounded-[…]`를 쓰지 않는다. 캐릭터 SVG(`src/components/NemoFace.tsx`, `NemoLogo.tsx`)는 예외다.
- 이유: P5.
- 강도: 권장 / 확인: 리뷰
- 예시: 남은 예외는 `border-gray-200` 1곳과 `src/components/analysis/Charts.tsx`의 색 상수(토큰 값의 사본)다.

**U2. 색 값을 고칠 때는 두 곳을 함께 고친다**
- 규칙: `tailwind.config.ts`의 `colors`와 `src/app/globals.css`의 `:root`를 같은 PR에서 같은 값으로 고친다.
- 이유: P5. 한쪽만 고치면 유틸리티와 손그림 장치의 색이 조용히 갈린다(두 파일의 주석 참고).
- 강도: 권장 / 확인: 리뷰

**U3. 글자 크기는 정해진 단계만 쓴다**
- 규칙: Tailwind 기본 단계(`text-xs` ~ `text-3xl`)와 지금 널리 쓰이는 `text-[11px]`, `text-[13px]`만 쓴다. `text-[12px]`은 `text-xs`로 쓰고, 그 밖의 임의 크기는 새로 넣지 않는다.
- 이유: P5.
- 강도: 권장 / 확인: 리뷰
- 전제: `text-[11px]`(29곳)과 `text-[13px]`(22곳)은 사실상 토큰인데 이름이 없다. 토큰으로 올리면(후속 이슈) 이 규칙을 "토큰만"으로 줄인다.
- 예시: 정리할 값 — `text-[12px]` 7곳, `[11.5px]` 3곳, `[10.5px]`·`[13.5px]`·`[10px]`·`[17px]` 각 1곳.

**U4. 공통 부품을 먼저 쓴다**
- 규칙: 버튼·입력·카드·모달·탭은 `@/components/common`의 부품을 쓰고, 맞는 부품이 없으면 화면에 따로 만들기 전에 공통 부품에 변형을 더한다. 아이콘은 `Icon`을 쓴다 — 새 코드에서 컬러 이모지와 아이콘 폰트(`xi-*`)를 쓰지 않고, 없는 아이콘은 `Icon`에 같은 결로 더한다(#175). `Modal`, `Tabs`, `BottomNavigation`은 `@/components/common/Modal`처럼 직접 경로로 가져온다.
- 이유: P5. 직접 경로의 까닭은 `src/components/common/index.ts`의 주석에 있다.
- 강도: 권장 / 확인: 리뷰
- 예시: 화면 코드의 날 `<button>`·`<input>`은 2개 파일에만 남아 있다(`ProductForm.tsx`, `src/app/(user)/user-info/myPage.tsx`). 예전 필터 `Filter.tsx`는 #85에서 지웠다. 검색 칸의 지우기 버튼은 화면에 따로 만들지 않고 `Input`에 `trailing` 자리를 더해 넣었다(#85).

**U5. 데이터를 읽는 화면은 세 가지 상태를 모두 그린다**
- 규칙: 읽는 중에는 `Skeleton`, 비었으면 `EmptyState`, 실패하면 `ErrorState`를 보여 준다. 로딩 자리는 실제 내용과 같은 크기로 잡는다.
- 이유: P5, P4. 오프라인과 빈 기기가 흔한 상황이다.
- 강도: 권장 / 확인: 리뷰
- 예시: `src/app/product/loading.tsx`, `src/app/product/error.tsx`.

**U6. 입력에는 이름표를, 누르는 것에는 포커스 링을**
- 규칙: 모든 입력은 `label`을 갖고, 오류 문구는 `aria-describedby`로 입력과 잇는다. 포커스 링(`outline-3`)을 지우지 않는다. 아이콘만 있는 버튼에는 `aria-label`을 단다.
- 이유: P5.
- 강도: 권장 / 확인: 리뷰
- 예시: `src/app/login/page.tsx`의 `Input`.

**U7. 문구는 해요체로, 무엇을 하면 되는지까지**
- 규칙: 화면 문구는 "~해요 / ~해 주세요"로 쓰고, 실패 문구에는 다음에 할 행동을 붙인다. 사용자를 탓하지 않는다.
- 이유: P5.
- 강도: 권장 / 확인: 리뷰
- 예시: 따를 것 — "제품 목록을 불러오지 못했어요 / 잠시 후 다시 시도해주세요."(`src/app/product/error.tsx`). 지금은 해요체 65곳, "~습니다" 20곳이 섞여 있다.

## 정하지 못한 것

- **"제품"과 "물건"**: 화면 문구에 각각 36곳, 41곳 쓰입니다. 추천은 사용자에게 보이는 말은 "물건", 코드 이름은 `product`입니다. 팀이 정하면 U7에 넣습니다.

## 나중에

- 다크 모드, 큰 글자 설정 대응, 색 대비 자동 검사.
