import humanize from './humanize.js';
import detect from './detect.js';
import detectHumanize from './detectHumanize.js';
import create from './create.js';
import convert from './convert.js';
import edit from './edit.js';
import summarize from './summarize.js';

export const TOOLS = [detectHumanize, humanize, detect, create, convert, edit, summarize];

export const getTool = id => TOOLS.find(tool => tool.id === id) ?? null;
