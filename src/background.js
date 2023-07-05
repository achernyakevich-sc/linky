/*
Open current tab in available Containers.
*/
async function openCurrentTabInAvailableContainers(
  currentTabUrl,
  currentCookieStoreId,
  numberContainersInGroup,
  delayToOpenBetweenGroupsMSeconds,
  delayToOpenBetweenContainersMSeconds
) {
  const containers = await browser.contextualIdentities.query({});

  for (let i = 0; i < containers.length; i++) {
    let isNewGroup = (i !== 0 && i % 3 === 0) ? true : false;
    let delayToOpenContainers = isNewGroup ? i * delayToOpenBetweenContainersMSeconds + delayToOpenBetweenGroupsMSeconds : i * delayToOpenBetweenContainersMSeconds;
    console.log({'delayToOpenContainers': delayToOpenContainers});
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

/*
The click event listener, where we perform the appropriate action
when extension menu item ('Open in available Containers') was clicked.
*/
browser.menus.onClicked.addListener((info, tab) => {
  openCurrentTabInAvailableContainers(tab.url, tab.cookieStoreId, 3, 500, 1000);
});

/*
The click event listener, where we perform the appropriate action
when extension icon was clicked.
*/
browser.browserAction.onClicked.addListener((tab, OnClickData) => {
  openCurrentTabInAvailableContainers(tab.url, tab.cookieStoreId, 3, 500, 1000);
});
