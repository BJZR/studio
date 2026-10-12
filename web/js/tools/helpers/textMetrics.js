const WORD = /[\p{L}\p{N}']+/gu;

export function textMetrics(text) {
  const words = text.toLowerCase().match(WORD) ?? [];
  const sentences = text.split(/(?<=[.!?…])\s+/).filter(sentence => sentence.trim());
  const lengths = sentences.map(sentence => (sentence.match(WORD) ?? []).length);

  const mean = lengths.reduce((sum, n) => sum + n, 0) / (lengths.length || 1);
  const variance = lengths.reduce((sum, n) => sum + (n - mean) ** 2, 0) / (lengths.length || 1);

  return {
    words: words.length,
    sentences: sentences.length,
    avgSentence: mean,
    variation: Math.sqrt(variance) / (mean || 1),
    lexicalDiversity: new Set(words).size / (words.length || 1),
  };
}
