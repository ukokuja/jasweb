var app = angular.module('todoApp', ['ui.router','ngSanitize'])
    .config(function ($stateProvider, $urlRouterProvider) {

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider
            .state('index', {
                url: '/index',
                abstract: true,
                templateUrl: 'home.html',
                controller: 'AppCtrl'
            })
            .state('signin', {
                url: '/signin',
                views: {
                    'signin': {
                        templateUrl: 'templates/sign-in.html',
                        controller: 'SignInCtrl'
                    }
                }
            })
            // setup an abstract state for the tabs directive
            .state('home', {
                url: '/home',
                views: {
                    'home': {
                        templateUrl: 'templates/home.html',
                        controller: 'HomeCtrl'
                    }
                }
            })
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/signin');

    }).directive('compile', ['$compile', function ($compile) {
        return function(scope, element, attrs) {
            scope.$watch(
                function(scope) {
                    // watch the 'compile' expression for changes
                    return scope.$eval(attrs.compile);
                },
                function(value) {
                    // when the 'compile' expression changes
                    // assign it into the current DOM
                    element.html(value);

                    // compile the new DOM and link it to the current
                    // scope.
                    // NOTE: we only compile .childNodes so that
                    // we don't get into infinite loop compiling ourselves
                    $compile(element.contents())(scope);
                }
            );
        };
    }]);