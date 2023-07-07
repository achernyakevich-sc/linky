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
  for (let i = 0; i < containers.length; i++) {
    const isNewGroup = (i !== 0 && i % numberContainersInGroup === 0);
    const delayToOpenContainers = isNewGroup ? i * delayToOpenBetweenContainersMSeconds + Number(delayToOpenBetweenGroupsMSeconds) : i * delayToOpenBetweenContainersMSeconds;
    (function (index) {
      setTimeout(function () {
        if (containers[i].cookieStoreId !== currentCookieStoreId) {
          browser.tabs.create({
            cookieStoreId: containers[i].cookieStoreId,
            url: currentTabUrl,
          });
        }
      }, delayToOpenContainers);
    })(i);
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
