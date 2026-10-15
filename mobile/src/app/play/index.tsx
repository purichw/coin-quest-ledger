import { Home } from '../../character/Home';
import { PlayerGate } from '../../player/ui';

export default function HomeTab() {
  return <PlayerGate>{({ account, hero }) => <Home account={account} character={hero} />}</PlayerGate>;
}
