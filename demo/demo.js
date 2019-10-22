(function(){

var canvas, app, stage, container;

var boundary;
var boundaryLine;

var selectTool;

// Resize function window
function resize() {
	selectTool.unselect();
	const parent = app.view.parentNode;
	app.renderer.resize(parent.clientWidth, app.renderer.height);
	updateBoundary(boundary);
	constrainStageObjects(container.children, boundary);
}

function updateBoundary(boundary) {
	var top = canvas.height * 0.1;
	var left = canvas.width * 0.1;
	var padding = Math.min(top, left);
	boundary.x = padding;
	boundary.y = padding;
	boundary.width = canvas.width - padding * 2;
	boundary.height = canvas.height - padding * 2;
	drawBoundaryLine();
}

function constrainStageObjects(objects, container) {
	objects.forEach(function(obj) {
		PIXI.util.constrainObjectTo(obj, container);
	});
}

function drawBoundaryLine() {
	boundaryLine.clear();
	boundaryLine.lineWidth = 1;
	boundaryLine.lineColor = "#000";
	boundaryLine
		.lineStyle(1, 0x000000, 1)
		.drawRect(boundary.x, boundary.y, boundary.width, boundary.height);
}

function clickToSelect(obj) {
	obj.interactive = true;
	obj.cursor = "pointer";
	obj.on("pointertap", function (evt) {
		evt.stopPropagation();
		selectTool.select(evt.currentTarget);
	});
}

function init() {
	canvas = document.getElementById("Designer");

	app = new PIXI.Application({
		width: 800, height: 600,
		transparent: true,
		resolution: 1,
		view: canvas
	});
	stage = app.stage;

	// Listen for window resize events
	window.addEventListener('resize', resize);

	// set up free transform tool
	const top = new PIXI.Container();
	// top.name = "top";
	app.stage.addChild(top);

	// define boundary
	boundary = new PIXI.Rectangle();
	boundaryLine = new PIXI.Graphics();
	top.addChild(boundaryLine);

	updateBoundary(boundary);

	let controlsSize = 10 * window.devicePixelRatio;
	selectTool = new PIXI.util.FreeTransformTool(0x005577, true, null, controlsSize, boundary);
	selectTool.name = "transform";

	top.addChild(selectTool);
	
	container = new PIXI.Container();
	stage.addChildAt(container, 0);

	// app.renderer.plugins.interaction.on("pointerup", function(e) {
	// 	console.log("click ", e.data.global.x, e.data.global.y);
	// });

	let ellipse = createEllipse();
	container.addChild(ellipse);

	let image = createBitmap('demo/flower.svg');
	container.addChild(image);
	
	let text = createText("Off\nCentre");
	container.addChild(text);


	// TODO: figure out how to animate handle dragging?
	// app.ticker.add(function(delta) {
	// 	text.rotation -= 0.01 * delta;
	// 	text.position.x += delta + 1;
	// 	ellipse.rotation += 0.05 * delta;
	// 	ellipse.position.x += delta + (Math.random() - 0.5) * 10;
	// 	ellipse.position.y += delta + (Math.random() - 0.5) * 10;
	// 	image.rotation += 0.03 * delta;
	// 	resize();
	// });
	
	resize();
}

function createEllipse() {
	// Shape
	var ellipse = new PIXI.Graphics();
	ellipse.x = canvas.width / 4;
	ellipse.y = canvas.height / 4;
	ellipse
		.beginFill(0x3355EE)
		.lineStyle(10, 0x000)
		.drawEllipse(0, 0, 50, 100);

	// TODO: figure out pivot
	// ellipse.pivot.x = ellipse.width * 0.1;
	// ellipse.pivot.y = ellipse.height * 0.1;
	clickToSelect(ellipse);
	return ellipse;
}

function createBitmap(filename) {
	// Bitmap
	const texture = PIXI.Texture.from(filename);
	const bitmap = new PIXI.Sprite(texture);
	bitmap.position.set(canvas.width / 2, canvas.height / 6);
	bitmap.anchor.set(0.5);
	bitmap.rotation = -25 | 0;
	clickToSelect(bitmap);
	return bitmap;
}

function createText(value) {
	let style = new PIXI.TextStyle({
		align: "center",
		fontFamily: "Century Gothic",
		fontSize: 86,
		fontWeight: "bold",
		fill: ["navy", "black"],
		fillGradientType: PIXI.TEXT_GRADIENT.LINEAR_VERTICAL,
		// fillGradientStops: 
		stroke: '#fff',
		strokeThickness: 6,
		dropShadow: true,
		dropShadowColor: "#000000",
		dropShadowAlpha: 0.4,
		dropShadowBlur: 4,
		dropShadowAngle: Math.PI / 6,
		dropShadowDistance: 6,
		lineJoin: "round"
	});
	var text = new PIXI.Text(value, style);
	text.position.set(canvas.width, canvas.height / 2.3);
	text.rotation = 0;
	// text.scale.set(1);
	text.anchor.set(0.2); // TODO: allow non-centered anchor
	clickToSelect(text);
	return text;
}

init();

}());