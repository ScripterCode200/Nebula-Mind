'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface NeonButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const NeonButton = ({
    children,
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    ...props
}: NeonButtonProps) => {
    const variants = {
        primary: "bg-primary/10 text-primary border border-primary/50 hover:bg-primary/20 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]",
        secondary: "bg-secondary/10 text-secondary border border-secondary/50 hover:bg-secondary/20 hover:shadow-[0_0_20px_rgba(112,0,255,0.3)]",
        ghost: "bg-transparent text-muted hover:text-foreground hover:bg-white/5",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
    };

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            className={cn(
                "relative rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            )}
            {children}
        </motion.button>
    );
};

export default NeonButton;
