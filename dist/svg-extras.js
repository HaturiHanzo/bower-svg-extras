window.svgext = (function () {
    'use strict';

    if (!inherit) {
        throw new Error('Svg-extras requires https://github.com/dfilatov/inherit');
    }

    var isTouchDevice = 'ontouchstart' in document.documentElement;

    return {
        _isTouchDevice: isTouchDevice,

        /**
         * Runs events only in a new request animation frame
         *
         * @param {String} type Event name
         * @param {String} callback Event listener
         * @param {DOMElement} [domNode]
         * @private
         * @returns {Function} detach function
         */
        _throttleEventListener: function (type, callback, domNode) {
            var running = false,
                detached = false;

            domNode = domNode || window;
            var handler = function (e) {
                if (running) {
                    return false;
                }
                running = true;
                requestAnimationFrame(function () {
                    if (!detached) {
                        callback(e);
                    }
                    running = false;
                });
            };

            domNode.addEventListener(type, handler, false);

            return function () {
                detached = true;
                domNode.removeEventListener(type, handler);
            };
        },

        default: {
            control: {
                width: 12,
                height: 12
            },
            borderedRect: {
                borderOffset: 14
            }
        }
    };
}());

/**
 * Defines SVGElement abstract class
 *
 * @name SVGElement
 */

(function (svgext) {
    'use strict';

    svgext.SVGElement = inherit({

        NS: 'http://www.w3.org/2000/svg',

        /**
         * Creates new SVGElement instance
         *
         * @param {Object} [opts]
         * @param {Boolean} [opts.isDraggable=true]
         * @param {Boolean} [opts.backgroundColor=#00d]
         * @param {Boolean} [opts.cssClass]
         * @param {String|SVGSVGElement} tag
         * @constructor
         */
        __constructor: function (opts, tag) {
            this.rootNode = this.node = typeof tag === 'string' ? this.createElem(tag) : tag;
            opts = opts || {};
            if (opts.cssClass) {
                this.addClass(opts.cssClass);
            }
            if (opts.backgroundColor) {
                this.attr('fill', opts.backgroundColor);
            } else {
                this.addClass('svg_bg-color_default');
            }

            this.on('dragstart', function (event) {
                event.preventDefault();
            });
        },

        /**
         * Checks if instance has a class
         *
         * @param {String} className
         * @returns {Boolean}
         */
        hasClass: function (className) {
            var activeClasses = this.attr('class');
            if (!activeClasses) {
                return false;
            }

            return new RegExp('(\\s|^)' + className + '(\\s|$)').test(activeClasses);
        },

        /**
         * Adds a new class to the element
         *
         * @param {String} newClass Class name or several classes separated by a space
         * @returns {SVGElement}
         */
        addClass: function (newClass) {
            newClass.split(/\s+/).forEach(function (className) {
                if (!this.hasClass(className)) {
                    var activeClasses = this.attr('class') || '';
                    this.attr('class', activeClasses + ' ' + className);
                }
            }, this);

            return this;
        },

        /**
         * Removes class
         *
         * @param {String} className
         * @returns {SVGElement}
         */
        removeClass: function (className) {
            var activeClasses = this.node.getAttribute('class');
            if (activeClasses) {
                var regExp = new RegExp('(?:(\\s|^))' + className + '(?=\\s|$)', 'g');
                this.attr('class', activeClasses.replace(regExp, ''));
            }

            return this;
        },

        /**
         * Hides an elment
         *
         * @returns {SVGElement}
         */
        hide: function () {
            return this.addClass('svg-element_hidden');
        },

        /**
         * Shows an elment
         *
         * @returns {SVGElement}
         */
        show: function () {
            return this.removeClass('svg-element_hidden');
        },

        /**
         * SVGElement node attributes setter & getter
         *
         * @param {String} key
         * @param {String} value
         * @returns {SVGElement}
         */
        attr: function (key, value) {
            if (value === undefined) {
                return this.node.getAttribute(key);
            }
            this.node.setAttribute(key, value);

            return this;
        },

        /**
         * Brings an element above another
         *
         * @returns {SVGElement}
         */
        bringToFront: function () {
            var parent = this.rootNode.parentNode;

            parent.removeChild(this.rootNode);
            parent.appendChild(this.rootNode);

            return this;
        },

        /**
         * Adds an active class
         *
         * @returns {SVGElement}
         */
        activate: function () {
            this.isActive = true;
            this.addClass('active');

            return this;
        },

        /**
         * Removes an active class
         *
         * @returns {SVGElement}
         */
        deactivate: function () {
            this.isActive = false;

            return this.removeClass('active');
        },

        /**
         * Adds an event listener
         *
         * @param {String} type Event name
         * @param {Function} listener Event handler
         * @returns {SVGElement}
         */
        on: function (type, listener) {
            this.node.addEventListener(type, listener);

            return this;
        },

        /**
         * Adds double tap event handler
         *
         * @param {Function} listener
         * @returns {Function}
         */
        onDoubleTap: function (listener) {
            var tapped = false,
                tap = function (event) {
                    if (!tapped) {
                        tapped = setTimeout(function () {
                            tapped = null;
                        }, 300);
                    } else {
                        clearTimeout(tapped);
                        tapped = null;
                        event.stopPropagation();
                        listener(event);
                    }
                };
            this.on('touchstart', tap);

            return tap;
        },


        /**
         * Removes double tap event handler
         *
         * @param {Function} tap
         * @returns {SVGElement}
         */
        offDoubleTap: function (tap) {
            return this.off('touchstart', tap);
        },

        /**
         * Removes an event listener
         *
         * @param {String} type Event name
         * @param {Function} listener Event handler
         * @returns {SVGElement}
         */
        off: function (type, listener) {
            this.node.removeEventListener(type, listener);

            return this;
        },

        /**
         * Svg container bounding client rect getter
         *
         * @returns {TextRectangle}
         */
        getContainerRect: function () {
            return this.node.ownerSVGElement.getBoundingClientRect();
        },

        /**
         * Element bounding client rect getter
         *
         * @returns {TextRectangle}
         */
        getRect: function () {
            return this.node.getBoundingClientRect();
        },

        /**
         * Destroys an object
         */
        destroy: function () {
            Object.keys(this).forEach(function (key) {
                delete this[key];
            }, this);
        },

        /**
         * Creates new svg element
         *
         * @param {String} tagName
         * @private
         * @returns {SVGNode}
         */
        createElem: function (tagName) {
            return document.createElementNS(this.NS, tagName);
        },

        /**
         * Fires when an element is appended to the DOM
         *
         * @param {SVGBlock} container New element container
         */
        onAppend: function (container) {
            this.container = container;
        }
    });
}(svgext));

