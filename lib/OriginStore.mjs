
import {crc32} from '/lib/crc32.mjs';
import {UUID} from '/lib/UUID.mjs';

export const BLANK_URL = 'about:blank';

export class Origin
{
	constructor(aUrl)
	{
		let scheme = '';
		let port = '';
		let domain = '';
		do {
			if (!aUrl) break;
			if ('null' == aUrl) break;
			const url = new URL(aUrl);
			const originString = url.origin;
			if ('null' == originString) break;
			const origin = new URL(originString);
			scheme = origin.protocol.split(':')[0].toLowerCase();
			port = origin.port;
			if (origin.hostname.match(/^\[.+\]$/)) break;
			if (origin.hostname.match(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/)) break;
			domain = origin.hostname;
		} while (false);
		Reflect.defineProperty(this, 'scheme', {value: scheme});
		Reflect.defineProperty(this, 'port', {value: port});
		Reflect.defineProperty(this, 'domain', {value: domain});
	}

	static compare(a, b)
	{

	}
}

export class OriginStore
{
	//
	static getDefaultPort(aProtocol)
	{
		//
		const scheme = String(aProtocol).split(':')[0].toLowerCase();
		switch (scheme) {
			case 'http':
				return 80;
			case 'https':
				return 443;
			case 'ftp':
				return 21;
			case 'ws':
				return 80;
			case 'wss':
				return 443;
			default:
				return 0;
		}
	}

	static getKey(aUrl)
	{
		//
		if ('null' === String(aUrl)) {
			return [''];
		}

		const url = new URL(aUrl);
		const origin = url.origin;
		const key = [];
		if ('null' == origin) {
			key.push('');
		} else {
			const originUrl = new URL(origin);
			const originPort = originUrl.port;
			const protocol = originUrl.protocol;
			const port = originPort;
			const host = originUrl.hostname;
			key.push(protocol, port, ... host.split('.').reverse());
		}
		return key;
	}

	constructor()
	{
		this._obj = Object.create(null);
		this._map = new Map;
	}

	add(aUrl, aData)
	{
		const store = this._obj;
		const map = this._map;
		const key = OriginStore.getKey(aUrl);
		const stringKey = key.join('.');
		if (!map.has(stringKey)) {
			map.set(stringKey, new Set);
		}
		map.get(stringKey).add(aData);
	}

	get(aUrl) {
		const key = OriginStore.getKey(aUrl);
		const map = this._map;
		const stringKey = key.join('.');
		if (!map.has(stringKey)) {
			return [];
		}
		return [... map.get(stringKey)];
	}

	delete(aUrl, aData)
	{
		const map = this._map;
		const key = OriginStore.getKey(aUrl);
		const stringKey = key.join('.');
		if (!map.has(stringKey)) return;
		map.get(stringKey).delete(aData);
		if (map.get(stringKey).size < 1) {
			map.delete(stringKey);
		}
	}

	clear(aUrl)
	{
		const map = this._map;
		const key = OriginStore.getKey(aUrl);
		const stringKey = key.join('.');
		map.delete(stringKey);
	}

	*[Symbol.iterator]()
	{
		const map = this._map;
		const keys = [... map.keys()].map(key => key.split('.')).sort();
		for (const key of keys) {
			if ('' === key[0]) {
				yield 'null';
				continue;
			}
			const url = new URL(location);
			url.protocol = key[0] + ':';
			url.port = key[1];
			url.hostname = key.slice(2).reverse().join('.');
			yield url.origin;
		}
	}
}
