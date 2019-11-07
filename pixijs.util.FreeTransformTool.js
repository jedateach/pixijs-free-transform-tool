// namespace:
this.PIXI = this.PIXI || {};

// package
this.PIXI.util = this.PIXI.util || {};

// helpers
function calcAngleDegrees(x, y) {
    return calcAngleRadians(x, y) * 180 / Math.PI;
}
this.PIXI.util.calcAngleDegrees = calcAngleDegrees;

function calcAngleRadians(x, y) {
    return Math.atan2(y, x);
}
this.PIXI.util.calcAngleRadians = calcAngleRadians;

function calcDistance(a, b) {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}
this.PIXI.util.calcDistance = calcDistance;

/**
 * Force a rectangle to always be inside another by
 * updating location and size.
 * @param {PIXI.Rectangle} rect 
 * @param {PIXI.Rectangle} container 
 */
function constrainRectTo(rect, container, debug) {
    if (rect.width >= container.width) {
        rect.width = container.width;
        if (debug) { console.log("constraining width to", rect.width); }
    }
    if (rect.x <= container.x) {
        rect.x = container.x;
        if (debug) { console.log("constraining x left at", rect.x); }
    } else if (rect.x + rect.width > container.x + container.width) {
        rect.x = container.x + container.width - rect.width;
        if (debug) { console.log("constraining x right at", rect.x + rect.width); }
    }
    if (rect.height >= container.height) {
        rect.height = container.height;
        if (debug) { console.log("constraining height to", rect.height); }
    }
    if (rect.y <= container.y) {
        rect.y = container.y;
        if (debug) { console.log("constraining y top to", rect.y); }
    } else if (rect.y + rect.height > container.y + container.height) {
        rect.y = container.y + container.height - rect.height;
        if (debug) { console.log("constraining y bottom to", rect.y + rect.height); }
    }
    return rect;
}
this.PIXI.util.constrainRectTo = constrainRectTo;

// constrains a display object to a given rect
function constrainObjectTo(obj, container) {
    var bounds = obj.getBounds();
    // bounds.x = obj.x - (obj.regX * obj.scale.x);
    // bounds.y = obj.y - (obj.regY * obj.scale.y);
    var constrained = new PIXI.Rectangle(
        bounds.x, bounds.y,
        bounds.width, bounds.height
    );
    constrainRectTo(constrained, container);
    var delta = {
        x: bounds.x - constrained.x,
        y: bounds.y - constrained.y
    };

    // TODO: work out new scale to apply, rather than overlapping
    var newScale = Math.min(
        constrained.width / bounds.width,
        constrained.height / bounds.height
    );

    obj.x = (obj.x - delta.x);
    obj.y = (obj.y - delta.y);
    // obj.x = obj.position.x + delta.x;
    // obj.y = obj.position.y + delta.y;
    obj.scale.x *= newScale;
    obj.scale.y *= newScale;
    
}
this.PIXI.util.constrainObjectTo = constrainObjectTo;

