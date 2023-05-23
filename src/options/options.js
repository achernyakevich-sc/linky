document.querySelectorAll("[data-locale]").forEach((elem) => {
    elem.innerText = browser.i18n.getMessage(elem.dataset.locale);
});

const radioButtons = document.querySelectorAll('input[name="tab-group-1"]');
const optionsTitle = document.getElementById('options-title');

radioButtons.forEach((item) => {
    item.addEventListener('click', () => {
        for (const radioButton of radioButtons) {
            if (radioButton.checked) {
                optionsTitle.innerText = radioButton.value;
                break;
            }
        }
    })
})
