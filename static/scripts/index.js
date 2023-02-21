// Spel opstarten
var canvas = document.createElement('canvas');
var c = canvas.getContext('2d');
canvas.width = 1300;
canvas.height = 700;
document.body.appendChild(canvas);

var Water = new Image();
Water.src = 'static/images/Water.png';

var Platform = new Image();
Platform.src = 'static/images/Platform.png';

var Logo = new Image();
Logo.src = 'static/images/Logo.png';

var Besturing = [new Image(), new Image(), new Image()];
Besturing[0].src = "static/images/controls_keyboard.png";
Besturing[1].src = "static/images/controls_controller_1.png";
Besturing[2].src = "static/images/controls_controller_2.png";

window.addEventListener('keydown', toetsIngedrukt);
window.addEventListener('keyup', toetsLosgelaten);

function loaded() {
	laadVoortgang += 1;
	if (laadVoortgang == 8) opgestart();
}

function opgestart() {
	window.requestAnimationFrame(mainLoop);
}

function mainLoop() {
	bijwerken();
	bijwerkenController();
	tekenen();
	if (!wachtOpStart && !spelGepauzeerd && !speler1.Wint && !speler2.Wint) {
		window.requestAnimationFrame(mainLoop);
	} else {
		if (spelGepauzeerd || wachtOpStart) {
			window.requestAnimationFrame(bijwerkenController);
		}
	}
}

// Constante waarden
const SPELDUUR = 45; // in seconden
const CODE_W = 87;
const CODE_A = 65;
const CODE_D = 68;
const CODE_PIJL_OP = 38;
const CODE_PIJL_LI = 37;
const CODE_PIJL_RE = 39;
const CODE_ESC = 27;
const CODE_ENTER = 13;
const BOTSING_HITBOX = 50;
const WATER_SNELHEID = 0.7;
const Y_VERSNELLING = 1.2;
const Y_SPRONGKRACHT = 20;
const X_VERSNELLING = 0.42;
const X_VERTRAGING = 1.02;
const KRIMP_START_FRAME = 10800; // 180 seconden * 60 fps

// Variërende waarden
var speler1 = {
	Foto: new Image(),
	x: 290,
	y: 300,
	xsnelheid: 0,
	ysnelheid: 0,
	NaarLinks: false,
	NaarRechts: false,
	Springt: false,
	Sprong: false,
	Wint: false
};
var speler2 = {
	Foto: new Image(),
	x: 910,
	y: 300,
	xsnelheid: 0,
	ysnelheid: 0,
	NaarLinks: false,
	NaarRechts: false,
	Springt: false,
	Sprong: false,
	Wint: false
};
var verlenging = {
	begonnen: false,
	platformY: 430,
	platformA: 0,
	krimp: 0,
};
var PLATFORM_BOUNDS = {
	TOP: 430,
	left: 176,
	right: 1024,
	left_smaller: 376,
	right_smaller: 824
};
var laadVoortgang = 0;
var spelGepauzeerd = false;
var wachtOpStart = true;
var besturingModus = 0; // 0 = toetsenbord, 1 = 1 controller, 2 = 2 controllers
var tekenOverwinningsEffectStatus = 0;
var randomWinnaar = Math.round(Math.random()) + 1;
var frameTeller = 0;
var verstrekenTijd = 0;
var timer = 0;
var timerKleur = "black";
var timerValue = '0:';
var waterX = 0;

speler1.Foto.src = "static/images/Karakter1.png";
speler2.Foto.src = "static/images/Karakter2.png";
Water.onload = Platform.onload = Logo.onload = speler1.Foto.onload = speler2.Foto.onload = Besturing[0].onload = Besturing[1].onload = Besturing[2].onload = loaded;

