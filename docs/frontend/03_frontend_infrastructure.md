# 03_frontend_infrastructure.md

# Frontend Infrastructure

ไฟล์นี้กำหนด runtime foundation ของ Frontend เพื่อให้ทุก module ใช้ฐานเดียวกันและไม่ทำซ้ำ concern ด้านเทคนิค

ขอบเขตหลักของไฟล์นี้คือ

- package baseline และ env/config strategy
- middleware, session bootstrap, HTTP, query client และ cache policy
- persistence/draft/queue/offline direction
- theme runtime และ notification runtime
- integration-facing helpers และขอบเขต `src/lib/`

---

## 1. เอกสารนี้มีไว้เพื่ออะไร

ใช้ไฟล์นี้เป็นเกณฑ์ตัดสินเรื่องโครง runtime ก่อนเริ่มทำ feature

- อะไรต้องรวมศูนย์ใน infra layer และอะไรห้ามอยู่ infra
- package ไหนเป็น baseline และไม่เพิ่ม library ซ้ำซ้อน
- config/env/http/query/cache ต้องวางอย่างไรให้ทุก module ใช้ร่วมกัน
- policy ของ persistence/offline/sync ต้องเริ่มที่ layer ไหน
- จุดที่ theme/notification runtime ต้องประกอบใน app

ไฟล์นี้ไม่ลงรายละเอียด business flow แต่เป็นฐานเทคนิคที่ไฟล์ API, auth/access และ UI ต้องอ้างร่วมกัน

### อ่านต่อ

- ภาพรวมของระบบ -> `01_frontend_overview.md`
- project structure และ app shell -> `02_frontend_architecture.md`
- auth/access flow -> `04_frontend_auth-access.md`
- API usage และ service/API flow -> `07_frontend_api-usage.md`
- mock usage (reference / isolated demo only) -> `08_frontend_mock-usage.md`
- UI standards ของ notification / offline / sync / theme / viewport -> `12_frontend_ui-design-standards.md`

---

## 2. Infrastructure Principles

## 2.1 Infrastructure ต้องเป็นของกลางจริง

ของที่อยู่ใน infrastructure layer ต้องช่วยหลายส่วนของระบบได้จริง เช่น

- http client
- config
- query client
- persistence helpers
- offline helpers
- integration helpers
- date helpers เชิง foundation
- pwa helpers

ไม่ควรเอา business logic เฉพาะ module ไปซ่อนใน infrastructure

## 2.2 Infrastructure ต้องบางแต่ชัด

infrastructure layer ไม่ควรอ้วนจนกลายเป็น business layer  
แต่ต้องชัดพอว่า

- อะไรเป็น standard
- อะไรเป็น baseline
- ใครเรียกใช้อย่างไร
- state ใดควรอยู่ตรงไหน

## 2.3 Runtime ต้องถูกออกแบบให้รองรับ failure

ระบบนี้ต้องพร้อมเจอสถานการณ์เช่น

- session หมดอายุ
- network ไม่เสถียร
- backend ช้า
- integration failed
- stale cache
- pending local actions
- user เปลี่ยน current access ระหว่างใช้งาน

ดังนั้น runtime foundation ต้องรองรับ failure modes ตั้งแต่ต้น

## 2.4 Frontend ไม่ใช่ owner ของ canonical business truth

frontend มีหน้าที่

- แสดงผล
- จัดการ local interaction state
- ช่วย persistence บางส่วน
- รองรับ draft/queue/offline-aware flows
- render statuses ให้ user เข้าใจ

แต่ canonical truth ของ auth, permissions, integration outcome และ business record state ยังอยู่ที่ server/BFF

## 2.5 Infrastructure ต้องสอดคล้องกับ shell model ของระบบ

เพราะระบบนี้ใช้ shell แบบ

- sidebar + main content
- notification center อยู่ใน sidebar
- toast อยู่ใน main content
- work pages ใช้ viewport-first baseline

runtime foundation ต้องสนับสนุน model นี้ด้วย

## 2.6 PWA และ Offline Direction ต้องคิดตั้งแต่โครง

