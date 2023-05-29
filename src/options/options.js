document.querySelectorAll("[data-locale]").forEach((elem) => {
    elem.innerText = browser.i18n.getMessage(elem.dataset.locale);
});

const radioButtons = document.querySelectorAll('input[name="tab-group-1"]');
const optionsTitle = document.getElementById("options-title");
const shortcutClearBtnArray = document.querySelectorAll(".clear-button");
const shortcutResetBtnArray = document.querySelectorAll(".reset-button");
const inputsShortcutsArr = document.querySelectorAll(".shortcuts-input");
/*
Default settings. Initialize storage to these values.
*/
const defaultShortCutsArr = [
    {
        id: "_execute_browser_action",
        shortcut: "Ctrl+Alt+L"
    }
]

let storedShortCutsArr = [
    {
        id: "",
        shortcut: ""
    }
]

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
    setShortCutsOnLoadPage();
}

function setShortCutsOnLoadPage() {
    inputsShortcutsArr.forEach((item) => {
        let getShortcutElement = storedShortCutsArr.filter((el) => el.id === item.id);
        let getDefaultShortCuts = defaultShortCutsArr.filter((el) => el.id === item.id)
        getShortcutElement.length ? (item.value = getShortcutElement.shortcut) : (item.value = getDefaultShortCuts[0].shortcut);
        browser.commands.update({ name: item.id, shortcut: getDefaultShortCuts[0].shortcut });
    })
}

const gettingStoredSettings = browser.storage.local.get();
gettingStoredSettings.then(checkStoredSettings, onError);

radioButtons.forEach((item) => {
    item.addEventListener("click", () => {
        for (const radioButton of radioButtons) {
            if (radioButton.checked) {
                optionsTitle.innerText = radioButton.value;
                break;
            }
        }
    })
});

// Clear button handler
shortcutClearBtnArray.forEach((item) => {
    item.addEventListener("click", () => {
        item.previousElementSibling.value = ""
        storedShortCutsArr.filter((el) => el.id === item.id);
        storedShortCutsArr[0].id = item.previousElementSibling.id;
        storedShortCutsArr[0].shortcut = "";
        browser.commands.update({ name: "_execute_browser_action", shortcut: "" });
        browser.storage.local.set({storedShortCutsArr});
    });
});

// Reset button handler
shortcutResetBtnArray.forEach((item) => {
    item.addEventListener("click",() => {
        let currentInput = item.parentNode.firstChild.nextSibling;
        let getDefaultShortCutsById = defaultShortCutsArr.filter((item) => item.id === currentInput.id);
        currentInput.value = getDefaultShortCutsById[0].shortcut;
        storedShortCutsArr.filter((el) => el.id === currentInput.id);
        storedShortCutsArr[0].shortcut = currentInput.value;
        storedShortCutsArr[0].id = currentInput.id;
        browser.commands.update({ name: "_execute_browser_action", shortcut: currentInput.value });
        browser.storage.local.set({storedShortCutsArr});
    })
})

// shortcuts setup
inputsShortcutsArr.forEach((item) => {
    item.addEventListener("keydown", (e) => {
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
    let error = e.target.parentNode.nextElementSibling.innerText = "";

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

    e.target.value = value || "";
    const isValidShortcut = error === "";

    if (isValidShortcut) {
        storedShortCutsArr.filter((el) => el.id === e.target.id);
        storedShortCutsArr[0].shortcut = e.target.value;
        storedShortCutsArr[0].id = e.target.id;
        browser.commands.update({ name: e.target.id, shortcut: value });
        browser.storage.local.set({storedShortCutsArr});
    } else {
        e.target.parentNode.nextElementSibling.innerText = 'Invalid shortcuts';
    }
}

function getOS() {
    let userAgent = window.navigator.userAgent,
        platform = window.navigator?.userAgentData?.platform || window.navigator.platform,
        macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"],
        windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"],
        iosPlatforms = ["iPhone", "iPad", "iPod"],
        os = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
        os = "Mac OS";
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = "iOS";
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = "Windows";
    } else if (/Android/.test(userAgent)) {
        os = "Android";
    } else if (/Linux/.test(platform)) {
        os = "Linux";
    }

    return os;
}
