// Re-export the mobile app entry so Expo's default AppEntry can find it
// in a monorepo where the actual app lives in the `mobile/` folder.
import App from './mobile/App';

export default App;
