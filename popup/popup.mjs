// vim: ts=4 noet ai

import {OriginStore} from '/lib/OriginStore.mjs';

(async () => {
	//
	const tabManager = (await browser.runtime.getBackgroundPage()).tabManager;
	const domainsElement = document.querySelector('#domains') || document.body;
	const currentWindow = await browser.window.getCurrent();
	const windowId = currentWindow.id;
	const tabs = await browser.tabs.query({windowId: browser.windows.WINDOW_ID_CURRENT});
	const origins = new OriginStore;
	for (const tab of tabs) {
		origins.add(tab.url, tab);
	}

	{
		const li = document.createElement('li');
		li.append('Show all tabs');
		domainsElement.append(li);
		domainsElement.append(document.createElement('hr'));
	}

	for (const origin of origins) {
		const li = document.createElement('li');
		if ('null' === origin) {
			li.append('Special pages');
		} else {
			const url = new URL(origin);
			if ('https:' === url.protocol) {
				li.classList.add('origin-secure');
			}
			li.append(url.host);
		}
		domainsElement.append(li);
		const key = origin;
		li.addEventListener('click', ev => {
			//
			const matchedTabs = origins.get(key).map(tab => tab.index);
			browser.tabs.highlight({tabs: matchedTabs, populate: false}).then(() => {
				console.log('Origin shown:', key);
			}).catch(e => {
				console.error(e);
			});
		});
	}
})();

