import { StatusBar } from 'expo-status-bar';
import MainNavegator from './src/navigation/MainNavigators'

export default function App() {
  return (
    <>
      <StatusBar hidden={false} />
      <MainNavegator />
    </>
  );
}

