(function(){

var canvas, stage;

var boundary;
var boundaryLine;

var selectTool;

var container;

function init() {
	canvas = document.getElementById("Designer");

	const app = new PIXI.Application({
		width: 800, height: 600,
		transparent: true,
		resolution: 1,
		view: canvas
	});
	stage = app.stage;

	// Resize function window
	function resize() {
		const parent = app.view.parentNode;
		app.renderer.resize(parent.clientWidth, parent.clientHeight);
	}

	// Listen for window resize events
	window.addEventListener('resize', resize);

	resize();


	// set up free transform tool
	const top = new PIXI.Container();
	// top.name = "top";
	app.stage.addChild(top);

	// define boundary
	boundary = new PIXI.Rectangle();
	// updateBoundary(boundary);
	boundaryLine = new PIXI.Graphics();
	top.addChild(boundaryLine);

	let controlsSize = 10 * window.devicePixelRatio;
	selectTool = new PIXI.util.FreeTransformTool(0x005577, true, null, controlsSize, boundary);
	selectTool.name = "transform";

	top.addChild(selectTool);

	function updateBoundary(boundary) {
		var top = canvas.height * 0.1;
		var left = canvas.width * 0.1;
		var padding = Math.min(top, left);
		boundary.x = padding;
		boundary.y = padding;
		boundary.width = canvas.width - padding * 2;
		boundary.height = canvas.height - padding * 2;
	}

	function drawBoundary() {
		boundaryLine.clear();
		boundaryLine.lineWidth = 1;
		boundaryLine.lineColor = "#000";
		boundaryLine
			.lineStyle(2, 0x000000, 1)
			.drawRect(boundary.x, boundary.y, boundary.width, boundary.height);
	}

	function clickToSelect(obj) {
		obj.interactive = true;
		obj.cursor = "pointer";
		obj.on("pointertap", function (evt) {
			evt.stopPropagation();
			selectTool.select(evt.currentTarget);
			update = true;
		});
	}

	// function constrainStageObjects(objects) {
	// 	objects.forEach(function(obj) {
	// 		createjs.util.constrainObjectTo(obj, boundary);
	// 	});
	// }

	container = new PIXI.Container();
	stage.addChildAt(container, 0);

	// Shape
	var ellipse = new PIXI.Graphics();
	ellipse.x = (canvas.width / 4);
	ellipse.y = canvas.height / 4;
	ellipse.pivot.set(
		ellipse.getBounds().width / 2 | 0,
		ellipse.getBounds().height / 6 | 0
	);
	ellipse
		.beginFill(0x3355EE)
		// .setStrokeStyle(4)
		// .beginRadialGradientFill(["#FFF","#35E"],[1,0],0,0,200,30,-50,40)
		.drawEllipse(0, 0, 50, 100);
	clickToSelect(ellipse);
	container.addChild(ellipse);
	ellipse.scale.set(1.5, 1);

	// Bitmap
	const texture = PIXI.Texture.from('demo/daisy.png');
	const bitmap = new PIXI.Sprite(texture);
	bitmap.position.set(canvas.width / 2, canvas.height / 6);
	bitmap.anchor.set(0.5);
	bitmap.rotation = -25 | 0;
	clickToSelect(bitmap);
	container.addChild(bitmap);
		
	// Text
	let style = new PIXI.TextStyle({
		fontFamily: "Arial",
		fontSize: 86,
		fill: "white",
		stroke: '#ff3300',
		strokeThickness: 4,
		dropShadow: true,
		dropShadowColor: "#000000",
		dropShadowBlur: 4,
		dropShadowAngle: Math.PI / 6,
		dropShadowDistance: 6,
	});
	var text = new PIXI.Text("Hello\nWorld", style);
	text.position.set(canvas.width / 2, canvas.height / 2.3);
	text.rotation = 5 | 0;
	text.scale.set(0.5);

	text.anchor.set(0.5); // TODO: allow non-centered anchor

	clickToSelect(text);
	container.addChild(text);
	
	// TODO: add a container of shapes

}

init();

}());