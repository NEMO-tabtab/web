"use client";

import { useShare } from "../hooks/useShare";

interface ShareButtonProps {
  text?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  children?: React.ReactNode;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export default function ShareButton({
  text = "NEMO 웹사이트를 확인해보세요!",
  className = "",
  variant = 'primary',
  size = 'md',
  showIcon = true,
  children,
  onSuccess,
  onError
}: ShareButtonProps) {
  const { isSharing, showFeedback, share } = useShare({
    defaultText: text,
    onSuccess,
    onError
  });

  const baseClasses = "flex items-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-600 text-white hover:bg-gray-700",
    outline: "border border-blue-600 text-blue-600 hover:bg-blue-50"
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };

  const iconClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <div className="relative">
      <button
        onClick={() => share()}
        disabled={isSharing}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      >
        {isSharing ? (
          <>
            <svg className={`animate-spin ${iconClasses[size]}`} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            공유 중...
          </>
        ) : (
          <>
            {showIcon && (
              <svg className={iconClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            )}
            {children || "공유하기"}
          </>
        )}
      </button>

      {/* 피드백 메시지 */}
      {showFeedback && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg shadow-lg animate-fade-in whitespace-nowrap">
          클립보드에 복사되었습니다!
        </div>
      )}
    </div>
  );
} 