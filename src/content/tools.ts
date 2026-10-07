/**
 * Every tool and web console the docs refer to, with direct download pages,
 * one-line install commands per OS and a verify command. Pages render these
 * with <ToolDownloads ids=[…] /> and <ConsoleButtons ids=[…] />.
 */
export type OsKey = "windows" | "mac" | "linux";
export type Tool = {
  name: string;
  icon: string;
  version: string;
  why: string;
  download: Partial<Record<OsKey | "all", { label: string; href: string }>>;
  install?: Partial<Record<OsKey, { label: string; code: string }>>;
  verify?: string;
  docs?: string;
  note?: string;
};

export const TOOLS = {
  jdk17: {
    name: "Java JDK 17 (Eclipse Temurin)",
    icon: "coffee",
    version: "17 LTS",
    why: "Gradle needs it to build Android apps (React Native 0.73+ requires JDK 17).",
    download: {
      windows: { label: "Windows .msi", href: "https://adoptium.net/temurin/releases/?version=17&os=windows&arch=x64&package=jdk" },
      mac: { label: "macOS .pkg", href: "https://adoptium.net/temurin/releases/?version=17&os=mac&package=jdk" },
      linux: { label: "Linux", href: "https://adoptium.net/temurin/releases/?version=17&os=linux&package=jdk" },
    },
    install: {
      windows: { label: "winget", code: "winget install EclipseAdoptium.Temurin.17.JDK" },
      mac: { label: "Homebrew", code: "brew install --cask temurin@17" },
      linux: { label: "apt", code: "sudo apt install openjdk-17-jdk" },
    },
    verify: "java -version",
    note: "In the Windows installer, enable “Set JAVA_HOME variable”.",
    docs: "https://adoptium.net/installation/",
  },
  androidStudio: {
    name: "Android Studio + Android SDK",
    icon: "android",
    version: "latest stable",
    why: "Installs the Android SDK, build tools and platform tools used by Gradle.",
    download: { all: { label: "Download Android Studio", href: "https://developer.android.com/studio" } },
    install: {
      windows: { label: "winget", code: "winget install Google.AndroidStudio" },
      mac: { label: "Homebrew", code: "brew install --cask android-studio" },
      linux: { label: "snap", code: "sudo snap install android-studio --classic" },
    },
    verify: "adb --version",
    note: "After the first launch, set ANDROID_HOME to the SDK path shown in Settings → Languages & Frameworks → Android SDK.",
    docs: "https://developer.android.com/studio/install",
  },
  node: {
    name: "Node.js",
    icon: "javascript",
    version: "LTS",
    why: "React Native's Gradle/Xcode build runs Node to bundle JavaScript; also needed for the Firebase CLI.",
    download: { all: { label: "Download Node.js LTS", href: "https://nodejs.org/en/download" } },
    install: {
      windows: { label: "winget", code: "winget install OpenJS.NodeJS.LTS" },
      mac: { label: "Homebrew", code: "brew install node" },
      linux: { label: "apt", code: "sudo apt install nodejs npm" },
    },
    verify: "node --version",
    docs: "https://nodejs.org/en/download",
  },
  git: {
    name: "Git",
    icon: "commit",
    version: "any recent",
    why: "Release notes are built from git history; production lanes check the branch.",
    download: {
      windows: { label: "Windows", href: "https://git-scm.com/downloads/win" },
      mac: { label: "macOS", href: "https://git-scm.com/downloads/mac" },
      linux: { label: "Linux", href: "https://git-scm.com/downloads/linux" },
    },
    install: {
      windows: { label: "winget", code: "winget install Git.Git" },
      mac: { label: "Homebrew", code: "brew install git" },
      linux: { label: "apt", code: "sudo apt install git" },
    },
    verify: "git --version",
  },
  rubyWindows: {
    name: "Ruby 3.4 + DevKit (RubyInstaller)",
    icon: "diamond",
    version: "3.4.x",
    why: "fastlane is a Ruby gem. DevKit compiles gems with native extensions on Windows.",
    download: { windows: { label: "Ruby+Devkit 3.4 (x64)", href: "https://rubyinstaller.org/downloads/" } },
    install: { windows: { label: "winget", code: "winget install RubyInstallerTeam.RubyWithDevKit.3.4" } },
    verify: "ruby --version",
    note: "Pick the “WITH DEVKIT” x64 installer, and let it run “ridk install” at the end.",
    docs: "https://rubyinstaller.org/",
  },
  rubyMac: {
    name: "Ruby 3.4 via rbenv",
    icon: "diamond",
    version: "3.4.x",
    why: "Never use the macOS system Ruby; rbenv installs a private Ruby per project.",
    download: { all: { label: "rbenv install guide", href: "https://github.com/rbenv/rbenv#installation" } },
    install: {
      mac: { label: "Homebrew", code: "brew install rbenv ruby-build && rbenv install 3.4.1" },
      linux: { label: "apt + rbenv", code: "sudo apt install rbenv && rbenv install 3.4.1" },
    },
    verify: "ruby --version",
    docs: "https://www.ruby-lang.org/en/downloads/",
  },
  bundler: {
    name: "Bundler",
    icon: "inventory_2",
    version: "2.4 – 4.x",
    why: "Pins the exact fastlane version through Gemfile.lock.",
    download: { all: { label: "bundler.io", href: "https://bundler.io/" } },
    install: {
      windows: { label: "gem", code: "gem install bundler" },
      mac: { label: "gem", code: "gem install bundler" },
      linux: { label: "gem", code: "gem install bundler" },
    },
    verify: "bundle --version",
  },
  firebaseCli: {
    name: "Firebase CLI",
    icon: "local_fire_department",
    version: "latest",
    why: "Run once to create FIREBASE_TOKEN (“firebase login:ci”).",
    download: {
      windows: { label: "Windows standalone .exe", href: "https://firebase.tools/bin/win/instant/latest" },
      all: { label: "All install options", href: "https://firebase.google.com/docs/cli#install_the_firebase_cli" },
    },
    install: {
      windows: { label: "npm", code: "npm install -g firebase-tools" },
      mac: { label: "npm", code: "npm install -g firebase-tools" },
      linux: { label: "script", code: "curl -sL https://firebase.tools | bash" },
    },
    verify: "firebase --version",
  },
  gcloud: {
    name: "Google Cloud CLI (gcloud)",
    icon: "cloud",
    version: "latest",
    why: "Optional: list Firebase Test Lab device models for testing.yml.",
    download: { all: { label: "Download Google Cloud CLI", href: "https://cloud.google.com/sdk/docs/install" } },
    install: {
      windows: { label: "winget", code: "winget install Google.CloudSDK" },
      mac: { label: "Homebrew", code: "brew install --cask google-cloud-sdk" },
    },
    verify: "gcloud --version",
  },
  homebrew: {
    name: "Homebrew",
    icon: "sports_bar",
    version: "latest",
    why: "The macOS package manager used by the other macOS install commands.",
    download: { mac: { label: "brew.sh", href: "https://brew.sh/" } },
    install: { mac: { label: "Terminal", code: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"' } },
    verify: "brew --version",
  },
  xcode: {
    name: "Xcode",
    icon: "construction",
    version: "latest (App Store requirement)",
    why: "Builds and signs the iOS app. macOS only.",
    download: {
      mac: { label: "Mac App Store", href: "https://apps.apple.com/app/xcode/id497799835" },
      all: { label: "Older versions (Apple Developer)", href: "https://developer.apple.com/download/all/" },
    },
    install: { mac: { label: "Command-line tools", code: "xcode-select --install" } },
    verify: "xcodebuild -version",
    note: "Open Xcode once after installing to accept the license and install components.",
  },
  cocoapods: {
    name: "CocoaPods",
    icon: "view_in_ar",
    version: "≥ 1.13",
    why: "Installs iOS native dependencies. The framework runs “pod install” for you.",
    download: { all: { label: "CocoaPods guide", href: "https://guides.cocoapods.org/using/getting-started.html" } },
    install: { mac: { label: "Gemfile (recommended)", code: 'echo \'gem "cocoapods", ">= 1.13"\' >> Gemfile && bundle install' } },
    verify: "bundle exec pod --version",
  },
  teams: {
    name: "Microsoft Teams",
    icon: "groups",
    version: "desktop or web",
    why: "Create the Workflows webhook that receives build and test reports.",
    download: { all: { label: "Download Teams", href: "https://www.microsoft.com/en-us/microsoft-teams/download-app" } },
    install: { windows: { label: "winget", code: "winget install Microsoft.Teams" }, mac: { label: "Homebrew", code: "brew install --cask microsoft-teams" } },
  },
  slack: {
    name: "Slack",
    icon: "forum",
    version: "optional",
    why: "Only if you also want plain-text release messages in Slack.",
    download: { all: { label: "Download Slack", href: "https://slack.com/downloads" } },
  },
} satisfies Record<string, Tool>;

export type ToolId = keyof typeof TOOLS;

export type Console = { name: string; href: string; icon: string };
export const CONSOLES = {
  firebase: { name: "Firebase console", href: "https://console.firebase.google.com/", icon: "local_fire_department" },
  firebaseSettings: { name: "Firebase project settings (App ID)", href: "https://console.firebase.google.com/project/_/settings/general", icon: "settings" },
  appDistribution: { name: "Firebase App Distribution", href: "https://console.firebase.google.com/project/_/appdistribution", icon: "cloud_upload" },
  gcpApis: { name: "Google Cloud API Library", href: "https://console.cloud.google.com/apis/library", icon: "api" },
  gcpServiceAccounts: { name: "Google Cloud service accounts", href: "https://console.cloud.google.com/iam-admin/serviceaccounts", icon: "manage_accounts" },
  appStoreConnect: { name: "App Store Connect", href: "https://appstoreconnect.apple.com/", icon: "storefront" },
  ascApiKeys: { name: "App Store Connect API keys", href: "https://appstoreconnect.apple.com/access/integrations/api", icon: "key" },
  appleAccount: { name: "Apple Developer account (Team ID)", href: "https://developer.apple.com/account", icon: "badge" },
  teamsWeb: { name: "Microsoft Teams (web)", href: "https://teams.microsoft.com/", icon: "groups" },
  slackApps: { name: "Slack apps (incoming webhooks)", href: "https://api.slack.com/apps", icon: "forum" },
  githubActions: { name: "GitHub: your repositories", href: "https://github.com/", icon: "code" },
} satisfies Record<string, Console>;

export type ConsoleId = keyof typeof CONSOLES;
