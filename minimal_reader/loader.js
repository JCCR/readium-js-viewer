requirejs.config({
    "baseUrl": "../lib",
    "paths": {
        //doesn't need to depend on specific versions of these
        underscore: "thirdparty/underscore-1.4.4",
        jquery: "thirdparty/jquery",
        backbone: "thirdparty/backbone-0.9.10",

        URIjs: 'thirdparty/URIjs/URI',
        punycode: 'thirdparty/URIjs/punycode',
        SecondLevelDomains: 'thirdparty/URIjs/SecondLevelDomains',
        IPv6: 'thirdparty/URIjs/IPv6',
    },
    "shim": {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        Readium: {
            deps: ['backbone'],
            exports: 'Readium'
        }
    }
});

require(['Readium'], function (Readium) {

    function toPromise(instance, funcName, cbIndex) {
        var args = _.toArray(arguments);
        args.splice(0, 3);
        return new Promise(function (resolve, reject) {
            if (cbIndex !== undefined) {
                args.splice(cbIndex, 0, resolve);
                instance[funcName].apply(instance, args);
            } else {
                resolve(instance[funcName]());
            }
        });
    }

    var ReadiumCubed = function (readiums) {

        var readers = _.map(readiums, function (r) {
            return r['reader']
        });

        function call(instances, func, cbIndex) {
            var args = _.toArray(arguments);
            args.splice(0, 1);
            var promises = [];
            _.each(instances, function (instance) {
                promises.push(toPromise.apply(this, [instance].concat(args)));
            });
            return Promise.all(promises);
        }

        return {
            call: function () {
                var args = _.toArray(arguments);
                return call.apply(this, [readiums].concat(args));
            },
            reader: {
                call: function () {
                    var args = _.toArray(arguments);
                    return call.apply(this, [readers].concat(args));
                }
            }
        };
    };


    $(document).ready(function () {

        var readerOptions = {
            annotationCSSUrl: new URI(window.location.href).normalize().filename("annotations.css").toString() //absoulte path since it's going to lose the base url inside an iframe
        };

        var readiumOptions = {
            jsLibRoot: '../lib/'
        };
        readerOptions.el = '#readium-container1';
        var readium1 = new Readium(readiumOptions, readerOptions);
        window.readium1 = readium1;
        readerOptions.el = '#readium-container2';
        var readium2 = new Readium(readiumOptions, readerOptions);
        window.readium2 = readium2;
        readerOptions.el = '#readium-container3';
        var readium3 = new Readium(readiumOptions, readerOptions);
        window.readium3 = readium3;
        var bookRoot = "/epub_content/moby_dick";

        var readiumCubed = new ReadiumCubed(
            [readium1, readium2, readium3]
        );

        readiumCubed.call('openPackageDocument', 1, bookRoot).then(function () {
            readiumCubed.reader.call('once', 1, ReadiumSDK.Events.PAGINATION_CHANGED).then(function () {
                console.log('pagination complete?');
                readiumCubed.reader.call('bookmarkCurrentPage').then(function (bookmarks) {
                    console.log('bookmarks:', bookmarks);
                });
            });
        });

        window.r3 = readiumCubed;
        r3.openPageRight = function () {
            readium1.reader.openPageRight();
            readium2.reader.openPageRight();
            readium3.reader.openPageRight();
            //r3.reader.call('openPageRight');
        };

        r3.openPageLeft = function () {
            readium1.reader.openPageLeft();
            readium2.reader.openPageLeft();
            readium3.reader.openPageLeft();
            //r3.reader.call('openPageLeft');
        };


        $('#left').on('click', function () {
            r3.openPageLeft();
        });
        $('#right').on('click', function () {
            r3.openPageRight();
        });
    });

});
