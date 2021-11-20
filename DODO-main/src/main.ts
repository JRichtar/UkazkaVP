import { Viewer } from "photo-sphere-viewer";
import MarkersPlugin from "photo-sphere-viewer/dist/plugins/markers";
import VisibleRangePlugin from "photo-sphere-viewer/dist/plugins/visible-range";
import {Path, Graph, ajax, Rooms} from "./loader";
import uuid4 from "uuid4";
import { createWatchCompilerHost } from "typescript";

class App {
	location: string;
	map: Graph;
	rooms: Rooms;

	viewer: any;
	markers_plugin: any;

	fouryear: boolean;
	points: number;
	victory_points: number;
	has_won: boolean;

	done: Array<string>;

	minimap_rotate_interval: number;
	minimap: any;
	minimap_markers_holder: any;

	constructor(map: Graph, rooms: Rooms, start: string, fouryear: boolean, points?: number, done?: Array<string>) {
		this.map = map;
		this.rooms = rooms;
		this.location = start;
		this.fouryear = fouryear;
		this.points = points == undefined ? 0 : points;
		this.victory_points = 90;
		this.done = done == undefined ? [] : done;;
		this.minimap_rotate_interval = -1;
		this.has_won = false;

		this.init_viewer();

		this.markers_plugin = this.viewer.getPlugin(MarkersPlugin);	

		this.markers_plugin.on("select-marker", (e: any, marker: any, data: any) => {
			if (marker.data.type == "hall") {
				this.hall(marker.data.payload);
			} 
			else {
				this.room(marker.data.payload);
			}
		});

		var overlay = document.getElementById("overlay");
		if (overlay) { overlay.style.display = "none"; }
		this.viewer.on("ready", (event: any) => {
			if (points === undefined)
				fetch("assets/tutorial.html").then((res) => res.text()).then((tutorial) => {
					this.popup(tutorial, true);
				});
			this.minimap = document.getElementById("minimap");
			this.minimap.style.visibility = "visible"; 
			this.minimap_rotate_interval = setInterval(() => this.minimap_rotate(this), 50);
			this.minimap_markers_holder = document.getElementById("minimap-markers");
			this.load_minimap_markers();

		});
	}

	init_viewer() {
		this.viewer = new Viewer({
			container: document.querySelector("#view"),
			panorama: this.map[this.location].pano,
			minFov: 36,
			maxFov: 36,
			caption: this.map[this.location].name + `<span class="points">${this.points} bodů</span>`,
			navbar: [
				"autorotate",
				{
					id: "help",
					content: "?",
					title: "Nápověda",
					className: "help",
					onClick: () => {
						fetch("assets/tutorial.html").then((res) => res.text()).then((tutorial) => {
							this.popup(tutorial, true);
						});
					}
				},
				"caption",
				"fullscreen",
			],

			plugins: [
				[MarkersPlugin, { markers: this.get_markers() }], 
				[VisibleRangePlugin, {latitudeRange: [0, 0]}]
			],

			lang: {
				autorotate  : "Automatická rotace",
				zoom        : "Přiblížení",
				zoomOut     : "Oddálit",
				zoomIn      : "Přiblížit",
				fullscreen  : "Na celou obrazovku",
				menu        : "Menu",
				twoFingers  : ["K navigování použijte dva prsty"],
				loadError   : "Panorama nelze načíst",
				markers     : "Ukazatelé",
  				markersList : "Ukazatelé",
			},

			loadingTxt: "Načítání...",
			loadingImg: "assets/loader.gif",
		});
	}

	hall(location: string) {
		this.location = location;

		this.markers_plugin.clearMarkers();

		this.viewer.setPanorama(this.map[this.location].pano).then(() => {
			this.viewer.setOption("caption", this.map[this.location].name + `<span class="points">${this.points} bodů</span>`);
			this.markers_plugin.setMarkers(this.get_markers());
		});
		this.load_minimap_markers()
	}

	popup(text: string, special?: boolean) {
		var popup = document.getElementById("popup");
		if (popup) {
			popup.innerHTML = text + '<p class="buttons"><a class="button" id="okbtn" href="#">Ok</a></p>';
			popup.style.display = "block";

			if (special) {
				popup.style.width = "600px";
			} else {
				popup.style.width = "400px";
			}
		}
		var overlay = document.getElementById("overlay");
		if (overlay) {
			overlay.style.filter = "blur(2px)";
			overlay.style.pointerEvents = "none";
		}
		var ok = document.getElementById("okbtn");
		if (ok) {
			ok.addEventListener("click", (event) => {
				var popup = document.getElementById("popup");
				if (popup)
					popup.style.display = "none";
				var overlay = document.getElementById("overlay");
				if (overlay) {
					overlay.style.filter = "none";
					overlay.style.pointerEvents = "auto";
				}
			});
		}
	}

