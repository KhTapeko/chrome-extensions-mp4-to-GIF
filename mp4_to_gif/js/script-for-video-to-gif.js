chrome.storage.local.get("enabled", (data) => {
    if (!data.enabled) {
        console.log("❌ 擴充功能已停用，腳本不執行");
        return;
    }

    console.log("✅ 擴充功能啟用中，開始執行腳本...");

    // **判斷是否為初始化頁面**
    if (location.href === "https://ezgif.com/video-to-gif/") {
        console.log("這是初始化頁面，停止執行腳本。");
        return;
    }

    console.log("正在監聽 #output 變化，準備解析檔案大小與圖片尺寸...");

    function executeOnce() {
        const fpsSelect = document.querySelector("#fps");
        if (!fpsSelect) {
            console.log("⏳ `#fps` 尚未出現，等待...");
            return false;
        }

        console.log("✅ 找到 `#fps`，開始執行一次性動作...");

        fpsSelect.value = "20";
        fpsSelect.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("✅ 已自動選擇 FPS: 20");

        setTimeout(() => {
            if (!data.enabled) {
                console.log("❌ 擴充功能停用，停止自動點擊");
                return;
            }
            const convertBtn = document.querySelector("input[name='video-to-gif']");
            if (convertBtn) {
                console.log("✅ 找到 Convert 按鈕，準備點擊...");
                convertBtn.click();
            } else {
                console.warn("❌ 找不到 Convert 按鈕");
            }
        }, 1000);

        return true;
    }

    let hasExecuted = executeOnce();

    // **監聽 DOM 變化，確保 `#fps` 出現時執行**
    const observer = new MutationObserver(() => {
        if (!hasExecuted && executeOnce()) {
            console.log("✅ `MutationObserver` 成功執行，斷開監聽");
            observer.disconnect();
            hasExecuted = true;
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // **監聽 #output 何時出現，解析檔案大小與圖片尺寸**
    const outputObserver = new MutationObserver(() => {
        const fileSizeElement = document.querySelector("#output .filestats strong");
        const fileStatsText = document.querySelector("#output .filestats")?.innerText;

        if (fileSizeElement && fileStatsText) {
            outputObserver.disconnect(); // 停止監聽

            const fileSizeText = fileSizeElement.innerText.trim();
            console.log("✅ 解析出的檔案大小:", fileSizeText);

            // 解析檔案大小
            const sizeMatch = fileSizeText.match(/([\d.]+)\s*(KiB|MiB)/);
            if (sizeMatch) {
                let sizeValue = parseFloat(sizeMatch[1]); // 數值部分
                let sizeUnit = sizeMatch[2]; // 單位（KiB 或 MiB）

                console.log(`✅ 解析後的大小: ${sizeValue} ${sizeUnit}`);

                // **解析 width 和 height**
                const dimensionMatch = fileStatsText.match(/width:\s*(\d+)px,\s*height:\s*(\d+)px/);
                let width = 9999, height = 9999; // 預設一個極大值，防止解析失敗

                if (dimensionMatch) {
                    width = parseInt(dimensionMatch[1]);
                    height = parseInt(dimensionMatch[2]);
                    console.log(`✅ 解析後的圖片尺寸: width=${width}px, height=${height}px`);
                } else {
                    console.warn("❌ 無法解析圖片尺寸");
                }

                if (sizeUnit === "KiB") {
                    console.log("✅ 檔案大小為 KiB，無需動作。");
                } else if (sizeUnit === "MiB") {
                    if (sizeValue > 8.0) {
                        console.log("⚠️ 檔案大於 8.0 MiB，進一步檢查尺寸...");

                        if (width >= 400 || height >= 400) {
                            console.log("⚠️ 圖片稍大 (width >= 400 或 height >= 400)，準備點擊 Resize 按鈕...");

                            // 找到 Resize 按鈕並點擊
                            setTimeout(() => {
                                const resizeLink = document.querySelector("#output td a[title='Resize image']");
                                if (resizeLink) {
                                    console.log("✅ 找到 Resize 按鈕，點擊中...");
                                    resizeLink.click();
                                } else {
                                    console.warn("❌ 找不到 Resize 按鈕");
                                }
                            }, 1000);
                        } else {
                            console.log("✅ 圖片大小適中 (width <= 400 且 height <= 400)，無需 Resize。");
                        }
                    } else {
                        console.log("✅ 檔案小於 8.0 MiB，無需動作。");
                    }
                }
            } else {
                console.warn("❌ 無法解析檔案大小");
            }
        }
    });

    outputObserver.observe(document.body, { childList: true, subtree: true });

    // **監聽 `background.js` 發送的 `toggleExtension` 訊息**
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "toggleExtension") {
            console.log(`🔄 擴充功能狀態更新：${message.enabled ? "啟用" : "停用"}`);

            if (message.enabled) {
                console.log("✅ 擴充功能重新啟用，立即執行一次");
                hasExecuted = executeOnce();
                observer.observe(document.body, { childList: true, subtree: true });
                outputObserver.observe(document.body, { childList: true, subtree: true });
            } else {
                console.log("❌ 擴充功能已停用，停止所有 MutationObserver");
                observer.disconnect();
                outputObserver.disconnect();
            }
        }
    });
});
