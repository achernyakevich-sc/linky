let globalConfig = {
  "version": "0.2-SNAPSHOT",
  "updatedOn": "Tue Jul 11 2023 19:52:49 GMT+0300 (Moscow Standard Time)",
  "settings": {
    "shortcuts": [
      {
        "id": "_execute_browser_action",
        "shortcut": "Ctrl+Alt+L",
      },
    ],
    "containerTabsOpeningControl" : {
      "numberOfContainersInGroup": 3,
      "containersInGroupOpeningInterval": 1000,
      "groupsOpeningInterval": 500,
    },
  },
};

function handleError(error) {
  console.log(`Error: ${error}`);
}
function handleResponse(message) {
  console.log(`Message from the background script: ${message.response}`);
}

function notifyBackgroundPage(e, config) {
  console.log('config in notifyBackgroundPage options.js', config);
  const sending = browser.runtime.sendMessage(config);
  sending.then(handleResponse, handleError);
}

// Update global config variable
function updateGlobalConfig(configJson) {
  globalConfig = configJson;
}

// Save settings
function saveSettings(configJson) {
  browser.storage.local.set({ config: JSON.stringify(globalConfig) }).then(
    updateGlobalConfig(configJson),
    handleError,
  );
}

document.querySelectorAll('[data-locale]').forEach((elem) => {
  const i18nElement = elem;
  i18nElement.innerText = browser.i18n.getMessage(i18nElement.dataset.locale);
});

const sidebarMenuTabs = document.querySelectorAll('input[name="tab-group-1"]');
const optionsTitle = document.getElementById('options-title');
const shortcutClearBtnArray = document.querySelectorAll('.clear-button');
const shortcutResetBtnArray = document.querySelectorAll('.reset-button');
const inputsShortcutsArr = document.querySelectorAll('.shortcuts-input');
const inputsDelaySettingsArr = document.querySelectorAll('.delay-settings-input');
const numberContainersInGroupInput = document.getElementById('number-containers-in-group');
const intervalBetweenContainersInput = document.getElementById('interval-between-containers');
const intervalBetweenGroupsInput = document.getElementById('interval-between-groups');

/*
Default settings for shortcuts - need for moment when user insert incorrect
values on options page
*/
const defaultShortCutsArr = [
  {
    id: '_execute_browser_action',
    shortcut: 'Ctrl+Alt+L',
  },
];

/*
Default settings for containerTabsOpeningControl - need for moment when user
insert incorrect values on options page
*/
const defaultContainerTabsOpeningControl = {
  'numberOfContainersInGroup': 3,
  'containersInGroupOpeningInterval': 1000,
  'groupsOpeningInterval': 500,
};

const settingsDelayMap = {
  'number-containers-in-group': 'numberOfContainersInGroup',
  'interval-between-containers': 'containersInGroupOpeningInterval',
  'interval-between-groups': 'groupsOpeningInterval',
};

/*
Generic error logger.
*/
function onError(e) {
  console.error(e);
}

function updateBrowserCommands(event, value) {
  browser.commands.update({ name: event, shortcut: value });
}

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
    updateBrowserCommands(currentId, '');
    currentError.innerText = '';
  });
});