// Gebruikershandelingen
function toetsIngedrukt(event) {
	if (event.keyCode == CODE_W) speler1.Springt = true;
	if (event.keyCode == CODE_A) speler1.NaarLinks = true;
	if (event.keyCode == CODE_D) speler1.NaarRechts = true;
	if (event.keyCode == CODE_PIJL_OP) speler2.Springt = true;
	if (event.keyCode == CODE_PIJL_LI) speler2.NaarLinks = true;
	if (event.keyCode == CODE_PIJL_RE) speler2.NaarRechts = true;
	if (event.keyCode == CODE_ESC) {
		if (!wachtOpStart) {
			if (spelGepauzeerd) {
				spelGepauzeerd = false;
				window.requestAnimationFrame(mainLoop);
			} else spelGepauzeerd = true;
		}
	}
	if (event.keyCode == CODE_ENTER && wachtOpStart) {
		wachtOpStart = false;
		opgestart();
	}
}

function toetsLosgelaten(event) {
	if (event.keyCode == CODE_W) speler1.Springt = false;
	if (event.keyCode == CODE_A) speler1.NaarLinks = false;
	if (event.keyCode == CODE_D) speler1.NaarRechts = false;
	if (event.keyCode == CODE_PIJL_OP) speler2.Springt = false;
	if (event.keyCode == CODE_PIJL_LI) speler2.NaarLinks = false;
	if (event.keyCode == CODE_PIJL_RE) speler2.NaarRechts = false;
}

