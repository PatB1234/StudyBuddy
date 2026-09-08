import { KatexOptions } from 'ngx-markdown';

/**
 * Shared maths options for every <markdown katex> in the app.
 *
 * Deliberately does NOT set `delimiters`. ngx-markdown merges this over its
 * own DEFAULT_KATEX_OPTIONS with a shallow spread, so supplying a delimiters
 * array replaces the default list wholesale rather than adding to it. Those
 * defaults already cover $...$, $$...$$, \(...\), \[...\] and the five
 * \begin{} environments, which is everything the model actually emits.
 *
 * throwOnError:false only changes what happens to a malformed expression: it
 * is shown in errorColor instead of throwing and being logged to the console.
 */
export const KATEX_OPTIONS: KatexOptions = {
    throwOnError: false,
};
