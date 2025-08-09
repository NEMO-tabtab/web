# NEMO - Web

## 📦 프로젝트 빌드 및 실행 방법

### 0-1. Node.js 설치

1. Node.js 공식 홈페이지 접속 [다운로드](https://nodejs.org/ko/download)
2. LTS(Long Term Support) 버전 다운로드 및 설치
   (이 프로젝트는 Node.js 20.x 이상 권장)

설치 확인

```bash
node -v
# v20.x.x
```

### 0-2. pnpm 설치

Node.js 설치 후 아래 명령어로 pnpm 전역 설치:

```bash
npm install -g pnpm
```

설치 확인:

```bash
pnpm -v
# 9.x.x
```

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 개발 서버 실행

```bash
pnpm run dev
```

## ⚙️ 개발 환경

### **- Node.js 20.x 이상**

### **- pnpm 9.x**

### **- Next.js 15.4.5**

### **- React 19.1.1**

### **- TypeScript 5.8.x**

### **- Tailwind CSS 3.4.x**

### **- ESLint 8.x**

## 🚀 주요 기능

### 1. Next.js App Router 기반 페이지 라우팅

-   / : 메인 페이지

### 2. Tailwind CSS 스타일링

-   반응형 레이아웃

-   커스텀 테마 색상 지원

### 3.TypeScript 지원

-   엄격한 타입 체크

-   @types 패키지로 타입 보완

### 4.ESLint 코드 품질 검사

-   Next.js 공식 ESLint 규칙 적용

-   자동 포맷팅 지원
