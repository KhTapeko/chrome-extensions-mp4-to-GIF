chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ enabled: true });
});

chrome.action.onClicked.addListener(() => {
    chrome.storage.local.get("enabled", (data) => {
        const newState = !data.enabled;

        chrome.storage.local.set({ enabled: newState }, () => {
            if (chrome.runtime.lastError) {
                console.error("❌ 儲存擴充功能狀態時發生錯誤:", chrome.runtime.lastError);
                return;
            }

            const iconPath = newState ? "icons/icon16.png" : "icons/icon16_disabled.png";
            chrome.action.setIcon({ path: iconPath });

            console.log(`🔄 擴充功能已 ${newState ? "啟用" : "停用"}`);

            chrome.tabs.query({}, (tabs) => {
                for (let tab of tabs) {
                    if (tab.url && tab.url.startsWith("http")) {
                        chrome.tabs.sendMessage(tab.id, { action: "toggleExtension", enabled: newState }, () => {
                            if (chrome.runtime.lastError) {
                                console.warn(`⚠️ 無法向分頁 ${tab.id} 發送訊息:`, chrome.runtime.lastError.message);
                            }
                        });
                    }
                }
            });
        });
    });
});
