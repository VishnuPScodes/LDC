import AppShell from './AppShell';
import LandingShell from './LandingShell';

export default function Home() {
  return <AppShell landing={<LandingShell />} />;
}
