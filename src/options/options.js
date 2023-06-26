document.querySelectorAll('[data-locale]').forEach((elem) => {
  const i18nElement = elem;
  i18nElement.innerText = browser.i18n.getMessage(i18nElement.dataset.locale);
});

const sidebarMenuTabs = document.querySelectorAll('input[name="tab-group-1"]');
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
    shortcut: 'Ctrl+Alt+L',
  },
];

/*
Generic error logger.
*/
function onError(e) {
  console.error(e);
}

function setShortCutsOnLoadPage(settings) {
  if (settings) {
    inputsShortcutsArr.forEach((item) => {
      const getShortcutElement = settings.storedShortCutsArr.find((el) => el.id === item.id);
      item.value = getShortcutElement.shortcut;
      browser.commands.update({
        name: item.id,
        shortcut: getShortcutElement.shortcut,
      });
    });
  } else {
    throw onError;
  }
}

/*
On startup, check whether we have stored settings.
If we don't, then store the default settings.
*/
async function checkStoredSettings(storedSettings) {
  if (!storedSettings.storedShortCutsArr) {
    browser.storage.local.set({ storedShortCutsArr: defaultShortCutsArr });
  }

  const settings = await browser.storage.local.get('storedShortCutsArr');

  await setShortCutsOnLoadPage(settings);
}

browser.storage.local.get().then(checkStoredSettings, onError);

sidebarMenuTabs.forEach((item) => {
  item.addEventListener('click', (e) => {
    if (e.target.checked) {
      optionsTitle.innerText = e.target.value;
    }
  });
});

// Clear button handler
shortcutClearBtnArray.forEach((item) => {
  const currentId = item.id.replace('_clear_btn', '');
  const currentInput = document.getElementById(currentId);
  const currentError = document.getElementById(`${currentId}_error`);
  item.addEventListener('click', () => {
    currentInput.value = '';
    browser.commands.update({ name: currentId, shortcut: '' });
    browser.storage.local.set({ storedShortCutsArr: [{ id: currentId, shortcut: '' }] });
    currentError.innerText = '';
  });
});

// Reset button handler
shortcutResetBtnArray.forEach((item) => {
  item.addEventListener('click', () => {
    const currentId = item.id.replace('_reset_btn', '');
    const currentInput = document.getElementById(currentId);
    const currentError = document.getElementById(`${currentId}_error`);
    const getDefaultShortCutsById = defaultShortCutsArr.find((el) => el.id === currentId);
    currentInput.value = getDefaultShortCutsById.shortcut;
    browser.commands.update({ name: currentId, shortcut: currentInput.value });
    browser.storage.local.set({ storedShortCutsArr: [{ id: currentId, shortcut: currentInput.value }] });
    currentError.innerText = '';
  });
});

function getOS() {
  const { userAgent } = window.navigator;
  const platform = window.navigator?.userAgentData?.platform || window.navigator.platform;
  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const iosPlatforms = ['iPhone', 'iPad', 'iPod'];

  if (macosPlatforms.indexOf(platform) !== -1) {
    return 'Mac OS';
  } if (iosPlatforms.indexOf(platform) !== -1) {
    return 'iOS';
  } if (windowsPlatforms.indexOf(platform) !== -1) {
    return 'Windows';
  } if (/Android/.test(userAgent)) {
    return 'Android';
  } if (/Linux/.test(platform)) {
    return 'Linux';
  }

  return null;
}
const isMac = getOS() === 'Mac OS';

const normalizeKey = (key, keyCode) => {
  const alphabet = /^([a-z]|[A-Z])$/;
  const digit = /^[0-9]$/;
  const func = /^F([0-9]|1[0-2])$/;
  if (alphabet.test(key) || digit.test(key) || func.test(key)) return key.toUpperCase();

  const homes = /^(Home|End|PageUp|PageDown|Insert|Delete)$/;
  if (homes.test(key)) return key;

  const space = /^\s$/;
  if (space.test(key)) return 'Space';

  const arrows = /^(ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/;
  if (arrows.test(key)) return key.split('Arrow')[1];

  const medias = /^(MediaPlayPause|MediaStop)$/;
  if (medias.test(key)) return key;
  if (key === 'MediaTrackNext') return 'MediaNextTrack';
  if (key === 'MediaTrackPrevious') return 'MediaPrevTrack';

  const keyCode0 = 48;
  if (keyCode0 <= keyCode && keyCode <= keyCode0 + 9) return keyCode - keyCode0;

  if (keyCode === 188) return 'Comma';
  if (keyCode === 190) return 'Period';

  return '';
};

function setShortcutsToStorageAndBrowserCommands(event, value) {
  browser.commands.update({ name: event.target.id, shortcut: value });
  browser.storage.local.set({ storedShortCutsArr: [{ id: event.target.id, shortcut: value }] });
}

function showErrorMessage(e, value) {
  const normalizedKey = normalizeKey(e.key, e.keyCode);
  const errorElement = document.getElementById(`${e.target.id}_error`);
  errorElement.innerText = '';
  const mediaKeys = /^(MediaPlayPause|MediaStop|MediaNextTrack|MediaPrevTrack)$/;
  const funcKeys = /^F([0-9]|1[0-2])$/;
  const modifierKeys = /^(Control|Alt|Shift|Meta)$/;

  if (mediaKeys.test(normalizedKey) || funcKeys.test(normalizedKey)) errorElement.innerText = '';
  else if (modifierKeys.test(e.key)) errorElement.innerText = browser.i18n.getMessage('typeLetterMessage');
  else if (!e.ctrlKey && !e.altKey && !e.metaKey) {
    errorElement.innerText = isMac
      ? errorElement.innerText = browser.i18n.getMessage('includeMacModifierKeysMessage')
      : errorElement.innerText = browser.i18n.getMessage('includeModifierKeysMessage');
  } else if (normalizedKey === '') errorElement.innerText = browser.i18n.getMessage('invalidLetterMessage');
  e.target.value = value || '';
}

function displayingInputValue(e) {
  const normalizedKey = normalizeKey(e.key, e.keyCode);
  const ctrlKeyMac = isMac ? 'MacCtrl+' : 'Ctrl+';
  const ctrlKey = e.ctrlKey ? ctrlKeyMac : '';
  const metaKey = e.metaKey && isMac ? 'Command+' : '';
  const altKey = e.altKey ? 'Alt+' : '';
  const shiftKey = e.shiftKey ? 'Shift+' : '';
  const value = `${ctrlKey}${metaKey}${altKey}${shiftKey}${normalizedKey}`;
  return value;
}

function handleKeyDown(e) {
  if (e.repeat) return;
  if (e.key === 'Tab') {
    window.document.activeElement.blur();
    return;
  }
  const errorElement = document.getElementById(`${e.target.id}_error`);
  const isValidShortcut = errorElement.innerText === '';

  const value = displayingInputValue(e);
  showErrorMessage(e, value);
  if (isValidShortcut) {
    setShortcutsToStorageAndBrowserCommands(e, value);
  }
}

// shortcuts setup
inputsShortcutsArr.forEach((item) => {
  item.addEventListener('keydown', (e) => {
    handleKeyDown(e);
  });
});
