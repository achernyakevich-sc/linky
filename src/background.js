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

const defaultDelaySettings = {
  numberContainersInGroup: 3,
  delayToOpenBetweenGroupsMSeconds: 500,
  delayToOpenBetweenContainersMSeconds: 1000,
};

function openContainersWithDelay(tab) {
  browser.storage.local.get('storedDelaySettings').then((data) => {
    let delaySettings;
    if (data.storedDelaySettings) {
      delaySettings = data.storedDelaySettings;
    } else {
      delaySettings = defaultDelaySettings;
    }
    const numberContainersInGroup = Number(delaySettings.numberContainersInGroup);
    const delayToOpenBetweenGroupsMSeconds = Number(delaySettings.delayToOpenBetweenGroupsMSeconds);
    const delayToOpenBetweenContainersMSeconds = Number(delaySettings.delayToOpenBetweenContainersMSeconds);
    openCurrentTabInAvailableContainers(tab.url, tab.cookieStoreId, numberContainersInGroup, delayToOpenBetweenGroupsMSeconds, delayToOpenBetweenContainersMSeconds);
  });
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
