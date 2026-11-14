# 코드 규칙

원칙 번호는 [principles.md](principles.md)를 봅니다. 줄바꿈·따옴표·import 순서 같은 모양은 여기 적지 않습니다. Prettier(`.prettierrc`)와 ESLint(`.eslintrc.json`)가 정합니다.

## 구조

```
src/app/                 화면(라우트). 화면 전용 부품은 그 폴더 안 components/ 또는 _components/
src/components/common/   공통 부품 → design-system.md
src/lib/db/              기기 저장소(Dexie). 읽기 훅과 쓰기 함수 (PR #94)
src/lib/                 화면과 무관한 도구: cn.ts, format.ts, image.ts
```

## 기존 코드에 적용하는 방식

- 새로 쓰는 코드는 규칙을 따릅니다.
- 기존 파일은 그 파일을 고치는 김에 같은 PR에서 맞춥니다. 단, 고치는 범위가 PR의 목적보다 커지면 따로 PR을 엽니다.
- 필수 규칙을 어기고 있는 기존 코드는 이슈로 만들어 따로 고칩니다.

## 규칙

**K1. 화면은 저장소를 정해진 입구로만 쓴다**
- 규칙: `src/app/`과 `src/components/`의 코드는 데이터를 `src/lib/db/hooks.ts`의 훅으로 읽고 `src/lib/db/products.ts`의 함수로 쓴다. `db` 객체를 직접 가져다 쓰지 않는다.
- 이유: P1. 정리(`normalize`)와 삭제 표시가 한 곳을 지나야 지켜진다.
- 강도: 필수 / 확인: 리뷰(지금), 자동(린트 import 제한 — 후속 이슈)
- 예시: `src/lib/db/hooks.ts`의 `useProducts()`, `src/app/product/components/ProductForm.tsx`의 `createProduct(...)` 호출 (모두 PR #94).

**K2. 화면은 서버를 직접 부르지 않는다**
- 규칙: `fetch`·`axios` 호출은 `src/lib/` 아래 한 곳(서버 통신 모듈)에만 두고, 서버 주소는 `NEXT_PUBLIC_API_URL`에서만 읽는다.
- 이유: P2, P4. 주소·인증·요청 횟수를 한 곳에서 다뤄야 지킬 수 있다.
- 강도: 필수(새 코드) / 확인: 리뷰(지금), 자동(린트 — 후속 이슈)
- 전제: 서버 통신 모듈은 아직 `main`에 없다. 처음 만드는 PR이 위치를 정하고 이 규칙의 경로를 고친다.
- 예시(지금의 모습): `main`은 `axios` 4곳, `fetch` 5곳이 화면 파일 안에 있고, 그중 3곳은 주소를 직접 적었다. 로그인·회원가입(`src/app/login/page.tsx`, `src/app/signup/page.tsx`)은 모듈이 생길 때 옮긴다.

**K3. 저장소 계층을 고치면 테스트도 고친다**
- 규칙: `src/lib/db/`의 동작을 바꾸는 PR은 같은 폴더의 `*.test.ts`에 그 동작의 테스트를 더하거나 고치고 `pnpm test`를 통과시킨다. 그 밖의 코드에는 테스트를 요구하지 않는다.
- 이유: P1 / P6(범위를 좁게).
- 강도: 필수 / 확인: 리뷰(지금), 자동(CI — 후속 이슈)
- 예시: `src/lib/db/products.test.ts`의 "삭제한 물건은 고칠 수 없다".

**K4. 실패는 화면 안에서 알린다**
- 규칙: 새 코드에서 `alert()`와 `confirm()`을 쓰지 않고, 입력 옆 메시지나 `ErrorState`·`Modal`로 알린다.
- 이유: P5. 설치된 앱에서 브라우저 알림창은 앱 밖의 것처럼 보인다.
- 강도: 권장 / 확인: 리뷰(지금), 자동(린트 `no-alert` — 후속 이슈)
- 예시: 따를 것 — `src/app/login/page.tsx`의 `setError(...)`와 `aria-describedby`. 고칠 것 — `alert()` 7곳(`src/app/signup/page.tsx` 5곳, `src/app/product/components/ProductForm.tsx` 2곳).

**K5. 실패를 삼키지 않는다**
- 규칙: `catch`에서는 사용자에게 알리거나 다시 던진다. 일부러 무시할 때는 이유를 주석으로 적는다. 확인용 `console.log`는 머지 전에 지운다. (로그에 넣으면 안 되는 내용은 [production.md](production.md)의 R4)
- 이유: P1. 조용히 실패한 저장은 사라진 기록과 같다.
- 강도: 권장 / 확인: 리뷰(지금), 자동(린트 `no-console` — 후속 이슈)
- 예시: 이유를 적은 무시 — `src/app/components/StoragePersist.tsx`(PR #94)의 "거절돼도 앱은 그대로 동작한다". 지울 것 — `src/app/barcode/barcodeScanner.tsx`의 `console.log` 6곳.

**K6. 파일 이름**
- 규칙: 컴포넌트 파일은 `ProductForm.tsx`처럼 대문자로 시작하고, 그 밖의 모듈은 `format.ts`처럼 소문자로 시작한다. Next.js가 정한 이름(`page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`)은 그대로 쓴다. import는 `@/`로 시작한다.
- 이유: P6.
- 강도: 권장 / 확인: 자율
- 예시: 컴포넌트 파일은 거의 모두 이미 이 형태다. 예외 2개: `src/app/(user)/user-info/myPage.tsx`, `src/app/barcode/barcodeScanner.tsx` — 고치는 김에 바꾼다.

**K7. 왜 그런지는 주석으로 남긴다**
- 규칙: 코드만 봐서는 알 수 없는 이유(브라우저 제약, 순서가 중요한 까닭)는 그 줄 위에 한국어 주석으로 적는다.
- 이유: P6. 다음 사람과 AI 에이전트가 같은 실수를 되풀이하지 않는다.
- 강도: 권장 / 확인: 자율
- 예시: `tailwind.config.ts`의 "색을 고칠 때는 반드시 양쪽을 같이 고칠 것", `src/lib/db/products.ts`(PR #94)의 트랜잭션 주석.

## 나중에

- 화면 테스트, E2E 테스트: 일반 공개 뒤에 다시 봅니다.
- 타입 규칙: `strict`가 켜져 있고 `any`가 0건이라 따로 적지 않습니다.
