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
    .controller('HomeCtrl', function($scope, $timeout){
        if(!localStorage.getItem('userId')){
            $state.go('signin');
        }
        $scope.usuario = JSON.parse(localStorage.getItem('usuario'));
        $scope.templatesRef = new Firebase('https://jasweb.firebaseio.com/templates');
        $scope.notificationsRef = new Firebase('https://jasweb.firebaseio.com/notifications');
        $scope.userRef = new Firebase('https://jasweb.firebaseio.com/user');
        $scope.jasRef = new Firebase('https://jas.firebaseio.com');
        $scope.templates = {};
        $scope.templateArray = [];
        $scope.models = {};
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
                    var splitted = val.text.split('<>');
                    var text = "";
                    $scope.models[key] = [];
                    for(var i = 0; i<splitted.length-1; i++){
                        text +=splitted[i] + '<input type="text" ng-model="models['+i+']">'
                    }
                    text +=splitted[i++];
                    val.replaced =text;
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
                    { id:'admin', name: 'admin', value: "true" , type: 'checkbox', label : "Admin"},
                ]
            }, function(isConfirm){
                var email =  $('#email').val();
                var password = $('#password').val();
                var admin = $('#admin').is(":checked");
                if(isConfirm && email && password){
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
                            $scope.userRef.push({
                                "email": email,
                                "uid" : userData.uid,
                                "isAdmin" : admin,
                                "date" : Firebase.ServerValue.TIMESTAMP
                            })
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

                }
            })
        }
        $scope.pushNotification = function(key){
            var template = $scope.templates[key];
            var splitted = template.text.split('<>');
            var text = "";
            for(var i = 0; i<splitted.length-1; i++){
                text +=splitted[i] + $scope.models[i];
            }
            text += splitted[i++];
            var notification = {
                "title": template.title,
                "text" : text,
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
                    })
                    swal({
                        title: "Pushed",
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
        $scope.edit = function(template){
            swal.withForm({
                title: template.title,
                text: 'Remember to use <> for inputs',
                showCancelButton: false,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: 'Save',
                closeOnConfirm: true,
                formFields: [
                    { id:'template', name: 'template', value: template.text, type: 'textarea' , model: 'templateEdit'},
                ]
            }, function(isConfirm){
                var text =  $('#template').val();
                if(isConfirm){
                    $scope.templatesRef.child(template.key).update({
                        text: text
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
                    { id:'template', name: 'template',  type: 'textarea' , model: 'templateEdit'},
                ]
            }, function(inputValue){
                if (inputValue === false) return false;
                if (inputValue === "" || $('#template').val() === "") {
                    swal.showInputError("You need to write something!");
                    return false
                }
                var text =  $('#template').val();
                $scope.templatesRef.push({
                    text: text,
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