/**
 * Defines SVGBlock class
 *
 * @name SVGBlock
 */

(function (svgext) {
    'use strict';

    svgext.SVGBlock = {

        /**
         * SVGBlock class constructor
         *
         * @constructor
         */
        __constructor: function () {
            this.__base.apply(this, arguments);
            this.children = [];
        },

        /**
         * Appends an element
         *
         * @param {SVGElement} svgElem
         * @returns {SVGBlock}
         */
        append: function (svgElem) {
            this.children.push(svgElem);
            svgElem.container = this;
            this.appendElem(svgElem.rootNode);
            svgElem.onAppend(this);

            return this;
        },

        /**
         * Appends svg node
         *
         * @param {SVGNode} node
         */
        appendElem: function (node) {
            this.rootNode.appendChild(node);
        },

        /**
         * Removes an svg element
         *
         * @param {SVGElement} svgElem
         * @returns {SVGBlock}
         */
        remove: function (svgElem) {
            if (!svgElem) {
                return;
            }

            if (svgElem.isActive && this.deactivateActiveElement) {
                this.deactivateActiveElement();
            }

            this.children.splice(this.children.indexOf(svgElem), 1);
            this.removeElem(svgElem.rootNode);
            svgElem.destroy();

            return this;
        },

        /**
         * Removes svg node
         *
         * @param {SVGNode} node
         */
        removeElem: function (node) {
            this.rootNode.removeChild(node);
        },

        /**
         * Hides an element and all children
         *
         * @override
         */
        hide: function () {
            this.__base();
            this.children.forEach(function (child) {
                child.hide();
            });
        },

        /**
         * Shows an element and all children
         *
         * @override
         */
        show: function () {
            this.__base();
            this.children.forEach(function (child) {
                child.show();
            });
        }
    };
}(svgext));

/**
 * Defines SVGDraggable class
 *
 * @name SVGDraggable
 */
(function (svgext) {
    'use strict';

    svgext.SVGDraggable = {
        /**
         * SVGDraggable class constructor
         *
         * @param {*} opts
         * @constructor
         */
        __constructor: function (opts) {
            this.__base.apply(this, arguments);

            if (opts.isDraggable || opts.isDraggable === undefined) {
                this._dndOnMouseMove = this._dndOnMouseMove.bind(this);
                this._dndOnMouseUp = this._dndOnMouseUp.bind(this);
                this.addClass('svg_draggable');
                this.on(svgext._isTouchDevice ? 'touchstart' : 'mousedown', this._dndOnMouseDown.bind(this));
            }
        },

        /**
         * Removes all dnd handlers
         *
         * @override {SVGElement}
         */
        destroy: function () {
            if (this.removeDndHandlers) {
                this.removeDndHandlers();
            }

            this.__base();
        },

        /**
         * Removes all handlers
         */
        removeDndHandlers: function () {
            if (svgext._isTouchDevice) {
                window.removeEventListener('touchmove', this._dndOnMouseMove);
                window.removeEventListener('touchcancel', this._dndOnMouseUp);
                window.removeEventListener('touchend', this._dndOnMouseUp);
            } else {
                window.removeEventListener('mousemove', this._dndOnMouseMove);
                window.removeEventListener('mouseup', this._dndOnMouseUp);
            }
        },

        /**
         * Mouse down event listener handler
         *
         * @param {Event} event
         * @private
         */
        _dndOnMouseDown: function (event) {
            // Cross browser right mouse click check
            if ((event.which && event.which === 3) || (event.button && event.button === 2)) {
                return;
            }
            document.body.classList.add('unselectable');

            this._saveClientCoords(event.changedTouches ? event.changedTouches[0] : event);
            if (svgext._isTouchDevice) {
                window.addEventListener('touchmove', this._dndOnMouseMove);
                window.addEventListener('touchend', this._dndOnMouseUp);
                window.addEventListener('touchcancel', this._dndOnMouseUp);
            } else {
                window.addEventListener('mousemove', this._dndOnMouseMove);
                window.addEventListener('mouseup', this._dndOnMouseUp);
            }
        },

        /**
         * Mouse move handler
         *
         * @param {Event} event
         * @private
         */
        _dndOnMouseMove: function (event) {

            if (event.movementX !== undefined) {
                return this.drag(this.normalizeCoords({x: event.movementX, y: event.movementY}));
            }

            var data = event;

            if (data.changedTouches) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                data = event.changedTouches[0];
            }
            if (!this._lastClientCoords) {
                return this._saveClientCoords(data);
            }

            this.drag(this.normalizeCoords({
                x: data.clientX - this._lastClientCoords.clientX,
                y: data.clientY - this._lastClientCoords.clientY
            }));
            this._saveClientCoords(data);
        },

        /**
         * Saves last event client coordinates
         *
         * @param {Object} data Mousemove event
         * @param {Number} data.clientX
         * @param {Number} data.clientY
         */
        _saveClientCoords: function (data) {
            this._lastClientCoords = {
                clientX: data.clientX,
                clientY: data.clientY
            };
        },

        /**
         * Mouse up handler
         *
         * @private
         */
        _dndOnMouseUp: function () {
            this._lastClientCoords = null;
            this.removeDndHandlers();
            document.body.classList.remove('unselectable');
        },

        /**
         * Changes element position on mouse move
         *
         * @abstract
         * @param {coordinates} delta
         */
        drag: function () {
            throw new Error('SVGDraggable.drag not implemented');
        },

        /**
         * Checks if a new element position won't cross the border
         *  and changes delta object to avoid border crossing
         *
         * @abstract
         * @param {coordinates} delta
         * @returns {coordinates}
         */
        normalizeCoords: function () {
            throw new Error('SVGDraggable.normalizeCoords not implemented');
        }
    };
}(svgext));

