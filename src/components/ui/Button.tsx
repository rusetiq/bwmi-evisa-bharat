import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { cn } from './cn'

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'orange-outline'

const variants: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  text: 'border-transparent px-0 underline underline-offset-4 hover:bg-transparent hover:text-[var(--ink)]',
  'orange-outline': 'border-[var(--orange)] text-[var(--graphite)] hover:bg-[#fbf1ed]',
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export function Button({ className, variant = 'primary', leadingIcon, trailingIcon, children, type = 'button', ...props }: ButtonProps) {
  return (
    <button className={cn('btn focus-ring', variants[variant], className)} type={type} {...props}>
      {leadingIcon}
      <span>{children}</span>
      {trailingIcon}
    </button>
  )
}

export type ButtonLinkProps = LinkProps & {
  variant?: ButtonVariant
  className?: string
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  children: ReactNode
}

export function ButtonLink({ className, variant = 'primary', leadingIcon, trailingIcon, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={cn('btn focus-ring', variants[variant], className)} {...props}>
      {leadingIcon}
      <span>{children}</span>
      {trailingIcon}
    </Link>
  )
}

export function InlineLink({ className, children, ...props }: LinkProps & { className?: string; children: ReactNode }) {
  return (
    <Link className={cn('link focus-ring rounded-lg', className)} {...props}>
      {children}
    </Link>
  )
}

export function IconButton({ className, children, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn('focus-ring inline-flex size-10 items-center justify-center rounded-lg border border-transparent hover:border-[var(--hairline)] hover:bg-[var(--linen)]', className)} type={type} {...props}>
      {children}
    </button>
  )
}