แม้จะยังไม่เปิด service worker เต็มรูปแบบ  
แต่ถ้าโครงไม่พร้อมตั้งแต่แรก จะทำให้ต่อยอด installable shell, local queue, sync-back และ persistence ยากมาก

---

## 3. Package Baseline ของโปรเจกต์

Baseline package ของโปรเจกต์นี้ให้ยึดอย่างน้อยดังนี้

หมายเหตุ baseline ปัจจุบัน:

- ไม่ใช้ i18n runtime packages ในรอบนี้ (Thai-first single language)
- ไม่ใช้ popup library เพิ่มเติมนอกมาตรฐาน MUI Dialog + notistack

## 3.1 Core UI / Foundation

```bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
```

ใช้สำหรับ

- MUI components
- styling engine
- icons ของระบบ

## 3.2 Date Picker / Date Handling

```bash
npm install @mui/x-date-pickers dayjs
```

ใช้สำหรับ

- date picker ของระบบ
- transaction date
- filter by date
- due date
- closing date
- date inputs มาตรฐาน

## 3.3 Data / Form / Validation

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install react-hook-form zod @hookform/resolvers
```

ใช้สำหรับ

- server state
- cache / refetch / invalidation
- forms
- schema validation
- form resolver

## 3.4 HTTP

```bash
npm install axios
```

ใช้สำหรับ

- HTTP client กลาง
- request/response interceptors
- timeout handling
- auth/session-aware requests

## 3.5 Notification / Charts

```bash
npm install notistack
npm install echarts
```

ใช้สำหรับ

- toast feedback
- chart engine ของระบบ

## 3.6 Persistence / Offline Direction

```bash
npm install idb
```

ใช้สำหรับ

- IndexedDB wrapper
- local draft
- pending queue
- offline-capable persistence direction

### หมายเหตุ

ถึงแม้บางส่วนอาจยังไม่ถูกใช้งานตั้งแต่วันแรก  
แต่สามารถถือเป็น baseline package ของโปรเจกต์ได้ เพราะอยู่ในทิศทางที่ระบบต้องใช้แน่

---

## 4. Runtime Providers Foundation

ระบบนี้มี providers หลักในระดับแอปดังนี้

```text
AuthProvider
AccessProvider
ShellProvider
ThemeProvider
QueryClientProvider
SnackbarProvider
LocalizationProvider
```

หมายเหตุ: provider order นี้เป็น canonical runtime order เชิงแนวคิด แม้ implementation ปัจจุบันของบาง concern จะอยู่ใน guard / helper / compatibility wrapper แทน standalone context files

### ความหมายของแต่ละตัว

#### `AuthProvider`

ถือ runtime state ที่เกี่ยวกับ session/current user

#### `AccessProvider`

ถือ runtime state ที่เกี่ยวกับ assignments/current access/effective access

#### `ShellProvider`

ถือ runtime state ของ shell เช่น

- sidebar collapsed
- notification panel open
- utility drawer state

#### `ThemeProvider`

ถือ theme runtime state และห่อ MUI theme

#### `QueryClientProvider`

เป็น owner ของ TanStack Query runtime

#### `SnackbarProvider`

เป็น owner ของ toast feedback ผ่าน notistack

#### `LocalizationProvider`

เป็น owner ของ date adapter สำหรับ MUI X Date Pickers

### แนวคิดการวางในแอป

ตัวอย่างเชิงโครงของ root runtime

```tsx
<AuthProvider>
  <AccessProvider>
    <ShellProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <SnackbarProvider>{children}</SnackbarProvider>
          </LocalizationProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ShellProvider>
  </AccessProvider>
