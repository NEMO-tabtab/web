export const shareContent = async (text: string = "NEMO 웹사이트를 확인해보세요!") => {
    const url = window.location.href;
    const shareText = `${text}\n\n${url}`;
    
    try {
        // 네이티브 공유 API가 지원되는 경우 (모바일)
        if (navigator.share) {
            await navigator.share({
                title: 'NEMO',
                text: text,
                url: url,
            });
            return { success: true, method: 'native' };
        }
        
        // 클립보드에 복사
        await navigator.clipboard.writeText(shareText);
        return { success: true, method: 'clipboard' };
    } catch (error) {
        console.error('공유하기 실패:', error);
        return { success: false, error };
    }
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('클립보드 복사 실패:', error);
        return false;
    }
}; 