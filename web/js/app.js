var minRotation = 5;
var maxRotation = 15;

var $photoList = $('.photos');
var $displayArea = $('.main');
var $bigPhoto = $('.big-photo');$bigPhoto.hide();
var $moreButton = $('.more');
var $playPauseButton = $('.play-pause');
var $footer = $('footer');
var $closeButton = $('header p');

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

var rotation = function () {
    var r = (2 * Math.floor(Math.random() * 2) - 1) * (Math.floor(Math.random() * (maxRotation - minRotation + 1)) + minRotation);
    return r;
};

var cPhotos = function () {

    var maxPhotosDisplayed = 20;

    this.load = function(count, preload, photoOptions) {
        var dfd = $.Deferred();
        var loadedPhotos = count;

        var photos = [];
        for (var i=0; i < count; i++) {
            loadSinglePhoto(preload, $.extend({'size': 'B'}, photoOptions || {}),
                function (photo) {
                    photos.push(photo);
                    dfd.notify(photo);
                    if (--loadedPhotos === 0) {
                        dfd.resolve(photos);
                    }
                },
                function (errorMessage) {
                    dfd.reject(errorMessage);
                }
            );
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
        var pos = position.randomPos();
        var $nextImg = $('<li/>').toggleClass('normal').css(pos);
        var colors = ["#f3f2f1", "#222"];
        var color = Math.floor(1 * Math.random());
        var styles = [
            {
                'backgroundColor': colors[color],
                'color': colors[1-color],
                'border': "25px solid transparent",
                'boxShadow': 'none',
                'borderImage':"url(/images/frame2.jpg) 100 round"
            },
            {
                'backgroundColor': colors[color],
                'color': colors[1-color],
                'border': "2px solid " + colors[1-color]
            }        
        ];
        var style = Math.floor((styles.length) * Math.random());
        console.log(style);
        $nextImg.css(styles[style]);
        $nextImg.attr('rotation', pos.rotation);

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
                $nextImg.toggleClass('normal');
                e.preventDefault();
                slideshow.pause();

                var tl = new TimelineLite({ paused: true,
                    onReverseComplete: function () {
                        $nextImg
                            .css('zIndex', 0)
                            .toggleClass('normal');
                    }
                });
                tl.from($nextImg, 0.5, {
                    rotation: 0,
                    scale: 1.25
                }, 'animate-other-photos');

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
                tl.to($nextImg, 2, {
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
                    var i = 0, initialRotation = $($nextImg[0]).attr('rotation');
                    var rotation = -initialRotation;
                    while ((i++ < 5) && ((Math.abs(rotation) + Math.abs(initialRotation) < 20))) {
                        rotation = rotation + 5 * (initialRotation < 0 ? 1 : -1);
                    }

                    var finalPosition = position.nearPos($nextImg);
					var img = $nextImg.find('img');
					tl.to($nextImg, 1,
						$.extend(finalPosition, {
                            opacity: 1,
                            rotation: rotation,
                            ease: Power1.easeOut
                        })
					);
					var area = img.width()*img.height();
					var x = "";
					if (area < 50000) {
						var newWidth = 350;
						$nextImg.find('a').width(newWidth);
						$nextImg.find('img').width(newWidth);
						x="a";
					}
					//$nextImg.find('.title').html(x + " => " + img.width() + " x " + img.height() + " = " + area);
                    //tl.fromTo($nextImg.find('img'), 1, {autoAlpha: 0}, {autoAlpha: 1});
                });
            })
            .then(function (photos) {
                tl.play();
                pruneOldPhotos();
                dfd.resolve();
            })
            .catch(function (errorMessage) {
                tl.play();
                dfd.reject(errorMessage);
            });

        return dfd.promise();
    };

    var pruneOldPhotos = function() {
        var $allImages = $photoList.find('li');
        if ($allImages.length >= maxPhotosDisplayed) {
            var $photosToBeRemoved = $photoList.find('li').slice(0, apiConfig.per_page);//.remove();return;
            var tl = new TimelineLite();
            tl.staggerTo($photosToBeRemoved, 2, {autoAlpha: 0, rotation: rotation(), scale: 0.25 }, 1.6, 0, function () {
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
    randomPos: function () {
        var rot = rotation();
        return {
            'top': 		 100 + Math.floor(Math.random() * $displayArea.height()) - 350 + 'px',
            'left': 	 100 + (Math.floor(Math.random() * $displayArea.width())) - 350 + 'px',
            'rotation':  rot,
            'transform': 'rotate(' + rot + 'deg)'
        }
    },

    nearPos: function ($el) {
        var final = $($el).position();
        var i = 0;
        do {
            var r = 50 + 400 * Math.random();
            var angle = Math.random() * Math.PI / 2;

            var left = Math.max(50, Math.min(
                $displayArea.width() - $($el).width() - 100,
                Math.round(final.left) + Math.round(r * Math.cos(angle))
            ));

            var top = Math.max(20, Math.min(
                $displayArea.height() - $($el).height() - 20,
                Math.round(final.top) + Math.round(r * Math.sin(angle))
            ));
            var diffLeft = Math.round(Math.abs(left-final.left));
            var diffTop = Math.round(Math.abs(top-final.top));
        } while (++i < 5 && ((diffLeft < 75 && diffTop < 75) || (diffLeft + diffTop < 150)));

        //console.log(i, diffLeft, diffTop, $el[0]);
        final.left = left + 'px';
        final.top = top + 'px';
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
