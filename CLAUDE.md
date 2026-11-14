# 네모(NEMO) 웹 — AI 에이전트 지침

이 파일은 입구입니다. 규칙 본문은 `docs/`에 있고, 여기에 복사하지 않습니다. 이 파일은 50줄 안팎으로 유지합니다(이유: `docs/decisions/0003-agent-instructions.md`).

## 무엇인가

물건을 기록하는 Next.js(App Router) PWA. 기기 저장소(IndexedDB)가 기준이고, 로그인한 사용자만 서버에 동기화하는 방향입니다. `main`에 머지하면 바로 운영에 나갑니다.

## 항상 지킬 것

1. 작업은 이슈에서 시작한다. 코드를 쓰기 전에 열린 이슈에서 중복을 찾아 정리하고, 맞는 이슈가 없으면 만든 뒤 그 범위 안에서만 작업한다. PR에는 모두 해결된 이슈를 `Closes #번호`로 적는다(`docs/issues.md` I3·I4).
2. `main`에 직접 커밋·push하지 않는다. 브랜치(`종류/이슈번호/설명`)와 PR로만.
3. 아래 **위험 영역**을 고칠 때는 먼저 `docs/production.md`를 읽고, PR에 확인한 것·되돌리는 방법·기존 데이터 영향을 적는다. 사람 1명의 승인 없이는 머지하지 않는다.
   - `src/lib/db/`, 서버를 부르는 코드, `src/app/login/`·`signup/`·`(user)/`, `src/app/sw.ts`, `next.config.mjs`, 환경변수
4. 이미 배포된 Dexie `version(n)`은 고치지 않는다. 새 버전을 추가한다.
5. 개인정보(입력값, 서버 응답)를 로그에 넣지 않는다. `.env`를 커밋하지 않는다.
6. 화면에서 `db`나 `fetch`·`axios`를 직접 쓰지 않는다. `src/lib/`의 입구를 거친다.
7. 색·글꼴·모서리는 토큰만, 부품은 `@/components/common` 먼저.
8. 확인하지 못한 것을 사실처럼 쓰지 않는다. 실행하지 않은 테스트를 통과했다고 하지 않는다.

## 작업별로 읽을 문서

| 하려는 일 | 먼저 읽을 것 |
|---|---|
| 무엇이든 처음 | `docs/principles.md`, `docs/context.md` |
| 브랜치·커밋·PR 만들기 | `CONTRIBUTING.md`, `docs/pull-requests.md` |
| 이슈 쓰기 | `docs/issues.md` |
| 코드 고치기 | `docs/code-conventions.md` |
| 화면·문구 고치기 | `docs/design-system.md`, 앱의 `/design-system` |
| 저장소·서버·인증·배포 | `docs/production.md`, `docs/decisions/0001-local-first-sync.md` |
| 규칙을 바꾸고 싶을 때 | `docs/principles.md`의 "규칙을 바꾸는 방법" |

## 명령

```bash
pnpm install && pnpm dev   # 개발
pnpm lint && pnpm build    # 머지 전 확인 (빌드가 타입 검사 포함)
pnpm test                  # src/lib/db 테스트 (PR #94 머지 후)
```

커밋·PR 제목은 `종류: 설명`(`feat`, `fix`, `refactor`, `style`, `docs`, `chore`), 문서와 주석은 한국어로 씁니다.
