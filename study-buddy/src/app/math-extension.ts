import { MarkedExtension, Tokens } from 'marked';

/* Keeps LaTeX intact through markdown parsing.
ngx-markdown runs marked first and KaTeX second, over the resulting DOM. */

interface MathToken extends Tokens.Generic {
    type: 'mathBlock' | 'mathInline';
    raw: string;
    text: string;
}

/** Escape so that markup characters inside a formula cannot become HTML. */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

const mathBlock = {
    name: 'mathBlock',
    level: 'block' as const,
    start(src: string) {
        return src.indexOf('$$');
    },
    tokenizer(src: string): MathToken | undefined {
        const match = /^\$\$([\s\S]+?)\$\$/.exec(src);
        if (!match) {
            return undefined;
        }
        return { type: 'mathBlock', raw: match[0], text: match[1] };
    },
    renderer(token: MathToken) {
        return `<p>$$${escapeHtml(token.text)}$$</p>\n`;
    },
};

const mathInline = {
    name: 'mathInline',
    level: 'inline' as const,
    start(src: string) {
        return src.indexOf('$');
    },
    tokenizer(src: string): MathToken | undefined {
        // Not $$ (that is the block rule), no unescaped $ inside, and the
        // closing $ must be on the same run of text.
        const match = /^\$(?!\$)((?:[^$\\]|\\.)+?)\$/.exec(src);
        if (!match) {
            return undefined;
        }
        return { type: 'mathInline', raw: match[0], text: match[1] };
    },
    renderer(token: MathToken) {
        return `$${escapeHtml(token.text)}$`;
    },
};

export const MATH_EXTENSION: MarkedExtension = {
    extensions: [mathBlock, mathInline],
};