/**
 * Defines Svg container class
 *
 * @name SVGContainer
 */

(function (svgext) {
    'use strict';

    svgext.SVGContainer = inherit([svgext.SVGElement, svgext.SVGBlock], {

        /**
         * SVGContainer class constructor
         *
         * @param {Object} [opts]
         * @param {String} [opts.cssClass]
         * @param {SVGSVGElement} [opts.node] existing svg element
         * @constructor
         */
        __constructor: function (opts) {
            opts = opts || {};
            opts.isDraggable = false;
            opts.cssClass = opts.cssClass || 'svg-container_fluid';
            this.__base(opts, opts.node || 'svg');
            this._offWindowResize = svgext._throttleEventListener('resize', this._onWindowResize.bind(this));
        },

        /**
         * Instances getter
         *
         * @param {SVGElement} [elemClass]
         * @returns {[SVGElement]}
         */
        getInstances: function (elemClass) {
            return elemClass ? this._filterChildren(elemClass) : this.children;
        },

        /**
         * Current active element getter
         *
         * @returns {SVGElement|null}
         */
        getActiveElement: function () {
            return this.activeElement;
        },

        /**
         * Toggles elements
         *
         * @param {Boolean} visible
         * @param {SVGElement} [elemClass]
         * @returns {SVGContainer}
         */
        toggleAllInstances: function (visible, elemClass) {
            this.getInstances(elemClass)
                .forEach(function (svgElement) {
                    if (!visible) {
                        svgElement.deactivate().hide();
                    } else {
                        svgElement.show();
                    }
                });

            return this;
        },

        /**
         * Sets an active element
         *
         * @param {SVGElement} svgElement
         */
        setActiveElement: function (svgElement) {
            if (svgElement && svgElement instanceof svgext.SVGElement && !svgElement.isActive) {
                this.deactivateActiveElement();
                svgElement.activate();
                this.activeElement = svgElement;
            }
        },

        /**
         * Deactivates active element if it exists
         *
         * @returns {SVGContainer}
         */
        deactivateActiveElement: function () {
            if (this.activeElement) {
                this.activeElement.deactivate();
                this.activeElement = null;
            }

            return this;
        },

        /**
         * Removes an active instance based on passed constructor
         *
         * @param {SVGElement} [elemClass]
         */
        removeActiveInstance: function (elemClass) {
            if (!this.activeElement) {
                return;
            }
            if (!elemClass || (elemClass && this.activeElement instanceof elemClass)) {
                this.remove(this.activeElement);
                this.activeElement = null;
            }
        },

        /**
         * Removes all instances based on passed constructor
         *
         * @param {SVGElement} [elemClass]
         */
        removeAllInstances: function (elemClass) {
            var children = this.children;

            if (elemClass) {
                this.removeActiveInstance(elemClass);
                return this.getInstances(elemClass).forEach(this.remove, this);
            }

            this.activeElement = null;
            while (children.length) {
                this.remove(children[0]);
            }
        },

        /**
         * Removes svg container
         *
         * @override {SVGBlock}
         */
        destroy: function () {
            this._offWindowResize();
            this.__base();
        },

        /**
         * Fetches all instances from the containers
         *
         * @param {instance} elemClass
         * @private
         * @returns {[SVGElement]}
         */
        _filterChildren: function (elemClass) {
            return this.children.filter(function (child) {
                return child instanceof elemClass;
            });
        },

        /**
         * Window resize handler
         *
         * @private
         */
        _onWindowResize: function () {
            var containerRect = this.getRect();
            if (this._prevContainerWidth === undefined) {
                this._prevContainerWidth = containerRect.width;
                this._prevContainerHeight = containerRect.height;
                return;
            }
            if (containerRect.width !== this._prevContainerWidth
                || containerRect.height !== this._prevContainerHeight) {
                this._resizeChildren(
                    containerRect.width / this._prevContainerWidth,
                    containerRect.height / this._prevContainerHeight
                );
                this._prevContainerWidth = containerRect.width;
                this._prevContainerHeight = containerRect.height;
            }
        },

        /**
         * Resizes all resizable children
         *
         * @param {Number} widthFactor width resize factor
         * @param {Number} heightFactor height resize factor
         * @private
         */
        _resizeChildren: function (widthFactor, heightFactor) {
            this.children.forEach(function (child) {
                if (child && child.resize) {
                    child.resize(widthFactor, heightFactor);
                }
            });
        }
    });
}(svgext));

/**
 * Defines SVGRect class
 *
 * @name SVGRect
 */

/**
 * Defines rectangle constructor options
 *
 * @typedef {Object} rectOpts
 * @prop {Number} x
 * @prop {Number} y
 * @prop {Number} width
 * @prop {Number} height
 * @prop {Boolean} [isDraggable=true]
 */

/**
 * Defines coordinates object
 *
 * @typedef {Object} coordinates
 * @prop {Number} x
 * @prop {Number} y
 */

