# 함께 일하는 방법

네모(NEMO) 웹 저장소의 협업 흐름입니다. 처음이라면 이 문서와 [docs/principles.md](docs/principles.md)를 먼저 읽으세요. 둘 다 합쳐 10분이면 됩니다.
규칙 형식과 원칙 번호(P1~P6)는 [docs/principles.md](docs/principles.md)를, 문서 전체 목록은 [docs/README.md](docs/README.md)를 봅니다.

## 한눈에 보는 흐름

1. 이슈를 만들거나 고른다 → [docs/issues.md](docs/issues.md)
2. `main`에서 브랜치를 만든다: `종류/이슈번호/짧은-설명`
3. 작게 커밋하고 PR을 연다 → [docs/pull-requests.md](docs/pull-requests.md)
4. 미리보기 빌드가 성공하면 머지한다. [위험 영역](docs/production.md#위험-영역)이면 다른 1명의 승인을 먼저 받는다.
5. 머지 = 운영 배포다 → [docs/production.md](docs/production.md)

## 실행

```bash
pnpm install
pnpm dev      # 개발 서버
pnpm lint     # 린트
pnpm build    # 운영 빌드 (린트·타입 검사 포함)
pnpm test     # 저장소 계층 테스트 (PR #94 머지 후)
```

패키지 관리자는 pnpm만 씁니다(`package.json`의 `packageManager`). 환경변수는 `.env.example`을 `.env`로 복사해 채웁니다.

## 규칙

**C1. `main`에는 PR로만 넣는다**
- 규칙: `main`에 직접 push하지 않는다.
- 이유: P3. `main`에 들어가면 바로 운영에 나간다.
- 강도: 필수 / 확인: 자동(브랜치 보호 — 현재 설정은 미확인, 후속 이슈)

**C2. 위험 영역 PR만 다른 1명의 승인을 받는다**
- 규칙: [위험 영역](docs/production.md#위험-영역)을 건드린 PR은 작성자가 아닌 1명이 승인한 뒤 머지하고, 그 밖의 PR은 승인 없이 본인이 머지한다.
- 이유: P1, P2, P3 / P6.
- 강도: 필수 / 확인: 리뷰(지금), 자동(`CODEOWNERS` — 후속 이슈)
- 전제: 팀 3명. 근거는 [docs/decisions/0002-review-by-risk.md](docs/decisions/0002-review-by-risk.md).

**C3. 브랜치 이름은 `종류/이슈번호/설명`**
- 규칙: 브랜치는 `feat/79/design-system-docs`처럼 짓는다. 이슈 없이 시작한 긴급 수정은 `fix/설명`으로 짓는다.
- 이유: P6. 브랜치만 보고 이슈를 찾는다.
- 강도: 권장 / 확인: 자율
- 예시: 원격 브랜치 27개 중 25개가 이미 이 형태다. 예외: `feat/local-first-pwa`.

**C4. 커밋과 PR 제목은 `종류: 설명`, 이슈 제목은 `[종류] 설명`**
- 규칙: 종류는 `feat`, `fix`, `refactor`, `style`, `docs`, `chore` 중 하나를 소문자로 쓰고 콜론 앞에는 띄어쓰기를 두지 않는다. 설명은 한국어로 무엇이 달라졌는지 적는다.
- 이유: P6. 스쿼시 머지라 PR 제목이 곧 `main`의 기록이다.
- 강도: 권장 / 확인: 리뷰(지금), 자동(PR 제목 검사 — 후속 이슈)
- 예시: 좋음 `fix: 홈 인사 카드에서 금액과 '+ 물건 등록' 버튼이 겹치던 것`. 고칠 것 `Feat/79/design system docs`(브랜치 이름이 그대로 제목이 됨), `bug: …`(→ `fix:`), `feat : …`(콜론 앞 띄어쓰기).

| 종류 | 쓰는 때 |
|---|---|
| `feat` | 사용자가 새로 할 수 있게 된 것 |
| `fix` | 잘못 동작하던 것을 고침 |
| `refactor` | 동작은 그대로, 코드 구조만 |
| `style` | 화면 모양·문구만 |
| `docs` | 문서 |
| `chore` | 설정, 의존성, 빌드 |

## 누가 무엇을 결정하나

| 대상 | 결정 방법 |
|---|---|
| 원칙 | 팀 세 명의 합의 |
| 규칙 문서 | 이유를 적은 PR (위험 영역 규칙은 승인 1명) |
| 일반 PR의 머지 | 작성자 |
| 위험 영역 PR의 머지 | 작성자 + 승인 1명 |
| 의견이 갈릴 때의 최종 결정 | (미확인 — [docs/context.md](docs/context.md)에 채워 주세요) |