</AuthProvider>
```

### หมายเหตุ

ลำดับจริงอาจปรับได้ตาม implementation  
แต่ baseline intent คือ

- auth ก่อน access
- shell/theme เป็น app runtime
- query client และ snackbar เป็น app-wide infrastructure
- date adapter เป็น app-level foundation

---

## 5. Middleware Foundation

ไฟล์นี้ลงลึกเรื่อง middleware มากกว่าไฟล์ architecture แต่ยังไม่ใช่ code-spec เต็ม

> Project alignment (ปัจจุบัน): โปรเจกต์นี้มี `src/middleware.ts` แล้ว โดยใช้ `auth_status` cookie เป็น session hint เพื่อคัด public/protected routes ระดับต้น และ redirect ไป `/auth/login` เมื่อยังไม่ authenticated

## 5.1 Middleware มีไว้ทำอะไร

middleware ของระบบนี้ควรทำหน้าที่ระดับบน เช่น

- แยก public route กับ protected route
- ตรวจว่ามี session hint / auth cookie หรือไม่
- redirect ไป login ถ้าจำเป็น
- redirect เข้าสู่ access flow ถ้าจำเป็น
- กัน route ที่ไม่ควรเข้าโดยไม่มี session ในระดับต้น

## 5.2 Middleware ไม่ควรทำอะไร

- ไม่ควร resolve business permissions ทั้งหมด
- ไม่ควร fetch business data หนัก
- ไม่ควร map DTO/model
- ไม่ควรกลายเป็น owner ของ current access logic ทั้งหมด
- ไม่ควรใช้แทน page-level guard และ action-level guard

## 5.3 Middleware กับ Access

middleware อาจรู้เพียงว่า

- ผู้ใช้มี session หรือไม่
- route นี้ควรเข้าด้วย session หรือไม่

แต่ไม่ควรเป็นคนตัดสิน action-level permissions หรือ section-level access

## 5.4 Middleware กับ PWA / Offline

middleware ไม่ใช่ชั้นที่ทำ offline sync หรือ cache logic  
offline/PWA เป็น concern คนละชั้น

### ตัวอย่างแนวคิดแบบย่อ

```ts
// middleware.ts
export function middleware(request: NextRequest) {
  const isAuthenticated = hasSessionCookie(request);

  if (!isAuthenticated && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}
```

### อ่านต่อ

- auth/access runtime จริง -> `04_frontend_auth-access.md`

---

## 6. HTTP Client Foundation

HTTP client กลางของระบบควรอยู่ใน `src/core/api/` (หรือชั้น shared ที่เทียบเท่า)  
ไม่ควรให้แต่ละ module สร้าง axios instance เองกระจัดกระจาย

### โครงที่แนะนำ

```text
src/core/api/
├── http-client.ts
├── interceptors.ts
└── index.ts
```

## 6.1 `httpClient.ts`

รับผิดชอบ

- create axios instance
- base URL
- timeout
- default headers
- interceptors
- error normalization ระดับ transport

## 6.2 `httpError.ts`

รับผิดชอบ

- normalize transport errors
- classify network error / timeout / auth error / validation error / server error

## 6.3 `httpTypes.ts`

รับผิดชอบ

- shared http-related technical types

### ตัวอย่างพื้นฐาน

```ts
// src/lib/http/httpClient.ts
import axios from 'axios';
import { getAppConfig } from '@/lib/config/getAppConfig';

const config = getAppConfig();

export const httpClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.httpTimeoutMs,
  withCredentials: true,
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);
```

### หลักสำคัญ

- `withCredentials` สำคัญเมื่อ auth ผ่าน BFF/cookies
- base URL ต้องมาจาก config กลาง
- timeout ต้อง centralized
- interceptors ต้องไม่ยัด business logic

---

## 7. Config / Env Foundation

config กลางควรอยู่ใน `src/lib/config/`

### โครงที่แนะนำ

```text
src/lib/config/
├── env.ts
├── getAppConfig.ts
└── index.ts
```

## 7.1 `env.ts`

อ่าน env variables แบบ centralized

## 7.2 `getAppConfig.ts`

normalize env ให้กลายเป็น app config ที่โค้ดใช้ได้ง่าย

### ตัวอย่าง

```ts
// src/lib/config/getAppConfig.ts
export type AppConfig = {
  apiBaseUrl: string;
  httpTimeoutMs: number;
  dataSource: 'api' | 'mock';
  enableMockBadge: boolean;
  enablePwa: boolean;
};

