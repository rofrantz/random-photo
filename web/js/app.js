var apiURL = window.location.href;
var apiConfig = {
    per_page: 5
};

var minRotation = -15;
var maxRotation = 15;

var $photoList = $('.photos');
var $bigPhoto = $('.big-photo');$bigPhoto.hide();
var $moreButton = $('.more');
var $playPauseButton = $('.play-pause');
var $footer = $('footer');
var $closeButton = $('header p');

var webWorkerSupport = false;
if (typeof(Worker) !== "undefined") {
    webWorkerSupport = true;
}

var footer = function () {
    var $actionsEl = $footer.find('.actions');
    var id;

    this.show = function (photoId) {
        $actionsEl.css({display: 'inline-block'});
        id = photoId;
    };

    $actionsEl.find('.btn').on('click', function() {
        //ajax(apiURL + 'randomPhoto.php', data.ajax.params, function (photos) {
        //photos.render(apiConfig.per_page);
    });
    //archive
};

var cPhotos = function () {

    var maxPhotosDisplayed = 20;

    var worker;
    if (webWorkerSupport) {
        if (typeof(worker) === 'undefined') {
            worker = new Worker('js/photoLoader.js');
        }
    } else {
        alert('no support for web workers');
    }

    var loadSinglePhoto = function(preload, photoOptions, callback) {
        worker.onmessage = function (e) {
            callback(e.data);
        };

        worker.postMessage({
            'cmd': 'loadPhoto',
            'preload': preload,
            'ajax': {
                url: apiURL + 'loadPhoto.php',
                params: $.extend(photoOptions || {}, apiConfig, {per_page: 1})
            }
        });
    };

    this.load = function(count, preload, photoOptions) {
        var dfd = $.Deferred();
        var loadedPhotos = count;

        var photos = [];
        for (var i=0; i < count; i++) {
            loadSinglePhoto(preload, $.extend({'size': 'B'}, photoOptions || {}), function (photo) {
                photos.push(photo);
                dfd.notify(photo);
                if (--loadedPhotos === 0) {
                    dfd.resolve(photos);
                }
            });
        }

        return dfd.promise();
    };

    var fullscreenAnimation = new TimelineLite({
        paused: true,
        onStart: function () {
            $bigPhoto.show();
            $closeButton.show()
        },
        onReverseComplete: function() {
            slideshow.play();
        }
    });

    var render = function (photo) {
        var $nextImg = $('<li/>').css(position.random());

        var html = '<a href="#" target="_blank">';
        //html += '<div class="tl"><svg width="100" height="100"><use xlink:href="#corner" transform="scale(0.2)" fill="#fff" stroke="#fff" stroke-width="5px"/></svg></div>';
        //html += '<div class="tr"><svg width="100" height="100"><use xlink:href="#corner" transform="scale(2)" fill="#fff" stroke="#fff" stroke-width="5px"/></svg></div>';

        if (photo['date']) {
            html += '<span class="date">' + photo['date'] + '</span>';
        }
        html += '<div class="image-wrapper"><img class="image" src="' + photo['src'] + '" alt="' + photo['name'] + '" /><\/div>';
        html += '<div class="title">' + photo['name'] + '</div>';
        html += '</a>';

        $nextImg
            .css({
                opacity: 0
                //, rotation: Math.floor(Math.random() * (maxRotation - minRotation + 1)) + minRotation
            })
            .html(html)
            .appendTo($photoList)
            .click(function (e) {
                e.preventDefault();
                slideshow.pause();

                var tl = new TimelineLite({ paused: true, onReverseComplete: function () {
                    $nextImg.css('zIndex', 0);
                }});

                loadSinglePhoto(0, { photo_id: photo.id, useCache: false, size: 'original' }, function (photo) {
                    var $img = $bigPhoto.children('img');
                    $img.attr('src', photo.src);
                    if ($img.length === 0) {
                        $img = $('<img>');$img.appendTo($bigPhoto);

                        fullscreenAnimation.from($bigPhoto, 1, {left: -$bigPhoto.width()});
                        fullscreenAnimation.fromTo($img, 1, {autoAlpha: 0, left: $(window).width() / 2}, {autoAlpha: 1, left:0});
                        fullscreenAnimation.from($closeButton, 1, { right: -$closeButton.width() - 100});
                    }

                    fullscreenAnimation.restart();
                });

                var displayedPhotos = $photoList.find('img').not($nextImg.find('img'));
                tl.to(displayedPhotos, 1, { filter: 'grayscale(1)' }, 'animate-other-photos');
                tl.to(displayedPhotos.parent(), 3, { opacity: 0.8 }, 'animate-other-photos');

                //footer.show();
                console.log(photo);
                var newScale = 1;
                tl.to($nextImg, 3, {
                    rotation: 0,
                    top: '50%',//$nextImg.outerHeight() * (newScale-1) / 2 + $('header').height(),
                    left: '50%', // $nextImg.outerWidth() * (newScale-1) / 2 ,
                    x: '-50%', y: '-50%',
                    zIndex: 5,
                    scale: newScale
                }, 'animate-other-photos');

                tl.play();

                $closeButton.click(function (e) {
                    tl.reverse();
                    fullscreenAnimation.reverse();
                });
            });

        return $nextImg;
    };

    this.render = function(count) {
        var dfd = $.Deferred();
        var tl = new TimelineLite({paused: true, autoRemoveChildren: true });
        this.load(count)
            .progress(function (photo) {
                var $nextImg = render(photo);
                $nextImg.ready(function () {
                    tl.to($nextImg, 1,
                        $.extend(position.near($nextImg), {
                            opacity: 1,
                            rotation: Math.floor(Math.random() * (maxRotation - minRotation + 1)) + minRotation,
                            ease: Power1.easeOut
                        }));
                    //tl.fromTo($nextImg.find('img'), 1, {autoAlpha: 0}, {autoAlpha: 1});
                });
            })
            .then(function (photos) {
                tl.play();
                pruneOldPhotos();
                dfd.resolve();
            });

        return dfd.promise();
    };

    var pruneOldPhotos = function() {
        var $allImages = $photoList.find('li');
        if ($allImages.length >= maxPhotosDisplayed) {
            var $photosToBeRemoved = $photoList.find('li').slice(0, apiConfig.per_page).remove();return;
            var tl = new TimelineLite();
            tl.staggerTo($photosToBeRemoved, 1, {autoAlpha: 0}, 0.7, 0, function () {
                $photosToBeRemoved.remove();
            });
        }
    };

};