// Reset button handler
shortcutResetBtnArray.forEach((item) => {
  const currentId = item.id.replace('_reset_btn', '');
  const currentInput = document.getElementById(currentId);
  const currentError = document.getElementById(`${currentId}_error`);
  const getDefaultShortCutsById = defaultShortCutsArr.find((el) => el.id === currentId);
  item.addEventListener('click', () => {
    currentInput.value = getDefaultShortCutsById.shortcut;
    updateBrowserCommands(currentId, currentInput.value);
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

function showErrorMessage(e) {
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
}

function validationDelayOptions(input, e) {
  const errorElement = document.getElementById(`${e.target.id}_error`);
  const inputValue = input.value;
  if (inputValue === '') {
    errorElement.innerText = 'Field can\'t be empty and should content number';
  } else {
    errorElement.innerText = '';
  }

  const isValid = errorElement.innerText === '';
  return isValid;
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

function checkAlreadyReservedCombination(value) {
  const reservedArray = ['Ctrl+Q', 'Ctrl+Z', 'Ctrl+X', 'Ctrl+D', 'Ctrl+C', 'Ctrl+V'];
  const reservedEl = reservedArray.find((element) => (element === value));
  if (reservedEl && reservedEl.length) {
    return true;
  }
  return false;
}

function handleKeyDown(e) {
  if (e.repeat) return;
  if (e.key === 'Tab') {
    window.document.activeElement.blur();
    return;
  }

  showErrorMessage(e);

  const value = displayingInputValue(e);
  const errorElement = document.getElementById(`${e.target.id}_error`);

  if (checkAlreadyReservedCombination(value)) {
    errorElement.innerText = browser.i18n.getMessage('invalidAlreadyReserved');
  }

  e.target.value = value || '';

  const isValidShortcut = errorElement.innerText === '';
  if (isValidShortcut) {
    updateBrowserCommands(e.target.id, value);
    const updatedConfig = globalConfig;
    updatedConfig.settings.shortcuts
      .filter((el) => el.id === e.target.id)
      .forEach((elem) => (elem.shortcut = e.target.value));
    saveSettings(updatedConfig);
    notifyBackgroundPage(e, updatedConfig);
  }
}

// shortcuts setup
inputsShortcutsArr.forEach((item) => {
  item.addEventListener('keydown', (e) => {
    handleKeyDown(e);
  });
});

// Settings tab Delay options
function handleInput(e) {
  const itemId = e.target.id;
  if (validationDelayOptions(e.target, e)) {
    const updatedConfig = globalConfig;
    updatedConfig.settings.containerTabsOpeningControl[settingsDelayMap[itemId]] = Number(e.target.value);
    saveSettings(updatedConfig);
    notifyBackgroundPage(e, updatedConfig);
  }
}

function handleBlur(e) {
  const itemId = e.target.id;
  const errorElement = document.getElementById(`${itemId}_error`);
  if (e.target.value === '') {
    e.target.value = defaultContainerTabsOpeningControl[settingsDelayMap[itemId]];
    // delaySettings[settingsDelayMap[itemId]] = e.target.value;
    errorElement.innerText = '';
  } else {
    const updatedConfig = globalConfig;
    updatedConfig.settings.containerTabsOpeningControl[settingsDelayMap[itemId]] = Number(e.target.value);
    saveSettings(updatedConfig);
    notifyBackgroundPage(e, updatedConfig);
  }
}

// Add event listeners to each item using the same functions
inputsDelaySettingsArr.forEach((item) => {
  item.addEventListener('input', handleInput);
  item.addEventListener('blur', handleBlur);
});

function setDelaySettingsOnLoadOptionPage(containerTabsOpeningControl) {
  numberContainersInGroupInput.value = containerTabsOpeningControl.numberOfContainersInGroup;
  intervalBetweenContainersInput.value = containerTabsOpeningControl.containersInGroupOpeningInterval;
  intervalBetweenGroupsInput.value = containerTabsOpeningControl.groupsOpeningInterval;
}

function setShortCutsOnLoadPage(shortcutsSettings) {
  if (shortcutsSettings.length) {
    inputsShortcutsArr.forEach((item) => {
      const getShortcutElement = shortcutsSettings.find((el) => el.id === item.id);
      item.value = getShortcutElement.shortcut;
      browser.commands.update({
        name: item.id,
        shortcut: getShortcutElement.shortcut,
      });
    });
  } else {
    onError();
  }
}

browser.storage.local.get('config').then((data) => {
  const delaySettings = JSON.parse(data.config).settings.containerTabsOpeningControl;
  const shortcutsSettings = JSON.parse(data.config).settings.shortcuts;
  saveSettings(JSON.parse(data.config));
  setDelaySettingsOnLoadOptionPage(delaySettings);
  setShortCutsOnLoadPage(shortcutsSettings);
}).catch((err) => {
  console.log('Error:', err);
});