var haveEvents = 'GamepadEvent' in window;
var controllers = {};
function connecthandler(event) {
	addgamepad(event.gamepad);
}
function addgamepad(gamepad) {
	controllers[gamepad.index] = gamepad;
	besturingModus = Object.keys(controllers).length;
	if (wachtOpStart) tekenBesturing();
}
function disconnecthandler(event) {
	delete controllers[event.gamepad.index];
	besturingModus = Object.keys(controllers).length;
	if (wachtOpStart) tekenBesturing();
}
function bijwerkenController() {
    var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    for (var i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            if (!(gamepads[i].index in controllers)) {
                addgamepad(gamepads[i]);
            } else {
                controllers[gamepads[i].index] = gamepads[i];
            }
        }
    }
    for (j in controllers) {
		var controller = controllers[j];
        for (var i=0; i<controller.buttons.length; i++) {
            var val = controller.buttons[i];
            if (val.pressed) {
				if (i == 2) {
					if (wachtOpStart) {
						wachtOpStart = false;
						opgestart();
					}
				}
				if (besturingModus == 2) {
					if (j == 0 && i == 0) speler1.Springt = true;
					if (j == 1 && i == 0) speler2.Springt = true;
				} else {
					if (i == 4) speler1.Springt = true;
					if (i == 5) speler2.Springt = true;				
				}
				if (i == 3 && (speler1.Wint || speler2.Wint || spelGepauzeerd)) location.reload();
	        } else {
				if (besturingModus == 2) {
					if (j == 0 && i == 0) speler1.Springt = false;
					if (j == 1 && i == 0) speler2.Springt = false;
				} else {
					if (i == 4) speler1.Springt = false;
					if (i == 5) speler2.Springt = false;
				}
			}
        }
		if (besturingModus == 2) {
			if (j == 0 && controller.axes[0] <= -.75) speler1.NaarLinks = true;
			else if (j == 0 && controller.axes[0] >= .75) speler1.NaarRechts = true;
			else if (j == 0) speler1.NaarLinks = speler1.NaarRechts = false;

			if (j == 1 && controller.axes[0] <= -.75) speler2.NaarLinks = true;
			else if (j == 1 && controller.axes[0] >= .75) speler2.NaarRechts = true;
			else if (j == 1) speler2.NaarLinks = speler2.NaarRechts = false;
		} else {
			if (controller.axes[0] <= -.75) speler1.NaarLinks = true;
			else if (controller.axes[0] >= .75) speler1.NaarRechts = true;
			else speler1.NaarLinks = speler1.NaarRechts = false;
			
			if (controller.axes[2] <= -.75) speler2.NaarLinks = true;
			else if (controller.axes[2] >= .75) speler2.NaarRechts = true;
			else speler2.NaarLinks = speler2.NaarRechts = false;
		}
    }
	if (wachtOpStart || spelGepauzeerd || speler1.Wint || speler2.Wint) window.requestAnimationFrame(bijwerkenController);
}
if (haveEvents) {
    window.addEventListener("gamepadconnected", connecthandler);
    window.addEventListener("gamepaddisconnected", disconnecthandler);
}
// Bijwerken
function bijwerken() {
	frameTeller += 1;
	verstrekenTijd = Math.floor(frameTeller / 60);
	timer = SPELDUUR - verstrekenTijd;
	if (timer < 10) {
		timerKleur = 'red';
		timerValue = '0:0';
	}
	if (timer < 0) {
		timer = 0;
		verlenging.begonnen = true;
		PLATFORM_BOUNDS.left = PLATFORM_BOUNDS.left_smaller;
		PLATFORM_BOUNDS.right = PLATFORM_BOUNDS.right_smaller;
	}
	if (verlenging.begonnen && verlenging.platformY < canvas.height * 2) {
		verlenging.platformY += verlenging.platformA;
		verlenging.platformA += Y_VERSNELLING * 1.5;
	}
	if (frameTeller >= KRIMP_START_FRAME && verlenging.krimp < 175) {
		verlenging.krimp = Number((verlenging.krimp + .05).toFixed(2));
		PLATFORM_BOUNDS.left_smaller = Number((PLATFORM_BOUNDS.left_smaller + .05).toFixed(2));
		PLATFORM_BOUNDS.right_smaller = Number((PLATFORM_BOUNDS.right_smaller - .05).toFixed(2));
	} else if (verlenging.krimp == 175) PLATFORM_BOUNDS.left_smaller = PLATFORM_BOUNDS.right_smaller = 0;

	speler1.x += speler1.xsnelheid;
	speler1.y = speler1.y + speler1.ysnelheid;
	speler2.x += speler2.xsnelheid;
	speler2.y = speler2.y + speler2.ysnelheid;
	speler1.ysnelheid = speler1.ysnelheid + Y_VERSNELLING;
	speler2.ysnelheid = speler2.ysnelheid + Y_VERSNELLING;
	if (speler1.y > PLATFORM_BOUNDS.TOP && speler1.y < PLATFORM_BOUNDS.TOP + BOTSING_HITBOX &&
	speler1.x > PLATFORM_BOUNDS.left && speler1.x < PLATFORM_BOUNDS.right) {
		speler1.y = PLATFORM_BOUNDS.TOP;
		speler1.ysnelheid = 0;
		speler1.Sprong = false;
	}
	if (speler2.y > PLATFORM_BOUNDS.TOP && speler2.y < PLATFORM_BOUNDS.TOP + BOTSING_HITBOX &&
	speler2.x > PLATFORM_BOUNDS.left && speler2.x < PLATFORM_BOUNDS.right) {
		speler2.y = PLATFORM_BOUNDS.TOP;
		speler2.ysnelheid = 0;
		speler2.Sprong = false;
	}

	if (speler1.Springt && !speler1.Sprong) {
		speler1.Sprong = true;
		speler1.ysnelheid = -Y_SPRONGKRACHT;
	}
	if (speler2.Springt && !speler2.Sprong) {
		speler2.Sprong = true;
		speler2.ysnelheid = -Y_SPRONGKRACHT;
	}

	if (speler1.NaarLinks && !speler1.NaarRechts) speler1.xsnelheid -= X_VERSNELLING;
	else if (speler1.NaarRechts && !speler1.NaarLinks) speler1.xsnelheid += X_VERSNELLING;
	else speler1.xsnelheid /= X_VERTRAGING;

	if (speler2.NaarLinks && !speler2.NaarRechts) speler2.xsnelheid -= X_VERSNELLING;
	else if (speler2.NaarRechts && !speler2.NaarLinks) speler2.xsnelheid += X_VERSNELLING;
	else speler2.xsnelheid /= X_VERTRAGING;
	
	waterX += WATER_SNELHEID;
	if (waterX > 1300) waterX = 0;

	if (speler1.y - 400 > PLATFORM_BOUNDS.TOP && speler2.y - 400 > PLATFORM_BOUNDS.TOP) window["speler" + randomWinnaar].Wint = true;
	else if (speler1.y - 400 > PLATFORM_BOUNDS.TOP) speler2.Wint = true;
	else if (speler2.y - 400 > PLATFORM_BOUNDS.TOP) speler1.Wint = true;

	if (speler1.x < speler2.x + speler2.Foto.width && speler1.x + speler1.Foto.width > speler2.x &&
	speler1.y < speler2.y + speler2.Foto.height && speler1.y + speler1.Foto.height > speler2.y) {
		speler1.xsnelheid /= 1.1;
		speler2.xsnelheid /= 1.1;
		if (speler1.y === speler2.y) {
			if (Math.abs(speler1.xsnelheid) > Math.abs(speler2.xsnelheid)) {
				if (speler1.x > speler2.x) {
					speler2.x = speler1.x - speler1.Foto.width;
				} else {
					speler2.x = speler1.x + speler1.Foto.width;
				}
			} else {
				if (speler1.x > speler2.x) {
					speler1.x = speler2.x + speler1.Foto.width;
				} else {
					speler1.x = speler2.x - speler1.Foto.width;
				}
			}
		} else {
			if (speler1.ysnelheid > speler2.ysnelheid) {
				if (speler1.y > speler2.y) {
					speler1.x = (speler1.x > speler2.x) ? speler2.x + speler1.Foto.width : speler2.x - speler1.Foto.width;
				} else {
					speler1.y = speler2.y - speler1.Foto.height;
					speler1.ysnelheid = 0;
				}
			} else if (speler1.ysnelheid < speler2.ysnelheid) {
				if (speler1.y < speler2.y) {
					speler2.x = (speler1.x > speler2.x) ? speler1.x - speler1.Foto.width : speler1.x + speler1.Foto.width;
				} else {
					speler2.y = speler1.y - speler1.Foto.height;
					speler2.ysnelheid = 0;
				}
			}
		}
	}
}
// Tekenen
function tekenBasis(filter) {
	var combiFilter = (filter == "none") ? "" : filter;
	c.filter = filter;
	c.fillStyle = "rgb(35,255,255)";
	c.fillRect(0, 0, 1300, 700);
	c.drawImage(Logo, 20, 20);
	c.filter = (timer <= 3 && frameTeller % 40 > 20) ? combiFilter + " opacity(0.75)" : filter;
	// left side
	c.drawImage(Platform, 0, 0, 200, Platform.height, 275, verlenging.platformY + 100, 200, Platform.height);
	// right side
	c.drawImage(Platform, Platform.width - 200, 0, 200, Platform.height, Platform.width - 200 + 275, verlenging.platformY + 100, 200, Platform.height);
	c.filter = filter;
	// center
	c.drawImage(Platform, 200, 0, Platform.width - 400, Platform.height, 475 + verlenging.krimp, PLATFORM_BOUNDS.TOP + 100, Platform.width - 400 - (verlenging.krimp * 2), Platform.height);
	c.drawImage(Water, waterX, 625);
	c.drawImage(Water, waterX - 1300, 625);
	c.drawImage(speler1.Foto, speler1.x, speler1.y);
	c.drawImage(speler2.Foto, speler2.x, speler2.y);
}

