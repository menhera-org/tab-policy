
import {SetMap} from '/lib/SetMap.mjs';

const tabsByWindow = new SetMap;
const windowByTab = new Map;

const activeTabByWindow = new Map;
const tabInfo = new Map;

const getActiveUrl = (windowId) => {
	if (!activeTabByWindow.has(windowId)) {
		return 'about:blank';
	}
	const activeTabId = activeTabByWindow.get(windowId);
	if (!tabInfo.has(activeTabId)) {
		return 'about:blank';
	}
	return tabInfo.get(activeTabId).url;
};

const updateShownTabs = async (windowId, activeUrl) => {
	const activeOrigin = new URL(activeUrl).origin;
	const tabs = await browser.tabs.query({windowId});
	for (const tab of tabs) {
		if (tab.pinned) continue;
		const url = new URL(tab.url);
		const origin = url.origin;
		if (origin !== activeOrigin) {
			browser.tabs.hide(tab.id).then(() => {
				//console.log('tab hidden:', tab.id);
			}).catch(e => {
				console.error(e);
			});
		} else {
			browser.tabs.show(tab.id).then(() => {
				//console.log('tab shown:', tab.id);
			}).catch(e => {
				console.error(e);
			});
		}
	}
};

browser.tabs.onCreated.addListener((tab) => {
	tabsByWindow.set(tab.windowId, tab.id);
	windowByTab.set(tab.id, tab.windowId);
	if (tab.active) {
		activeTabByWindow.set(tab.windowId, tab.id);
	}
});

browser.tabs.onDetached.addListener((tabId, detachInfo) => {
	tabsByWindow.deleteValue(detachInfo.oldWindowId, tabId);
});

browser.tabs.onAttached.addListener(async (tabId, {newWindowId}) => {
	try {
		//
		tabsByWindow.set(newWindowId, tabId);
		windowByTab.set(tabId, newWindowId);
	} catch (e) {
		console.error(e);
	}
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, updatedTab) => {
	try {
		if (changeInfo.url) {
			if (updatedTab.discarded || !updatedTab.url) {
				// ignore
			} else {
				const url = updatedTab.url;
				const origin = new URL(url).origin;
				if ('null' === origin) {
					console.log('null origin:', url);
				}
				if (url !== 'about:blank') {
					tabInfo.set(tabId, {
						id: tabId,
						origin,
						url,
					});
				}
				if (updatedTab.active) {
					await updateShownTabs(updatedTab.windowId
						, tabInfo.has(tabId) ? tabInfo.get(tabId).url : 'about:blank');
				}
			}
			
		}
	} catch (e) {
		console.error(e);
	}
});

browser.tabs.query({}).then(tabs => {
	for (const tab of tabs) {
		if (tab.active) {
			activeTabByWindow.set(tab.windowId, tab.id);
		}
		tabsByWindow.set(tab.windowId, tab.id);
		windowByTab.set(tab.id, tab.windowId);
		const origin = new URL(tab.url || 'about:blank').origin;
		tabInfo.set(tab.id, {
			id: tab.id,
			origin,
			url: tab.url || 'about:blank',
		});
	}
}).catch(e => {
	console.error(e);
});

browser.tabs.onActivated.addListener(async ({previousTabId, tabId, windowId}) => {
	const activeTab = await browser.tabs.get(tabId);
	activeTabByWindow.set(windowId, tabId);
	if (activeTab.discarded || activeTab.url === 'about:blank') return;
	const activeOrigin = new URL(activeTab.url).origin;
	console.log('active origin:', activeOrigin, activeTab.url);
	await updateShownTabs(windowId, activeTab.url);
	
});

