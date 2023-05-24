document.querySelectorAll("[data-locale]").forEach((elem) => {
    elem.innerText = browser.i18n.getMessage(elem.dataset.locale);
});

const radioButtons = document.querySelectorAll('input[name="tab-group-1"]');
const optionsTitle = document.getElementById('options-title');
const shortcutClearBtnArray = document.querySelectorAll('.clear-button');
/*
Default settings. Initialize storage to these values.
*/
let defaultShortCuts = {
    id: '_execute_browser_action',
    shortcut: 'Ctrl+Alt+U'
}

/*
Generic error logger.
*/
function onError(e) {
    console.error(e);
}

/*
On startup, check whether we have stored settings.
If we don't, then store the default settings.
*/
function checkStoredSettings(storedSettings) {
    if (!storedSettings.defaultShortCuts) {
        browser.storage.local.set({defaultShortCuts});
    }
}

const gettingStoredSettings = browser.storage.local.get();
gettingStoredSettings.then(checkStoredSettings, onError);

radioButtons.forEach((item) => {
    item.addEventListener('click', () => {
        for (const radioButton of radioButtons) {
            if (radioButton.checked) {
                optionsTitle.innerText = radioButton.value;
                break;
            }
        }
    })
});

shortcutClearBtnArray.forEach((item) => {
    item.addEventListener('click', () => {
        if (item.previousElementSibling.value) {
            item.previousElementSibling.value = ''
        }
    });
});
