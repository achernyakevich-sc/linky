/*
Open current tab in available Containers.
*/
async function openCurrentTabInAvailableContainers(
    currentTabUrl,
    currentCookieStoreId
) {
    // Checks is CurrentTabURL open in reading mode
    if ( !/^(javascript|place):/i.test(currentTabUrl)) {
        const openInReaderMode = currentTabUrl.startsWith("about:reader");
        const containers = await browser.contextualIdentities.query({});

        if (openInReaderMode) {
            try {
                const parsed = new URL(currentTabUrl);
                currentTabUrl = parsed.searchParams.get("url") + parsed.hash;
            } catch (err) {
                return err.message;
            }
            containers.forEach(function (container) {
                if (container.cookieStoreId !== currentCookieStoreId) {
                    browser.tabs.create({
                        cookieStoreId: container.cookieStoreId,
                        url: currentTabUrl,
                        openInReaderMode: openInReaderMode,
                    });
                }
            });
        } else {
            containers.forEach(function (container) {
                if (container.cookieStoreId !== currentCookieStoreId) {
                    browser.tabs.create({
                        cookieStoreId: container.cookieStoreId,
                        url: currentTabUrl,
                    });
                }
            });
        }
    }
}

/*
Create the context menu item for browser tab - 'Open in available Containers'.
*/
browser.menus.create({
    id: "linky",
    title: browser.i18n.getMessage("extensionContextMenuLink"),
    contexts: ["tab"],
});

/*
Create the context menu item for Bookmarks menu - 'Open in available Containers'.
*/
browser.menus.create({
    id: "linky-open-bookmark",
    title: browser.i18n.getMessage("extensionContextMenuLinkinBookmarksMenu"),
    contexts: ["bookmark"],
});

/*
The click event listener, where we perform the appropriate action
when extension menu item ('Open in available Containers') was clicked.
*/
browser.menus.onClicked.addListener((info, tab) => {
    if (tab) {
        openCurrentTabInAvailableContainers(tab.url, tab.cookieStoreId);
    } else {
        onClickedBookmark(info);
    }
});

/*
The click event listener, where we perform the appropriate action
when extension icon was clicked.
*/
browser.browserAction.onClicked.addListener((tab, OnClickData) => {
    openCurrentTabInAvailableContainers(tab.url, tab.cookieStoreId);
});

/* The click event listener, where we perform the appropriate action
when context menu item ('Open in available Containers') was clicked
from Bookmarks menu.
*/

async function onClickedBookmark(info){
    async function _getBookmarksFromInfo(info) {
        const [bookmarkTreeNode] =
            await browser.bookmarks.get(info.bookmarkId);
        if (bookmarkTreeNode.type === "folder") {
            return browser.bookmarks.getChildren(bookmarkTreeNode.id);
        }
        return [bookmarkTreeNode];
    }

    const bookmarks = await _getBookmarksFromInfo(info);
    for (const bookmark of bookmarks) {
        // Some checks on the urls from
        // https://github.com/Rob--W/bookmark-container-tab/ thanks!
        if ( !/^(javascript|place):/i.test(bookmark.url) &&
            bookmark.type !== "folder") {
            const openInReaderMode = bookmark.url.startsWith("about:reader");
            if (openInReaderMode) {
                try {
                    const parsed = new URL(bookmark.url);
                    bookmark.url = parsed.searchParams.get("url") + parsed.hash;
                } catch (err) {
                    return err.message;
                }
            }

            const containers = await browser.contextualIdentities.query({});
            containers.forEach(function (container) {
                browser.tabs.create({
                    cookieStoreId: container.cookieStoreId,
                    url: bookmark.url,
                    openInReaderMode: openInReaderMode
                });
            });
        }
    }
}