export function getAppConfig(): AppConfig {
  return {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api',
    httpTimeoutMs: Number(process.env.NEXT_PUBLIC_HTTP_TIMEOUT_MS ?? 15000),
    dataSource: (process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'api') as
      | 'api'
      | 'mock',
    enableMockBadge: process.env.NEXT_PUBLIC_ENABLE_MOCK_BADGE === 'true',
    enablePwa: process.env.NEXT_PUBLIC_ENABLE_PWA === 'true',
  };
}
```

### หลักสำคัญ

- component ไม่ควรอ่าน env ตรง
- service ไม่ควร parse env เองทุกไฟล์
- config ต้อง centralized

---

## 8. Query Client Foundation

TanStack Query เป็น foundation ของ server state  
ดังนั้นต้องตั้งค่ากลางให้ชัด

### โครงที่แนะนำ

```text
src/lib/query/
├── queryClient.ts
├── queryKeys.ts
└── index.ts
```

## 8.1 `queryClient.ts`

สร้าง query client กลางของแอป

### ตัวอย่าง

```ts
// src/lib/query/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

## 8.2 Query Defaults ระดับระบบ

นี่คือ baseline ที่แนะนำ

- `retry` ของ queries ไม่ควร aggressive เกินไป
- `mutations` ไม่ควร retry ดื้อ ๆ โดยไม่มี rule
- `refetchOnWindowFocus` ปิดเป็น baseline ได้ ถ้าไม่เหมาะกับ ERP flow
- `staleTime` ให้เหมาะกับ type ของข้อมูล ไม่ต้องเหมือนกันทุกอย่าง

### หลักสำคัญ

- query defaults ต้อง centralized
- module-specific tweaks ทำได้ แต่ต้องมี baseline กลาง

---

## 9. Cache Strategy Foundation

cache ของระบบนี้ต้องไม่ใช่แค่ “React Query มี cache อยู่แล้วจบ”  
แต่ต้องมีแนวคิดชัดว่า cache ใช้เพื่ออะไร

## 9.1 เป้าหมายของ cache

- ลดเวลา reload
- ลดการ fetch ซ้ำ
- ทำให้ dashboard/list/detail ลื่นขึ้น
- รองรับ stale-while-revalidate feeling เมื่อเหมาะสม
- ลดการกระตุกเวลา navigate ระหว่างหน้าที่มีข้อมูลเกี่ยวข้องกัน

## 9.2 สิ่งที่ cache ไม่ใช่

- ไม่ใช่ canonical source of truth
- ไม่ใช่ local draft storage
- ไม่ใช่ auth/session store
- ไม่ใช่ permission source of truth

## 9.3 Cache กับ Current Access

เมื่อ current access เปลี่ยน  
query ที่ access-sensitive ต้องถูก clear หรือ invalidate อย่างเหมาะสม

### ตัวอย่างแนวคิด

```ts
// on access switch
queryClient.clear();
```

หรือถ้าต้องการละเอียดกว่าในภายหลัง  
อาจ invalidate เฉพาะ access-sensitive keys

## 9.4 Cache กับ Notification Center

notification counts / unread summaries อาจเป็น query ได้  
แต่ต้องมี refresh strategy ที่ไม่รบกวน work pages เกินไป

---

## 10. Browser Persistence Foundation

ระบบนี้ต้องแยกชัดว่าอะไรควร persist ที่ไหน

## 10.1 localStorage

ใช้กับ

- theme mode
- sidebar collapsed state
- table density
- selected tab / filter presets บางอย่าง
- mock badge preference บางกรณี

## 10.2 sessionStorage

ใช้กับ

- temporary browser-session state
- state ที่ไม่จำเป็นต้องคงข้าม browser restart

## 10.3 IndexedDB

ใช้กับ

- local draft
- pending queue
- offline-capable payloads
- data ที่มีขนาดใหญ่กว่า simple preference

## 10.4 สิ่งที่ไม่ควร persist เป็น canonical source

- auth truth
- permissions truth
- effective access truth
- canonical business record truth

### โครง helper ที่แนะนำ

```text
src/lib/persistence/
├── localStorage.ts
├── sessionStorage.ts
├── indexedDb.ts
└── index.ts
```

### ตัวอย่าง helper ง่าย ๆ