var photos = new cPhotos();

var cSlideshow = function ($el) {

    var photoDisplayed = 5;

    var tl = new TimelineLite({paused: true});
    tl.add(
        TweenLite.fromTo($el, 10, {'width': 0}, {
            width: '100%',
            ease: Linear.easeNone,
            onStart: function () {
                // preload photos
                photos.load(photoDisplayed, true);
            },
            onComplete: function () {
                photos.render(photoDisplayed).then(function () {
                    tl.restart();
                });
            }
        })
    );

    return tl;
};

slideshow = new cSlideshow($('.slideshow-progress'));

var position = {
    random: function () {
        return {
            top: 		100 + Math.floor(Math.random() * $photoList.height()) - 350 + 'px',
            left: 		100 + (Math.floor(Math.random() * $photoList.width())) - 350 + 'px',
            transform: 	'rotate(' + (Math.floor(Math.random() * (maxRotation - minRotation + 1)) + minRotation) + 'deg)'
        }
    },

    near: function ($el) {
        var final = $($el).position();
        var r = 50 + 400 * Math.random();
        var angle = Math.random() * Math.PI / 2;

        final.left = Math.max(50, Math.min(
            $photoList.width() - $($el).width() - 100,
            Math.round(final.left) + Math.round(r * Math.cos(angle))
        )) + 'px';

        final.top = Math.max(20, Math.min(
            $photoList.height() - $($el).height() - 20,
            Math.round(final.top) + Math.round(r * Math.sin(angle))
        )) + 'px';
        //final.transform = 'rotate(' + (Math.floor(Math.random() * (maxRotation - minRotation + 1)) + minRotation) + 'deg)';

        return final;
    }
};

var handleClicks = function() {
    $moreButton.on('click', function() {
        photos.render(apiConfig.per_page);
    });

    $playPauseButton
        .removeClass('mdi-play-circle-outline').addClass('mdi-pause-circle-outline').html('Pause')
        .on({
            'click': function (e) {
                e.preventDefault();
                if (slideshow.paused()) {
                    slideshow.play();
                    $(this).html('Pause');
                    this.className = this.className.replace(/-play-/, '-pause-');
                } else {
                    slideshow.pause();
                    $(this).html('Play');
                    this.className = this.className.replace(/-pause-/, '-play-');
                }
            },
            'mouseover mouseout': function () {
                var className = this.className.match(/mdi-(?:play|pause)-(?:.[^\x20]*)/);
                if (className) {
                    className = className[0];
                    $(this)
                        .toggleClass(className)
                        .toggleClass(className.match(/-outline$/)
                                ? className.replace(/-outline/, '')
                                : className + '-outline'
                        );
                }
            }
        });
};

var startUpAnimation = function () {
    var tl = new TimelineLite({
        paused: true,
        onComplete: function () {
            slideshow.play();
        }
    });

    // start up intro
    tl.from('header', 1, {top: -$('header').height()},                      'header-footer');
    tl.from('footer', 1, {bottom: -$('footer').height()},                   'header-footer');

    tl.from('header h1', 1, {left: -$('header h1').width() - 100},          'header');

    tl.from('footer p', 1, {right: -$('footer p').width() - 100},           'footer');
    tl.from('footer button', 1, {left: -$('footer button').width() - 100},  'footer');
    tl.play();
};

$(document).ready(function () {
    startUpAnimation();
    handleClicks();
});

$(window).on({
    // pause slideshow when window loses focus
    "blur focus": function (e) {
        $playPauseButton.click();
    }
});
