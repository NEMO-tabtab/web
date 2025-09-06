import { useState } from 'react';
import { shareContent } from '../utils/share';

interface UseShareOptions {
    defaultText?: string;
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

export const useShare = (options: UseShareOptions = {}) => {
    const [isSharing, setIsSharing] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    
    const { defaultText = "NEMO 웹사이트를 확인해보세요!", onSuccess, onError } = options;

    const share = async (customText?: string) => {
        setIsSharing(true);
        const text = customText || defaultText;
        
        try {
            const result = await shareContent(text);
            
            if (result.success) {
                setShowFeedback(true);
                setTimeout(() => setShowFeedback(false), 2000);
                onSuccess?.();
            } else {
                onError?.(result.error);
            }
        } catch (error) {
            onError?.(error);
        } finally {
            setIsSharing(false);
        }
    };

    const hideFeedback = () => setShowFeedback(false);

    return {
        isSharing,
        showFeedback,
        share,
        hideFeedback
    };
}; 