```ts
// src/lib/persistence/localStorage.ts
export function getLocalStorageItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setLocalStorageItem<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
```

---

## 11. Local Draft / Pending Queue Direction

ระบบนี้ต้องเผื่อ local draft และ pending queue ตั้งแต่ infrastructure foundation

## 11.1 Local Draft

ใช้กับ

- ฟอร์มที่ผู้ใช้กรอกนาน
- ฟอร์มที่มีโอกาสหลุด/ออกกลางคัน
- flow ที่ต้องกลับมาแก้ต่อ

## 11.2 Pending Queue

ใช้กับ

- create/update actions ที่รองรับ offline-capable direction
- actions ที่ต้อง sync เมื่อกลับมาออนไลน์

## 11.3 สิ่งที่ infrastructure ต้องเตรียม

- persistence storage
- queue item shape ระดับ technical
- retry orchestration hooks/helpers
- sync status classification

### โครงที่แนะนำ

```text
src/lib/offline/
├── queue.ts
├── draft.ts
├── syncStatus.ts
├── connectivity.ts
└── index.ts
```

### หมายเหตุ

business-level queue logic ยังไม่อยู่ใน infrastructure ล้วน ๆ  
แต่ infrastructure ต้องเตรียมฐานให้ module ใช้ได้

---

## 12. Offline-Aware Runtime Direction

ระบบนี้ไม่ใช่แค่ “ทำได้ตอนออฟไลน์” หรือ “ทำไม่ได้ตอนออฟไลน์”  
แต่ต้องมี runtime states ที่ระบบรู้และสื่อได้

## 12.1 baseline states ที่ต้องมี

- `online`
- `offline`
- `pending`
- `syncing`
- `failed`
- `conflict`
- `stale`

## 12.2 infrastructure ที่ต้องมีอย่างน้อย

- connectivity detection
- sync status helpers
- persistence foundation
- queue/draft helpers
- UI hooks สำหรับ online/offline awareness

### ตัวอย่าง hook ง่าย ๆ

```ts
// src/lib/offline/connectivity.ts
'use client';

import { useEffect, useState } from 'react';

export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(window.navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
```

### หมายเหตุ

hook นี้อาจอยู่ใน `src/hooks/` หรือ `src/lib/offline/` ตาม style ที่ทีมเลือก  
แต่ owner เชิง concept คือ infrastructure/offline foundation

---

## 13. PWA Direction Foundation

แม้เฟสแรกยังไม่ลงลึก service worker เต็มรูปแบบ  
แต่ระบบนี้ต้องพร้อมอย่างน้อยในระดับนี้

## 13.1 สิ่งที่ควรมีตั้งแต่ต้น

- `src/app/manifest.ts`
- app icons / metadata
- theme color / display mode
- installable shell direction

## 13.2 สิ่งที่เผื่อไว้ในโครง

- offline helpers
- queue/draft persistence
- sync status model
- service worker integration point ในอนาคต
- package direction สำหรับ phase ถัดไป

## 13.3 สิ่งที่ยังไม่จำเป็นต้องบังคับตอนเฟสแรก

- service worker runtime caching แบบเต็ม
- background sync implementation
- advanced precache strategies

### ตัวอย่าง `manifest.ts`

```ts
// src/app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JBF FarmHUB',
    short_name: 'FarmHUB',
    description: 'ERP web application for JBF FarmHUB',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1976d2',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
```

---

## 14. Theme Runtime Foundation

theme runtime ต้องแยกจาก theme assets ชัดเจน

### โครงที่แนะนำ

```text
src/contexts/ThemeContext.tsx
src/core/theme/
├── tokens/
├── palette.ts
├── typography.ts
├── components.ts
├── light-theme.ts
├── dark-theme.ts
└── createAppTheme.ts
```

## 14.1 `ThemeContext.tsx`

ทำหน้าที่

- ถือ current theme mode
- set/toggle theme mode
- read/write preference จาก persistence
- ห่อ MUI ThemeProvider

## 14.2 Theme assets

ทำหน้าที่

- define tokens
- define light/dark palette
- define typography
- define component overrides

