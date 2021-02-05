// vim: ts=4 noet ai

(async () => {
	//
	const {
		getActiveDomainByWindow,
		getNoHideModeByWindow,
		setNoHideModeByWindow,
		setActiveDomainByWindow,
		getDomainsByWindow,
	} = (await browser.runtime.getBackgroundPage());

	const menuListElement = document.querySelector('#menuList');
	const currentWindow = await browser.windows.getCurrent();
	const windowId = currentWindow.id;
	
	const toggleShowAllElement = document.createElement('li');
	toggleShowAllElement.append('Show all tabs');
	menuListElement.append(toggleShowAllElement);
	if (getNoHideModeByWindow(windowId)) {
		toggleShowAllElement.classList.add('checked');
	}
	toggleShowAllElement.addEventListener('click', ev => {
		if (getNoHideModeByWindow(windowId)) {
			toggleShowAllElement.classList.remove('checked');
			setNoHideModeByWindow(windowId, false).catch(e => {
				console.error(e);
			});
		} else {
			toggleShowAllElement.classList.add('checked');
			setNoHideModeByWindow(windowId, true).catch(e => {
				console.error(e);
			});
		}
	});

	const domains = await getDomainsByWindow(windowId);

	if (domains.length) {
		menuListElement.append(document.createElement('hr'));
	}

	const activeDomain = getActiveDomainByWindow(windowId);

	for (const domain of domains) {
		if (!domain) {
			continue;
		}
		const li = document.createElement('li');
		menuListElement.append(li);
		li.append(domain);
		if (!getNoHideModeByWindow(windowId) && activeDomain === domain) {
			li.classList.add('checked');
		}
		li.addEventListener('click', ev => {
			setActiveDomainByWindow(windowId, domain).catch(e => {
				console.error(e);
			});
		});
	}
})();

