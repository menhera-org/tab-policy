browser.pageAction.onClicked.addListener((tab) => {
	browser.tabs.hide(tab.id);
});
