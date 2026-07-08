# 디자인 레퍼런스 검색 프록시 (Vercel)

포장사양서 뷰어(`index.html`)가 **제품명(한글)** 으로 네이버·구글 검색 결과를 받아오도록 중계하는 서버리스 프록시입니다.
브라우저는 외부 검색 API를 직접 호출할 수 없고(CORS·키 노출), API 키는 이 프록시의 **환경변수(시크릿)** 에만 저장됩니다. 페이지에는 절대 노출되지 않습니다.

## 엔드포인트
- `GET /api/search?q=<제품명>` → `{ query, images[], blogs[], shops[], errors[] }` (네이버 이미지·블로그·쇼핑 + 구글 이미지 종합)
- `GET /api/img?url=<이미지URL>` → 원본 이미지를 CORS 허용 헤더로 전달(02B 크롭용)

## 배포 (Vercel)
1. 이 `proxy/` 폴더를 Vercel 프로젝트로 배포
   - 방법 A: Vercel 대시보드에서 이 저장소를 Import → **Root Directory = `proxy`** 로 지정
   - 방법 B: 로컬에서 `cd proxy && npx vercel --prod`
2. **환경변수(Environment Variables)** 등록 — Settings → Environment Variables:

   | 이름 | 값 | 발급처 |
   |---|---|---|
   | `NAVER_CLIENT_ID` | 네이버 앱 Client ID | https://developers.naver.com/apps (검색 API 사용 등록) |
   | `NAVER_CLIENT_SECRET` | 네이버 앱 Client Secret | 위와 동일 |
   | `GOOGLE_API_KEY` | 구글 API 키 | https://console.cloud.google.com (Custom Search API 사용 설정) |
   | `GOOGLE_CX` | 검색엔진 ID(cx) | https://programmablesearchengine.google.com (이미지 검색 ON) |
   | `ALLOW_ORIGIN` | `https://duckjin87-web.github.io` | 뷰어가 배포된 오리진(보안상 권장) |

3. 재배포 후 발급된 URL(예: `https://spec-search-xxxx.vercel.app`)을 뷰어의
   **01·5 디자인 레퍼런스 → 프록시 URL** 칸에 붙여넣으면 "자동 검색"이 동작합니다.

## 주의
- `ALLOW_ORIGIN`을 지정하지 않으면 `*`(전체 허용)이라 누구나 호출해 **API 쿼터를 소모**할 수 있습니다. 운영 시 반드시 오리진을 지정하세요.
- 네이버 검색 API는 일 25,000회, 구글 CSE 무료는 일 100회 제한이 있습니다(2026-07 기준, 변동 가능).
- 키는 이 저장소나 페이지에 커밋하지 마세요 — 오직 Vercel 환경변수에만 넣습니다.