(function (svgext) {
    'use strict';

    svgext.SVGRect = inherit([svgext.SVGElement, svgext.SVGDraggable], {

        /**
         * SVGRect class constructor
         *
         * @param {rectOpts} [opts]
         * @constructor
         */
        __constructor: function (opts) {
            if (!opts) {
                opts = {};
            }
            this.__base(opts, 'rect');
            if (opts.width !== undefined) {
                this.width(opts.width);
            }
            if (opts.height !== undefined) {
                this.height(opts.height);
            }
            if (opts.x !== undefined) {
                this.setX(opts.x);
            }
            if (opts.y !== undefined) {
                this.setY(opts.y);
            }
        },

        /**
         * Rectangle X coordinate setter
         * @param {Number} x
         *
         * @returns {SVGRect}
         */
        setX: function (x) {
            this._rectX = x || 0;
            return this.attr('x', this._rectX);
        },

        /**
         * Rectangle X coordinate getter
         *
         * @returns {Number}
         */
        getX: function () {
            return this._rectX;
        },

        /**
         * Rectangle Y coordinate setter
         *
         * @param {Number} y
         * @returns {SVGRectangle}
         */
        setY: function (y) {
            this._rectY = y || 0;

            return this.attr('y', this._rectY);
        },

        /**
         * Rectangle Y coordinate getter
         *
         * @returns {Number}
         */
        getY: function () {
            return this._rectY;
        },

        /**
         * Sets or gets rectangle width
         *
         * @param {Number} [width]
         * @returns {(Number|SVGRect)}
         */
        width: function (width) {
            if (width === undefined) {
                return this._width;
            }
            this._width = width;

            return this.attr('width', this._width);
        },

        /**
         * Sets or gets rectangle height
         *
         * @param {Number} [height]
         * @returns {(Number|SVGRect)}
         */
        height: function (height) {
            if (height === undefined) {
                return this._height;
            }
            this._height = height;

            return this.attr('height', this._height);
        },

        /**
         * SVGDraggable normalizeCoords implementation
         *
         * @override {SVGDraggable}
         */
        normalizeCoords: function (delta) {
            var x = this.getX(),
                y = this.getY(),
                width = this.width(),
                height = this.height(),
                containerSize = this.getContainerRect();
            if (x + delta.x < 0) {
                delta.x = (-1) * x;
            } else if (x + width + delta.x > containerSize.width) {
                delta.x = containerSize.width - x - width;
            }
            if (y + delta.y < 0) {
                delta.y = (-1) * y;
            } else if (y + height + delta.y > containerSize.height) {
                delta.y = containerSize.height - y - height;
            }

            return delta;
        },

        /**
         * Rectangle value getter
         *
         * @param {Boolean} [relative=false] Returns relative coordinates if true
         * @returns {Object} resolution
         * @returns {Number} resolution.width
         * @returns {Number} resolution.height
         */
        getValue: function (relative) {
            var result = {
                width: this.width(),
                height: this.height()
            }, containerRect;

            if (relative) {
                containerRect = this.getContainerRect();
                result.width /= containerRect.width;
                result.height /= containerRect.height;
            }

            return result;
        },

        /**
         * SVGDraggable drag implementation
         *
         * @override {SVGDraggable}
         */
        drag: function (delta) {
            this.setX(this.getX() + delta.x)
                .setY(this.getY() + delta.y);
        }
    });
}(svgext));

/**
 * Defines CartesianGeometryMath class
 *
 * @name CartesianGeometryMath
 */

/**
 * @typedef {Array} Point
 * @prop {Number} Point[0] X coordinate
 * @prop {Number} Point[1] Y coordinate
 */

/**
 * @typedef {Array} LineSegment
 * @prop {Point} LineSegment[0]
 * @prop {Point} LineSegment[1]
 */
(function (svgext) {
    'use strict';

    svgext.CartesianGeometryMath = {

        /**
         * Counts distance between two points
         *
         * @param {Point} point1 First point
         * @param {Point} point2 First point
         * @returns {Number}
         */
        distanceBtwTwoPoints: function (point1, point2) {
            return Math.sqrt(
                Math.pow(point2[0] - point1[0], 2) +
                Math.pow(point2[1] - point1[1], 2)
            );
        },

        /**
         * Finds line segment middle point
         *
         * @param {LineSegment} lineSegment
         * @returns {Array} Point
         */
        lineSegmentMidPoint: function (lineSegment) {
            return [
                (lineSegment[0][0] + ((lineSegment[1][0] - lineSegment[0][0]) / 2)),
                (lineSegment[0][1] + (lineSegment[1][1] - lineSegment[0][1]) / 2)
            ];
        },

        /**
         * Checks if two lines segments are intersected
         *
         * @param {LineSegment} lS1
         * @param {LineSegment} lS2
         * @returns {Boolean}
         */
        checkLinesIntersection: function (lS1, lS2) {
            return this._arePointsCounterClockWise(lS1[0], lS2[0], lS2[1])
                !== this._arePointsCounterClockWise(lS1[1], lS2[0], lS2[1])
                && this._arePointsCounterClockWise(lS1[0], lS1[1], lS2[0])
                !== this._arePointsCounterClockWise(lS1[0], lS1[1], lS2[1]);
        },

        /**
         * Finds an index in the polygon points array between 2 nearest points
         * to the passed coordinates
         *
         * @param {Array} polygonPoints
         * @param {Point} point New vertex coordinates
         * @returns {Number}
         */
        findPolygonInsertIndex: function (polygonPoints, point) {
            var smallestDistance = 10000,
                result;

            // Findind the nearest pair
            this.generateLineSegments(polygonPoints).forEach(function (lineSegment, index) {
                var distance = this.distanceBtwTwoPoints(
                    this.lineSegmentMidPoint(lineSegment),
                    point
                );
                if (smallestDistance > distance) {
                    smallestDistance = distance;
                    result = index + 1;
                }
            }, this);

            return result;
        },


        /**
         * Generates line segments array based on passed coordinates
         *
         * @param {[Number]} points polygon vertexes coordinates
         * @returns {[LineSegment]}
         */
        generateLineSegments: function (points) {
            var lineSegments = [];
            // Generating sibling pairs
            for (var i = 0; i <= points.length - 4; i += 2) {
                lineSegments.push([
                    [points[i], points[i + 1]],
                    [points[i + 2], points[i + 3]]
                ]);
            }

            // Adding a pair from the first and the last elements
            lineSegments.push([
                [points[points.length - 2], points[points.length - 1]],
                [points[0], points[1]]
            ]);

            return lineSegments;
        },

        /**
         * Checks if three points are listed in a counterclockwise order
         *
         * @param {Point} p1
         * @param {Point} p2
         * @param {Point} p3
         * @private
         * @returns {Boolean}
         */
        _arePointsCounterClockWise: function (p1, p2, p3) {
            return (p3[1] - p1[1]) * (p2[0] - p1[0]) > (p2[1] - p1[1]) * (p3[0] - p1[0]);
        }
    };
}(svgext));

/**
 * Defines SVGPolygonVertex
 *
 * @name SVGPolygonVertex
 */

/**
 * Defines rectangle constructor options
 *
 * @typedef {Object} vertexOpts
 * @prop {Number} x
 * @prop {Number} y
 * @prop {Number} width
 * @prop {Number} height
 * @prop {Boolean} [isDraggable=true]
 * @prop {SVGPolygon} polygon
 */

