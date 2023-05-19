document.querySelectorAll("[data-locale]").forEach((elem) => {
    elem.innerText = browser.i18n.getMessage(elem.dataset.locale);
});

function openSection(event, sectionName) {
    let sectionContent = document.getElementsByClassName("section-content");
    for (let i = 0; i < sectionContent.length; i++) {
        sectionContent[i].style.display = "none";
        sectionContent[i].className = sectionContent[i].className.replace(" active", "");
    }

    let sidebarLinks = document.getElementsByClassName("sidebar-link");
    for (let i = 0; i < sidebarLinks.length; i++) {
        sidebarLinks[i].className = sidebarLinks[i].className.replace(" active", "");
    }

    document.getElementById(sectionName).style.display = "block";
    event.currentTarget.className += " active";
}

const sideBarItemsArray = document.querySelectorAll('.sidebar-link');

// TODO
sideBarItemsArray.forEach(function(item) {
    item.addEventListener('click', {
        handleEvent(event) {
            openSection(event, event.target.innerHTML);
            console.log('1');
        }
    });

    // item.addEventListener('click',
    //     openSection(event, event.target.innerHTML)
    // );
})
