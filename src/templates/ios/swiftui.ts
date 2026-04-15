export function renderProjectYml(projectName: string) {
  return `name: ${projectName}
options:
  bundleIdPrefix: com.example
  deploymentTarget:
    iOS: "17.0"
targets:
  ${projectName}:
    type: application
    platform: iOS
    sources:
      - ${projectName}
    info:
      path: ${projectName}/Info.plist
      properties:
        CFBundleDisplayName: ${projectName}
        CFBundleVersion: "1"
        CFBundleShortVersionString: "1.0.0"
        UILaunchScreen: {}
`;
}

export function renderInfoPlist(projectName: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key>
  <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>${projectName}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSRequiresIPhoneOS</key>
  <true/>
  <key>UILaunchScreen</key>
  <dict/>
  <key>UISupportedInterfaceOrientations</key>
  <array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string>
  </array>
</dict>
</plist>
`;
}

export function renderAppSwift(projectName: string) {
  return `import SwiftUI

@main
struct ${projectName}App: App {
  var body: some Scene {
    WindowGroup {
      ContentView()
    }
  }
}
`;
}

export function renderContentView(projectName: string) {
  return `import SwiftUI

struct ContentView: View {
  var body: some View {
    VStack(spacing: 16) {
      Text("${projectName}")
        .font(.largeTitle)
        .fontWeight(.bold)
      Text("Scaffolded with create-dushin-stack")
        .font(.subheadline)
        .foregroundStyle(.secondary)
    }
    .padding()
  }
}

#Preview {
  ContentView()
}
`;
}
