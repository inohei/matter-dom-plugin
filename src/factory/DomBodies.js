var DomBodies = {};

module.exports = function(Matter){
    var Body = Matter.Body;
    var Bodies = Matter.Bodies;
    var DomBody = Matter.DomBody;
    var Vertices = Matter.Vertices;
    var Common = Matter.Common;
    var World = Matter.World;
    var Bounds = Matter.Bounds;
    var Vector = Matter.Vector;

    DomBodies.create = function(options){
        var bodyType = options.bodyType; // Required
        var el = options.el; // Required
        var render = options.render; // Required
        var position = options.position; // Required

        delete options.bodyType;
        //delete options.el;
        delete options.render;
        delete options.position;

        options.domRenderer = render;

        /*
        options.Dom = {
            render: render,
            element: null
        }
        */

        var worldBody = null
        var domBody = document.querySelector(el);

        if(bodyType == "block"){
            //console.log("One block, please!")
            worldBody = DomBodies.OGblock(
                position.x,
                position.y,
                domBody.offsetWidth,
                domBody.offsetHeight,
                options
            );
        }else if(bodyType == "circle"){
            //console.log("One circle, please!");
            worldBody = DomBodies.circle(
                position.x,
                position.y,
                domBody.offsetWidth/2,
                options
            );
        }

        if(worldBody){
            // TODO TEST THIS!!
            //domBody.setAttribute('matter-id', worldBody.id);
            World.add(render.engine.world, [worldBody]);
        }

        return worldBody;
    }

    DomBodies.OGblock = function(x, y, width, height, options){
        var options = options || {};

        var block = {
            label: 'Block Body',
            position: {x: x, y: y},
            vertices: Vertices.fromPath('L 0 0 L ' + width + ' 0 L ' + width + ' ' + height + ' L 0 ' + height)
        };

        if(options.chamfer){
            var chamfer = option.chamfer;
            block.vertices = Vertices.chamfer(block.vertices, chamfer.radius,
                                chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
            delete options.chamfer;
        }
        return DomBody.create(Common.extend({}, block, options));
    };

    DomBodies.element = function(element, options){
        var bbox = element.getBoundingClientRect();
        var position = {x: bbox.x + bbox.width / 2.0, y: bbox.y + bbox.height / 2.0};

        var defaults = {
            Dom:{element:element}
        }


    // let bodyopts = {restitution: 0.3,
    //     friction: 1, frictionAir:0, frictionStatic: 2,
    //     density: 0.1,
    //     isStatic: false}
        var attributes = ['restitution', 'friction', 'frictionAir', 'frictionStatic', 'density', 'isStatic'];
        for(var attr of attributes) {
            var v;
            if(v = element.getAttribute(`data-${attr}`)) {
                defaults[attr] = v
            }
        }

        var options = options || {};
        options = Common.extend(defaults, options);
        
        if(element.tagName == 'circle' || element.tagName == 'ellipse' )
            return DomBodies.circle(position.x, position.y, bbox.width / 2.0, options);

        var block = {
            label: `DOM ${element.tagName} Body`,
            position: position,
            vertices: Vertices.fromPath('L 0 0 L ' + bbox.width + ' 0 L ' + bbox.width + ' ' + bbox.height + ' L 0 ' + bbox.height)
        };

        
        if(options.chamfer){
            var chamfer = option.chamfer;
            block.vertices = Vertices.chamfer(block.vertices, chamfer.radius,
                                chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
            delete options.chamfer;
        }
        
        var body = DomBody.create(Common.extend({}, block, options));
         element.setAttribute('matter-id', body.id);

         return body;
    };

    // DomBodies.block = function(x, y, options){
    //     var defaults = {
    //         Dom: {
    //             element: null,
    //             render: null
    //         }
    //     }
    //     var options = options || {};
    //     options = Common.extend(defaults, options);

    //     var block = {
    //         label: 'DOM Block Body',
    //         position: {x: x, y: y},
    //         vertices: Vertices.fromPath('L 0 0 L ' + bbox.width + ' 0 L ' + bbox.width + ' ' + bbox.height + ' L 0 ' + bbox.height)
    //     };

    //     if(options.chamfer){
    //         var chamfer = option.chamfer;
    //         block.vertices = Vertices.chamfer(block.vertices, chamfer.radius,
    //                             chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
    //         delete options.chamfer;
    //     }
        
    //     var body = DomBody.create(Common.extend({}, block, options));
    //      //element.setAttribute('matter-id', body.id);

    //      return body;
    // };

    DomBodies.circle = function(x, y, radius, options, maxSides){
        options = options || {};

        var circle = {
            label: 'Circle Body',
            circleRadius: radius
        }

        // approximate circles with polygons until true circles implemented in SAT
        maxSides = maxSides || 25;
        var sides = Math.ceil(Math.max(10, Math.min(maxSides, radius)));

        // optimisation: always use even number of sides (half the number of unique axes)
        if(sides % 2 === 1)
            sides += 1;

        return DomBodies.polygon(x, y, sides, radius, Common.extend({}, circle, options));
    };

    DomBodies.polygon = function(x, y, sides, radius, options){
        options = options || {};

        if (sides < 3)
            return Bodies.circle(x, y, radius, options);

        var theta = 2 * Math.PI / sides,
            path = '',
            offset = theta * 0.5;

        for (var i = 0; i < sides; i += 1) {
            var angle = offset + (i * theta),
                xx = Math.cos(angle) * radius,
                yy = Math.sin(angle) * radius;

            path += 'L ' + xx.toFixed(3) + ' ' + yy.toFixed(3) + ' ';
        }

        var polygon = { 
            label: 'Polygon Body',
            position: { x: x, y: y },
            vertices: Vertices.fromPath(path)
        };

        if (options.chamfer) {
            var chamfer = options.chamfer;
            polygon.vertices = Vertices.chamfer(polygon.vertices, chamfer.radius, 
                                    chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
            delete options.chamfer;
        }

        return DomBody.create(Common.extend({}, polygon, options));
    }

    return DomBodies;
};
