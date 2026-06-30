import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pawdiary.app",
  appName: "PawDiary",
  webDir: "out",
  server: {
    url: "https://pawdiary.app",
    cleartext: false,
  },
};

export default config;
