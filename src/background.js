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

let linkyConfig = DEFAULT_CONFIG;
const LINKY_ADD_ON_CONFIG = 'LINKY_ADD_ON_CONFIG';

// Set config values to storage when open add-on first time
browser.storage.local.get(LINKY_ADD_ON_CONFIG).then((data) => {
  if (!data.length) {
    browser.storage.local.set({ LINKY_ADD_ON_CONFIG: JSON.stringify(DEFAULT_CONFIG) });
  }
}).catch((error) => console.error(error));

/*
Open current tab in available Containers.
*/
async function openCurrentTabInAvailableContainers(
  currentTabUrl,
  currentCookieStoreId,
  numberContainersInGroup,
  delayToOpenBetweenGroupsMSeconds,
  delayToOpenBetweenContainersMSeconds,
) {
  // Preparing array with groups of containers
  const containers = await browser.contextualIdentities.query({});
  const otherContainers = containers.filter(container => container.cookieStoreId !== currentCookieStoreId);
  const containerGroups = [];
  for (let i = 0; i < otherContainers.length; i += numberContainersInGroup) {
    containerGroups.push(otherContainers.slice(i, i + numberContainersInGroup));
  }

  let totalDelay = 0;
  for (let j = 0; j < containerGroups.length; j++) {
    const currentGroup = containerGroups[j];
    for (let k = 0; k < currentGroup.length; k++) {
      const currentContainer = currentGroup[k];
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

function openContainersWithDelay(tab) {
  const delaySettings = linkyConfig.settings.containerTabsOpeningControl;
  openCurrentTabInAvailableContainers(
    tab.url,
    tab.cookieStoreId,
    delaySettings.numberOfContainersInGroup,
    delaySettings.groupsOpeningInterval,
    delaySettings.containersInGroupOpeningInterval,
  );
}

/*
The click event listener, where we perform the appropriate action
when extension menu item ('Open in available Containers') was clicked.
*/
browser.menus.onClicked.addListener((info, tab) => {
  openContainersWithDelay(tab);
});

/*
The click event listener, where we perform the appropriate action
when extension icon was clicked.
*/
browser.browserAction.onClicked.addListener((tab, OnClickData) => {
  openContainersWithDelay(tab);
});

function handleMessage(request, sender, sendResponse) {
  linkyConfig = request;
  sendResponse({ response: 'Response from background script' });
}

browser.runtime.onMessage.addListener(handleMessage);