// // class
(function() {

    var FreeTransformTool = function(lineColor, dashed, color, controlsSize, boundary) {
        this.initialize(lineColor, dashed, color, controlsSize, boundary);
    };
    var p = FreeTransformTool.prototype = new PIXI.Container();

    // public properties:    
    p.moveTool = null;
    p.moveHitArea = null;
    p.scaleTool = null;
    p.hScaleTool = null;
    p.vScaleTool = null;
    p.rotateTool = null;
    p.target = null;
    p.border = null;
    p.dashed = null;
    p.boundary = null;

    p.anchorMark = null;

    // constructor:
    // copy before override
    p.Container_initialize = p.initialize;
    p.initialize = function(lineColor, dashed, handleColor, controlsSize, boundary) {

        // default values
        lineColor = lineColor || 0x4285F4;
        handleColor = handleColor || 0xffffff;
        this.handleOpacity = 0.7;
        this.controlsSize = controlsSize || 10;

        this.controlsDim = 0.05;
        this.controlStrokeThickness = 1;
        this.movedThreshold = 10;
    
        this.dashed = dashed === undefined ? true : dashed;
        this.boundary = boundary === undefined ? null : boundary;

        this.visible = false;

        var that = this;

        // create border
        this.border = new PIXI.Graphics();
        this.addChild(this.border);

        function addToolTip(shape, name, cursor) {
            shape.on("pointerover", function() {
                that.setTitle(name);
                that.setCursor(cursor);
            });
            shape.on("pointerout", function() {
                that.setTitle();
                that.setCursor('default');
            });
        }

        function onHandleDown() {
            this.dragging = true;
        }
        function onHandleMove() {
            if (this.dragging) {
                that.alpha = that.controlsDim;
            }
        }
        function onHandleUp() {
            that.alpha = 1;
            that.update();
            this.dragging = false;
        }

        function handleHandleEvents(handle) {
            handle
                .on("pointerdown", onHandleDown)
                .on("pointermove", onHandleMove)
                .on("pointerup", onHandleUp)
                .on("pointerupoutside", onHandleUp);
        }

        // create a transform control handle
        var handleStrokeWidth = this.controlStrokeThickness;
        function createHandle(name, cursor) {
            var handle = new PIXI.Graphics();
            handle.interactive = true;
            handle.alpha = this.handleOpacity;
            addToolTip(handle, name, cursor);
            handle.lineStyle(handleStrokeWidth, lineColor)
                .beginFill(handleColor);
            handle.pivot.set(that.controlsSize / 2, that.controlsSize / 2);
            handleHandleEvents(handle);
            return handle;
        }

        this.anchorMark = new PIXI.Graphics();
        this.anchorMark.alpha = this.handleOpacity;
        this.addChild(this.anchorMark);

        /**
         * Move tool
         * Drag anywhere within the object bounds to move.
         * Tap to deselect.
         */
        this.moveHandle = new PIXI.Graphics();
        this.moveHandle.interactive = true;
        addToolTip(this.moveHandle, "Move", "move");
        this.moveHandle
            .on('pointerdown', onMoveHandleDown)
            .on('pointermove', onMoveHandleMove)
            .on('pointerup', onMoveHandleUp)
            .on('pointerupoutside', onMoveHandleUp);
        handleHandleEvents(this.moveHandle);
        this.moveHandle.hitArea = new PIXI.Rectangle();
        this.addChild(this.moveHandle);

        function onMoveHandleDown(downEvent) {
            if (that.target && !this.dragging) {
                this.targetStart = that.target.position.clone();
                this.downGlobal = downEvent.data.global.clone();
                this.dragDistance = 0;
                this.dragging = true;
                this.startBounds = that.target.getBounds();
            }
        }

        function onMoveHandleMove(moveEvent) {
            if (!this.dragging) {
                return;
            }
            var moveDelta = new PIXI.Point(
                moveEvent.data.global.x - this.downGlobal.x,
                moveEvent.data.global.y - this.downGlobal.y
            );
            if (that.boundary && this.startBounds) {
                let newBounds = new PIXI.Rectangle(
                    moveDelta.x + this.startBounds.x,
                    moveDelta.y + this.startBounds.y,
                    this.startBounds.width,
                    this.startBounds.height
                );
                var constrainedBounds = constrainRectTo(newBounds, that.boundary);
                moveDelta.x = constrainedBounds.x - this.startBounds.x;
                moveDelta.y = constrainedBounds.y - this.startBounds.y;
            }
            that.target.position.x = this.targetStart.x + moveDelta.x;
            that.target.position.y = this.targetStart.y + moveDelta.y;
            this.dragDistance = calcDistance(moveEvent.data.global, this.downGlobal);
            that.update();
            moveEvent.stopPropagation();
        }

        function onMoveHandleUp(upEvent) {
            upEvent.stopPropagation();
            if(this.dragging) {
                that.alpha = 1;
                this.downGlobal = null;
                this.targetStart = null;
                this.dragging = false;
            
                // only deselect if there was very little movement on click
                // which helps on mobile devices, where it's difficult to 
                // tap without dragging slightly
                if(!this.dragDistance || this.dragDistance < that.movedThreshold) {
                    that.unselect();
                }
            }

        }

        // init hScale tool
        this.hScaleHandle = createHandle('Stretch', 'e-resize');
        this.hScaleHandle.drawRect(0, 0, this.controlsSize, this.controlsSize);
        this.hScaleHandle
            .on("pointerdown", onHScaleToolDown)
            .on("pointermove", onHScaleToolMove);
        this.addChild(this.hScaleHandle);

        function onHScaleToolDown(downEvent) {
            this.globalStart = downEvent.data.global.clone();
            this.scaleStart = that.target.scale.clone();
        }
        
        function onHScaleToolMove(moveEvent) {
            if (!this.dragging) {
                return;
            }
            var distStart = calcDistance(this.globalStart, that.target.position);
            var distEnd = calcDistance(moveEvent.data.global, that.target);
            var rescaleFactor = distEnd / distStart;
            that.target.scale.x = this.scaleStart.x * rescaleFactor;
            that.update();
        }

        // init vScale tool
        this.vScaleHandle = createHandle('Stretch', 's-resize');
        this.vScaleHandle.drawRect(0, 0, this.controlsSize, this.controlsSize);
        this.vScaleHandle
            .on("pointerdown", onVScaleToolDown)
            .on("pointermove", onVScaleToolMove);
        this.addChild(this.vScaleHandle);

        function onVScaleToolDown(downEvent) {
            this.globalStart = downEvent.data.global.clone();
            this.scaleStart = that.target.scale.clone();
        }

        function onVScaleToolMove(moveEvent) {
            if (!this.dragging) {
                return;
            }
            var distStart = calcDistance(this.globalStart, that.target.position);
            var distEnd = calcDistance(moveEvent.data.global, that.target);
            var rescaleFactor = distEnd / distStart;
            that.target.scale.y = this.scaleStart.y * rescaleFactor;
            that.update();
        }

        /**
         * Scale tool:
         * Changes display object's scale based on
         * the difference in position away/near the
         * registration point
         */
        this.scaleHandle = createHandle('Resize', 'se-resize');
        this.scaleHandle.drawRect(0, 0, this.controlsSize, this.controlsSize);
        this.scaleHandle
            .on("pointerdown", onScaleToolDown)
            .on("pointermove", onScaleToolMove)
            .on("pointerupoutside", onScaleToolUp)
            .on("pointerup", onScaleToolUp);
        this.addChild(this.scaleHandle);

        function onScaleToolDown(downEvent) {
            this.downGlobalPosition = downEvent.data.global.clone();
            this.startScale = that.target.scale.clone();
            this.resolutionStart = that.target.resolution;
            this.targetStart = that.target.position.clone();
            this.startBounds = that.target.getBounds();
        }

        function onScaleToolMove(moveEvent) {
            if (!this.dragging) {
                return;
            }
            var distStart = calcDistance(this.downGlobalPosition, that.target.position);
            var distEnd = calcDistance(moveEvent.data.global, that.target.position);
            this.rescaleFactor = distEnd / distStart;

            if (that.boundary && this.startBounds) {

                let boundsAnchor = {
                    x: that.target.anchor.x * this.startBounds.width,
                    y: that.target.anchor.y * this.startBounds.height
                };

                let bounds = new PIXI.Rectangle(
                    this.startBounds.x - (boundsAnchor.x * this.rescaleFactor) + boundsAnchor.x,
                    this.startBounds.y - (boundsAnchor.y * this.rescaleFactor) + boundsAnchor.y,
                    this.startBounds.width * this.rescaleFactor,
                    this.startBounds.height * this.rescaleFactor
                );
                // TODO: don't adjust position if at max width
                var constrainedBounds = constrainRectTo(bounds.clone(), that.boundary, true);
                var boundsPositionDelta = {
                    x: bounds.x - constrainedBounds.x,
                    y: bounds.y - constrainedBounds.y
                };
                this.rescaleFactor = Math.min(
                    constrainedBounds.width / this.startBounds.width,
                    constrainedBounds.height / this.startBounds.height
                );
                that.target.position.x = this.targetStart.x - boundsPositionDelta.x;
                that.target.position.y = this.targetStart.y - boundsPositionDelta.y;
            }
            that.target.scale.x = this.startScale.x * this.rescaleFactor;
            that.target.scale.y = this.startScale.y * this.rescaleFactor;
            
            that.update();
        }

        function onScaleToolUp() {
            // TODO: scale all aspects including shadow etc?

            that.target.resolution = this.resolutionStart * this.rescaleFactor;
            that.update();
        }

        /**
         * Rotate Tool:
         * Rotates around registration point
         * Work out delta angle between three points:
         *  1. drag start point
         *  2. registration point
         *  3. drag end/current point
         * Add that angle to the object's start rotation
         */
        this.rotateTool = createHandle('Rotate', 'pointer');
        this.rotateTool.drawEllipse(
            this.controlsSize / 2, this.controlsSize / 2,
            this.controlsSize / 2, this.controlsSize / 2
        );
        this.rotateTool
            .on("pointerdown", onRotateToolDown)
            .on("pointermove", onRotateToolMove);
        this.addChild(this.rotateTool);
        
        function onRotateToolDown(downEvent) {
            this.downGlobalPosition = downEvent.data.global.clone();
            this.startRotation = that.target.rotation;
        }
        function onRotateToolMove(moveEvent) {
            if (!this.dragging) {
                return;
            }
            // the drag point is relative to the display object x,y position on the stage (it's registration point)
            var relativeStartPoint = {
                x: this.downGlobalPosition.x - that.target.x,
                y: this.downGlobalPosition.y - that.target.y
            };
            var relativeEndPoint = {
                x: moveEvent.data.global.x - that.target.x,
                y: moveEvent.data.global.y - that.target.y
            };
            var endAngle = calcAngleRadians(relativeEndPoint.x , relativeEndPoint.y);
            var startAngle = calcAngleRadians(relativeStartPoint.x, relativeStartPoint.y);
            var deltaAngle = endAngle - startAngle;
            // TODO: constrain to bounds
            that.target.rotation = this.startRotation + deltaAngle;
            that.update();
        }
     };

    // public methods:
    p.select = function(target) {
        if (!target) {
            this.unselect();
            return;
        }

        // copy object translation/transformation
        this.target = target;
        var bounds = target.getLocalBounds();
        this.width = bounds.width;
        this.height = bounds.height;
        this.scale.x = target.scale.x;
        this.scale.y = target.scale.y;
        this.x = target.x;
        this.y = target.y;
        this.rotation = target.rotation;

        var anchor;
        if (target.anchor) {
            anchor = target.anchor;
        } else if (target.pivot) {
            anchor = new PIXI.Point(
                0.5 + target.pivot.x / target.width,
                0.5 + target.pivot.y / target.height
            );
        } else {
            anchor = new PIXI.Point(0.5, 0.5);
        }

        target.anchor = anchor;

        this.left = -bounds.width * anchor.x;
        this.top = -bounds.height * anchor.y;
        this.bottom = bounds.height * (1 - anchor.y);
        this.right = bounds.width * (1 - anchor.x);

        // anchor mark
        this.anchorMark.clear()
            .beginFill(0x333)
            .drawStar(0, 0, 4, this.controlsSize*0.8, this.controlsSize * 0.1);
        this.anchorMark.scale.x = 1 / this.scale.x;
        this.anchorMark.scale.y = 1 / this.scale.y;
        this.anchorMark.rotation = -this.rotation;

        // borders
        this.border.clear();
        // if(this.dashed) {
        //     this.border.setStrokeDash([5 / this.scale.x, 5 / this.scale.x], 0);
        // }
        this.border
            .lineStyle(this.controlStrokeThickness / this.scale.y)
            .moveTo(this.left, this.top)
            .lineTo(this.right, this.top)
            .moveTo(this.right, this.bottom)
            .lineTo(this.left, this.bottom);
        // if(this.dashed) {
        //     this.border.setStrokeDash([5 / this.scale.y, 5 / this.scale.y], 0);
        // }    
        this.border
            .lineStyle(this.controlStrokeThickness / this.scale.x)
            .moveTo(this.left, this.top)
            .lineTo(this.left, this.bottom)
            .moveTo(this.right, this.bottom)
            .lineTo( this.right, this.top);

        // tools size should stay consistent
        var toolScaleX = 1 / this.scale.x;
        var toolScaleY = 1 / this.scale.y;

        // draw move hit area
        this.moveHandle.hitArea.x = this.left;
        this.moveHandle.hitArea.y =  this.top;

        this.moveHandle.hitArea.width = bounds.width;
        this.moveHandle.hitArea.height = bounds.height;

        // scale tool (bottom right)
        this.scaleHandle.x = this.right;
        this.scaleHandle.y = this.bottom;
        this.scaleHandle.scale.x = toolScaleX;
        this.scaleHandle.scale.y = toolScaleY;

        // hScale tool (right edge)
        this.hScaleHandle.x = this.right;
        this.hScaleHandle.y = this.top + bounds.height / 2;
        this.hScaleHandle.scale.x = toolScaleX;
        this.hScaleHandle.scale.y = toolScaleY;

        // vScale tool (bottom edge)
        this.vScaleHandle.x = this.left + bounds.width / 2;
        this.vScaleHandle.y = this.bottom;
        this.vScaleHandle.scale.x = toolScaleX;
        this.vScaleHandle.scale.y = toolScaleY;

        // rotate tool
        this.rotateTool.x = this.right;
        this.rotateTool.y = this.top;
        this.rotateTool.scale.x = toolScaleX;
        this.rotateTool.scale.y = toolScaleY;

        this.visible = true;
    };

    p.unselect = function() {
        this.target = null;
        this.visible = false;
    };

    p.update = function() {
        if (this.target) {
            this.select(this.target);
        }
    };

    p.setTitle = function(title) {
        title = title || "";
        this.accessibleTitle = title;
    };

    p.setCursor = function(cursor) {
        var cursors = ["e-resize", "se-resize", "s-resize", "sw-resize", "w-resize", "nw-resize", "n-resize", "ne-resize"];
        var index = cursors.indexOf(cursor);
        if (index >= 0) {
            var angle = 45;
            var rotation = this.target.rotation;
            rotation = rotation + angle / 2;
            var newIndex = index + Math.floor(rotation / angle);
            newIndex = newIndex % (cursors.length);
            document.body.style.cursor = cursors[newIndex];
        } else {
            document.body.style.cursor = cursor;
        }
    };

     this.PIXI.util.FreeTransformTool = FreeTransformTool;
}());