(function (svgext) {
    'use strict';

    svgext.SVGPolygonVertex = inherit(svgext.SVGRect, {

        /**
         * Creates new SVGPolygonVertex instance
         *
         * @param {vertexOpts} opts
         * @constructor
         */
        __constructor: function (opts) {
            opts = opts ? opts : {isDraggable: true};
            this.__base(opts);

            if (svgext._isTouchDevice) {
                this.addClass('svg-control_type_touch');
            }
        },

        /**
         * SVGDraggable normalizeCoords implementation
         *
         * @override {SVGDraggable}
         */
        normalizeCoords: function (delta) {
            var x = this.getX(),
                y = this.getY(),
                containerSize = this.getContainerRect();

            if (x + delta.x < 0) {
                delta.x = (-1) * x;
            } else if (x + delta.x > containerSize.width) {
                delta.x = containerSize.width - x;
            }
            if (y + delta.y < 0) {
                delta.y = (-1) * y;
            } else if (y + delta.y > containerSize.height) {
                delta.y = containerSize.height - y;
            }

            return delta;
        },

        /**
         * SVGDraggable drag implementation
         *
         * @override {SVGDraggable}
         */
        drag: function (delta) {
            this.__base(delta);
            this.container.render();
        },

        /**
         * Vertex X coordinate setter, with the half of the width offset
         *
         * @param {Number} x
         * @override {SVGRect}
         * @returns {SVGPolygonVertex}
         */
        setX: function (x) {
            this._rectX = x - (this.width() / 2);

            return this.attr('x', this._rectX);
        },

        /**
         * Vertex X coordinate getter, with the half of the width offset
         *
         * @override {SVGRect}
         * @returns {Number}
         */
        getX: function () {
            return this._rectX + (this.width() / 2);
        },

        /**
         * Vertex Y coordinate setter, with the half of the height offset
         *
         * @param {Number} y
         * @override {SVGRect}
         * @returns {SVGPolygonVertex}
         */
        setY: function (y) {
            this._rectY = y - (this.height() / 2);

            return this.attr('y', this._rectY);
        },

        /**
         * Vertex Y coordinate getter, with the half of the heihgt offset
         *
         * @override {SVGRect}
         * @returns {Number}
         */
        getY: function () {
            return this._rectY + (this.height() / 2);
        }
    });
}(svgext));

/**
 * Defines SVGPolygon class
 *
 * @name SVGPolygon
 */

/**
 * Defines polygon constructor options
 *
 * @typedef {Object} polygonOpts
 * @prop {Array} points
 * @prop {String} [cssClass='svg-polygon'] CSS classes separated by space
 * @prop {Boolean} [isDraggable=true]
 */
