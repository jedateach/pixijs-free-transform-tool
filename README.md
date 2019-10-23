# Pixi.js - Free Transform Tool

Provides controls for transforming position, size, and rotation of Pixi.js Display Objects.

## Features

* Transformations are relative to the registration point (ob.regX, obj.regY), which you can choose.
* Un-obtrusive to your pixijs project scene. The tool sits in it's own container layer.

## Demo

See the tool in action at: https://jedateach.github.io/pixijs-free-transform-tool

[Source code for demo](demo/demo.js)

## Usage

In order to use this tool you have to do the following:

1. add a new layer to your stage in top of everything as the follwing:

    ```js
    var top = new PIXI.Container();
    app.stage.addChild(top);
    ```

2. add the transform tool inside the top layer as the follwing:

    ```js
    var selectTool = new PIXI.util.FreeTransformTool();
    selectTool.name = "transform";
    top.addChild(selectTool);
    ```

3. to select any object for example when the user click on that object as the following:

    ```js
    object.on("pointertap", function (evt) {
        selectTool.select(evt.currentTarget);
    });
    ```

4. to unselect object  for example when the user click on the stage as the following:

    ```js
    stage.addEventListener("click", function () {
        selectTool.unselect();
    });
    ```