function tekenen() {
	c.textAlign = "center";
	tekenBasis("none");
	if (frameTeller < (SPELDUUR + 1) * 60 && !wachtOpStart) {
		c.font = "50px comic sans ms, chilanka, sans-serif";
		c.fillStyle = (timer < 10) ? "red":"black";
		c.fillText("0:" + ("0" + timer).slice(-2), canvas.width / 2, 70);
		c.font = "24px comic sans ms, chilanka, sans-serif";
		c.fillText("UNTIL AREA REDUCTION", canvas.width / 2, 100);
	} else if (frameTeller < KRIMP_START_FRAME && !wachtOpStart) {
		var tijdOver = Math.floor(KRIMP_START_FRAME / 60 - frameTeller / 60);
		var minuten = Math.floor(tijdOver / 60);
		var seconden = tijdOver % 60;
		c.font = "50px comic sans ms, chilanka, sans-serif";
		c.fillStyle = (minuten == 0 && seconden < 10) ? "red":"black";
		c.fillText(minuten + ":" + ("0" + seconden).slice(-2), canvas.width / 2, 70);
		c.font = "24px comic sans ms, chilanka, sans-serif";
		c.fillText("UNTIL TOTAL SHRINK", canvas.width / 2, 100);
	} else if (wachtOpStart) tekenBesturing();
	if (frameTeller >= KRIMP_START_FRAME && frameTeller % 60 <= 30) {
		c.fillStyle = "red";
		c.font = "50px comic sans ms, chilanka, sans-serif";
		c.fillText('PLATFORM SHRINKING!', canvas.width / 2, 100);
	}
	if (speler1.Wint) {
		tekenBasis("blur(8px)");
		c.filter = "none";
		window.requestAnimationFrame(function() {tekenOverwinningsEffect("speler1")});
	}
	if (speler2.Wint) {
		tekenBasis("blur(8px)");
		c.filter = "none";
		window.requestAnimationFrame(function() {tekenOverwinningsEffect("speler2")});
	}
	if (spelGepauzeerd) {
		tekenBasis("blur(8px)");
		c.filter = "none";
		c.fillStyle = "black";
		c.font = '89px comic sans ms, chilanka, sans-serif';
		c.fillText("PAUSED", canvas.width / 2, 200);
	}
}

