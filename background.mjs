// vim: ts=4 noet ai

import {SetMap} from '/lib/SetMap.mjs';

const tabsByWindow = new SetMap;
const windowByTab = new Map;

const activeTabByWindow = new Map;
const activeDomainByWindow = new Map;
const tabInfo = new Map;

const registrableDomains = new Set;

browser.runtime.onMessage.addListener((message) => {
	if (message.command == 'registrable_domain') {
		console.log('registrable domain:', message.domain);
		registrableDomains.add(message.domain);
	}
});

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

const addTab = (tab) => {
	const url = tab.url || 'about:blank';
	const origin = new URL(url).origin;
	const domain = origin == 'null' ? null : new URL(origin).hostname;
	tabInfo.set(tab.id, {
		id: tab.id,
		origin,
		domain,
		url,
	})
};

let lastActiveOrigin = 'null';


window.tabController = {
	//
	async updateTabInformation()
	{
		//
		const tabs = await browser.tabs.query({});
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
	},
	getLastActiveOriginByWindow(windowId)
	{
		//
	},
	getShownOriginByWindow(windowId)
	{
		//
	},
	setShownOriginByWindow(windowId, origin)
	{
		//
	},
	getOriginsByWindow(windowId)
	{
		//
	},
	async updateShownTabOnWindow(windowId)
	{
		//
		const activeUrl = getActiveUrl(windowId);
		const activeOrigin = new URL(activeUrl).origin;
		const tabs = await browser.tabs.query({windowId});
		const promises = [];
		for (const tab of tabs) {
			if (tab.pinned) continue;
			const url = new URL(tab.url);
			const origin = url.origin;
			if (origin !== activeOrigin) {
				promises.push(browser.tabs.hide(tab.id));
			} else {
				promises.push(browser.tabs.show(tab.id));
			}
		}
		await Promise.all(promises);
	},
};

browser.tabs.onCreated.addListener((tab) => {
	tabsByWindow.set(tab.windowId, tab.id);
	windowByTab.set(tab.id, tab.windowId);
	if (tab.active) {
		activeTabByWindow.set(tab.windowId, tab.id);
	}
});

browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
	const {isWindowClosing, windowId} = removeInfo;
	tabInfo.delete(tabId);
	tabsByWindow.deleteValue(windowId, tabId);
	windowByTab.delete(tabId);
	if (isWindowClosing) {
		tabsByWindow.delete(windowId);
	}
})

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
					await tabController.updateShownTabOnWindow(updatedTab.windowId);
				}
			}
			
		}
	} catch (e) {
		console.error(e);
	}
});

tabController.updateTabInformation();

browser.tabs.onActivated.addListener(async ({previousTabId, tabId, windowId}) => {
	const activeTab = await browser.tabs.get(tabId);
	activeTabByWindow.set(windowId, tabId);
	if (activeTab.discarded || activeTab.url === 'about:blank') return;
	const activeOrigin = new URL(activeTab.url).origin;
	console.log('active origin:', activeOrigin, activeTab.url);
	await tabController.updateShownTabOnWindow(windowId);
	
});