(function (svgext) {
    'use strict';

    svgext.SVGPolygon = inherit([svgext.SVGElement, svgext.SVGBlock, svgext.SVGDraggable], {

        /**
         * SVGPolygon class constructor
         *
         * @param {polygonOpts} [opts]
         * @constructor
         */
        __constructor: function (opts) {
            opts = opts || {};
            opts.cssClass = opts.cssClass || 'svg-polygon';
            this.__base(opts, 'polygon');
            this.rootNode = this.createElem('g');
            this.appendElem(this.node);
            if (opts.points) {
                this.setPoints(opts.points);
            }
            this.on(svgext._isTouchDevice ? 'touchstart' : 'mousedown', this.select.bind(this));
        },

        /**
         * Adds double click event listener to the container
         *
         * @override {SVGElement}
         */
        onAppend: function (container) {
            this.__base(container);
            this._onContainerDblClick = this._onContainerDblClick.bind(this);
            if (svgext._isTouchDevice) {
                return this._onContainerDblClick = this.container.onDoubleTap(this._onContainerDblClick);
            }

            this.container.on('dblclick', this._onContainerDblClick);
        },

        /**
         * Removes double click event listener from the container & destroys a polygon
         *
         * @override {SVGElement}
         */
        destroy: function () {
            if (svgext._isTouchDevice) {
                this.container.offDoubleTap(this._onContainerDblClick);
            } else {
                this.container.off('dblclick', this._onContainerDblClick);
            }

            this.__base();
        },

        /**
         * SVGPolygon points setter
         *
         * @param {Array} points SVGPolygon points
         * @returns {SVGPolygon}
         */
        setPoints: function (points) {
            if (points && Array.isArray(points) && points.length % 2 === 0) {
                if (this.vertexes) {
                    this.vertexes.forEach(this.remove, this);
                }
                this.vertexes = [];
                for (var i = 0; i < points.length - 1; i += 2) {
                    this.vertexes.push(this._createVertex([points[i], points[i + 1]]));
                }
                this.render();
            }

            return this;
        },

        /**
         * Renders a polygon based on vertexes coordinates
         *
         * @returns {SVGPolygon}
         */
        render: function () {
            this.attr('points', this.vertexes.reduce(function (all, vertex) {
                all.push(vertex.getX() + ',' + vertex.getY());
                return all;
            }, []).join(' '));

            return this;
        },

        /**
         * Adds a point to the polygon between two nearest points
         *
         * @param {Point} point
         * @returns {SVGPolygon}
         */
        addPoint: function (point) {
            var points = this.getValue(false);
            if (points && points.length) {
                var vertex = this._createVertex(point).addClass('active');
                this.vertexes.splice(
                    svgext.CartesianGeometryMath.findPolygonInsertIndex(points, point), 0, vertex
                );
                this.render();
            }

            return this;
        },

        /**
         * SVGDraggable normalizeCoords implementation
         *
         * @override {SVGDraggable}
         */
        normalizeCoords: function (delta) {
            this.vertexes.forEach(function (vertex) {
                delta = vertex.normalizeCoords(delta);
            });

            return delta;
        },

        /**
         * SVGDraggable drag implementation
         *
         * @override {SVGDraggable}
         */
        drag: function (delta) {
            this.vertexes.forEach(function (vertex) {
                vertex.setX(vertex.getX() + delta.x);
                vertex.setY(vertex.getY() + delta.y);
            });
            this.render();
        },

        /**
         * Activates polygon
         *
         * @override {SVGElement}
         * @returns {SVGPolygon}
         */
        activate: function () {
            this.__base();
            this.vertexes.forEach(function (vertex) {
                vertex.activate();
            });
            this.bringToFront();

            return this;
        },

        /**
         * Deactivates polygon
         *
         * @override {SVGElement}
         * @returns {SVGPolygon}
         */
        deactivate: function () {
            this.__base();
            this.vertexes.forEach(function (vertex) {
                vertex.deactivate();
            });

            return this;
        },

        /**
         * Checks if polygon doesn't intersect itself
         *
         * @param {Boolean} [highlight=false] Highlights polygon if it is complex
         * @returns {Boolean}
         */
        isSimple: function (highlight) {
            var lineSegments = svgext.CartesianGeometryMath.generateLineSegments(this.getValue(false)),
                lineSegmentsLen = lineSegments.length;

            for (var i = 0; i < lineSegmentsLen - 2; i++) {
                for (var j = i + 2; j < lineSegmentsLen - (i > 0 ? 0 : 1); j++) {
                    if (svgext.CartesianGeometryMath.checkLinesIntersection(lineSegments[i], lineSegments[j])) {
                        if (highlight) {
                            this.select();
                        }

                        return false;
                    }
                }
            }

            return true;
        },

        /**
         * Polygon coordinates getter
         *
         * @param {Boolean} [relative=false]
         * @returns {*}
         */
        getValue: function (relative) {
            var containerSize = this.getContainerRect();

            return this.vertexes.reduce(function (all, vertex) {
                if (relative) {
                    all.push(
                        vertex.getX() / containerSize.width,
                        vertex.getY() / containerSize.height
                    );
                } else {
                    all.push(vertex.getX(), vertex.getY());
                }

                return all;
            }, []);
        },

        /**
         * Resizes polygon
         *
         * @param {Number} widthFactor width resize factor
         * @param {Number} heightFactor height resize factor
         */
        resize: function (widthFactor, heightFactor) {
            this.vertexes.forEach(function (vertex) {
                vertex.setX(vertex.getX() * widthFactor);
                vertex.setY(vertex.getY() * heightFactor);
            });
            this.render();
        },

        /**
         * Activates polygon
         *
         * @returns {SVGPolygon}
         */
        select: function () {
            this.container.setActiveElement(this);

            return this;
        },

        /**
         * Removes polygon vetex
         *
         * @param {SVGPolygonVertex} vertex
         * @private
         */
        _removeVertex: function (vertex) {
            if (this.vertexes.length < 4) {
                return;
            }
            this.vertexes.splice(this.vertexes.indexOf(vertex), 1);
            this.remove(vertex).render();
        },

        /**
         * Creates a new vertex
         *
         * @param {Point} point
         * @private
         * @returns {SVGPolygonVertex}
         */
        _createVertex: function (point) {
            var vertex = new svgext.SVGPolygonVertex({
                    width: svgext.default.control.width,
                    height: svgext.default.control.height,
                    x: point[0],
                    y: point[1],
                    cssClass: 'svg-polygon-vertex'
                }),
                removeVertex = function (event) {
                    this._removeVertex(vertex);
                    event.stopPropagation();
                }.bind(this);

            this.append(vertex);
            if (svgext._isTouchDevice) {
                vertex.onDoubleTap(removeVertex);
            } else {
                vertex.on('dblclick', removeVertex);
            }

            return vertex;
        },

        /**
         * SVG container double click event handler, adds a new vertex to the polygon
         *
         * @param {Event} event
         * @private
         */
        _onContainerDblClick: function (event) {
            if (!this.isActive) {
                return;
            }

            var containerRect = this.getContainerRect(),
                point = svgext._isTouchDevice ? [
                    event.changedTouches[0].clientX - containerRect.left,
                    event.changedTouches[0].clientY - containerRect.top
                ] : [
                    event.offsetX, event.offsetY
                ];

            this.addPoint(point);
        }
    });

}(svgext));

/**
 * Defines SVGRectControls
 *
 * @name SVGRectControls
 */

/**
 * Defines rectangle constructor options
 *
 * @typedef {Object} controlsOpts
 * @param {Number} x
 * @prop {Number} y
 * @prop {Number} width
 * @prop {Number} height
 * @prop {('vertical' | 'horizontal')} type
 * @prop {Boolean} [isDraggable=true]
 * @prop {SVGPolygon} polygon
 */

(function (svgext) {
    'use strict';

    svgext.SVGRectControls = inherit(svgext.SVGRect, {

        /**
         * Creates new SVGRectControls instance
         *
         * @param {controlsOpts} opts
         * @constructor
         */
        __constructor: function (opts) {
            if (!opts.type) {
                throw new Error('Type should be set in a SVGRectControls constructor');
            }
            this.__base(opts);
            this.type = opts.type;
            this.addClass('svg-rectangle-control_type_' + this.type);

            if (svgext._isTouchDevice) {
                this.addClass('svg-control_type_touch');
            }
        },

        /**
         * SVGDraggable normalizeCoords implementation
         *
         * @override {SVGDraggable}
         */
        normalizeCoords: function (delta) {
            var width = this.width(),
                height = this.height(),
                x = this.getX() + width / 2,
                y = this.getY() + height / 2,
                containerSize = this.getContainerRect();
            if (x + delta.x < 0) {
                delta.x = (-1) * x;
            } else if (x + delta.x > containerSize.width) {
                delta.x = containerSize.width - x;
            }
            if (y + delta.y < 0) {
                delta.y = (-1) * y;
            } else if (y + delta.y > containerSize.height) {
                delta.y = containerSize.height - y;
            }

            return delta;
        },

        /**
         * SVGDraggable drag implementation
         *
         * @override {SVGDraggable}
         */
        drag: function (delta) {
            delta[this.type === 'horizontal' ? 'y' : 'x'] = 0;
            this.__base(delta);
            this.container.update(this.type);
        }
    });
}(svgext));

/**
 * Defines SVGResizableRect
 *
 * @name SVGResizableRect
 */