	async room(room_url: string) {
		const room = this.rooms[room_url];

		if (this.points < room.unlocks && room.unlocks != 0) {
			this.popup("Pro vstup sem potřebujete alespoň " + room.unlocks + " bodů.");
			return;
		}

		const res = await fetch(room.url!);
		const text = await res.text();
		var overlay = document.getElementById("overlay");
		if (overlay) {
			overlay.innerHTML = text;
			overlay.style.filter = "none";
			overlay.style.display = "block";
			overlay.style.backgroundImage = room.bg ? "url(" + room.bg + ")" : "none";
			overlay.style.backgroundColor = room.bg ? "black" : "rgba(10, 10, 10, 0.7)";
			var cross = document.getElementById("cross");
			if (cross) {
				cross.addEventListener("click", function(event) {
					var overlay = document.getElementById("overlay");
					if (overlay) {
						overlay.style.display = "none";
						overlay.innerHTML = "";
					}
				});
			}

			const to_remove = document.getElementsByClassName(this.fouryear ? "eightyear" : "fouryear");

			for (let i = 0; i < to_remove.length; i++) {
				(<HTMLElement>to_remove[i].parentNode).removeChild(<HTMLElement>to_remove[i]);
			}

			const items = document.getElementsByClassName("answer");

			if (this.done.includes(room.url!)) {
				for (let i = 0; i < items.length; i++) {
					items[i].classList.add("disabled");

					if (items[i].classList.contains("correct"))
						items[i].classList.remove("correct");
				}
			} else {
				for (let i = 0; i < items.length; i++) {
					let ans = items[i];
	
					if (ans.classList.contains("correct")) {
						ans.addEventListener("click", (event) => {
							if (!event.target || (<HTMLElement>event.target).classList.contains("disabled")) {
								return;
							}

							this.points += 5;
							this.viewer.setOption("caption", this.map[this.location].name + `<span class="points">${this.points} bodů</span>`);
	
							for (let i = 0; i < items.length; i++) {
								items[i].classList.add("disabled");
							}

							this.done.push(room.url!);
							this.markers_plugin.setMarkers(this.get_markers());

							if (this.points >= this.victory_points && !this.has_won) {
								this.popup("Výborně, máte dostatek bodů na otevření místnosti sekretariátu. Zajděte si tam pro přihlášku.");
								this.has_won = true;
								/*(async function () {
									const res = await fetch("assets/victory.html");
									const text = await res.text();

									var overlay = document.getElementById("overlay");
									if (overlay) {
										overlay.innerHTML = text;
										overlay.style.backgroundImage = 'url("assets/cup.png")';
									}
								})();*/
							} else {
								this.popup("Vaše odpověď je správná. Získáváte 5 bodů.");
							}
							this.load_minimap_markers();
							this.save_game();
						});
						ans.classList.remove("correct");
					} else {
						ans.addEventListener("click", (event) => {
							(<HTMLElement>event.target).classList.add("disabled");
							this.points -= 1;
							this.popup("Vaše odpověď není správná. Ztrácíte 1 bod.");
							this.save_game();
							this.viewer.setOption("caption", this.map[this.location].name + `<span class="points">${this.points} bodů</span>`);
						});
					}
				}
			}
		} 
	}


	get_markers(): Array<any> {
		var markers = []
		for (let path of this.map[this.location].paths) {
			let clr = "white";
			let image = undefined;
			let comms = false;

			if (path.room) {
				if (this.done.includes(this.rooms[path.room].url!)) {
					clr = "green";
				}
				else if (this.points < this.rooms[path.room].unlocks) {
					clr = "red";
				}
				if (path.room == "comms") {
					image = "assets/map/display.png";
					comms = true;
				}
				else if (path.room == "kurzygo" || path.room == "dofe" || path.room == "galerie") {
					image = "assets/map/pin.png";
				}
			} else {
				if ((parseInt(this.location) <= 3 && parseInt(path.hall!) > parseInt(this.location)) || (parseInt(this.location) > 3 && parseInt(path.hall!) < parseInt(this.location))) {
					image = "assets/map/arrow.png";
				} else
				image = "assets/map/arrow_down.png";
			}

			let marker: any = {
				id: uuid4(),
				circle: 20,
				svgStyle: {
					fill: "rgba(10, 10, 10, 0.7)",
					stroke: clr,
					strokeWidth: "2px",
				},
				tooltip: path.tooltip ? path.tooltip : this.rooms[path.room!].tooltip,
				data: {type: path.hall ? "hall" : "room", payload: path.hall ? path.hall : path.room},
			};
			marker.latitude = path.lat! * (Math.PI/180);
			marker.longitude = path.lon! * (Math.PI/180);

			if (image) {
				delete marker.circle;
				delete marker.svgStyle;
				marker.image = image;
				marker.width = 40;
				marker.height = 40;
			}

			if (comms) {
				marker.width = 100;
				marker.height = 100;
			}
			
			markers.push(marker);
		}
		return markers
	}

