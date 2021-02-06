// vim: ts=4 noet ai

const activeDomainByWindow = new Map;

const registrableDomains = new Set;

const disabledWindows = new Set;


globalThis.getRegistrableDomain = (aDomain) =>
{
	if (!aDomain) return null;
	const domain = String(aDomain);
	const parts = domain.split('.');
	if (parts.length < 2) return domain;
	for (let i = 2; i <= parts.length; i++) {
		const domain = parts.slice(- i).join('.');
		if (registrableDomains.has(domain)) return domain;
	}
	return domain;
};

globalThis.getDomain = (aUrl) =>
{
	const url = aUrl || 'about:blank';
	const origin = new URL(url).origin;
	return origin == 'null' ? null : new URL(origin).hostname;
};

globalThis.getActiveDomainByWindow = (windowId) =>
{
	return !activeDomainByWindow.has(windowId)
		? null
		: getRegistrableDomain(activeDomainByWindow.get(windowId));
};

globalThis.getNoHideModeByWindow = (windowId) =>
	disabledWindows.has(windowId);

globalThis.setNoHideModeByWindow = async (windowId, noHide) =>
{
	if (noHide) {
		disabledWindows.add(windowId);
	} else {
		disabledWindows.delete(windowId);
	}
	await updateShownTabByWindow(windowId);
};

globalThis.setActiveDomainByWindow = async (windowId, domain) =>
{
	activeDomainByWindow.set(windowId, domain);
	await updateShownTabByWindow(windowId, true);
};

globalThis.getDomainsByWindow = async (windowId, includePinned) =>
{
	const tabs = await browser.tabs.query({windowId});
	const domains = new Set;
	for (const tab of tabs) {
		if (!includePinned && tab.pinned) continue;
		const domain = getRegistrableDomain(getDomain(tab.url));
		if (domain) {
			domains.add(domain);
		}
	}
	return [... domains].sort();
};

globalThis.updateShownTabByWindow = async (windowId, jumpEnabled) =>
{
	const noHide = getNoHideModeByWindow(windowId);
	const activeDomain = getActiveDomainByWindow(windowId);
	const tabs = await browser.tabs.query({windowId});
	const promises = [];
	const activeTabIndices = [];
	for (const tab of tabs) {
		if (tab.pinned) continue;
		if (!activeDomain) {
			promises.push(browser.tabs.show(tab.id));
			continue;
		}
		const domain = getDomain(tab.url);
		if (!domain) {
			promises.push(browser.tabs.show(tab.id));
			continue;
		}
		const registrableDomain = getRegistrableDomain(domain);
		if (activeDomain !== registrableDomain) {
			if (noHide) {
				promises.push(browser.tabs.show(tab.id));
			} else {
				promises.push(browser.tabs.hide(tab.id));
			}
		} else {
			promises.push(browser.tabs.show(tab.id));
			if (noHide) {
				activeTabIndices.push(tab.index);
			}
		}
	}

	if (jumpEnabled && noHide && activeTabIndices.length) {
		promises.push(browser.tabs.highlight({
			windowId,
			tabs: [activeTabIndices[activeTabIndices.length - 1]],
			populate: false,
		}));
	}
	await Promise.all(promises);
};

globalThis.updateTabData = async () =>
{
	const tabs = await browser.tabs.query({});
	for (const tab of tabs) {
		const domain = getDomain(tab.url);
		if (tab.active) {
			if (domain) {
				activeDomainByWindow.set(tab.windowId, domain);
				console.log('Active domain on window:', tab.windowId, domain);
			}
		}
	}
};


browser.runtime.onMessage.addListener((message) => {
	if (message.command == 'registrable_domain') {
		const {domain} = message;
		if (!registrableDomains.has(domain)) {
			console.log('registrable domain:', domain);
		}
		registrableDomains.add(domain);
	}
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, updatedTab) => {
	try {
		if (changeInfo.url) {
			if (updatedTab.discarded || !updatedTab.url) {
				// ignore
			} else {
				const domain = getDomain(updatedTab.url);
				if (updatedTab.active) {
					if (domain) {
						activeDomainByWindow.set(updatedTab.windowId, domain);
						console.log('Active tab updated on window:', updatedTab.windowId, domain);
					}
					await updateShownTabByWindow(updatedTab.windowId);
				}
			}
			
		}
	} catch (e) {
		console.error(e);
	}
});

browser.tabs.onActivated.addListener(async ({previousTabId, tabId, windowId}) => {
	const activeTab = await browser.tabs.get(tabId);
	if (activeTab.discarded || activeTab.pinned || activeTab.url === 'about:blank') return;
	const domain = getDomain(activeTab.url);
	if (domain) {
		activeDomainByWindow.set(windowId, domain);
		console.log('Tab activated on window:', windowId, domain);
	}
	
	await updateShownTabByWindow(windowId);
});

updateTabData();

