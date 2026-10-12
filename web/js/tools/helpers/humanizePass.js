import { collect } from '../../providers/collect.js';
import humanize from '../humanize.js';

export function humanizePass(provider, text, { tone, level, signals }, { signal, onText }) {
  const notes = signals.length ? `Elimina especialmente estas señales detectadas: ${signals.join('; ')}.` : '';
  const { system, user } = humanize.build({ tone, level, notes }, text);
  return collect(provider, {
    system,
    messages: [{ role: 'user', content: user }],
    signal,
    onToken: (_, full) => onText(full),
  });
}
