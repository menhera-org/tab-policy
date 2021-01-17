export class SetMap extends Map
{
	constructor()
	{
		super();
	}

	has(key)
	{
		if (!super.has(key)) {
			return false;
		}
		return super.get(key).size > 0;
	}

	set(key, value)
	{
		this.get(key).add(value);
	}

	get(key)
	{
		if (!super.has(key)) {
			super.set(key, new Set);
		}
		return super.get(key);
	}

	deleteValue(key, value)
	{
		if (!super.has(key)) return;
		super.get(key).delete(value);
	}

	delete(key)
	{
		if (!super.has(key)) return;
		super.get(key).clear();
	}
}
