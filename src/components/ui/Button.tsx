import { Loader2 } from 'lucide-react';
import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    fullWidth?: boolean;
    children?: React.ReactNode;
}

/**
 * Componente de Botão reutilizável com variantes de estilo
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    fullWidth = false,
    className = '',
    ...props
}, ref) => {

    // Base styles applied to all buttons
    const baseStyles = "inline-flex items-center justify-center rounded-full font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-target";

    // Variants map - usando cores Ly Vest (#800020 - Vermelho Carmesim)
    const variants: Record<ButtonVariant, string> = {
        primary: "bg-lyvest-500 hover:bg-lyvest-600 text-white focus:ring-[#800020]",
        secondary: "bg-red-100 hover:bg-red-200 text-lyvest-500 focus:ring-red-300",
        outline: "border-2 border-lyvest-500 text-lyvest-500 hover:bg-lyvest-100/30 focus:ring-[#800020]",
        ghost: "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-lyvest-500 focus:ring-slate-300",
        danger: "bg-lyvest-100/300 hover:bg-red-600 text-white focus:ring-red-400",
    };

    // Sizes map
    const sizes: Record<ButtonSize, string> = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-6 py-2.5 text-sm",
        lg: "px-8 py-3.5 text-base",
        icon: "p-2", // For icon-only buttons
    };

    const variantStyles = variants[variant] || variants.primary;
    const sizeStyles = sizes[size] || sizes.md;
    const widthStyles = fullWidth ? 'w-full' : '';

    return (
        <button
            ref={ref}
            disabled={disabled || isLoading}
            className={`${baseStyles} ${variantStyles} ${sizeStyles} ${widthStyles} ${className}`}
            {...props}
        >
            {isLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
