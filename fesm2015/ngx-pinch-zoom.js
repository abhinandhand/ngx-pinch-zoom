import { Component, HostBinding, ElementRef, HostListener, ViewChild, Input, EventEmitter, Output, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
class PinchZoomComponent {
    /**
     * @param {?} elementRef
     */
    constructor(elementRef) {
        this.elementRef = elementRef;
        this.i = 0;
        this.scale = 1;
        this.initialScale = 1;
        this.moveX = 0;
        this.moveY = 0;
        this.initialMoveX = 0;
        this.initialMoveY = 0;
        this.lastTap = 0;
        this.draggingMode = false;
        this.transitionDuration = 200;
        this.doubleTap = true;
        this.doubleTapScale = 2;
        this.zoomButton = true;
        this.linearHorizontalSwipe = false;
        this.linearVerticalSwipe = false;
        this.autoZoomOut = false;
        this.events = new EventEmitter();
    }
    /**
     * @param {?} value
     * @return {?}
     */
    set id(value) {
        this._id = value;
    }
    /**
     * @return {?}
     */
    get id() {
        return this._id;
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        this.element = this.contentElement.nativeElement;
        this.parentElement = this.elementRef.nativeElement;
        this.elementTarget = this.element.querySelector('*').tagName;
        this.setBasicStyles();
        this.element.ondragstart = (/**
         * @return {?}
         */
        () => false);
    }
    /**
     * @return {?}
     */
    get isTouchScreen() {
        /** @type {?} */
        var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
        /** @type {?} */
        var mq = (/**
         * @param {?} query
         * @return {?}
         */
        function (query) {
            return window.matchMedia(query).matches;
        });
        if (('ontouchstart' in window)) {
            return true;
        }
        // include the 'heartz' as a way to have a non matching MQ to help terminate the join
        // https://git.io/vznFH
        /** @type {?} */
        var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
        return mq(query);
    }
    /**
     * @return {?}
     */
    get isDragging() {
        /** @type {?} */
        const imgHeight = this.getImageHeight();
        /** @type {?} */
        const imgWidth = this.getImageWidth();
        if (this.scale > 1) {
            return imgHeight * this.scale > this.parentElement.offsetHeight ||
                imgWidth * this.scale > this.parentElement.offsetWidth;
        }
        if (this.scale === 1) {
            return imgHeight > this.parentElement.offsetHeight ||
                imgWidth > this.parentElement.offsetWidth;
        }
    }
    /*
         * Desktop listeners
         */
    /**
     * @param {?} event
     * @return {?}
     */
    onMouseEnter(event) {
        this.getElementPosition();
        if (this.isDragging) {
            this.draggingMode = true;
        }
    }
    /**
     * @param {?} event
     * @return {?}
     */
    onMouseMove(event) {
        if (this.draggingMode) {
            event.preventDefault();
            if (!this.eventType) {
                this.startX = event.clientX - this.elementPosition.left;
                this.startY = event.clientY - this.elementPosition.top;
            }
            this.eventType = 'swipe';
            this.events.emit({
                type: 'swipe',
                moveX: this.moveX,
                moveY: this.moveY
            });
            this.moveX = this.initialMoveX + ((event.clientX - this.elementPosition.left) - this.startX);
            this.moveY = this.initialMoveY + ((event.clientY - this.elementPosition.top) - this.startY);
            this.centeringImage();
            this.transformElement(0);
        }
    }
    /**
     * @param {?} event
     * @return {?}
     */
    onMouseUp(event) {
        this.draggingMode = false;
        this.updateInitialValues();
        this.eventType = '';
    }
    /*
         * Mobile listeners
         */
    /**
     * @param {?} event
     * @return {?}
     */
    onResize(event) {
        this.setImageWidth();
        this.transformElement(this.transitionDuration);
    }
    /**
     * @param {?} event
     * @return {?}
     */
    touchstartHandler(event) {
        this.getElementPosition();
        if (!this.eventType) {
            this.startX = event.touches[0].clientX - this.elementPosition.left;
            this.startY = event.touches[0].clientY - this.elementPosition.top;
            this.startClientX = event.touches[0].clientX - this.elementPosition.left;
            this.startClientY = event.touches[0].clientY - this.elementPosition.top;
        }
        this.events.emit({ type: 'touchstart' });
    }
    /**
     * @param {?} event
     * @return {?}
     */
    touchmoveHandler(event) {
        /** @type {?} */
        const touches = event.touches;
        // Swipe
        if (this.detectSwipe(touches) || this.eventType === 'swipe') {
            this.handleSwipe(event);
        }
        // Linear swipe
        if (this.detectLinearSwipe(touches) ||
            this.eventType === 'horizontal-swipe' ||
            this.eventType === 'vertical-swipe') {
            this.handleLinearSwipe(event);
        }
        // Pinch
        if (touches.length === 2 && !this.eventType || this.eventType === 'pinch') {
            this.handlePinch(event);
        }
    }
    /**
     * @param {?} event
     * @return {?}
     */
    touchendHandler(event) {
        this.i = 0;
        this.draggingMode = false;
        /** @type {?} */
        const touches = event.touches;
        if (this.scale < 1) {
            this.scale = 1;
        }
        // Auto Zoom Out
        if (this.autoZoomOut && this.eventType === 'pinch') {
            this.scale = 1;
        }
        this.events.emit({ type: 'touchend' });
        // Double Tap
        if (this.doubleTapDetection() && !this.eventType) {
            this.toggleZoom(event);
            this.events.emit({ type: 'double-tap' });
            return;
        }
        // Limit Zoom
        if (this.limitZoom && this.eventType === 'pinch') {
            this.handleLimitZoom();
        }
        if (this.eventType === 'pinch' || this.eventType === 'swipe') {
            this.alignImage();
        }
        if (this.eventType === 'pinch' ||
            this.eventType === 'swipe' ||
            this.eventType === 'horizontal-swipe' ||
            this.eventType === 'vertical-swipe') {
            this.updateInitialValues();
        }
        this.eventType = 'touchend';
        if (touches && touches.length === 0) {
            this.eventType = '';
        }
    }
    /*
         * Handlers
         */
    /**
     * @param {?} index
     * @param {?} touches
     * @return {?}
     */
    moveLeft(index, touches) {
        return touches[index].clientX - this.elementPosition.left;
    }
    /**
     * @param {?} index
     * @param {?} touches
     * @return {?}
     */
    moveTop(index, touches) {
        return touches[index].clientY - this.elementPosition.top;
    }
    /**
     * @param {?} event
     * @return {?}
     */
    handleSwipe(event) {
        event.preventDefault();
        if (!this.eventType) {
            this.startX = event.touches[0].clientX - this.elementPosition.left;
            this.startY = event.touches[0].clientY - this.elementPosition.top;
        }
        this.eventType = 'swipe';
        this.events.emit({
            type: 'swipe',
            moveX: this.moveX,
            moveY: this.moveY
        });
        this.moveX = this.initialMoveX + (this.moveLeft(0, event.touches) - this.startX);
        this.moveY = this.initialMoveY + (this.moveTop(0, event.touches) - this.startY);
        this.transformElement(0);
    }
    /**
     * @param {?} event
     * @return {?}
     */
    handlePinch(event) {
        event.preventDefault();
        /** @type {?} */
        const touches = event.touches;
        if (!this.eventType) {
            this.initialDistance = this.getDistance(touches);
            /** @type {?} */
            const moveLeft0 = this.moveLeft(0, touches);
            /** @type {?} */
            const moveLeft1 = this.moveLeft(1, touches);
            /** @type {?} */
            const moveTop0 = this.moveTop(0, touches);
            /** @type {?} */
            const moveTop1 = this.moveTop(1, touches);
            this.moveXC = ((moveLeft0 + moveLeft1) / 2) - this.initialMoveX;
            this.moveYC = ((moveTop0 + moveTop1) / 2) - this.initialMoveY;
        }
        this.eventType = 'pinch';
        this.distance = this.getDistance(touches);
        this.scale = this.initialScale * (this.distance / this.initialDistance);
        this.events.emit({
            type: 'pinch',
            scale: this.scale
        });
        this.moveX = this.initialMoveX - (((this.distance / this.initialDistance) * this.moveXC) - this.moveXC);
        this.moveY = this.initialMoveY - (((this.distance / this.initialDistance) * this.moveYC) - this.moveYC);
        this.transformElement(0);
    }
    /**
     * @param {?} event
     * @return {?}
     */
    handleLinearSwipe(event) {
        if (this.linearVerticalSwipe) {
            event.preventDefault();
        }
        this.i++;
        if (this.i > 3) {
            this.eventType = this.getLinearSwipeType(event);
        }
        if (this.eventType === 'horizontal-swipe') {
            this.moveX = this.initialMoveX + ((event.touches[0].clientX - this.elementPosition.left) - this.startX);
            this.moveY = 0;
        }
        if (this.eventType === 'vertical-swipe') {
            this.moveX = 0;
            this.moveY = this.initialMoveY + ((event.touches[0].clientY - this.elementPosition.top) - this.startY);
        }
        if (this.eventType) {
            this.events.emit({
                type: this.eventType,
                moveX: this.moveX,
                moveY: this.moveY
            });
            this.transformElement(0);
        }
    }
    /**
     * @return {?}
     */
    handleLimitZoom() {
        if (this.scale > this.limitZoom) {
            /** @type {?} */
            const imageWidth = this.getImageWidth();
            /** @type {?} */
            const imageHeight = this.getImageHeight();
            /** @type {?} */
            const enlargedImageWidth = imageWidth * this.scale;
            /** @type {?} */
            const enlargedImageHeight = imageHeight * this.scale;
            /** @type {?} */
            const moveXRatio = this.moveX / (enlargedImageWidth - imageWidth);
            /** @type {?} */
            const moveYRatio = this.moveY / (enlargedImageHeight - imageHeight);
            this.scale = this.limitZoom;
            /** @type {?} */
            const newImageWidth = imageWidth * this.scale;
            /** @type {?} */
            const newImageHeight = imageHeight * this.scale;
            this.moveX = -Math.abs((moveXRatio * (newImageWidth - imageWidth)));
            this.moveY = -Math.abs((-moveYRatio * (newImageHeight - imageHeight)));
            this.centeringImage();
            this.transformElement(this.transitionDuration);
        }
    }
    /**
     * @param {?} touches
     * @return {?}
     */
    detectSwipe(touches) {
        return touches.length === 1 && this.scale > 1 && !this.eventType;
    }
    /**
     * @param {?} touches
     * @return {?}
     */
    detectLinearSwipe(touches) {
        return touches.length === 1 && this.scale === 1 && !this.eventType;
    }
    /**
     * @param {?} event
     * @return {?}
     */
    getLinearSwipeType(event) {
        if (this.eventType !== 'horizontal-swipe' && this.eventType !== 'vertical-swipe') {
            /** @type {?} */
            const movementX = Math.abs(this.moveLeft(0, event.touches) - this.startClientX);
            /** @type {?} */
            const movementY = Math.abs(this.moveTop(0, event.touches) - this.startClientY);
            if ((movementY * 3) > movementX) {
                return this.linearVerticalSwipe ? 'vertical-swipe' : '';
            }
            else {
                return this.linearHorizontalSwipe ? 'horizontal-swipe' : '';
            }
        }
        else {
            return this.eventType;
        }
    }
    /**
     * @param {?} touches
     * @return {?}
     */
    getDistance(touches) {
        return Math.sqrt(Math.pow(touches[0].pageX - touches[1].pageX, 2) + Math.pow(touches[0].pageY - touches[1].pageY, 2));
    }
    /**
     * @return {?}
     */
    getImageHeight() {
        return this.element.getElementsByTagName(this.elementTarget)[0].offsetHeight;
    }
    /**
     * @return {?}
     */
    getImageWidth() {
        return this.element.getElementsByTagName(this.elementTarget)[0].offsetWidth;
    }
    /**
     * @return {?}
     */
    setBasicStyles() {
        this.element.style.display = 'flex';
        this.element.style.height = '100%';
        this.element.style.alignItems = 'center';
        this.element.style.justifyContent = 'center';
        this.element.style.transformOrigin = '0 0';
        this.hostDisplay = 'block';
        this.hostOverflow = 'hidden';
        this.hostHeight = this.containerHeight;
        this.setImageWidth();
    }
    /**
     * @return {?}
     */
    setImageWidth() {
        /** @type {?} */
        const imgElement = this.element.getElementsByTagName(this.elementTarget);
        if (imgElement.length) {
            imgElement[0].style.maxWidth = '100%';
            imgElement[0].style.maxHeight = '100%';
        }
    }
    /**
     * @param {?=} duration
     * @return {?}
     */
    transformElement(duration = 50) {
        this.element.style.transition = `all ${duration}ms`;
        this.element.style.transform = `
            matrix(${Number(this.scale)}, 0, 0, ${Number(this.scale)}, ${Number(this.moveX)}, ${Number(this.moveY)})`;
    }
    /**
     * @return {?}
     */
    doubleTapDetection() {
        if (!this.doubleTap) {
            return false;
        }
        /** @type {?} */
        const currentTime = new Date().getTime();
        /** @type {?} */
        const tapLength = currentTime - this.lastTap;
        clearTimeout(this.doubleTapTimeout);
        if (tapLength < 300 && tapLength > 0) {
            return true;
        }
        else {
            this.doubleTapTimeout = setTimeout((/**
             * @return {?}
             */
            () => {
                clearTimeout(this.doubleTapTimeout);
            }), 300);
        }
        this.lastTap = currentTime;
    }
    /**
     * @param {?=} event
     * @return {?}
     */
    toggleZoom(event = false) {
        if (this.initialScale === 1) {
            if (event && event.changedTouches) {
                /** @type {?} */
                const changedTouches = event.changedTouches;
                this.scale = this.initialScale * this.doubleTapScale;
                this.moveX = this.initialMoveX - (changedTouches[0].clientX * (this.doubleTapScale - 1) - this.elementPosition.left);
                this.moveY = this.initialMoveY - (changedTouches[0].clientY * (this.doubleTapScale - 1) - this.elementPosition.top);
            }
            else {
                this.scale = this.initialScale * 2;
                this.moveX = this.initialMoveX - this.element.offsetWidth / 2;
                this.moveY = this.initialMoveY - this.element.offsetHeight / 2;
            }
            this.centeringImage();
            this.updateInitialValues();
            this.transformElement(this.transitionDuration);
            this.events.emit({ type: 'zoom-in' });
        }
        else {
            this.resetScale();
            this.events.emit({ type: 'zoom-out' });
        }
    }
    /**
     * @return {?}
     */
    resetScale() {
        this.scale = 1;
        this.moveX = 0;
        this.moveY = 0;
        this.updateInitialValues();
        this.transformElement(this.transitionDuration);
    }
    /**
     * @return {?}
     */
    updateInitialValues() {
        this.initialScale = this.scale;
        this.initialMoveX = this.moveX;
        this.initialMoveY = this.moveY;
    }
    /**
     * @return {?}
     */
    centeringImage() {
        /** @type {?} */
        const img = this.element.getElementsByTagName(this.elementTarget)[0];
        /** @type {?} */
        const initialMoveX = this.moveX;
        /** @type {?} */
        const initialMoveY = this.moveY;
        if (this.moveY > 0) {
            this.moveY = 0;
        }
        if (this.moveX > 0) {
            this.moveX = 0;
        }
        if (img) {
            this.transitionYRestriction();
            this.transitionXRestriction();
        }
        if (img && this.scale < 1) {
            if (this.moveX < this.element.offsetWidth * (1 - this.scale)) {
                this.moveX = this.element.offsetWidth * (1 - this.scale);
            }
        }
        return initialMoveX !== this.moveX || initialMoveY !== this.moveY;
    }
    /**
     * @return {?}
     */
    alignImage() {
        /** @type {?} */
        const isMoveChanged = this.centeringImage();
        if (isMoveChanged) {
            this.updateInitialValues();
            this.transformElement(this.transitionDuration);
        }
    }
    /**
     * @return {?}
     */
    transitionYRestriction() {
        /** @type {?} */
        const imgHeight = this.getImageHeight();
        if (imgHeight * this.scale < this.parentElement.offsetHeight) {
            this.moveY = (this.parentElement.offsetHeight - this.element.offsetHeight * this.scale) / 2;
        }
        else {
            /** @type {?} */
            const imgOffsetTop = ((imgHeight - this.element.offsetHeight) * this.scale) / 2;
            if (this.moveY > imgOffsetTop) {
                this.moveY = imgOffsetTop;
            }
            else if ((imgHeight * this.scale + Math.abs(imgOffsetTop) - this.parentElement.offsetHeight) + this.moveY < 0) {
                this.moveY = -(imgHeight * this.scale + Math.abs(imgOffsetTop) - this.parentElement.offsetHeight);
            }
        }
    }
    /**
     * @return {?}
     */
    transitionXRestriction() {
        /** @type {?} */
        const imgWidth = this.getImageWidth();
        if (imgWidth * this.scale < this.parentElement.offsetWidth) {
            this.moveX = (this.parentElement.offsetWidth - this.element.offsetWidth * this.scale) / 2;
        }
        else {
            /** @type {?} */
            const imgOffsetLeft = ((imgWidth - this.element.offsetWidth) * this.scale) / 2;
            if (this.moveX > imgOffsetLeft) {
                this.moveX = imgOffsetLeft;
            }
            else if ((imgWidth * this.scale + Math.abs(imgOffsetLeft) - this.parentElement.offsetWidth) + this.moveX < 0) {
                this.moveX = -(imgWidth * this.scale + Math.abs(imgOffsetLeft) - this.parentElement.offsetWidth);
            }
        }
    }
    /**
     * @return {?}
     */
    getElementPosition() {
        this.elementPosition = this.elementRef.nativeElement.getBoundingClientRect();
    }
    /**
     * @param {?} value
     * @param {?=} transitionDuration
     * @return {?}
     */
    setMoveX(value, transitionDuration = 200) {
        this.moveX = value;
        this.transformElement(transitionDuration);
    }
    /**
     * @param {?} value
     * @param {?=} transitionDuration
     * @return {?}
     */
    setMoveY(value, transitionDuration = 200) {
        this.moveY = value;
        this.transformElement(transitionDuration);
    }
}
PinchZoomComponent.decorators = [
    { type: Component, args: [{
                selector: 'pinch-zoom, [pinch-zoom]',
                template: "<div #content \n\t[class.pz-dragging]=\"isDragging\">\n\t<ng-content></ng-content>\n</div>\n\n<div class=\"pz-zoom-button\"\n\t*ngIf=\"zoomButton && !isTouchScreen\"\n\t(click)=\"toggleZoom()\"\n\t[class.pz-zoom-out]=\"scale > 1\">\n</div>",
                styles: [":host{position:relative}.pz-dragging{cursor:all-scroll}.pz-zoom-button{position:absolute;left:50%;bottom:16px;margin-left:-22px;z-index:1000;color:#fff;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAQAAABLCVATAAABVUlEQVR4Ae3PAwxQXRgA0Pvbto1sW2NDts0x27atIdeQrakpY8i23cnGe5nn8epDeO1h+VgeVdRVRJLwsCQ101nX2aWJd8OD8a7Ozrkda6UJ8XnPUsBZy43S2Wz7rs8UDnEZCZjn5+tzb6jqCDgucYhDakAnb4Rb+MdmMCPEYSqYfH2cXfPr/ymcBalDFF84izN+uD7TnHCdXqB7iCI/WByuuy1QbrAiRFEL9L3WlObmc/l7uUHfgn0hivqg47VaXMfluQ/A6RBFeTDmnq39D7aEKNKBXfcMVBVMCtFsB0XvFshbVoBSIZqGYL8/wh10B/u8F6L52E6wU7ZwEx/oC6gV4pHVOXDeIPn95WOZ1bYRsD7EJ79D7m4nmO7dEI+fTHC7o7p6h+uh4pJJB0vscMwKQ+X13uXZ6RGh4vKeeQ8c6nWoJiFadCjRFUXzntbeDc/GaxcAotf7cicflKkAAAAASUVORK5CYII=),url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAQAAABLCVATAAABS0lEQVR4Ae3UA8xWfQCG8afPNrNt240N2TbHbNu2hlxDtqamjCHbdr/s5905b9Z1fN/bdfyPfOZl8ZMSGmipggwvL8loqZsAOKaDb2Ir+UZ/t7zITjlio/nWRsBNm03T33KnHiflw4umAlaJ/ziLo6EL4LL04TTZAf3Eea5JYT9YEk60EMyP2mVxE2QP1vzuJm74P4Z+GBgcLCoN1sfYFwdbgkXNwMj7+4V1fnq6n/0DTgWLWoO+9/c7AwD3s+/B9WBRbTAjxj41OBAsygWOxdg3BPMiwTgMKkbtvrQFVAsjagtOSxKlGwxO+Tbc0HEUHFXomfx7IwHNIuFQ0C1w2zilJfOT/JrbC9gdCY/SzonOUbA49Mgknjme56KBvuaxKizy6WODIy7ZYqKSDx6xxUGq8MPeqlirPqs6RKljqwq6ovCq7r6JvBs+cwdLiOaEU9ek1AAAAABJRU5ErkJggg==),url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAQAAABLCVATAAABVUlEQVR4Ae3PAwxQXRgA0Pvbto1sW2NDts0x27atIdeQrakpY8i23cnGe5nn8epDeO1h+VgeVdRVRJLwsCQ101nX2aWJd8OD8a7Ozrkda6UJ8XnPUsBZy43S2Wz7rs8UDnEZCZjn5+tzb6jqCDgucYhDakAnb4Rb+MdmMCPEYSqYfH2cXfPr/ymcBalDFF84izN+uD7TnHCdXqB7iCI/WByuuy1QbrAiRFEL9L3WlObmc/l7uUHfgn0hivqg47VaXMfluQ/A6RBFeTDmnq39D7aEKNKBXfcMVBVMCtFsB0XvFshbVoBSIZqGYL8/wh10B/u8F6L52E6wU7ZwEx/oC6gV4pHVOXDeIPn95WOZ1bYRsD7EJ79D7m4nmO7dEI+fTHC7o7p6h+uh4pJJB0vscMwKQ+X13uXZ6RGh4vKeeQ8c6nWoJiFadCjRFUXzntbeDc/GaxcAotf7cicflKkAAAAASUVORK5CYII=),url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAQAAABLCVATAAABS0lEQVR4Ae3UA8xWfQCG8afPNrNt240N2TbHbNu2hlxDtqamjCHbdr/s5905b9Z1fN/bdfyPfOZl8ZMSGmipggwvL8loqZsAOKaDb2Ir+UZ/t7zITjlio/nWRsBNm03T33KnHiflw4umAlaJ/ziLo6EL4LL04TTZAf3Eea5JYT9YEk60EMyP2mVxE2QP1vzuJm74P4Z+GBgcLCoN1sfYFwdbgkXNwMj7+4V1fnq6n/0DTgWLWoO+9/c7AwD3s+/B9WBRbTAjxj41OBAsygWOxdg3BPMiwTgMKkbtvrQFVAsjagtOSxKlGwxO+Tbc0HEUHFXomfx7IwHNIuFQ0C1w2zilJfOT/JrbC9gdCY/SzonOUbA49Mgknjme56KBvuaxKizy6WODIy7ZYqKSDx6xxUGq8MPeqlirPqs6RKljqwq6ovCq7r6JvBs+cwdLiOaEU9ek1AAAAABJRU5ErkJggg==);background-color:rgba(0,0,0,.8);background-position:center,-1000px;background-repeat:no-repeat,no-repeat;width:56px;height:56px;border-radius:4px;opacity:.5;cursor:pointer;transition:opacity .1s;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.pz-zoom-button.pz-zoom-out{background-position:-1000px,center}.pz-zoom-button:hover{opacity:.7}"]
            }] }
];
/** @nocollapse */
PinchZoomComponent.ctorParameters = () => [
    { type: ElementRef }
];
PinchZoomComponent.propDecorators = {
    containerHeight: [{ type: Input, args: ['height',] }],
    transitionDuration: [{ type: Input, args: ['transition-duration',] }],
    doubleTap: [{ type: Input, args: ['double-tap',] }],
    doubleTapScale: [{ type: Input, args: ['double-tap-scale',] }],
    zoomButton: [{ type: Input, args: ['zoom-button',] }],
    linearHorizontalSwipe: [{ type: Input, args: ['linear-horizontal-swipe',] }],
    linearVerticalSwipe: [{ type: Input, args: ['linear-vertical-swipe',] }],
    autoZoomOut: [{ type: Input, args: ['auto-zoom-out',] }],
    limitZoom: [{ type: Input, args: ['limit-zoom',] }],
    id: [{ type: Input }],
    events: [{ type: Output }],
    hostDisplay: [{ type: HostBinding, args: ['style.display',] }],
    hostOverflow: [{ type: HostBinding, args: ['style.overflow',] }],
    hostHeight: [{ type: HostBinding, args: ['style.height',] }],
    contentElement: [{ type: ViewChild, args: ['content',] }],
    onMouseEnter: [{ type: HostListener, args: ['mousedown', ['$event'],] }],
    onMouseMove: [{ type: HostListener, args: ['window:mousemove', ['$event'],] }],
    onMouseUp: [{ type: HostListener, args: ['window:mouseup', ['$event'],] }],
    onResize: [{ type: HostListener, args: ['window:resize', ['$event'],] }],
    touchstartHandler: [{ type: HostListener, args: ['touchstart', ['$event'],] }],
    touchmoveHandler: [{ type: HostListener, args: ['touchmove', ['$event'],] }],
    touchendHandler: [{ type: HostListener, args: ['touchend', ['$event'],] }]
};

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
class PinchZoomModule {
}
PinchZoomModule.decorators = [
    { type: NgModule, args: [{
                declarations: [
                    PinchZoomComponent
                ],
                imports: [
                    CommonModule
                ],
                exports: [
                    PinchZoomComponent
                ],
                entryComponents: [
                    PinchZoomComponent
                ]
            },] }
];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

export { PinchZoomComponent, PinchZoomModule };

//# sourceMappingURL=ngx-pinch-zoom.js.map