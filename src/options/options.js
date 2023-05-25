document.querySelectorAll("[data-locale]").forEach((elem) => {
    elem.innerText = browser.i18n.getMessage(elem.dataset.locale);
});

const radioButtons = document.querySelectorAll('input[name="tab-group-1"]');
const optionsTitle = document.getElementById('options-title');
const shortcutClearBtnArray = document.querySelectorAll('.clear-button');
const shortcutResetBtnArray = document.querySelectorAll('.reset-button');
const inputsShortcutsArr = document.querySelectorAll('.shortcuts-input');
/*
Default settings. Initialize storage to these values.
*/

const defaultShortCutsArr = [
    {
        id: '_execute_browser_action',
        shortcut: 'Ctrl+Alt+U'
    }
]

let storedShortCutsArr = {
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
    if (!storedSettings.storedShortCutsArr) {
        browser.storage.local.set({storedShortCutsArr});
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

shortcutResetBtnArray.forEach((item) => {
    item.addEventListener('click',() => {
        let currentInput = item.parentNode.firstChild.nextSibling;
        let getDefaultShortCutsById = defaultShortCutsArr.filter((item) => item.id === currentInput.id);
        currentInput.value = getDefaultShortCutsById[0].shortcut;
    })
})

// shortcuts setup
inputsShortcutsArr.forEach((item) => {
    item.addEventListener('keydown', (e) => {
        console.log('keydown e', e);
        console.log('e.target', e.target);
        handleKeyDown(e)
    })
})


const normalizeKey = (key, keyCode) => {
    const alphabet = /^([a-z]|[A-Z])$/;
    if (alphabet.test(key)) return key.toUpperCase();

    const digit = /^[0-9]$/;
    const func = /^F([0-9]|1[0-2])$/;
    const homes = /^(Home|End|PageUp|PageDown|Insert|Delete)$/;
    if (digit.test(key) || func.test(key) || homes.test(key)) return key;

    const space = /^\s$/;
    if (space.test(key)) return "Space";

    const arrows = /^(ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/;
    if (arrows.test(key)) return key.split("Arrow")[1];

    const medias = /^(MediaPlayPause|MediaStop)$/;
    if (medias.test(key)) return key;
    if (key == "MediaTrackNext") return "MediaNextTrack";
    if (key == "MediaTrackPrevious") return "MediaPrevTrack";

    const keyCode0 = 48;
    if (keyCode0 <= keyCode && keyCode <= keyCode0 + 9) return keyCode - keyCode0;

    if (keyCode == 188) return "Comma";
    if (keyCode == 190) return "Period";

    return "";
};
const isMac = getOS() == "Mac OS";
function handleKeyDown(e) {
    if (e.repeat) return;
    if (e.key == "Tab") {
        window.document.activeElement.blur();
        return;
    }
    const normalizedKey = normalizeKey(e.key, e.keyCode);
    let error = "";

    const mediaKeys = /^(MediaPlayPause|MediaStop|MediaNextTrack|MediaPrevTrack)$/;
    const funcKeys = /^F([0-9]|1[0-2])$/;
    const modifierKeys = /^(Control|Alt|Shift|Meta)$/;

    if (mediaKeys.test(normalizedKey) || funcKeys.test(normalizedKey)) error = "";
    else if (modifierKeys.test(e.key)) error = "typeLetterMessage";
    else if (!e.ctrlKey && !e.altKey && !e.metaKey)
        error = isMac
            ? "includeMacModifierKeysMessage"
            : "includeModifierKeysMessage";
    else if (normalizedKey == "") error = "invalidLetterMessage";

    const value = `${e.ctrlKey ? (isMac ? "MacCtrl+" : "Ctrl+") : ""}${
        e.metaKey && isMac ? "Command+" : ""
    }${e.altKey ? "Alt+" : ""}${e.shiftKey ? "Shift+" : ""}${normalizedKey}`;

    // this.setState({ error: error, value: value || "" });
    const isValidShortcut = value != "" && error == "";
    if (isValidShortcut) updateShortcut(value);
    e.target.value = value;
}

async function updateShortcut(shortcut) {
    console.log('shortcut', shortcut)
    try {
        await browser.commands.update({ name: "_execute_browser_action", shortcut: shortcut });
        // this.setState({ shortcut: shortcut || "" });
    } catch (e) {
        // this.setState({ error: "invalidShortcutMessage" });
    }
}


function getOS() {
    var userAgent = window.navigator.userAgent,
        platform = window.navigator?.userAgentData?.platform || window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
        os = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
        os = 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = 'Windows';
    } else if (/Android/.test(userAgent)) {
        os = 'Android';
    } else if (/Linux/.test(platform)) {
        os = 'Linux';
    }

    return os;
}
