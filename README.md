# 🐠 Commit Aquarium

> GitHub 커밋 기록을 어항으로 시각화하는 웹 서비스  
> 커밋할수록 어항 속 물고기가 늘어납니다.

> 🤖 Built entirely with [Claude Code](https://claude.ai/code)

---

## 미리보기

- GitHub OAuth 로그인
- 내 연간 커밋 수 기반으로 물고기 수 결정
- Frutiger Aero 감성의 Canvas 어항 애니메이션 (클론피시, 블루탱, 젤리피쉬, 씨호스 등)
- Contribution 캘린더 히트맵

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Backend | Spring Boot 3.2, Spring Security, OAuth2 Client, JPA |
| Frontend | React 18, Vite, Canvas 2D API |
| Database | MySQL 8 |
| Auth | GitHub OAuth App |

---

## 프로젝트 구조

```
commit-aquarium/
├── backend/                          # Spring Boot
│   └── src/main/java/com/aquarium/
│       ├── config/
│       │   ├── SecurityConfig.java   # OAuth2 + CORS 설정
│       │   └── AppConfig.java        # RestTemplate, WebMVC
│       ├── controller/
│       │   └── AquariumController.java  # REST API (/api/me, /api/contributions)
│       ├── domain/
│       │   └── ContributionDay.java
│       ├── security/
│       │   └── OAuth2TokenExtractor.java
│       └── service/
│           └── GitHubGraphQLService.java  # GitHub GraphQL API 호출
│
└── frontend/                         # React + Vite
    └── src/
        ├── api/github.js             # axios API 모듈
        ├── components/
        │   └── Aquarium.jsx          # Canvas 어항 애니메이션
        ├── pages/
        │   ├── LoginPage.jsx
        │   └── AquariumPage.jsx
        └── App.jsx
```

---

## 시작하기

### 사전 준비

- Java 17+
- Node.js 18+
- MySQL 8
- GitHub OAuth App

### 1. GitHub OAuth App 등록

[GitHub](https://github.com) → Settings → Developer settings → **OAuth Apps** → New OAuth App

| 항목 | 값 |
|------|----|
| Homepage URL | `http://localhost:5173` |
| Authorization callback URL | `http://localhost:8080/login/oauth2/code/github` |

발급받은 **Client ID**와 **Client Secret** 저장.

### 2. MySQL 데이터베이스 생성

```sql
CREATE DATABASE commit_aquarium
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 3. 백엔드 환경 설정

`backend/src/main/resources/application-local.yml` 생성 (git에 포함되지 않음):

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          github:
            client-id: YOUR_GITHUB_CLIENT_ID
            client-secret: YOUR_GITHUB_CLIENT_SECRET

  datasource:
    url: jdbc:mysql://localhost:3306/commit_aquarium?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
    username: root
    password: YOUR_DB_PASSWORD
```

### 4. 백엔드 실행

```bash
cd backend
./gradlew bootRun --args='--spring.profiles.active=local'
```

### 5. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

### 6. 접속

브라우저에서 `http://localhost:5173` 열기 → GitHub 로그인

---

## API 엔드포인트

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/health` | 서버 상태 확인 |
| GET | `/api/me` | 로그인 사용자 정보 |
| GET | `/api/contributions` | 연간 커밋 데이터 |

---

## 어항 물고기 종류

커밋 수 / 30 = 물고기 수 (최소 4 ~ 최대 14마리)

| 물고기 | 특징 |
|--------|------|
| 🐠 클론피시 | 오렌지 + 흰 줄무늬 |
| 🐟 블루탱 | 파랑 + 노란 꼬리 |
| 🐡 복어 | 둥글고 귀여운 몸통 |
| 금붕어 | 황금빛 흐르는 지느러미 |
| 엔젤피시 | 세로 줄무늬 다이아몬드 몸 |
| 베타 | 보라빛 긴 지느러미 |
| 네온테트라 | 형광 파랑 + 빨강 줄 |
| 🪼 젤리피쉬 | 위로 떠오르며 맥동 |
| 🦀 씨호스 | 천천히 유영 |

---

## 라이선스

MIT
