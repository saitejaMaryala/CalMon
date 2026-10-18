import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Mascot } from './Mascot';
import { Txt } from './ui';

const LINES = [
  'Looking at your plate…',
  'Identifying each food…',
  'Estimating portions…',
  'Crunching the numbers…',
  'Planning your next meal…',
];

export function AnalyzingLoader({ lines = LINES }: { lines?: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % lines.length), 2200);
    return () => clearInterval(t);
  }, [lines]);
  return (
    <View style={{ alignItems: 'center', gap: 16, paddingVertical: 32 }}>
      <Mascot size={96} mood="yum" bounce />
      <Txt variant="h2">{lines[i % lines.length]}</Txt>
      <Txt variant="caption">This usually takes a few seconds</Txt>
    </View>
  );
}
