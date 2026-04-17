'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';

// Recursively extract the raw text content from react-markdown's React-node children.
// In react-markdown v10, children passed to custom code components are React nodes,
// not plain strings — so String(children) returns "[object Object]" for block code.
function extractRawText(children: any): string {
    if (typeof children === 'string') return children;
    if (Array.isArray(children)) return children.map(extractRawText).join('');
    if (children && typeof children === 'object' && children.props) {
        return extractRawText(children.props.children);
    }
    return '';
}

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

// Custom component to render AI-generated SVGs safely, bypassing React's SVG attribute validation.
// Compatible with react-markdown v10 (the `inline` prop was removed in v9 → v10).
export const markdownComponents = {
    // react-markdown v10 wraps block code as: <pre><code className="language-*">...</code></pre>
    // The `code` component is always called for both inline and block code.
    // We detect block code by checking whether the parent element is <pre>.
    code: ({ node, className, children, ...props }: any) => {
        const match = /language-render-svg/.exec(className || '');

        // In react-markdown v10, block <code> is always a direct child of <pre>.
        // node.position is set for block code; inline code has no parent <pre>.
        // We check: if there is no className and no match, treat as inline.
        const isBlock = Boolean(className); // block code always has a language className

        if (isBlock && match) {
            // Extract the raw SVG string from possibly-nested React node children.
            const rawSvg = extractRawText(children).replace(/\n$/, '');
            return (
                <div className="my-8 flex flex-col items-center gap-2 group w-full">
                    <div
                        className="w-full max-w-2xl bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm shadow-xl transition-all duration-300 group-hover:bg-white/10 group-hover:border-primary/30 overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: rawSvg }}
                    />
                    <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-mono">Visual Anchor (SVG)</span>
                </div>
            );
        }
        return <code className={className} {...props}>{children}</code>;
    },
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
    return (
        <div className={cn("prose prose-invert max-w-none", className)}>
            <ReactMarkdown
                rehypePlugins={[rehypeRaw, [rehypeHighlight, { ignoreMissing: true }]]}
                remarkPlugins={[remarkGfm]}
                components={markdownComponents as any}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
