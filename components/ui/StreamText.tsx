'use client';

import MarkdownRenderer from './MarkdownRenderer';

interface StreamTextProps {
    content: string;
    isStreaming?: boolean;
    onComplete?: () => void;
    className?: string;
}

export const StreamText: React.FC<StreamTextProps> = ({
    content,
    isStreaming = false,
    onComplete,
    className
}) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const indexRef = useRef(0);
    const contentRef = useRef(content);

    // Update ref when content changes
    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    useEffect(() => {
        // If not streaming, just show everything immediately (or if it's a history message)
        if (!isStreaming) {
            setDisplayedContent(content);
            indexRef.current = content.length;
            return;
        }

        const interval = setInterval(() => {
            const currentLength = indexRef.current;
            const targetContent = contentRef.current;

            if (currentLength < targetContent.length) {
                // Calculate how many characters to add based on backlog
                // If we are far behind, speed up
                const distance = targetContent.length - currentLength;
                const step = distance > 50 ? 5 : distance > 20 ? 2 : 1;

                setDisplayedContent(targetContent.slice(0, currentLength + step));
                indexRef.current = currentLength + step;
            } else {
                // Caught up
                if (onComplete) onComplete();
            }
        }, 15); // 15ms per update ~ 66fps

        return () => clearInterval(interval);
    }, [isStreaming, onComplete]); // We don't depend on 'content' here to avoid resetting interval on every chunk

    // Force update if content changed significantly and we are not streaming anymore
    useEffect(() => {
        if (!isStreaming && displayedContent !== content) {
            setDisplayedContent(content);
            indexRef.current = content.length;
        }
    }, [content, isStreaming, displayedContent]);

    return (
        <MarkdownRenderer 
            content={displayedContent} 
            className={className} 
        />
    );
};
