var DEFAULT_CONFIG = {
  "version": "0.2-SNAPSHOT",
  "updatedOn": "Tue Jul 11 2023 19:52:49 GMT+0300 (Moscow Standard Time)",
  "settings": {
    "shortcuts": [
      {
        "id": "_execute_browser_action",
        "shortcut": "Ctrl+Alt+L",
      },
    ],
    "containerTabsOpeningControl": {
      "numberOfContainersInGroup": 3,
      "containersInGroupOpeningInterval": 1000,
      "groupsOpeningInterval": 500,
    },
  },
};

let linkyConfig;
// TODO: renamed key variable -> LINKY_ADD_ON_CONFIG_STORAGE_KEY
const LINKY_ADD_ON_CONFIG = 'LINKY_ADD_ON_CONFIG';

// Set config values to storage when open add-on first time
browser.storage.local.get(LINKY_ADD_ON_CONFIG).then((data) => {
  if (Object.keys(data).length !== 0) {
    linkyConfig = JSON.parse(data.LINKY_ADD_ON_CONFIG);
  } else {
    browser.storage.local.set({ LINKY_ADD_ON_CONFIG: JSON.stringify(DEFAULT_CONFIG) }).then(() => {
      linkyConfig = DEFAULT_CONFIG;
    });
  }
}).catch((error) => console.error(error));

/*
Open current tab in available Containers.
*/
async function openCurrentTabInAvailableContainers(tab) {
  const currentTabUrl = tab.url;
  const currentCookieStoreId = tab.cookieStoreId;
  const numberContainersInGroup = linkyConfig.settings.containerTabsOpeningControl.numberOfContainersInGroup;
  const delayToOpenBetweenGroupsMSeconds = linkyConfig.settings.containerTabsOpeningControl.groupsOpeningInterval;
  const delayToOpenBetweenContainersMSeconds = linkyConfig.settings.containerTabsOpeningControl.containersInGroupOpeningInterval;
  const containers = (await browser.contextualIdentities.query({})).filter((container) => container.cookieStoreId !== currentCookieStoreId);

  // Preparing array with groups of containers
  const containerGroups = [];
  for (let i = 0; i < containers.length; i += numberContainersInGroup) {
    containerGroups.push(containers.slice(i, i + numberContainersInGroup));
  }

  let totalDelay = 0;
  for (let i = 0; i < containerGroups.length; i++) {
    const currentGroup = containerGroups[i];
    for (let j = 0; j < currentGroup.length; j++) {
      const currentContainer = currentGroup[j];
      setTimeout(() => {
        browser.tabs.create({
          cookieStoreId: currentContainer.cookieStoreId,
          url: currentTabUrl,
        });
      }, totalDelay);
      totalDelay += delayToOpenBetweenContainersMSeconds;
    }
    totalDelay += delayToOpenBetweenGroupsMSeconds;
  }
}

/*
Create the context menu item for browser tab - 'Open in available Containers'.
*/
browser.menus.create({
  id: 'linky',
  title: browser.i18n.getMessage('extensionContextMenuLink'),
  contexts: ['tab'],
});

/*
The click event listener, where we perform the appropriate action
when extension menu item ('Open in available Containers') was clicked.
*/
browser.menus.onClicked.addListener((info, tab) => {
  openCurrentTabInAvailableContainers(tab);
});

/*
The click event listener, where we perform the appropriate action
when extension icon was clicked.
*/
browser.browserAction.onClicked.addListener((tab, OnClickData) => {
  openCurrentTabInAvailableContainers(tab);
});

function handleMessage(request, sender, sendResponse) {
  linkyConfig = request;
  sendResponse({ response: 'Response from background script' });
}

browser.runtime.onMessage.addListener(handleMessage);
