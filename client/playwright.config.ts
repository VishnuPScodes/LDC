import {defineConfig,devices} from '@playwright/test';

const chrome=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
export default defineConfig({
  testDir:'./e2e',
  timeout:45_000,
  expect:{timeout:8_000},
  fullyParallel:false,
  reporter:'list',
  use:{baseURL:process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:3006',...devices['Desktop Chrome'],headless:true,launchOptions:chrome?{executablePath:chrome}:undefined},
  webServer:{command:'pnpm exec next start -p 3006',url:'http://127.0.0.1:3006',reuseExistingServer:!process.env.CI,timeout:120_000},
});
