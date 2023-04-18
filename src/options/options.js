async function setUpCheckBoxes() {
    document.querySelectorAll("[data-permission-id]").forEach(async(el) => {
        const permissionId = el.dataset.permissionId;
        const permissionEnabled = await browser.permissions.contains({ permissions: [permissionId] });
        el.checked = !!permissionEnabled;
    });
}

function disablePermissionsInputs() {
    document.querySelectorAll("[data-permission-id]").forEach(el => {
        el.disabled = true;
    });
}

function enablePermissionsInputs() {
    document.querySelectorAll("[data-permission-id]").forEach(el => {
        el.disabled = false;
    });
}

document.querySelectorAll("[data-permission-id]").forEach(async(el) => {
    const permissionId = el.dataset.permissionId;
    el.addEventListener("change", async() => {
        if (el.checked) {
            disablePermissionsInputs();
            const granted = await browser.permissions.request({ permissions: [permissionId] });
            if (!granted) {
                el.checked = false;
                enablePermissionsInputs();
            }
            return;
        }
        await browser.permissions.remove({ permissions: [permissionId] });
    });
});

async function resetPermissionsUi() {
    await setUpCheckBoxes();
    enablePermissionsInputs();
}

browser.permissions.onAdded.addListener(resetPermissionsUi);
browser.permissions.onRemoved.addListener(resetPermissionsUi);

document.querySelectorAll("[data-locale]").forEach((elem) => {
    elem.innerText = browser.i18n.getMessage(elem.dataset.locale);
});

resetPermissionsUi();
