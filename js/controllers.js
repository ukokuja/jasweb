app.controller('SignInCtrl', function($scope, $state) {
    if(localStorage.getItem('userId')){
        $state.go('home');
    }
    $scope.user = {};
    $scope.userRef = new Firebase('https://jasweb.firebaseio.com/');
    $scope.signin = function(){
        $scope.userRef.authWithPassword({
            "email": $scope.user.email,
            "password":$scope.user.password
        }, function(error, authData) {
            if (error) {
                console.log("Login Failed!", error);
            } else {
                localStorage.setItem('userId', authData.uid);
                localStorage.setItem('usuario', JSON.stringify(authData));
                $state.go('home');
            }
        });
    }


})
    .controller('AppCtrl', function(){

    })
    .controller('HomeCtrl', function($scope, $timeout, $location, $http){
        if(!localStorage.getItem('userId')){
            $location.path('signin');
        }
        $scope.usuario = JSON.parse(localStorage.getItem('usuario'));
        $scope.templatesRef = new Firebase('https://jasweb.firebaseio.com/templates');
        $scope.notificationsRef = new Firebase('https://jasweb.firebaseio.com/notifications');
        $scope.userRef = new Firebase('https://jasweb.firebaseio.com/user');

        $scope.jasRef = new Firebase('https://jas.firebaseio.com');
        $scope.templates = {};
        $scope.templateArray = [];
        $scope.modelsEN = {};
        $scope.modelsFR = {};
        $scope.activities = {};
        $scope.activitiesArray = [];
        $scope.userRef.limitToFirst(10).once('value', function(userSnapshot){
            $scope.notificationsRef.limitToFirst(10).once('value', function(notifSnapshot){
                $timeout(function(){
                    $scope.activities = userSnapshot.val();
                    for (var attrname in notifSnapshot.val()) { $scope.activities[attrname] = notifSnapshot.val()[attrname]; $scope.activities[attrname].notification = true;}
                    angular.forEach($scope.activities, function(val){
                        $scope.activitiesArray.push(val);
                    });
                })
            })
        })
        $scope.templatesRef.once('value', function(templatesSnapshot){
            $timeout(function(){
                $scope.templates = templatesSnapshot.val();
                angular.forEach($scope.templates, function(val, key){
                    val.key = key;
                    var splittedEN = val.textEN.split('<>');
                    var textEN = "";
                    $scope.modelsEN[key] = [];
                    for(var i = 0; i<splittedEN.length-1; i++){
                        textEN +=splittedEN[i] + '<input type="text" ng-model="modelsEN['+i+']">'
                    }
                    textEN +=splittedEN[i++];
                    val.replacedEN =textEN;

                    var splitted = val.textFR.split('<>');
                    var text = "";
                    $scope.modelsFR[key] = [];
                    for(var i = 0; i<splitted.length-1; i++){
                        text +=splitted[i] + '<input type="text" ng-model="modelsEN['+i+']">'
                    }
                    text +=splitted[i++];
                    val.replacedFR =text;

                    $scope.templateArray.push($scope.templates[key]);
                })
            })
        })
        $scope.getDate = function(date){
            mill = new Date(date);
            return moment(moment(mill).format('YYYYMMDD,h:mm a'), "YYYYMMDD,h:mm a").fromNow();
        }
        $scope.getAuthor = function(user){
            return user.substr(0, user.indexOf("@"));
        }
        $scope.addUser = function(){
            swal.withForm({
                title: "Add new user",
                text: '',
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: 'Save',
                closeOnConfirm: true,
                closeOnCancel: true,
                formFields: [
                    { id:'email', name: 'email', placeholder: "E-mail", type: 'email'},
                    { id:'password', name: 'password', placeholder: "Password", type: 'password'},
                    { id:'firstname', name: 'name', placeholder: "First name", type: 'text'},
                    { id:'lastname', name: 'last', placeholder: "Last name", type: 'text'},
                    { id:'phone', name: 'phone', placeholder: "Phone", type: 'number'},
                    { id:'plan', name: 'plan', placeholder: "0, 1 or 2", type: 'number'},
                    { id:'isNotification', name: 'isNotification', value: "true" , type: 'checkbox', label : "Send notifications"},
                    { id:'isEmail', name: 'isEmail', value: "false" , type: 'checkbox', label : "Send email"},
                    { id:'admin', name: 'admin', value: "false" , type: 'checkbox', label : "Admin"},
                ]
            }, function(isConfirm){
                var email =  $('#email').val();
                var password = $('#password').val();
                var admin = $('#admin').is(":checked");
                var firstname = $('#firstname').val();
                var lastname = $('#lastname').val();
                var phone = $('#phone').val();
                var plan = $('#plan').val();
                var isNotification = $('#isNotification').is(":checked");
                var isEmail = $('#isEmail').is(":checked");
                if(isConfirm && email && password){
                    if(admin) {
                        $scope.userRef.createUser({
                            email: email,
                            password: password
                        }, function(error) {
                            $(".sweet-alert").remove();
                            if (error) {
                                swal({
                                    title: "Error",
                                    text: "There was an error creating the user",
                                    type: "error",
                                    showCancelButton: false,
                                    confirmButtonText: "Ok",
                                    closeOnConfirm: false
                                }, function() {
                                    location.reload();
                                });
                            } else {
                                swal({
                                    title: "User created",
                                    text: "",
                                    type: "success",
                                    showCancelButton: false,
                                    confirmButtonText: "Ok",
                                    closeOnConfirm: false
                                }, function() {
                                    location.reload();
                                });
                            }
                        });
                    }else{
                        $scope.jasRef.createUser({
                            email: email,
                            password: password
                        }, function(error, userData) {
                            $(".sweet-alert").remove();
                            if (error) {
                                swal({
                                    title: "Error",
                                    text: "There was an error creating the user",
                                    type: "error",
                                    showCancelButton: false,
                                    confirmButtonText: "Ok",
                                    closeOnConfirm: false
                                }, function() {
                                    location.reload();
                                });
                            } else {
                                $scope.jasRef.child('reverse').child(btoa(email)).set(userData.uid, function(){
                                    $http({
                                        method: 'GET',
                                        url: 'https://morning-everglades-9603.herokuapp.com/newuser/?email='+email+'&plan='+plan
                                    }).then(function successCallback(response) {
                                        var newuser = {
                                            email: email,
                                            firstname: firstname,
                                            lastname: lastname,
                                            isNotification: isNotification,
                                            isEmail: isEmail,
                                            phone: phone,
                                            author: $scope.usuario.password.email
                                        };
                                        $scope.jasRef.child('uid').child(userData.uid).set(
                                            newuser
                                        );
                                        swal({
                                            title: "User created",
                                            text: "",
                                            type: "success",
                                            showCancelButton: false,
                                            confirmButtonText: "Ok",
                                            closeOnConfirm: false
                                        }, function() {
                                            location.reload();
                                        });
                                    });
                                });
                            }
                        });
                    }

                }
            })
        }
        $scope.pushNotification = function(key){
            var template = $scope.templates[key];
            var splitted = template.textEN.split('<>');
            var text = "";
            for(var i = 0; i<splitted.length-1; i++){
                text +=splitted[i] + $scope.modelsEN[i];
            }
            text += splitted[i++];
            var splittedFR = template.textFR.split('<>');
            var textFR = "";
            for(var i = 0; i<splittedFR.length-1; i++){
                textFR +=splittedFR[i] + $scope.modelsEN[i];
            }
            textFR += splitted[i++];
            var notification = {
                "title": template.title,
                "textEN" : text,
                "textFR": textFR,
                "author" : template.author,
                "date" : Firebase.ServerValue.TIMESTAMP
            }
            swal({
                title: "Are you sure?",
                text: "",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, push it!",
                cancelButtonText: "Cancel",
                closeOnConfirm: false,
                closeOnCancel: true
            }, function(isConfirm) {
                if (isConfirm) {
                    $scope.notificationsRef.push(notification);
                    $scope.templatesRef.child(key).update({
                        "date" : Firebase.ServerValue.TIMESTAMP
                    });
                    notification.textEN = notification.textEN.replace(/<br>/g, ' ');
                    notification.textFR = notification.textFR.replace(/<br>/g, ' ');
                    var url = "http://morning-everglades-9603.herokuapp.com/notification?";
                    $http.get(url+'textEN='+notification.textEN+'&textFR='+notification.textFR+'&titleEN='+notification.title+'&titleFR='+notification.title)
                        .then(swal({
                            title: "Pushed",
                            text: "",
                            type: "success",
                            showCancelButton: false,
                            confirmButtonText: "Ok",
                            closeOnConfirm: false
                        }, function() {
                            location.reload();
                        }));

                }
            });
        }
        $scope.edit = function(template){
            swal.withForm({
                title: template.title,
                text: 'Remember to use <> for inputs',
                showCancelButton: false,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: 'Save',
                closeOnConfirm: true,
                formFields: [
                    { id:'templateEN', name: 'templateEN', value: template.textEN, type: 'textarea' , placeholder: 'English'},
                    { id:'templateFR', name: 'templateFR', value: template.textFR, type: 'textarea' , placeholder: 'French'},
                ]
            }, function(isConfirm){
                var textEN =  $('#templateFR').val();
                var textFR =  $('#templateEN').val();
                if(isConfirm){
                    $scope.templatesRef.child(template.key).update({
                        textEN: textEN,
                        textFR: textFR
                    })
                    location.reload();
                }

            })
        }
        $scope.addTemplate = function(){
            swal.withForm({
                title: "New template",
                text: 'Remember to use <> for inputs',
                showCancelButton: false,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: 'Save',
                closeOnConfirm: false,
                type: 'input',
                inputPlaceholder: "Title",
                formFields: [
                    { id:'templateEN', name: 'template',  type: 'textarea' , model: 'templateEdit', placeholder: 'English'},
                    { id:'templateFR', name: 'template',  type: 'textarea' , model: 'templateEdit', placeholder: 'French'},
                ]
            }, function(inputValue){
                if (inputValue === false) return false;
                if (inputValue === "" || $('#templateEN').val() === "" || $('#templateFR').val() === "") {
                    swal.showInputError("You need to write something!");
                    return false
                }

                var textEN =  $('#templateEN').val();
                textEN = textEN.replace(/[\n]/g, '<br>');
                var textFR =  $('#templateFR').val();
                textFR = textFR.replace(/[\n]/g, '<br>');

                $scope.templatesRef.push({
                    textEN: textEN,
                    textFR: textFR,
                    title: inputValue,
                    created: Date.now(),
                    date: Date.now(),
                    author: $scope.usuario.password.email,
                    online: true
                })
                location.reload();
            })
        }
        $scope.remove = function(template){
            swal({
                title: "Are you sure?",
                text: "",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",
                cancelButtonText: "Cancel",
                closeOnConfirm: false,
                closeOnCancel: true
            }, function(isConfirm) {
                if (isConfirm) {
                    $scope.templatesRef.child(template.key).update({
                        online : false
                    })
                    swal({
                        title: "Deleted",
                        text: "",
                        type: "success",
                        showCancelButton: false,
                        confirmButtonText: "Ok",
                        closeOnConfirm: false
                    }, function() {
                        location.reload();
                    });
                }
            });


        }
    });