/**
 * Defines rectangle constructor options
 *
 * @typedef {Object} rectOpts
 * @prop {Number} x
 * @prop {Number} y
 * @prop {Number} width
 * @prop {Number} height
 * @prop {String} [cssClass='svg-resizable-rectangle'] CSS classes separated by space
 * @prop {Boolean} [isDraggable=true]
 */
(function (svgext) {
    'use strict';

    svgext.SVGResizableRect = inherit([svgext.SVGRect, svgext.SVGBlock], {

        /**
         * SVGResizableRect class constructor
         *
         * @param {rectOpts} opts
         * @constructor
         */
        __constructor: function (opts) {
            if (!(opts.width && opts.height && opts.x && opts.y)) {
                throw new Error('Missing property. Properties:'
                    + 'width, height, x and y are required by SVGResizableRectangle.');
            }
            opts.cssClass = opts.cssClass || 'svg-resizable-rectangle';
            this.__base(opts);

            this.rootNode = this.createElem('g');
            this.appendElem(this.node);
            this._createControls();
            this.on(svgext._isTouchDevice ? 'touchstart' : 'mousedown', this.select.bind(this));
        },

        /**
         * Changes rectangle coordiantes or resolution after controls move
         *
         * @param {('vertical' | 'horizontal')} type Control type
         */
        update: function (type) {
            var smallestPointIndex,
                points = this.controls;

            if (type === 'vertical') {
                // Finds vertical point index with the smallest Y value
                smallestPointIndex = points[0].getY() >= points[1].getY() ? 1 : 0;
                this.setY((svgext.default.control.height / 2) + points[smallestPointIndex].getY());
                this.height(points[smallestPointIndex ? 0 : 1].getY() - points[smallestPointIndex].getY());
                var hPointsY = this.getY() + (this.height() / 2) - svgext.default.control.height / 2;
                [points[2], points[3]].forEach(function (hPoint) {
                    hPoint.setY(hPointsY);
                });
            } else {
                // Finds vertical point index with the smallest X value
                smallestPointIndex = points[2].getX() >= points[3].getX() ? 3 : 2;
                this.setX((svgext.default.control.width / 2) + points[smallestPointIndex].getX());
                this.width(points[smallestPointIndex === 3 ? 2 : 3].getX() - points[smallestPointIndex].getX());
                var vPointsX = this.getX() + (this.width() / 2) - svgext.default.control.width / 2;
                [points[0], points[1]].forEach(function (vPoint) {
                    vPoint.setX(vPointsX);
                });
            }
        },

        /**
         * Activates resizable polygon
         *
         * @override {SVGElement}
         * @returns {SVGResizableRect}
         */
        activate: function () {
            this.__base();
            this.controls.forEach(function (control) {
                control.activate();
            });
            this.bringToFront();

            return this;
        },

        /**
         * Deactivates resizable polygon
         *
         * @override {SVGElement}
         * @returns {SVGResizableRect}
         */
        deactivate: function () {
            this.__base();
            this.controls.forEach(function (control) {
                control.deactivate();
            });

            return this;
        },

        /**
         * SVGDraggable drag implementation
         *
         * @override {SVGDraggable}
         */
        drag: function (delta) {
            this.controls.concat(this)
                .forEach(function (point) {
                    point.setX(point.getX() + delta.x).setY(point.getY() + delta.y);
                });
        },

        /**
         * Activates rectangle
         *
         * @returns {SVGResizableRect}
         */
        select: function () {
            this.container.setActiveElement(this);

            return this;
        },

        /**
         * Resizes rectangle
         *
         * @param {Number} widthFactor width resize factor
         * @param {Number} heightFactor height resize factor
         */
        resize: function (widthFactor, heightFactor) {
            this.setX(this.getX() * widthFactor);
            this.setY(this.getY() * heightFactor);
            this.width(this.width() * widthFactor);
            this.height(this.height() * heightFactor);
            this.controls.forEach(function (point) {
                point.setX(point.getX() * widthFactor)
                    .setY(point.getY() * heightFactor);
            }, this);
        },

        /**
         * Adds a new control
         *
         * @param {controlsOpts} opts
         * @private
         */
        _addControl: function (opts) {
            var control = new svgext.SVGRectControls(opts);
            this.append(control);
            this.controls.push(control);
        },

        /**
         * Creates controls based on resolution and coordiantes, can be called only once
         *
         * @private
         */
        _createControls: function () {
            if (this.controlCreated) {
                return;
            }
            this.controls = [];
            var halfControlWidth = svgext.default.control.width / 2,
                halfControlHeight = svgext.default.control.height / 2,
                controlOpts = {
                    width: svgext.default.control.width,
                    height: svgext.default.control.height,
                    cssClass: 'svg-rectangle-control'
                };
            // Top
            controlOpts.type = 'vertical';
            controlOpts.x = this.getX() + (this.width() / 2) - halfControlWidth;
            controlOpts.y = this.getY() - halfControlHeight;
            this._addControl(controlOpts);

            // Bottom
            controlOpts.y = this.getY() + this.height() - halfControlHeight;
            this._addControl(controlOpts);

            // Right
            controlOpts.type = 'horizontal';
            controlOpts.x = this.getX() + this.width() - halfControlWidth;
            controlOpts.y = this.getY() + (this.height() / 2) - halfControlHeight;
            this._addControl(controlOpts);

            // Left
            controlOpts.x = this.getX() - halfControlWidth;
            this._addControl(controlOpts);

            this.controlCreated = true;
            return this;
        }
    });
}(svgext));

/**
 * Defines SVGBorder
 *
 * @name SVGBorderedRect
 * @namespace Services
 */

(function (svgext) {
    'use strict';

    svgext.SVGBorder = inherit(svgext.SVGElement, {

        /**
         * SVGBorder class constructor
         *
         * @constructor
         */
        __constructor: function () {
            this.__base({
                isDraggable: false,
                cssClass: 'svg-border',
                backgroundColor: 'none'
            }, 'rect');
        },

        /**
         * Renders border
         *
         * @override {SVGElement}
         */
        onAppend: function (container) {
            this.__base(container);
            this.render();
        },

        /**
         * Places border around a rectangle
         *
         * @param {axis} [axis] Changed axis
         */
        render: function (axis) {
            var offset = svgext.default.borderedRect.borderOffset;

            if (axis !== 'x') {
                this.attr('y', this.container.getY() - offset)
                    .attr('height', this.container.height() + 2 * offset);
            }

            if (axis !== 'y') {
                this.attr('x', this.container.getX() - offset)
                    .attr('width', this.container.width() + 2 * offset);
            }
        }
    });

}(svgext));

