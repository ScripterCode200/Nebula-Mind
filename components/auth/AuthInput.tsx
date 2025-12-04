'use client';

import React, { useState } from 'react';
import { LucideIcon, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: LucideIcon;
    label: string;
    error?: string;
}

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
    ({ className, icon: Icon, label, error, type = 'text', ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);
        const [showPassword, setShowPassword] = useState(false);
        const [hasValue, setHasValue] = useState(false);

        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

        return (
            <div className="space-y-1.5">
                <label className={cn(
                    "text-xs font-semibold ml-1 uppercase tracking-wider transition-colors duration-300",
                    isFocused ? "text-primary" : "text-muted"
                )}>
                    {label}
                </label>

                <div className="relative group">


                    {/* Background & Border */}
                    <div className={cn(
                        "absolute inset-0 rounded-xl border transition-all duration-300 pointer-events-none",
                        error
                            ? "border-red-500/50 bg-red-500/5"
                            : isFocused
                                ? "border-primary/50 bg-black/80"
                                : "border-white/10 bg-black/40 group-hover:border-white/20 group-hover:bg-black/60"
                    )} />

                    {/* Icon */}
                    {Icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                            <Icon
                                size={18}
                                className={cn(
                                    "transition-colors duration-300",
                                    error
                                        ? "text-red-400"
                                        : isFocused
                                            ? "text-primary"
                                            : "text-muted group-hover:text-white"
                                )}
                            />
                        </div>
                    )}

                    <input
                        ref={ref}
                        type={inputType}
                        className={cn(
                            "w-full p-3 bg-transparent rounded-xl py-3.5 text-sm text-white transition-all relative z-10 placeholder:text-muted/20 focus:outline-none",
                            Icon ? "pl-11" : "pl-4",
                            isPassword ? "pr-11" : "pr-4",
                            className
                        )}
                        onFocus={(e) => {
                            setIsFocused(true);
                            props.onFocus?.(e);
                        }}
                        onBlur={(e) => {
                            setIsFocused(false);
                            setHasValue(!!e.target.value);
                            props.onBlur?.(e);
                        }}
                        onChange={(e) => {
                            setHasValue(!!e.target.value);
                            props.onChange?.(e);
                        }}
                        {...props}
                    />

                    {/* Password Toggle */}
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={cn(
                                "absolute right-4 top-1/2 -translate-y-1/2 z-20 transition-colors duration-300",
                                isFocused ? "text-white" : "text-muted hover:text-white"
                            )}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] text-red-400 ml-1 font-medium"
                    >
                        {error}
                    </motion.p>
                )}

                {/* Autofill Fix Style */}
                <style jsx>{`
                    input:-webkit-autofill,
                    input:-webkit-autofill:hover, 
                    input:-webkit-autofill:focus, 
                    input:-webkit-autofill:active {
                        -webkit-box-shadow: 0 0 0 30px #0a0a0a inset !important;
                        -webkit-text-fill-color: white !important;
                        transition: background-color 5000s ease-in-out 0s;
                    }
                `}</style>
            </div>
        );
    }
);

AuthInput.displayName = 'AuthInput';

export default AuthInput;
