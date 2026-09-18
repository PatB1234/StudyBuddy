import { KatexOptions } from 'ngx-markdown';

// Shared maths options for every <markdown katex>.
// Don't set delimiters here: ngx-markdown shallow-merges over its own
// defaults, so passing an array replaces the full default list.
export const KATEX_OPTIONS: KatexOptions = {
    throwOnError: false,
};
