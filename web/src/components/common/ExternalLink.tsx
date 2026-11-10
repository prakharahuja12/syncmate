import * as React from 'react';
import { ExternalLink as ExternalIcon } from 'lucide-react';

export interface ExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  showIcon?: boolean;
}

export const ExternalLink: React.FC<ExternalLinkProps> = ({
  href,
  children,
  className = '',
  showIcon = true,
  ...props
}) => {
  const isValidUrl = /^https?:\/\/.+/i.test(href);

  if (!isValidUrl) {
    return <span className={className}>{children}</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 font-medium hover:underline text-primary ${className}`}
      {...props}
    >
      <span>{children}</span>
      {showIcon && <ExternalIcon className="h-3 w-3 inline shrink-0" aria-hidden="true" />}
    </a>
  );
};

