/* A function that takes an array of containers and a number of containers per group
  and returns an array of container groups
*/
function prepareArrayGroupsOfContainers(containers, numberContainersInGroup) {
  const containerGroups = [];
  let group = [];
  for (let i = 0; i < containers.length; i++) {
    group.push(containers[i]);
    if (group.length === numberContainersInGroup || i === containers.length - 1) {
      containerGroups.push(group);
      group = [];
    }
  }
  return containerGroups;
}

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
  const containerGroups = prepareArrayGroupsOfContainers(otherContainers, numberContainersInGroup);

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
