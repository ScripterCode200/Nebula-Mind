'use client';

import { useState, useEffect } from "react";

export interface TypewriterEffectProps {
    words: {
        text: string;
        className?: string;
    }[];
    className?: string;
    cursorClassName?: string;
}

export const TypewriterEffect = ({
    words,
    className,
    cursorClassName,
}: TypewriterEffectProps) => {
    const [text, setText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);

    useEffect(() => {
        const i = loopNum % words.length;
        const fullText = words[i].text;

        const handleTyping = () => {
            setText(
                isDeleting
                    ? fullText.substring(0, text.length - 1)
                    : fullText.substring(0, text.length + 1)
            );

            // Determine next speed
            let delta = 200 - Math.random() * 100;
            if (isDeleting) delta /= 2;

            if (!isDeleting && text === fullText) {
                // Finished typing word
                delta = 2000; // Pause at end
                setIsDeleting(true);
            } else if (isDeleting && text === "") {
                // Finished deleting
                setIsDeleting(false);
                setLoopNum(loopNum + 1);
                delta = 500; // Pause before next word
            }

            setTypingSpeed(delta);
        };

        const timer = setTimeout(handleTyping, typingSpeed);

        return () => clearTimeout(timer);
    }, [text, isDeleting, loopNum, typingSpeed, words]);

    const currentWordIndex = loopNum % words.length;
    const currentClass = words[currentWordIndex]?.className || "";

    return (
        <div className={`inline-block ${className}`}>
            <span className={currentClass}>{text}</span>
            <span className={`inline-block w-[2px] h-[1em] bg-current ml-1 align-middle animate-blink ${cursorClassName}`}></span>
        </div>
    );
};
