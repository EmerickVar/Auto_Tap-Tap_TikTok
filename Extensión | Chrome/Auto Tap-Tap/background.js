chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['totalTapTaps'], result => {
        if (!result.totalTapTaps) {
            chrome.storage.local.set({ totalTapTaps: 0 });
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const actions = {
        started: () => {
            chrome.action.setBadgeText({ text: 'ON' });
            chrome.action.setBadgeBackgroundColor({ color: '#00ff88' });
        },
        stopped: () => {
            chrome.action.setBadgeText({ text: '' });
        }
    };
    
    if (actions[request.action]) {
        actions[request.action]();
    }
});