function tekenBesturing() {
	c.drawImage(Besturing[besturingModus], canvas.width / 2 - Besturing[besturingModus].width / 2, 20);
	c.strokeStyle = "rgb(51,163,218)";
	c.strokeRect(canvas.width / 2 - Besturing[besturingModus].width / 2, 20, Besturing[besturingModus].width, Besturing[besturingModus].height);
}

function tekenOverwinningsEffect(toestand) {
	tekenOverwinningsEffectStatus += 2;
	tekenBasis("blur(8px)");
	c.filter = "none";
	c.fillStyle = "black";
	c.textAlign = "center";
	c.fillRect(0, 0, canvas.width, tekenOverwinningsEffectStatus);
	c.fillRect(0, canvas.height - tekenOverwinningsEffectStatus, canvas.width, tekenOverwinningsEffectStatus);
	c.fillStyle = "black";
	c.font = '89px comic sans ms, chilanka, sans-serif';
	if (toestand == "speler1") {
		c.drawImage(speler1.Foto, (tekenOverwinningsEffectStatus / 100 * (canvas.width / 2)) - 100, 300, 220, 220);
		c.fillText('WINNER', tekenOverwinningsEffectStatus / 100 * (canvas.width / 2), 240);
	} else if (toestand == "speler2") {
		c.drawImage(speler2.Foto, canvas.width - ((tekenOverwinningsEffectStatus / 100 * (canvas.width / 2))) - 100, 300, 220, 220);
		c.fillText('WINNER', canvas.width - (tekenOverwinningsEffectStatus / 100 * (canvas.width / 2)), 240);
	} else if (toestand == "gelijk") {
		c.fillText('DRAW', canvas.width / 2, tekenOverwinningsEffectStatus * 4);
	}
	if (tekenOverwinningsEffectStatus < 100) {window.requestAnimationFrame(function() {tekenOverwinningsEffect(toestand)})}
}
