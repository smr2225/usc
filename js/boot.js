// js/boot.js
(function() {
    const currentScript = document.currentScript;
    if (!currentScript) return;
    
    // Берем абсолютный путь, по которому браузер загрузил boot.js
    const bootSrc = currentScript.src;
    const bootDir = bootSrc.substring(0, bootSrc.lastIndexOf('/js/') + 4); // .../js/
    const rootDir = bootDir.replace('js/', ''); // .../

    // Строгий порядок загрузки
    const coreScripts = [
        rootDir + 'main.js',
        bootDir + 'trns.js',
        bootDir + 'layout.js',
        bootDir + 'quot.js',
        bootDir + 'embl.js'
    ];

    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = url;
            s.onload = () => resolve(url);
            s.onerror = () => reject(new Error(`Ошибка загрузки: ${url}`));
            document.head.appendChild(s);
        });
    }

    // Загружаем по цепочке
    (async () => {
        for (const url of coreScripts) {
            try {
                await loadScript(url);
            } catch (e) {
                console.error(e);
            }
        }
    })();
})();