### ตัวอย่างเชิงแนวคิด

```ts
// src/core/theme/create-app-theme.ts
import { createTheme } from '@mui/material/styles';

export function createAppTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: {
      mode,
    },
  });
}
```

---

## 15. Notification Runtime Foundation

ระบบนี้มี notification model 3 ชั้น

1. notification center
2. toast feedback
3. inline alerts

infrastructure layer ต้องรองรับอย่างน้อยเรื่องต่อไปนี้

## 15.1 Toast Provider

ใช้ `SnackbarProvider` จาก notistack ในระดับแอป

### ตัวอย่าง

```tsx
import { SnackbarProvider } from 'notistack';

<SnackbarProvider
  maxSnack={3}
  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
>
  {children}
</SnackbarProvider>;
```

### หมายเหตุ

ถึงจะใช้ provider ระดับแอป  
แต่ในการใช้งาน UX ของระบบนี้ ให้ถือว่า toast เป็น feedback ที่สัมพันธ์กับ main content area ไม่ใช่ notification center หลัก

## 15.2 Notification Center Runtime

notification center เป็น shell-owned concern

สิ่งที่ infrastructure/shell runtime ควรรองรับเช่น

- unread count state
- open/close state
- refresh strategy
- panel host

## 15.3 Inline Alerts

ไม่ใช่ concern ของ provider ระดับแอป  
แต่เป็น concern ของ page/section components

---

## 16. Date / Time Foundation

ระบบนี้ใช้ **Day.js + MUI X Date Pickers**

### สิ่งที่ infrastructure ต้องรองรับ

- global `LocalizationProvider`
- standard date parsing/formatting helpers
- consistent timezone assumptions ในระดับแอป
- reusable date utilities

### โครงที่แนะนำ

```text
src/lib/date/
├── dateFormat.ts
├── dateParse.ts
├── dayjsConfig.ts
└── index.ts
```

### ตัวอย่าง runtime setup

```tsx
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

<LocalizationProvider dateAdapter={AdapterDayjs}>
  {children}
</LocalizationProvider>;
```

### หลักสำคัญ

- date formatting ไม่ควรกระจัดกระจายทั่วแอป
- ชนิดของ date field ต้องชัดว่า field ไหนเป็น raw string, field ไหนเป็น display string, field ไหนเป็น dayjs/date object

---

## 17. SAP / Integration Runtime Direction

Frontend ไม่คุย SAP ตรง  
แต่ runtime foundation ต้องพร้อมรองรับ integration-aware flows

## 17.1 สิ่งที่ frontend ควรรู้

- integration status
- sync status
- retry availability
- last synced time
- user-facing warnings/errors

## 17.2 สิ่งที่ frontend ไม่ควรรู้โดยตรง

- SAP raw schema
- SAP credentials
- SAP client internals
- backend integration worker details

## 17.3 Infrastructure helpers ที่ควรมี

```text
src/lib/integration/
├── integrationStatus.ts
├── syncState.ts
└── index.ts
```

helpers พวกนี้ใช้สำหรับ

- normalize technical status
- map status families ในระดับ infrastructure/helper
- support UI state interpretation

---

## 18. `src/lib/` ควรมีอะไรบ้าง

Baseline ที่แนะนำ

```text
src/lib/
├── config/
├── date/
├── http/
├── integration/
├── offline/
├── persistence/
├── query/
└── access/
```

### `config/`

app config / env normalization

### `date/`

date helpers

### `http/`

axios instance / transport helpers

### `integration/`

integration-facing technical helpers

### `offline/`

connectivity / queue / draft / sync helpers

### `persistence/`

localStorage / sessionStorage / IndexedDB helpers

### `query/`

query client / shared query helpers

### `access/`

technical helpers ที่ support access runtime เช่น permission checks แบบ generic

---

## 19. สิ่งที่ไม่ควรอยู่ใน Infrastructure Layer

- business-specific services ของ module
- DTO/model mapping ของ module
- page sections ของ module
- giant current-access business logic ที่ควรอยู่ใน access module
- module-specific form validation rules
- business notification wording ของแต่ละ domain
- business-specific chart configuration

