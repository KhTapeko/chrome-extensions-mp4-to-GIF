chrome.storage.local.get("enabled", (data) => {
    if (!data.enabled) {
        console.log("❌ 擴充功能已停用，腳本不執行");
        return;
    }

    console.log("✅ 擴充功能啟用中，開始執行 Resize 腳本...");

    function executeResize() {
        const percentageInput = document.querySelector("#percentage");
        if (!percentageInput) {
            console.log("⏳ `#percentage` 尚未出現，等待...");
            return false;
        }

        console.log("✅ 找到 `#percentage`，設定預設值為 80...");
        percentageInput.value = "80";

        // **觸發 `input` 和 `change` 事件，確保 `width` 和 `height` 更新**
        percentageInput.dispatchEvent(new Event("input", { bubbles: true }));
        percentageInput.dispatchEvent(new Event("change", { bubbles: true }));

        setTimeout(() => {
            if (!data.enabled) {
                console.log("❌ 擴充功能停用，停止自動點擊");
                return;
            }

            const resizeBtn = document.querySelector("input[name='resize-image']");
            if (resizeBtn) {
                console.log("✅ 找到 `Resize image!` 按鈕，準備點擊...");
                resizeBtn.click();
            } else {
                console.warn("❌ 找不到 `Resize image!` 按鈕");
            }
        }, 1000);

        return true;
    }

    let hasExecuted = executeResize();

    // **監聽 #output 何時出現，解析檔案大小與圖片尺寸**
    const outputObserver = new MutationObserver(() => {
        const fileSizeElement = document.querySelector("#output .filestats strong");
        const fileStatsText = document.querySelector("#output .filestats")?.innerText;

        if (fileSizeElement && fileStatsText) {
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
                            console.log("⚠️ 圖片稍大 (width >= 400 或 height >= 400)，減少 `percentage` 並重新 Resize...");

                            const percentageInput = document.querySelector("#percentage");
                            let newPercentage = Math.max(10, parseInt(percentageInput.value) - 10); // 最小值 10%
                            percentageInput.value = newPercentage.toString();

                            // 觸發 `input` 和 `change` 事件，確保 `width` 和 `height` 更新
                            percentageInput.dispatchEvent(new Event("input", { bubbles: true }));
                            percentageInput.dispatchEvent(new Event("change", { bubbles: true }));

                            setTimeout(() => {
                                const resizeBtn = document.querySelector("input[name='resize-image']");
                                if (resizeBtn) {
                                    console.log(`✅ 減少 percentage 為 ${newPercentage}%，重新點擊 Resize 按鈕...`);
                                    resizeBtn.click();
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
                hasExecuted = executeResize();
                outputObserver.observe(document.body, { childList: true, subtree: true });
            } else {
                console.log("❌ 擴充功能已停用，停止所有 MutationObserver");
                outputObserver.disconnect();
            }
        }
    });
});
