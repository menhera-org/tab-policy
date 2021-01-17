import {OriginStore} from '/lib/OriginStore.mjs';

(async () => {
	//
	const domainsElement = document.querySelector('#domains') || document.body;
	const tabs = await browser.tabs.query({windowId: browser.windows.WINDOW_ID_CURRENT});
	const origins = new OriginStore;
	for (const tab of tabs) {
		origins.add(tab.url, tab);
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

