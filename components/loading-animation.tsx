"use client"

interface LoadingAnimationProps {
    className?: string;
}

export const LoadingAnimation = ({ className }: LoadingAnimationProps) => {
    return (
        <div className={className}>
            <style>{`
                @keyframes loading-unmask {
                    0% { transform: translateX(30%); }
                    50% { transform: translateX(-30%); }
                    100% { transform: translateX(30%); }
                }
            `}</style>
            <img
                src="/loading.svg"
                alt="Loading..."
                className="w-full h-auto"
                style={{
                    filter: 'brightness(0) invert(59%) sepia(50%) saturate(2878%) hue-rotate(230deg) brightness(102%)',
                    WebkitMaskImage: 'linear-gradient(90deg, black 0%, black 30%, black 0%)',
                    maskImage: 'linear-gradient(90deg, black 0%, black 30%, black 0%)',
                    WebkitMaskSize: '200% 100%',
                    maskSize: '200% 100%',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    animation: 'loading-unmask 1.5s ease-in-out infinite',
                }}
            />
        </div>
    );
};
