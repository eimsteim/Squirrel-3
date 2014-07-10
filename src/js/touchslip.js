/**
 * @file SQ.TouchSlip 触摸滑动组件
 * @data 2013.7.10
 * @version 1.0.0
 */

/*global $, SQ, console, jQuery */

(function (window, document) {
    'use strict';
    var _fun = {
        ios: function () { // 作用：判断是否为苹果的IOS设备
            var regularResult = navigator.userAgent.match(/.*OS\s([\d_]+)/),
                isiOS = !!regularResult;
            if (!this._versionValue && isiOS) {
                this._versionValue = regularResult[1].replace(/_/g, '.');
            }
            this.ios = function () {
                return isiOS;
            };
            return isiOS;
        },
        version: function () { // 作用：返回IOS的版本号
            return this._versionValue;
        },
        clone: function (object) { // 作用：用于原型继承
            function F() {}
            F.prototype = object;
            return new F();
        }
    };

    var slipjs = {
        _refreshCommon: function (wideHigh, parentWideHigh) { // 作用：当尺寸改变时，需要重新取得相关的值
            var me = this;
            me.wideHigh = wideHigh || me.core[me.offset] - me.upRange;
            me.parentWideHigh      = parentWideHigh      || me.core.parentNode[me.offset];
            me._getCoreWidthSubtractShellWidth();
        },
        _initCommon: function (core, param) { // 作用：初始化
            var me = this;
            me.core = core;
            me.startFun    = param.startFun;
            me.moveFun     = param.moveFun;
            me.touchEndFun = param.touchEndFun;
            me.endFun      = param.endFun;
            me.DIRECTION   = param.DIRECTION;
            me.upRange    = param.upRange   || 0;
            me.downRange  = param.downRange  || 0;
            if (me.DIRECTION === 'x') {
                me.offset = 'offsetWidth';
                me._pos   = me.__posX;
            } else {
                me.offset = 'offsetHeight';
                me._pos   = me.__posY;
            }
            me.wideHigh       = param.wideHigh || me.core[me.offset] - me.upRange;
            me.parentWideHigh   = param.parentWideHigh || me.core.parentNode[me.offset];
            me._getCoreWidthSubtractShellWidth();

            me._bind('touchstart');
            me._bind('touchmove');
            me._bind('touchend');
            me._bind('webkitTransitionEnd');

            me.xy = 0;
            me.y = 0;
            me._pos(-me.upRange);
        },
        _getCoreWidthSubtractShellWidth: function () { // 作用：取得滑动对象和它父级元素的宽度或者高度的差
            var me = this;
            me.widthCutCoreWidth = me.parentWideHigh - me.wideHigh;
            me.coreWidthCutWidth = me.wideHigh - me.parentWideHigh;
        },
        handleEvent: function (e) { // 作用：简化addEventListener的事件绑定
            switch (e.type) {
            case 'touchstart':
                this._start(e);
                break;
            case 'touchmove':
                this._move(e);
                break;
            case 'touchend':
            case 'touchcancel':
                this._end(e);
                break;
            case 'webkitTransitionEnd':
                this._transitionEnd(e);
                break;
            }
        },
        _bind: function (type, boole) { // 作用：事件绑定
            this.core.addEventListener(type, this, !!boole);
        },
        _unBind: function (type, boole) { // 作用：事件移除
            this.core.removeEventListener(type, this, !!boole);
        },
        __posX: function (x) { // 作用：当设置滑动的方向为“X”时用于设置滑动元素的坐标
            this.xy = x;
            this.core.style.webkitTransform = 'translate3d(' + x + 'px, 0px, 0px)';
            //this.core.style['webkitTransform'] = 'translate('+x+'px, 0px) scale(1) translateZ(0px)';
        },
        __posY: function (x) { // 作用：当设置滑动的方向为“Y”时用于设置滑动元素的坐标
            this.xy = x;
            this.core.style.webkitTransform = 'translate3d(0px, ' + x + 'px, 0px)';
            //this.core.style['webkitTransform'] = 'translate(0px, '+x+'px) scale(1) translateZ(0px)';
        },
        _posTime: function (x, time) { // 作用：缓慢移动
            this.core.style.webkitTransitionDuration = time + 'ms';
            this._pos(x);
        }
    };

    var SlipPage = _fun.clone(slipjs);
    //function SlipPage() {}
    //SQ.util.extend(SlipPage, slipjs);

    SlipPage._init = function (core, param) { // 作用：初始化
        var me = this;
        me._initCommon(core, param);
        me.NUM_PAGES = param.NUM_PAGES;
        me.page = 0;
        me.AUTO_TIMER = param.AUTO_TIMER;
        me.lastPageFun = param.lastPageFun;
        me.firstPageFun = param.firstPageFun;
        if (param.AUTO_TIMER) {
            me._autoChange();
        }
        param.noFollow ? (me._move = me._moveNoMove, me.nextTime = 500) : me.nextTime = 300;
    };
    SlipPage._start = function(evt) { // 触摸开始
        var me = this;
        var e = evt.touches[0];
        me._abruptX = 0;
        me._abruptXAbs = 0;
        me._startX = me._startXClone = e.pageX;
        me._startY = e.pageY;
        me._movestart = undefined;
        if (me.AUTO_TIMER) {
            me._stop();
        }
        if (me.startFun) {
            me.startFun(e);
        }
    };
    SlipPage._move = function(evt) { // 触摸中,跟随移动
        var me = this;
        me._moveShare(evt);
        if(!me._movestart){
            var e = evt.touches[0];
            evt.preventDefault();
            me.offsetX = (me.xy > 0 || me.xy < me.widthCutCoreWidth) ? me._disX/2 + me.xy : me._disX + me.xy;
            me._startX  = e.pageX;
            if (me._abruptXAbs < 6) {
                me._abruptX += me._disX;
                me._abruptXAbs = Math.abs(me._abruptX);
                return;
            }
            me._pos(me.offsetX);
            if (me.moveFun) {
                me.moveFun(e);
            }
        }
    };
    SlipPage._moveNoMove = function(evt) { // 触摸中,不跟随移动，只记录必要的值
        var me = this;
        me._moveShare(evt);
        if(!me._movestart){
            evt.preventDefault();
            me.moveFun && me.moveFun(e);
        }
    };
    SlipPage._moveShare = function(evt) { // 不跟随移动和跟随移动的公共操作
        var me = this,
        e = evt.touches[0];
        me._disX = e.pageX - me._startX;
        me._disY = e.pageY - me._startY;
        typeof me._movestart === 'undefined' && (me._movestart = !!(me._movestart || Math.abs(me._disX) < Math.abs(me._disY)));
    };
    SlipPage._end = function(e) { // 触摸结束
        if (!this._movestart) {
            var me = this;
            me._endX = e.changedTouches[0].pageX;
            me._range = me._endX - me._startXClone;
            if(me._range > 35){
                me.page !== 0 ? me.page -= 1 : (me.firstPageFun && me.firstPageFun(e));
            }else if(Math.abs(me._range) > 35){
                me.page !== me.NUM_PAGES - 1 ? me.page += 1 : (me.lastPageFun && me.lastPageFun(e));
            }
            me.toPage(me.page, me.nextTime);
            me.touchEndFun && me.touchEndFun(e);
        }
    };
    SlipPage._transitionEnd = function(e) { // 动画结束
        var me = this;
        e.stopPropagation();
        me.core.style.webkitTransitionDuration = '0';
        me._stopIng && me._autoChange(), me._stopIng = false;
        me.endFun && me.endFun();
    };
    SlipPage.toPage = function(num, time) { // 可在外部调用的函数，指定轮换到第几张，只要传入：“轮换到第几张”和“时间”两个参数。
        this._posTime(-this.parentWideHigh * num, time || 0);
        this.page = num;
    };
    SlipPage._stop = function() { // 作用：停止自动轮换
        clearInterval(this._autoChangeSet);
        this._stopIng = true;
    };
    SlipPage._autoChange = function() { // 作用：自动轮换
        var me = this;
        me._autoChangeSet = setInterval(function() {
            me.page !== me.NUM_PAGES - 1 ? me.page += 1 : me.page = 0;
            me.toPage(me.page, me.nextTime);
        },me.AUTO_TIMER);
    };
    SlipPage.refresh = function(wideHigh, parentWideHigh) { // 可在外部调用，作用：当尺寸改变时（如手机横竖屏时），需要重新取得相关的值。这时候就可以调用该函数
        this._refreshCommon(wideHigh, parentWideHigh);
    };
            
    var SlipPx = _fun.clone(slipjs);
    //function SlipPx() {}
    //SQ.util.extend(SlipPx, slipjs);

    SlipPx._init = function(core,param) { // 作用：初始化
        var me  = this;
        me._initCommon(core,param);
        me.perfect     = param.perfect;
        me.SHOW_SCROLL_BAR = param.SHOW_SCROLL_BAR;
        if(me.DIRECTION === 'x'){
            me.pageX          = 'pageX';
            me.pageY          = 'pageY';
            me.widthOrHeight = 'width';
            me._real           = me._realX;
            me._posBar         = me.__posBarX;
        }else{
            me.pageX          = 'pageY';
            me.pageY          = 'pageX';
            me.widthOrHeight = 'height';
            me._real           = me._realY;
            me._posBar         = me.__posBarY;
        }
        if(me.perfect){
            me._transitionEnd = function(){};
            me._stop          = me._stopPerfect;
            me._slipBar       = me._slipBarPerfect;
            me._posTime       = me._posTimePerfect;
            me._barUpRange   = me.upRange;
            me.noBar         = false;
            me._slipBarTime   = function(){};
        }else{
            me.noBar   = param.noBar;
            me.core.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33, 0.66, 0.66, 1)';
        }
        if(me.SHOW_SCROLL_BAR){
            me._hideBar = function(){};
            me._showBar = function(){};
        }
        if(_fun.ios()){
            me.radius = 11;
        }else{
            me.radius = 0;
        }
        if(!me.noBar){
            me._insertSlipBar(param);
            if(me.coreWidthCutWidth <= 0){
                me._barShellOpacity = 0;
                me._showBarStorage    = me._showBar;
                me._showBar           = function(){};
            }
        }else{
            me._hideBar = function(){};
            me._showBar = function(){};
        }
    };
    SlipPx._start = function(evt) { // 触摸开始
        var me = this;
        var e = evt.touches[0];
        me._animating = false;
        me._steps = [];
        me._abruptX     = 0;
        me._abruptXAbs = 0;
        me._startX = me._startXClone = e[me.pageX];
        me._startY = e[me.pageY];
        me._startTime = e.timeStamp || Date.now();
        me._movestart = undefined;
        !me.perfect && me._needStop && me._stop();
        me.core.style.webkitTransitionDuration = '0';
        me.startFun && me.startFun(e);
    };
    SlipPx._move = function(evt) { // 触摸中
        var me = this;
        var e = evt.touches[0];
        var _ePage = e[me.pageX];
        var _ePageOther = e[me.pageY];
        var thatX = me.xy;
        me._disX = _ePage - me._startX;
        me._disY = _ePageOther - me._startY;
        (me.DIRECTION === 'x' && typeof me._movestart === 'undefined') && (me._movestart = !!(me._movestart || (Math.abs(me._disX) < Math.abs(me._disY))));
        
        if(!me._movestart){
            evt.preventDefault();
            me._moveTime = e.timeStamp || Date.now();
            me.offsetX = (thatX > 0 || thatX < me.widthCutCoreWidth - me.upRange) ? me._disX/2 + thatX : me._disX + thatX;
            me._startX = _ePage;
            me._startY = _ePageOther;
            me._showBar();
            if (me._abruptXAbs < 6 ) {
                me._abruptX += me._disX;
                me._abruptXAbs = Math.abs(me._abruptX);
                return;
            }
            me._pos(me.offsetX);
            me.noBar || me._slipBar();
            if (me._moveTime - me._startTime > 300) {
                me._startTime    = me._moveTime;
                me._startXClone = _ePage;
            }
            me.moveFun && me.moveFun(e);
        }
    };
    SlipPx._end = function(evt) { // 触摸结束
        if (!this._movestart) {
            var me = this,
                e = evt.changedTouches[0],
                duration = (e.timeStamp || Date.now()) - me._startTime,
                fastDistX = e[me.pageX] - me._startXClone;
            me._needStop = true;
            if(duration < 300 && Math.abs(fastDistX) > 10) {
                if (me.xy > -me.upRange || me.xy < me.widthCutCoreWidth) {
                    me._rebound();
                }else{
                    var _momentum = me._momentum(fastDistX, duration, -me.xy - me.upRange, me.coreWidthCutWidth + (me.xy), me.parentWideHigh);
                    me._posTime(me.xy + _momentum.dist, _momentum.time);
                    me.noBar || me._slipBarTime(_momentum.time);
                }
            }else{
                me._rebound();
            }
            me.touchEndFun && me.touchEndFun(e);
        }
    };
    SlipPx._transitionEnd = function(e) { // 滑动结束
        var me = this;
        if (e.target !== me.core) {
            return;
        }
        me._rebound();
        me._needStop = false;
    };
    SlipPx._rebound = function(time) { // 作用：滑动对象超出时复位
        var me = this,
            _reset = (me.coreWidthCutWidth <= 0) ? 0 : (me.xy >= -me.upRange ? -me.upRange : me.xy <= me.widthCutCoreWidth - me.upRange ? me.widthCutCoreWidth - me.upRange : me.xy);
        if (_reset === me.xy) {
            me.endFun && me.endFun();
            me._hideBar();
            return;
        }
        me._posTime(_reset, time || 400);
        me.noBar || me._slipBarTime(time);
    };
    SlipPx._insertSlipBar = function(param) { // 插入滚动条
        var me = this;
        me._bar       = document.createElement('div');
        me._barShell = document.createElement('div');
        var _barCss;
        var _barShellCss;
        if(me.DIRECTION === 'x'){
            _barCss = 'height: 5px; position: absolute;z-index: 10; pointer-events: none;';
            _barShellCss = 'opacity: '+me._barShellOpacity+'; left:2px; bottom: 2px; right: 2px; height: 5px; position: absolute; z-index: 10; pointer-events: none;';
        }else{
            _barCss = 'width: 5px; position: absolute;z-index: 10; pointer-events: none;';
            _barShellCss = 'opacity: '+me._barShellOpacity+'; top:2px; bottom: 2px; right: 2px; width: 5px; position: absolute; z-index: 10; pointer-events: none;';
        }
        var _defaultBarCss = ' background-color: rgba(0, 0, 0, 0.5); border-radius: '+me.radius+'px; -webkit-transition: cubic-bezier(0.33, 0.66, 0.66, 1);' ;
        _barCss = _barCss + _defaultBarCss + param.barCss;
        
        me._bar.style.cssText       = _barCss;
        me._barShell.style.cssText = _barShellCss;
        me._countAboutBar();
        me._countBarSize();
        me._setBarSize();
        me._countWidthCutBarSize();
        me._barShell.appendChild(me._bar);
        me.core.parentNode.appendChild(me._barShell);
        setTimeout(function(){me._hideBar();}, 500);
    };
    SlipPx._posBar = function(pos) {};
    SlipPx.__posBarX = function(pos) { // 作用：当设置滑动的方向为“X”时用于设置滚动条的坐标 
        var me = this;
        me._bar.style.webkitTransform = 'translate3d('+pos+'px, 0px, 0px)';
        //me._bar.style['webkitTransform'] = 'translate('+pos+'px, 0px)  translateZ(0px)';
    };
    SlipPx.__posBarY = function(pos) { // 作用：当设置滑动的方向为“Y”时用于设置滚动条的坐标 
        var me = this;
        //me._bar.style['webkitTransform'] = 'translate(0px, '+pos+'px)  translateZ(0px)';
        me._bar.style.webkitTransform = 'translate3d(0px, '+pos+'px, 0px)';
    };
    SlipPx._slipBar = function() { // 流畅模式下滚动条的滑动
        var me = this;
        var pos = me._aboutBar * (me.xy + me.upRange);
        if (pos <= 0) {
            pos = 0;
        }else if(pos >= me._widthCutBarSize){
            pos = Math.round(me._widthCutBarSize);
        }
        me._posBar(pos);
        me._showBar();
    };
    SlipPx._slipBarPerfect = function() { // 完美模式下滚动条的滑动
        var me = this;
        var pos = me._aboutBar * (me.xy + me._barUpRange);
        me._bar.style[me.widthOrHeight] = me._barSize + 'px';
        if (pos < 0) {
            var size = me._barSize + pos * 3;
            me._bar.style[me.widthOrHeight] = Math.round(Math.max(size, 5)) + 'px';
            pos = 0;
        }else if (pos >= me._widthCutBarSize) {
            var size = me._barSize - (pos - me._widthCutBarSize) * 3;
            if(size < 5) {size = 5;}
            me._bar.style[me.widthOrHeight] = Math.round(size) + 'px';
            pos = Math.round(me._widthCutBarSize + me._barSize - size);
        }
        me._posBar(pos);
    };
    SlipPx._slipBarTime = function(time) { // 作用：指定时间滑动滚动条
        this._bar.style.webkitTransitionDuration = ''+time+'ms';
        this._slipBar();
    };
    SlipPx._stop = function() { // 流畅模式下的动画停止
        var me = this;
        var _realX = me._real();
        me._pos(_realX);
        if(!me.noBar){
            me._bar.style.webkitTransitionDuration = '0';
            me._posBar(me._aboutBar * _realX);
        }
    };
    SlipPx._stopPerfect = function() { // 完美模式下的动画停止
        clearTimeout(this._aniTime);
        this._animating = false;
    };
    SlipPx._realX = function() { // 作用：取得滑动X坐标
        var _realXy = getComputedStyle(this.core, null).webkitTransform.replace(/[^0-9-.,]/g, '').split(',');
        return _realXy[4] * 1;
    };
    SlipPx._realY = function() { // 作用：取得滑动Y坐标
        var _realXy = getComputedStyle(this.core, null).webkitTransform.replace(/[^0-9-.,]/g, '').split(',');
        return _realXy[5] * 1;
    };
    SlipPx._countBarSize = function() { // 作用：根据比例计算滚动条的高度
        this._barSize = Math.round(Math.max(this.parentWideHigh * this.parentWideHigh / this.wideHigh, 5));
    };
    SlipPx._setBarSize = function() { // 作用：设置滚动条的高度
        this._bar.style[this.widthOrHeight] = this._barSize + 'px';
    };
    SlipPx._countAboutBar = function() { // 作用：计算一个关于滚动条的的数值
        this._aboutBar = ((this.parentWideHigh-4) - (this.parentWideHigh-4) * this.parentWideHigh / this.wideHigh)/this.widthCutCoreWidth;
    };
    SlipPx._countWidthCutBarSize = function() { // 作用：计算一个关于滚动条的的数值
        this._widthCutBarSize = (this.parentWideHigh-4) - this._barSize;
    };
    SlipPx.refresh = function(wideHigh, parentWideHigh) {// 可在外部调用，作用：当尺寸改变时（如手机横竖屏时），需要重新取得相关的值。这时候就可以调用该函数
        var me = this;
        me._refreshCommon(wideHigh, parentWideHigh);
        if(!me.noBar){
            if(me.coreWidthCutWidth <= 0) {
                me._barShellOpacity   = 0;
                me._showBar       = function(){};
            }else{
                me._showBar = me._showBarStorage || me._showBar;
                me._countAboutBar();
                me._countBarSize();
                me._setBarSize();
                me._countWidthCutBarSize();
            }
        }
        me._rebound(0);
    };
    SlipPx._posTimePerfect = function (x, time) { // 作用：完美模式下的改变坐标函数
        var me = this,
            step = x,
            i, l;
        me._steps.push({ x: x, time: time || 0 });
        me._startAni();
    };
    SlipPx._startAni = function () {// 作用：完美模式下的改变坐标函数
        var me = this,
            startX = me.xy,
            startTime = Date.now(),
            step, easeOut,
            animate;
        if (me._animating) {
            return;
        }
        if (!me._steps.length) {
            me._rebound();
            return;
        }
        step = me._steps.shift();
        if (step.x === startX) {
            step.time = 0;
        }
        me._animating = true;
        animate = function () {
            var now = Date.now(),
                newX;
            if (now >= startTime + step.time) {
                me._pos(step.x);
                me._animating = false;
                me._startAni();
                return;
            }
            now = (now - startTime) / step.time - 1;
            easeOut = Math.sqrt(1 - now * now);
            newX = (step.x - startX) * easeOut + startX;
            me._pos(newX);
            if (me._animating) {
                me._slipBar();
                me._aniTime = setTimeout(animate, 1);
            }
        };
        animate();
    };
    SlipPx._momentum = function (dist, time, maxDistUpper, maxDistLower, size) { // 作用：计算惯性
        var deceleration = 0.001,
            speed = Math.abs(dist) / time,
            newDist = (speed * speed) / (2 * deceleration),
            newTime = 0, outsideDist = 0;
        if (dist > 0 && newDist > maxDistUpper) {
            outsideDist = size / (6 / (newDist / speed * deceleration));
            maxDistUpper = maxDistUpper + outsideDist;
            speed = speed * maxDistUpper / newDist;
            newDist = maxDistUpper;
        } else if (dist < 0 && newDist > maxDistLower) {
            outsideDist = size / (6 / (newDist / speed * deceleration));
            maxDistLower = maxDistLower + outsideDist;
            speed = speed * maxDistLower / newDist;
            newDist = maxDistLower;
        }
        newDist = newDist * (dist < 0 ? -1 : 1);
        newTime = speed / deceleration;
        return { dist: newDist, time: newTime };
    };
    SlipPx._showBar = function() {// 作用：显示滚动条
        var me = this;
        me._barShell.style.webkitTransitionDelay = '0ms';
        me._barShell.style.webkitTransitionDuration = '0ms';
        me._barShell.style.opacity = '1';
    };
    SlipPx._hideBar = function() {// 作用：隐藏滚动条
        var me = this;
        me._barShell.style.opacity = '0';
        me._barShell.style.webkitTransitionDelay  = '300ms';
        me._barShell.style.webkitTransitionDuration = '300ms';
    };

    function TouchSlip(config) {
        var me = this;
        var i;

        me.config = {

        };

        for (i in config) {
            if (config.hasOwnProperty(i)) {
                me.config[i] = config[i];
            }
        }

        me.triggerTarget = $(me.config.DOM_TRIGGER_TARGET)[0];

        if (_fun.ios() && (parseInt(_fun.version()) >= 5 && config.DIRECTION === 'x') && config.wit) {
            me.triggerTarget.parentNode.style.cssText += 'overflow:scroll; -webkit-overflow-scrolling:touch;';
            return;
        }
        
        switch (me.config.MODE) {
        case 'page':
            config.DIRECTION = 'x';
            if (!this.SlipPage) {
                this.SlipPage = true;
                SlipPage._init(me.triggerTarget, config);
                return SlipPage;
            } else {
                var page = _fun.clone(SlipPage);
                page._init(me.triggerTarget, config);
                return page;
            }
            break;
        case 'px':
            if (!this.SlipPx) {
                this.SlipPx = true;
                SlipPx._init(me.triggerTarget, config);
                return SlipPx;
            } else {
                var Px = _fun.clone(SlipPx);
                Px._init(me.triggerTarget, config);
                return Px;
            }
            break;
        }
        
    }
    SQ.TouchSlip = TouchSlip;
})(window, document);