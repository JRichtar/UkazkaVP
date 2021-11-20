export async function ajax<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return await response.json();
}


export interface Path {
	lat: number,
	lon: number,
	tooltip?: string,
	hall?: string,
	room?: string,
}

export interface Marker {
	to: string,
	top: string,
	left: string,
	type: string,
	transform?: string,
	tooltip?: string,
}

export interface Room {
	url?: string,
	bg: string,
	unlocks: number,
	tooltip: string,
}

export interface Minimap {
	angle: number,
	top: string,
	right: string,
	map: string,
	markers: Array<Marker>,
}

export interface LocationData {
	pano: string,
	name: string,
	paths: Array<Path>,
	minimap: Minimap,
}


export interface Graph {
	[id: string]: LocationData,
}

export interface Rooms {
	[id: string]: Room,
}

