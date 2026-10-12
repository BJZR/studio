import { streamChat } from '../providers/registry.js';

// ctx: { provider, signal, onToken, setOutput, step, report }
export function runTool(tool, values, input, ctx) {
  if (tool.run) return tool.run(input, values, ctx);

  const { system, user } = tool.build(values, input);
  return streamChat(ctx.provider, {
    system,
    messages: [{ role: 'user', content: user }],
    signal: ctx.signal,
    onToken: ctx.onToken,
  });
}
