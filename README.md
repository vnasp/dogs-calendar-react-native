npm install
npx expo prebuild --platform ios --clean
cd ios && pod install --repo-update && cd ..
open ios/PewosApp.xcworkspace
