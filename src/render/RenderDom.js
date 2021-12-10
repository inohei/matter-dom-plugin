var RenderDom = {};

module.exports = function(Matter){
    var Common = Matter.Common;
    var Composite = Matter.Composite;
    var Events = Matter.Events;
    var Render = Matter.Render;

    var _requestAnimationFrame,
        _cancelAnimationFrame;

    if (typeof window !== 'undefined'){
        _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
                                    || window.mozRequestAnimationFrame || window.msRequestAnimationFrame
                                    || function(callback){ window.setTimeout(function(){callback(Common.now())}, 1000 / 60);};
        
        _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame 
                                    || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
    }

    RenderDom.create = function(options){
        var defaults = {
            engine: null,
            element: window,
            controller: RenderDom,
            frameRequestId: null,
            options: {}
        }

        /*
        try{
            if(!options){
                throw (new Error('No engine was specified. Create an options object and specify the engine with the engine property.'));
            }

            if(!options.engine){
                throw (new Error('No engine was specified. Create an options object and specify the engine with the engine property.'));
            }
        }catch(e){
            console.log(`${e.name}: ${e.message}`);
            return;
        }*/

        var engine = options.engine;

        var render = Common.extend(defaults, options);
        


        return render;
    }

    RenderDom.run = function(render){
        (function loop(time){
            render.frameRequestId = _requestAnimationFrame(loop);
            RenderDom.world(render);
        })();
    }

    RenderDom.stop = function(render){
        _cancelAnimationFrame(render.frameRequestId);
    }

    RenderDom.world = function(render){
        var engine = render.engine,
        world = engine.world,
        allBodies = Composite.allBodies(world),
        allConstraints = Composite.allConstraints(world),
        domBodies = document.querySelectorAll('[matter]');


        var event = {
            timestamp: engine.timing.timestamp
        };

        Events.trigger(render, 'beforeRender', event);

        // TODO bounds if specified
        RenderDom.bodies(render, domBodies);
    }

    /**
     * Map Dom view elements position to matter world bodys position
     */
    RenderDom.bodies = function(render, bodies, context){
        var c = context,
            engine = render.engine,
            world = engine.world,
            options = render.options,
            matterBodies = Composite.allBodies(world),
            domBody;

        for(var i=0; i<matterBodies.length; i++){
            var matterBody = matterBodies[i];
            
            for(var k=(matterBody.parts.length > 1) ? 1 : 0; k<matterBody.parts.length; k++){
                var matterPart = matterBody.parts[k];
                if(!matterPart.Dom) continue;
                var domPart = matterPart.Dom.element;

                var bodyWorldPoint = matterPart.position;
                var bodyViewOffset;
                var center;
                if(domPart instanceof SVGElement) {
                    const parent = domPart.parentElement;
                    const vbox = parent.getAttribute("viewBox")?.split(/ +/) || [0,0]
                    var bbox = domPart.getBBox();
                    var svgbbox = parent.getBoundingClientRect();
                    center = {x: bbox.x + bbox.width/2, y: bbox.y + bbox.height/2};
                    bodyViewOffset = {x: center.x - vbox[0] + svgbbox.x, y: center.y - vbox[1] + svgbbox.y};
                } else {
                    bodyViewOffset = {x: domPart.offsetLeft + domPart.offsetWidth/2, y: domPart.offsetTop + domPart.offsetHeight/2};
                }
                domPart.style.position = "absolute";
                var t = `translate(${bodyWorldPoint.x-bodyViewOffset.x}px, ${bodyWorldPoint.y-bodyViewOffset.y}px)`;
                if(domPart instanceof SVGElement) t += `translate(${center.x}px, ${center.y}px)`;
                t += `rotate(${matterBody.angle}rad)`;
                if(domPart instanceof SVGElement) t += `translate(${-center.x}px, ${-center.y}px)`;

                domPart.style.transform = t;
            }
        }
    }

    return RenderDom;
};
