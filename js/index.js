var DEBUG = 0;
var ECHO = '';

var SCALE = 2;

var BGSPEED = 200/SCALE;
var GRAVITY = 10/SCALE;
var SPEED = 2000/SCALE;
var PLAYER_Y = 0.85;
var TOLERANCE = 12/SCALE;

var COLLIDE = false;
var ORIGIN = 0;

var MSG = '';

var gameStats = {
	'hiScore': null,	//OK
	'multiplierCurrent': null,
	'multiplierMax': null,
	'shotsCurrent': null,	//OK
	'shotsTotal': null,	//OK
	'gamesTotal': null,	//OK
	'sessionsTotal': null,	//OK
};

// var HISCORE = '';

var HOW = "";

var state = {
	boot: function() {
		Phaser.Canvas.setImageRenderingCrisp(game.canvas);  //for Canvas, modern approach
		Phaser.Canvas.setSmoothingEnabled(game.context, false);  //also for Canvas, legacy approach
		PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST; //for WebGL
	},
	preload: function() {
		// game.add.plugin(Phaser.Plugin.Debug);

		// game.scale.maxHeight = innerHeight;
		// game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.scale.pageAlignHorizontally = true;

		this.game.stage.backgroundColor = '#22252A';
		this.HOW = (game.device.desktop) ? 'PRESS SPACE' : 'TAP SCREEN';
		this.SCALE = (game.device.desktop) ? 2 : 1;

		game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.6.16/webfont.js');

		// this.load.spritesheet("player",'img/player.png', 48, 48);
		this.load.image("player", "img/player.png");
		this.load.image("shrapnel", "img/shrapnel.png");
		this.load.image("background", "img/bg_arrow.png");
		// this.load.image("background", "img/bg_gingham.png");
		// this.load.image("background", "img/bg_hex.png");
		// this.load.image("background", "img/bg_houndstooth.png");
		this.load.image("dot", "img/dot.png");
		this.load.image("flash", "img/white.png");

		if (Phaser.Device.localStorage) {
			gameStats.hiScore = this.getScore();
			gameStats.sessionsTotal = gameStats.sessionsTotal+1;
			this.setScore(gameStats.hiScore);
		}

		game.time.advancedTiming = true;
		if (DEBUG) {
			game.time.slowMotion = 2.0;
		}
	},
	create: function(){
		game.plugins.screenShake = game.plugins.add(Phaser.Plugin.ScreenShake);

		this.background = this.add.tileSprite(0,0,this.world.width*2, this.world.height, "background");
		this.background.anchor.setTo(0.25, 0);
		this.background.alpha = 0.025;

		this.flash = this.add.sprite(0,0,"flash");
		this.flash.scale.setTo(6/SCALE,10/SCALE);
		this.flash.alpha = 0;

		this.dots = this.add.group();

		this.physics.startSystem(Phaser.Physics.ARCADE);
		// this.physics.arcade.gravity.y = GRAVITY;

		this.player = this.add.sprite(0,0,'player');
		this.physics.arcade.enableBody(this.player);
		this.player.body.collideWorldBounds = false;
		if (SCALE > 1) {
			this.player.scale.setTo(0.5,0.5);
			this.player.body.setSize(this.player.width,this.player.height,0,0);
		}
		this.player.anchor.setTo(0.5,0.5);

		this.scoreText = this.add.text(
			this.world.centerX,
			0,
			"",
			{
				fill: "#ffffff",
				align: "center"
			}

		)
		this.scoreText.anchor.setTo(0.5, 0);
		this.scoreText.font = 'Press Start 2P';
		this.scoreText.fontSize = 48/SCALE;
		this.scoreText.smoothed = false;
		// this.scoreText.setShadow(2,2,'#444444', 0);

		this.mulText = this.add.text(
			this.world.centerX,
			0,
			"",
			{
				fill: "#ffffff",
				align: "center"
			}

		)
		this.mulText.anchor.setTo(0.5, 0);
		this.mulText.font = 'Press Start 2P';
		this.mulText.fontSize = 48/SCALE;
		this.mulText.smoothed = false;
		// this.mulText.setShadow(2,2,'#444444', 0);

		this.wtfText = this.add.text(
			this.world.centerX,
			0,
			"",
			{
				fill: "#999999",
				align: "center"
			}

		)
		this.wtfText.anchor.setTo(0.5, 0);
		this.wtfText.font = 'Press Start 2P';
		this.wtfText.fontSize = 24/SCALE;
		this.wtfText.smoothed = false;
		this.wtfText.setText("\n\n\n\n\n\n\nINSPIRED BY\nUMBRELLA.WTF/BOOMDOTS", game.centerX, 0);
		// this.wtfText.setShadow(2,2,'#444444', 0);

		var actionKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		actionKey.onDown.add(this.fire, this);

		this.input.onDown.add(this.fire, this);

		this.reset();
	},
	update: function(){
		// ECHO = this.gameStarted +","+ this.gameOver;

		if(this.gameStarted){

			// this.dots.forEachAlive(function(dot){
			// 	if (dot.x + dot.width < game.world.bounds.left) {
			// 		dot.kill();
			// 	} else if (!dot.scored && dot.x <= state.player.x) {
			// 		state.addScore(dot);
			// 	}
			// })

			if(!this.gameOver){
				if(this.player.body.bottom >= this.world.bounds.bottom) {
					this.setGameOver();
				}
				if(this.player.y <=this.world.bounds.top) {
					this.setGameOver();
				}

				this.physics.arcade.overlap(this.player, this.dots, this.nextDot, this.circleToCircle, this);
			} else {
				if (this.time.now > (this.timeOver + 4*Phaser.Timer.SECOND)){
					this.reset();
				}
			}

		// } else {
		// 	this.wtfText.alpha = 1;
		// 	this.player.x = this.world.centerX;
		// 	this.player.y = this.world.height * PLAYER_Y;
		}
	},
	circleToCircle: function(obj1, obj2){
		return (game.physics.arcade.distanceBetween(obj1, obj2) < (obj1.body.width/2 + obj2.body.width/2));
	},
	reset: function(){
		this.gameStarted = false;
		this.gameOver = false;
		this.score = 0;
		gameStats.multiplierCurrent = 1;
		this.mulText.alpha = (gameStats.multiplierCurrent > 1);
		this.wtfText.alpha = 1;

		gameStats.shotsCurrent = 0;

		// this.player.body.allowGravity = false;
		this.player.reset(this.world.centerX, this.world.height * PLAYER_Y);

		if (gameStats.hiScore) {
			this.scoreText.setText("\n\nBOOM MATT!\n——————————\n\nHI SCORE\n"+ gameStats.hiScore +"\n\n\n\n\n\n\n\n"+ this.HOW +"\nTO\nSTART");
			this.wtfText.setText('');
		} else {
			this.scoreText.setText("\n\nBOOM MATT!\n——————————\n\n\n\n\n\n\n\n\n\n\n"+ this.HOW +"\nTO\nSTART");
		}

		this.dots.removeAll();
	},
	start: function(){
		this.scoreText.setText("\n\nSCORE\n"+ this.score);
		this.gameStarted = true;
		this.wtfText.alpha = 0;

		gameStats.gamesTotal++;

		this.spawnDots();
	},
	fire: function(){
		if(!this.gameStarted) {
			this.start();

			return;
		}

		if (!this.gameOver){
			this.player.body.velocity.y = -SPEED;
		}

		if (this.gameOver && this.gameStarted) {
			this.reset();
		}
	},
	explodeStuff: function(px, py, q, f) {
		var emitter = game.add.emitter(px, py, 200);

		emitter.makeParticles(['shrapnel', 'player', 'dot'], f, q);

		emitter.minParticleSpeed.setTo(-2000/SCALE, -2000/SCALE);
		emitter.maxParticleSpeed.setTo(2000/SCALE, 2000/SCALE);
		// emitter.gravity = 100;
		emitter.minParticleScale = 0.1 /SCALE;
		emitter.maxParticleScale = 0.3 /SCALE;
		emitter.minRotation = 0;
		emitter.maxRotation = 0;
		emitter.setAlpha(1, 0, 2000, Phaser.Easing.Linear.Out);
		emitter.start(true, 2000, null, q);
	},
	nextDot: function(){
		this.dots.forEachAlive(function(dot){

			if (Math.abs(dot.x - state.player.x) < TOLERANCE) {
				var flashWhite = game.add.tween(state.flash).to({ alpha: 1 }, 60*1.5, Phaser.Easing.Sinusoidal.InOut, true, 0);
				flashWhite.yoyo(true);
				game.plugins.screenShake.shake(10);
				state.explodeStuff(state.player.x, state.player.y, 50, [0,1,1,2,2,2]);

				//process multiplier
				if (gameStats.multiplierCurrent == 1) {
					if (state.score == 0) {
						gameStats.multiplierCurrent = 5;
					} else {
						gameStats.multiplierCurrent = 3;
					}
				} else {
					gameStats.multiplierCurrent = gameStats.multiplierCurrent + 1;
				}
				state.addScore(dot, gameStats.multiplierCurrent);

				var bravo = Array(
					'NICELY DONE',
					'BRILLIANT',
					'FANTASTIC',
					'AMAZING',
					'AWESOME',
					'WOAH',
					'YEAH',
					'SUPER',
					'SMASHING',
					'GREAT'
				);
				state.congrats = bravo[gameStats.multiplierCurrent % 10];	//cycle
				// do {
				// 	newcongrats = this.game.rnd.pick(bravo);
				// } while (newcongrats == state.congrats);	//random pick
				// state.congrats = newcongrats;
			} else {
				gameStats.multiplierCurrent = 1;
				state.addScore(dot, gameStats.multiplierCurrent);

				game.plugins.screenShake.shake(5);
				state.explodeStuff(state.player.x, state.player.y, 25, [0,1,1,2,2,2]);
			}
			dot.kill();
		})

		gameStats.shotsCurrent++;
		gameStats.shotsTotal++;

		this.spawnDots();

		this.player.reset(this.world.centerX, this.world.height * PLAYER_Y);

		this.player.body.velocity.y = GRAVITY;
	},
	setGameOver: function(){
		// gameStats.shotsCurrent++;
		gameStats.shotsTotal++;

		game.plugins.screenShake.shake(10);
		state.explodeStuff(state.player.x, state.player.y, 10, [0,1,1]);

		gameStats.multiplierCurrent = 1;
		this.mulText.alpha = 0;
		this.gameOver = true;
		this.scoreText.setText("\n\nSCORE\n"+ this.score +"\n\nHI SCORE\n"+ gameStats.hiScore +"\n\n\n\n\n\n\n\n"+ this.HOW +"\nTO\nTRY AGAIN");
		this.timeOver = this.time.now;

		this.setScore(gameStats.hiScore);

		this.dots.forEachAlive(function(dot){
			dot.kill();
		})

		this.player.body.velocity.y = 0;
	},
	spawnDot: function(x){
		var dot = this.dots.create(
			x,
			0,
			"dot"
		);

		this.physics.arcade.enableBody(dot);
		dot.body.immovable = true;
		dot.scored = false;
		dot.speed = this.rnd.between(2,4) * 500;
		dot.scale.setTo(1/SCALE, 1/SCALE);

		var targetX = (x > game.world.centerX) ? game.width*.1 : game.width*.9;
		var targetY = game.height * (this.rnd.between(3, 7) / 10);
		// var targetY = game.height * .7;

		game.add.tween(state.background.tilePosition).to( {y: '+'+targetY }, targetY, Phaser.Easing.Cubic.Out, true);

		var slideDown = game.add.tween(dot).to({ y: targetY }, targetY, Phaser.Easing.Cubic.Out, true, 0, 0, false);

		var sideToSide = game.add.tween(dot).to({ x: targetX }, dot.speed, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);

		return dot;
	},
	spawnDots: function(){
		var dotX = Phaser.Utils.randomChoice(game.width*.1, game.width*.9);
		ORIGIN = dotX;

		var enemy = this.spawnDot(dotX);
		enemy.anchor.setTo(0.5,0.5);
	},
	getScore: function() {
		var jsonData = localStorage.getItem('saveGame');

		if (jsonData == null) {
			return 0;
		} else {
			gameStats = JSON.parse(jsonData);
			return gameStats.hiScore;
		}
	},
	setScore: function(s) {
		gameStats.hiScore = s;

		localStorage.setItem('saveGame', JSON.stringify(gameStats));
	},
	resetScore: function() {
		this.setScore(0);
	},
	addScore: function(dot, m){
		dot.scored = true;
		this.score = this.score + m;
		this.scoreText.setText("\n\n\n"+ this.score);

		// save hi score
		if (this.score > gameStats.hiScore) {
			gameStats.hiScore = this.score;
			this.setScore(gameStats.hiScore);
		}

		// save max multiplier
		if (m > gameStats.multiplierMax) {
			gameStats.multiplierMax = m;
		}
	},
	prerender: function() {
	},
	render: function()
	{
		if (gameStats.shotsCurrent == 1 && gameStats.multiplierCurrent == 5) {	//perfect start
			this.MSG = "PERFECT START!\n+5";
		// } else if (gameStats.multiplierCurrent > 3 && gameStats.multiplierCurrent < 10) {	// between 3 and 10
		// 	var msg = state.congrats +"!\n+"+ gameStats.multiplierCurrent;
		// } else if (gameStats.multiplierCurrent >= 10) {	// over 10
		// 	var msg = "+"+ gameStats.multiplierCurrent;
		} else if (gameStats.multiplierCurrent > 3) {	// between 3 and 10
			this.MSG = state.congrats +"!\n+"+ gameStats.multiplierCurrent;
		} else {	// perfect, but not start
			this.MSG = "PERFECT!\n+"+ gameStats.multiplierCurrent;
		}

		if (gameStats.multiplierCurrent == 1) {
			WELLNESS = "#999";
			this.mulText.alpha = 0;
		} else {
			WELLNESS = "#ff6";
			this.mulText.alpha = 1;
		}
		this.mulText.fill = WELLNESS;

		var egg = "\n"+ this.MSG;
		this.mulText.setText(egg, game.centerX, 0, WELLNESS);

		if (DEBUG) {
			// game.debug.bodyInfo(this.player, 2, 32);
			game.debug.body(this.player);
			this.dots.forEachAlive(function(dot){
				game.debug.body(dot);
			})

			game.debug.text(ECHO, game.width/2-14, 28, "#ffff00");

			fps = game.time.fps;
			if (fps < 30) {
				WELLNESS = "#ff0000";
			} else if (fps < 60) {
				WELLNESS = "#ffff00";
			} else {
				WELLNESS = "#00ff00";
			}
			game.debug.text(game.time.fps || '??', 2, 14, WELLNESS);
			game.debug.text(Phaser.VERSION, game.world.width - 55, 14, "#ffff00");
		}
	}
};

var innerWidth = window.innerWidth;
var innerHeight = window.innerHeight;
var gameRatio = innerWidth/innerHeight;

var game = new Phaser.Game(
	750/SCALE,
	1334/SCALE,
	Phaser.CANVAS,
	// Phaser.AUTO,
	document.querySelector('#screen'),
	state
);

WebFontConfig = {
	active: function() { game.time.events.add(Phaser.Timer.SECOND, createText, this); },
	google: {
		families: ['Press Start 2P']
	}
};

function createText() {
    text = game.add.text(0, -99, "dummy");
    text.font = 'Press Start 2P';
}
