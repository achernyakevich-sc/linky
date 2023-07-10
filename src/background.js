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
  const containers = await browser.contextualIdentities.query({});
  const otherContainers = containers.filter(container => container.cookieStoreId !== currentCookieStoreId);
  let totalDelay = 0;

  otherContainers.forEach((container, index) => {
    const isNewGroup = (index !== 0 && (index + 1) % numberContainersInGroup === 0);
    if (isNewGroup) {
      totalDelay += Number(delayToOpenBetweenGroupsMSeconds);
    }

    setTimeout(() => {
      browser.tabs.create({
        cookieStoreId: container.cookieStoreId,
        url: currentTabUrl,
      });
    }, totalDelay);

    totalDelay += delayToOpenBetweenContainersMSeconds;
  });
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
    openCurrentTabInAvailableContainers(tab.url, tab.cookieStoreId, delaySettings.numberContainersInGroup, delaySettings.delayToOpenBetweenGroupsMSeconds, delaySettings.delayToOpenBetweenContainersMSeconds);
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