infrastructure layer มีหน้าที่ “วางฐาน” ไม่ใช่ “กิน ownership ของทุกอย่าง”

---

## 20. Infrastructure Summary Matrix

| Concern                               | Baseline Owner                   |
| ------------------------------------- | -------------------------------- |
| Public/protected route gate เบื้องต้น | `src/middleware.ts`              |
| HTTP client                           | `src/core/api/http-client.ts`    |
| Env/config                            | `src/core/config/`               |
| Query client                          | `src/lib/query/`                 |
| Browser persistence                   | `src/lib/persistence/`           |
| Offline helpers                       | `src/lib/offline/`               |
| Integration technical helpers         | `src/lib/integration/`           |
| Date helpers                          | `src/lib/date/`                  |
| Theme runtime                         | `src/contexts/ThemeContext.tsx`  |
| Theme assets                          | `src/core/theme/`                     |
| Toast provider                        | app root                         |
| Notification center open/close state  | `ShellContext`                   |
| Local draft / queue foundation        | `src/lib/offline/` + persistence |
| PWA manifest                          | `src/app/manifest.ts`            |

---

## 21. ความสัมพันธ์กับไฟล์อื่นใน Docs ชุดนี้

ไฟล์นี้วาง **runtime foundation ของระบบ**

### `02_frontend_architecture.md`

วางโครงของ project/app/module/shell

### `04_frontend_auth-access.md`

ลงลึกเรื่อง session bootstrap, current access, effective access และ permission checks

### `07_frontend_api-usage.md`

ลงลึกเรื่อง page -> hook -> service -> api จริง

### `08_frontend_mock-usage.md`

ลงลึกเรื่อง mock/reference mode, storybook fixtures และ isolated demo/test

### `12_frontend_ui-design-standards.md`

ลงลึกเรื่อง offline states, notification model, dialogs, tables, forms, charts และ wording

### `13_frontend_requirements.md`

ยืนยันว่า offline/PWA/SAP/theme/cache เป็น requirement level ไหน

---

## เมื่อไรต้องอัปเดตไฟล์นี้

อัปเดตไฟล์นี้เมื่อเกิดอย่างน้อยหนึ่งข้อดังต่อไปนี้

- requirement หรือ policy ของ business เปลี่ยน
- flow งานจริงหน้างานเปลี่ยนและกระทบการใช้งานหน้า
- backend contract/permission/scope เปลี่ยนจน behavior ฝั่ง frontend เปลี่ยน
- มีการปรับโครงสร้าง route/module/folder ที่เกี่ยวข้องกับไฟล์นี้
- พบว่าทีม implement ผิดซ้ำเพราะเอกสารยังกำกวม

---

## 22. Summary

สรุปสาระสำคัญที่สุดของ `03_frontend_infrastructure.md` คือ

- infrastructure layer เป็น foundation กลางของระบบ ไม่ใช่ business layer
- package baseline ของระบบต้องพร้อมสำหรับ MUI, date picker, query, forms, axios, echarts, notistack และ persistence direction
- middleware มีหน้าที่เป็น request-time route gate เบื้องต้น ไม่ใช่ owner ของ business access logic ทั้งหมด
- HTTP client ต้อง centralized
- config/env ต้อง centralized
- query client ต้องมี defaults กลางของทั้งระบบ
- cache, persistence, draft, queue และ offline direction ต้องแยก concern กันให้ชัด
- localStorage ไม่ใช่ canonical auth/access source
- Theme runtime กับ theme assets ต้องแยกกัน
- notification runtime ต้องรองรับ notification center, toast และ inline alerts เป็นคนละ pattern
- date handling ต้องใช้ Day.js + MUI X Date Pickers เป็น baseline
- frontend ไม่คุย SAP ตรง แต่ต้องพร้อมสำหรับ integration-aware UX
- PWA direction ต้องถูกเผื่อไว้ในโครงตั้งแต่ต้น แม้ยังไม่บังคับ service worker เต็มรูปแบบในเฟสแรก
- `src/lib/` ต้องเป็นบ้านของ technical foundation ที่ shared จริง