/**
 * Defines SVGBorderControl
 *
 * @name SVGBorderControl
 */
(function (svgext) {
    'use strict';

    svgext.SVGBorderControl = inherit(svgext.SVGRect, {

        /**
         * Creates new SVGBorderControl instance
         *
         * @constructor
         */
        __constructor: function () {
            this.__base({
                cssClass: 'svg-border-control',
                isDraggable: true,
                width: svgext.default.control.width,
                height: svgext.default.control.height
            });

            if (svgext._isTouchDevice) {
                this.addClass('svg-control_type_touch');
            }
        },

        /**
         * Renders border control
         *
         * @override {SVGElement}
         */
        onAppend: function (container) {
            this.__base(container);
            this.render();
        },

        /**
         * SVGDraggable normalizeCoords implementation
         *
         * @override {SVGDraggable}
         */
        normalizeCoords: function (delta) {
            var containerSize = this.getContainerRect(),
                rect = this.container;

            if (rect.width() + delta.x < 1) {
                delta.x = rect.width() > 1 ? (-1) * (rect.width() - 1) : 0;
            } else if (rect.getX() + rect.width() + delta.x > containerSize.width) {
                delta.x = containerSize.width - rect.getX() - rect.width();
            }
            if (rect.height() + delta.y < 1) {
                delta.y = rect.height() > 1 ? (-1) * rect.height() + 1 : 0;
            } else if (rect.getY() + rect.height() + delta.y > containerSize.height) {
                delta.y = containerSize.height - rect.getY() - rect.height();
            }

            return delta;
        },

        /**
         * SVGDraggable drag implementation
         *
         * @override {SVGDraggable}
         */
        drag: function (delta) {
            var rect = this.container;

            rect.width(rect.width() + delta.x).height(rect.height() + delta.y);
        },

        /**
         * Places control on the bottom of border rectangle
         *
         * @param {axis} [axis] Changed axis
         */
        render: function (axis) {
            var rect = this.container,
                offset = svgext.default.borderedRect.borderOffset;

            if (axis !== 'x') {
                this.setY(rect.getY() + rect.height() + offset - svgext.default.control.height / 2);
            }

            if (axis !== 'y') {
                this.setX(rect.getX() + rect.width() + offset - svgext.default.control.width / 2);
            }
        }
    });
}(svgext));

/**
 * Defines SVGBorderedRect
 *
 * @name SVGBorderedRect
 */

/**
 * Defines rectangle constructor options
 *
 * @typedef {Object} rectOpts
 * @prop {Number} x
 * @prop {Number} y
 * @prop {Number} width
 * @prop {Number} height
 * @prop {String} [cssClass='svg-bordered-rect'] CSS classes separated by space
 * @prop {String} [backgroundColor='#00d']
 * @prop {Boolean} [isDraggable=true]
 */

/**
 * Defines axis
 *
 * @typedef {('x'|'y')} axis
 */
(function (svgext) {
    'use strict';

    svgext.SVGBorderedRect = inherit([svgext.SVGRect, svgext.SVGBlock], {

        /**
         * SVGBorderedRect class constructor
         *
         * @param {rectOpts} [opts]
         * @constructor
         */
        __constructor: function (opts) {
            if (!(opts.width && opts.height && opts.x && opts.y)) {
                throw new Error('Missing property. Properties:'
                    + 'width, height, x and y are required by SVGResizeableRectangle.');
            }
            opts.cssClass = opts.cssClass || 'svg-bordered-rect';
            this.__base(opts);

            this.rootNode = this.createElem('g');
            this.appendElem(this.node);

            this.border = new svgext.SVGBorder();
            this.append(this.border);

            this.control = new svgext.SVGBorderControl();
            this.append(this.control);

            this.on(svgext._isTouchDevice ? 'touchstart' : 'mousedown', this.select.bind(this));
        },

        /**
         * Sets or gets rectangle width
         *
         * @override {SVGRect}
         */
        width: function (width) {
            var result = this.__base(width);

            if (width) {
                this.renderComponents('x');
            }

            return result;
        },

        /**
         * Sets or gets rectangle height
         *
         * @override {SVGRect}
         */
        height: function (height) {
            var result = this.__base(height);

            if (height) {
                this.renderComponents('y');
            }

            return result;
        },

        /**
         * Activates bordered rectangle
         *
         * @override {SVGElement}
         * @returns {SVGBorderedRect}
         */
        activate: function () {
            this.__base();
            this.border.activate();
            this.control.activate();
            this.bringToFront();

            return this;
        },

        /**
         * Deactivates bordered rectangle
         *
         * @override {SVGElement}
         * @returns {SVGBorderedRect}
         */
        deactivate: function () {
            this.__base();
            this.border.deactivate();
            this.control.deactivate();

            return this;
        },

        /**
         * SVGDraggable drag implementation
         *
         * @override {SVGDraggable}
         */
        drag: function (delta) {
            this.setX(this.getX() + delta.x)
                .setY(this.getY() + delta.y);
            this.renderComponents();
        },

        /**
         * Activates rect
         *
         * @returns {SVGBorderedRect}
         */
        select: function () {
            this.container.setActiveElement(this);

            return this;
        },

        /**
         * Resizes rectangle
         *
         * @param {Number} widthFactor width resize factor
         * @param {Number} heightFactor height resize factor
         */
        resize: function (widthFactor, heightFactor) {
            this.setX(this.getX() * widthFactor);
            this.setY(this.getY() * heightFactor);
            this.width(this.width() * widthFactor);
            this.height(this.height() * heightFactor);
            this.renderComponents();
        },

        /**
         * Renders border and control
         *
         * @param {axis} [axis] Changed axis
         */
        renderComponents: function (axis) {
            if (this.border && this.control) {
                this.border.render(axis);
                this.control.render(axis);
            }
        }
    });
}(svgext));