	minimap_rotate(ref: any) {
		var angle = (ref.viewer.getPosition().longitude*57.3 + ref.map[ref.location].minimap.angle)%360; //convert to angle
		ref.minimap.children[1].style.transform = "rotate("+angle+"deg)";
	}

	load_minimap_markers() {
		this.minimap.children[0].src = this.map[this.location].minimap.map;
		this.minimap.children[1].style.top = this.map[this.location].minimap.top;
		this.minimap.children[1].style.right = this.map[this.location].minimap.right;
		this.minimap_markers_holder.innerHTML = ""
		this.map[this.location].minimap.markers.forEach((a) => {
			if (a.type == "door") {
				var sprite;
				if (this.done.includes(this.rooms[a.to].url!)) {
					sprite = "assets/map/door_green.png"
				} else if (this.rooms[a.to].unlocks > this.points) {
					sprite = "assets/map/door_red.png"
				} else {
					sprite = "assets/map/door_white.png"
				}
				this.minimap_markers_holder.innerHTML += '<img src="'+sprite+'" id="minimap-marker" style="top: '+a.top+'; left: '+a.left+'">'
			} else if (a.type == "hall") {
				this.minimap_markers_holder.innerHTML += '<img src="assets/map/arrow.png" id="minimap-marker" style="top: '+a.top+'; left: '+a.left+'; transform: '+a.transform+'">'
			} else if (a.type == "comms") {
				this.minimap_markers_holder.innerHTML += '<img src="assets/map/display.png" id="minimap-marker" style="top: '+a.top+'; left: '+a.left+'; transform: '+a.transform+'">'
			} else if (a.type == "pin") {
				this.minimap_markers_holder.innerHTML += '<img src="assets/map/pin.png" id="minimap-marker" style="top: '+a.top+'; left: '+a.left+'; transform: '+a.transform+'">'
			}
		})
		var x = 0;
		this.map[this.location].minimap.markers.forEach((a) => {
			this.minimap_markers_holder.children[x].addEventListener("click", (event: any) => {
				document.getElementById("minimap-tooltip")!.style.visibility="hidden"
				if (a.type == "door" || a.type == "comms" || a.type == "pin") {
					this.room(a.to)
				} else if (a.type == "hall") {
					this.hall(a.to)
				}
			});
			this.minimap_markers_holder.children[x].addEventListener("mouseenter", (event: any) => {
				var x_cord = Math.min(event.clientX - 0.79*window.innerWidth - 75, 0.21*window.innerWidth-150);
				var y_cord = event.clientY - 0.01*window.innerWidth + 11;
				var tooltip = document.getElementById("minimap-tooltip");
				if (a.type == "door" || a.type == "comms" || a.type == "pin") {
					tooltip!.children[0].innerHTML = this.rooms[a.to].tooltip;
				} else if (a.type == "hall") {
					tooltip!.children[0].innerHTML = a.tooltip!;
				}
				tooltip!.style.top = y_cord+"px";
				tooltip!.style.left = x_cord+"px";
				tooltip!.style.visibility = "visible";
			});
			this.minimap_markers_holder.children[x].addEventListener("mouseleave", (event: any) => {
				document.getElementById("minimap-tooltip")!.style.visibility="hidden"
			});
			x++;
		});
	}

	save_game() {
		var save = {location: this.location, fouryear: this.fouryear, points: this.points, done: this.done};
		localStorage.save = btoa(encodeURI(JSON.stringify(save)));
	}

}

(<any>window).start = function(fouryear: boolean) {
	ajax<Graph>("assets/map.json").then((map) => {
		ajax<Rooms>("assets/rooms.json").then((rooms) => {
			if (localStorage.save !== undefined && fouryear === undefined) {
				var save = JSON.parse(decodeURI(atob(localStorage.save)));
				new App(map, rooms, save.location, save.fouryear, save.points, save.done);	
			} else
				new App(map, rooms, "01", fouryear);
		});
	});	
}