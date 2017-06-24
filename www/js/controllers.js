angular.module('app.controllers', ['ngCordova'])

    .controller('cameraCtrl', ['$scope', '$stateParams', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
        // You can include any angular dependencies as parameters for this function
        // TIP: Access Route Parameters for your page via $stateParams.parameterName
        function ($scope, $stateParams) {


        }])

    .controller('localizacaoCtrl', ['$scope', '$stateParams', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
        // You can include any angular dependencies as parameters for this function
        // TIP: Access Route Parameters for your page via $stateParams.parameterName
        function ($scope, $stateParams) {


        }])

    .controller('EmailController', function($scope) {
    $scope.sendFeedback= function() {
        if(window.plugins && window.plugins.emailComposer) {
            window.plugins.emailComposer.showEmailComposerWithCallback(function(result) {
                console.log("Response -> " + result);
            }, 
            "Feedback for your App", // Subject
            "krai porra",                      // Body
            ["dsbcesario@gmail.com"],    // To
            null,                    // CC
            null,                    // BCC
            false,                   // isHTML
            null,                    // Attachments
            null);                   // Attachment Data
        }
    }
})

    .controller('emailCtrl', function($cordovaEmailComposer){
        
        $cordovaEmailComposer.isAvailable().then(function(){
            // is available
        }, function(){
            //not available
        });

        var email = {
            to : 'dsbcesario@gmail.com',
            subject: 'Poda de Árvore',
            body: 'FALEI Q IA PASSA PORRA',
            isHtml: true
        };

        $cordovaEmailComposer.open(email).then(null, function(){
            // user cancelled email
        });

    })
    .controller('notificacoesCtrl', function ($scope, $firebaseArray, buscarLista,buscarUsuario, solicitacaoPoda, ionicSuperPopup, $ionicModal) {
         $scope.show = false;

         buscarUsuario.get().then(function (data) {
            if (data == true) {
                $scope.show = true;              
            }
        })
        
        var ref = firebase.database().ref('notifications');
        $scope.notifications = $firebaseArray(ref);
        var lista = $scope.listaAberta;
        console.log($scope.listaAberta);
        if (lista != null) {
            var index = Object.keys(lista);
        }
        

        $scope.moverRecusada = function (obj, id) {
            console.log(index);
            solicitacaoPoda.moverRecusada(obj, index[id]);
            ionicSuperPopup.show('Aviso!', 'Solicitação Recusada!', 'error');
            // $scope.listaAberta.splice(id,1);
        }

        $scope.excluirRecusada = function (id) {
            console.log(index);
            solicitacaoPoda.excluirRecusada(index[id]);
            ionicSuperPopup.show('Aviso!', 'Solicitação Excluida!', 'error');
            // $scope.listaAberta.splice(id,1);
        }


        

        $ionicModal.fromTemplateUrl('templates/detalhesSolicitacao.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modal = modal;
                        
        });
        $scope.openModal = function (array) {
            $scope.modal.show();            
            $scope.detalhesModal={endereco: array.endereco,
                          img: array.img,
                          detalhes: array.detalhes}
        };
        $scope.closeModal = function () {
            $scope.modal.hide();
        };
        // Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function () {
            $scope.modal.remove();
        });
        // Execute action on hide modal
        $scope.$on('modal.hidden', function () {
            // Execute action
        });
        // Execute action on remove modal
        $scope.$on('modal.removed', function () {
            // Execute action
        });
    })

    .controller('configuracoesCtrl', function ($scope, $ionicAuth, $state, $cordovaCamera, buscarUsuario) {

         $scope.show = false;

         buscarUsuario.get().then(function (data) {
            if (data == true) {
                $scope.show = true;              
            }
        })

        $scope.logout = function () {
            firebase.auth().signOut().then(function () {
                // Sign-out successful.
            }, function (error) {
                // An error happened.
            });
        }

        $scope.pictureProfUrl = '../img/default-profile.png';
        $scope.abrirGaleria = function () {
            var options = {


                destinationType: Camera.DestinationType.FILE_URI,
                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
            };
            $cordovaCamera.getPicture(options).then(function (data) {
                $scope.pictureProfUrl = data;
            }, function (err) {
                // error    
            });


            /*var user = firebase.auth().currentUser;
            user.updateProfile({ displayName: nome, photoURL: "" }).then(function () {
                $scope.usuarioNome = nome;
            });*/
        }

    })

    .controller('menuCtrl', function ($scope, buscarUsuario, buscarLista, buscarListaAberto, buscarListaRecusada, $ionicLoading) {
        
        $scope.show = false;
        
        firebase.database().ref('solicitacaoPoda/aberto').on('value', function (data) {
            
            $scope.listaAberta = [];
            $scope.listaAberta = data.val();
            console.log(data.val());
            if (!$scope.$$phase)
                $scope.$digest();
        })
        firebase.database().ref('solicitacaoPoda/recusada').on('value', function (data) {
            
            $scope.listaRecusada = [];
            $scope.listaRecusada = data.val();
            
            if (!$scope.$$phase)
                $scope.$digest();
        })
        buscarUsuario.get().then(function (data) {
            if (data == true) {
                $scope.show = true;
                console.log('foi adm');
                
            }
        })
        buscarLista.get();
       
    })

    .controller('cadastroFunc', function ($scope, gerenciarFunc) {
        var auth = firebase.auth().currentUser;
        $scope.user = {
            nome: '',
            senha: '',
            email: '',
            uidADM: auth.uid,
            auth: false
        }
        $scope.salvarFunc = function (senha) {
            if ($scope.user.senha == senha) {
                var promise1 = gerenciarFunc.pesquisarFunc($scope.user.email);
                promise1.then(function (func) {
                    console.log(func)
                    if (func.val() == null) {
                        gerenciarFunc.salvarFunc($scope.user);
                    } else console.log('troca a senha');
                })
            }
            else console.log('Troca a senha');
        }
    })

    .controller('gerenciarFuncCtrl', function ($scope) {
        firebase.database().ref('funcionarioADM').on('value', function (data) {
            $scope.listaFunc = data.val();
            console.log(data.val());
            if (!$scope.$$phase)
                $scope.$digest();
        })
    })

    .controller('loginCtrl', function ($scope, $stateParams, $ionicAuth, $state, ionicSuperPopup,
        userService, buscarUsuario, gerenciarFunc) {
        
        $scope.login = function (response) {
            $state.go('tabsController.notificacoes')
        }

        $scope.login1 = function (response) {
            $state.go('tabsController.camera')
        }

        $scope.login2 = function (response) {
            $state.go('tabsController.configuracoes')
        }
        // $scope.user = {
        //     email: "",
        //     password: ""
        // }
        // firebase.auth().onAuthStateChanged(function (user) {
        //     if (user) {
        //         $state.go('tabsController.camera');
        //     } else {
        //         $state.go('login');
        //     }
        // });
        
            // $ionicLoading.show({
            //     template: 'Carregando...',
            //     duration: 100
            // })

            // var promiseFunc = gerenciarFunc.pesquisarFunc($scope.user.email);
            // promiseFunc.then(function (func) {
            //     if (func.val() != null) {
            //         var id = Object.keys(func.val());
            //         var obj = Object.keys(func.val()).map(function (key) {
            //             return func.val()[key];
            //         })
            //         if (obj[0].senha == $scope.user.password) {
            //             if (obj[0].auth == false) {
            //                 var obj2 = {
            //                     nome: obj[0].nome,
            //                     email: obj[0].email,
            //                     senha: obj[0].senha,
            //                     uidADM: obj[0].uidADM,
            //                     auth: true,
            //                     cidade: 'teste'
            //                 }
            //                 gerenciarFunc.editarFunc(obj2, id);
            //                 var promise2 = userService.createUser(obj2);
            //                 promise2.then(function () {
            //                     var promiseUser = gerenciarFunc.createLogin(obj2.email, obj2.senha);
            //                     promiseUser.then(function () {
            //                         $state.go('tabsController.notificacoes');
            //                     })
            //                 })
            //             } else {
            //                 login();
            //             }
            //         }
            //     } else login();
            // })
            
        // function login() {
        //     firebase.auth().signInWithEmailAndPassword($scope.user.email, $scope.user.password)
        //         .catch(function (error) {
        //             // Handle Errors here.
        //             var errorCode = error.code;
        //             if (errorCode == 'auth/invalid-email') {
        //                 ionicSuperPopup.show('Erro!', 'E-mail inválido!', 'error');
        //             }
        //             if (error.code == 'auth/user-disabled') {
        //                 ionicSuperPopup.show('Aviso!', 'Acesso bloqueado!', 'warning');
        //             }
        //             if (error.code == "auth/user-not-found") {
        //                 ionicSuperPopup.show('Erro!', 'E-mail não cadastrado!', 'error');
        //             }
        //             if (error.code == "auth/wrong-password") {
        //                 ionicSuperPopup.show('Erro!', 'Senha incorreta!', 'error');
        //             }
        //             else console.log(error);
        //         });
        // }
    })

    .controller('cadastroCtrl', function ($scope, $ionicAuth, $ionicUser, $state, $ionicLoading, ionicSuperPopup, userService) {
        $scope.user = {
            email: "",
            nome: "",
            cidade: ""
        }

        $scope.tipo = {
            status: ""
        };

        $scope.lista =
            [
                { id: 1, cidade: 'São José do Rio Preto' },
                { id: 2, cidade: 'Olimpia' },
                { id: 3, cidade: 'Mirassol' }
            ]

        $scope.Cadastrar = function (nome, senha) {
            $scope.user.nome = nome;
            var senha1 = document.getElementById('cadastro-input5').value;
            if (senha1 == senha) {
                var promise = userService.createLogin($scope.user.email, senha1);
                promise.then(function () {
                    $ionicLoading.hide();
                    var promise2 = userService.createUser($scope.user);
                    promise2.then(function () {
                        var user = firebase.auth().currentUser;
                        user.updateProfile({ displayName: nome, photoURL: "" }).then(function () {
                            ionicSuperPopup.show('Bem Vindo!', 'Cadastrado com sucesso.', 'success');
                        });
                        if ($scope.tipo.status == 1) {
                            var promise3 = userService.createAdmin();
                            promise3.then(function () {
                                ionicSuperPopup.show('Bem Vindo!', 'Cadastrado com sucesso.', 'success');
                                $state.go('tabsController.notificacoes');
                                console.log('ooo')
                            })
                        } else {

                            $state.go('tabsController.camera');
                        }
                    })

                })
                promise.catch(function (error) {
                    if (error.code == 'auth/email-already-in-use')
                        ionicSuperPopup.show('Erro!', 'E-mail já cadastrado!', 'error');
                    console.log("msgEmailexistente");
                    if (error.code == 'auth/invalid-email')
                        ionicSuperPopup.show('Erro!', 'E-mail inválido!', 'error');
                    console.log("msgEmailinvalido");
                    if (error.code == "auth/weak-password")
                        ionicSuperPopup.show('Erro!', 'Senha muito fraca!', 'warning');
                    console.log('senha fraca')
                })
            } else ionicSuperPopup.show('Erro!', 'As senhas não se correspondem!', 'warning');
        }
    })

    .controller('alterarSenhaCtrl', ['$scope', '$stateParams', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
        // You can include any angular dependencies as parameters for this function
        // TIP: Access Route Parameters for your page via $stateParams.parameterName
        function ($scope, $stateParams) {


        }])

    .controller('cadastrarFuncionarioCtrl', ['$scope', '$stateParams', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
        // You can include any angular dependencies as parameters for this function
        // TIP: Access Route Parameters for your page via $stateParams.parameterName
        function ($scope, $stateParams) {


        }])



    .controller('CameraCtrl', function ($scope, $cordovaCamera, $rootScope, $state, $ionicModal, solicitacaoPoda, ionicSuperPopup, $ionicLoading) {
        $scope.voltarLocalizacao = function () {
            $state.go('tabsController.localizacao');
        };
        $scope.camera = { cidade: $rootScope.formatted_address };
        $scope.pictureUrl = '../img/add_photo.png';
        $scope.fotografar = function () {
            $cordovaCamera.getPicture({
                destinationType: Camera.DestinationType.DATA_URL,
                encodingType: Camera.EncodingType.JPEG,
                saveToPhotoAlbum: true
            })
                .then(function (data) {
                    $scope.pictureUrl = 'data:image/jpeg;base64,' + data;
                });
        }
        // ModalImage
        $scope.showImages = function (index) {
            $scope.activeSlide = index;
            $scope.showModal('templates/imagemmodal.html');
        }

        $scope.showModal = function (templateUrl) {
            $ionicModal.fromTemplateUrl(templateUrl, {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modal = modal;
                $scope.modal.show();
            });
        }

        // Close the modal
        $scope.closeModal = function () {
            $scope.modal.hide();
            $scope.modal.remove()
        };
        $scope.obj = {
            detalhes: ""
        }
        $scope.salvar = function (cidade) {
            $ionicLoading.show({

                template: 'Carregando...',
                duration: 300
            })
            var user = firebase.auth().currentUser;
            var obj = {
                endereco: cidade,
                img: $scope.pictureUrl,
                uid: user.uid,
                detalhes: $scope.obj.detalhes
            }
            var promise = solicitacaoPoda.createSolicitacao(obj);
            promise.then(function () {
                $ionicLoading.hide();
                ionicSuperPopup.show('Feito!', 'Solicitação enviada com sucesso!', 'success');
                console.log('cadastrou foda')
                $state.go('tabsController.notificacoes');

            })
        }



    })


    .controller('MapCtrl', function ($scope, $ionicLoading, $cordovaGeolocation, $window, $rootScope, $state) {

        $ionicLoading.show({

            template: 'Carregando...',
            duration: 300
        })


        $scope.mapCreated = function (map) {

            $scope.map = map;
        };

        $scope.centerOnMe = function () {

            console.log("Centering");

            if (!$scope.map) {
                return;
            }

            $scope.loading = $ionicLoading.show({
                content: 'Capturando localização atual...',
                showBackdrop: false,
                duration: 3000
            });

            navigator.geolocation.getCurrentPosition(function (pos) {

                console.log('Got pos', pos);
                $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
                $scope.loading.hide();
            }, function (error) {
                alert('Impossivel carregar localização: ' + error.message);



            });
        };

        var marker;
        var watchOptions = {
            timeout: 3000,
            enableHighAccuracy: false
        };

        var watch = $cordovaGeolocation.watchPosition(watchOptions, $scope);


        watch.then(null,
            function (err) { },
            function (position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;

                $scope.map.setCenter(new google.maps.LatLng(lat, lng));

                google.maps.event.addListenerOnce($scope.map, 'idle', function () {

                    if (marker)
                        marker.setMap(null);

                    marker = new google.maps.Marker({
                        map: $scope.map,
                        animation: google.maps.Animation.DROP,
                        position: new google.maps.LatLng(lat, lng)
                    });


                });

                var geocoder = new google.maps.Geocoder();
                var infowindow = new google.maps.InfoWindow;
                var latlng = new google.maps.LatLng(lat, lng);
                geocoder.geocode({ 'latLng': latlng }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        if (results[1]) {

                            $scope.cidade = Object;
                            $rootScope.formatted_address = results[0].address_components[1].long_name + ", " + results[1].formatted_address;


                            console.log($rootScope.formatted_address);

                            if (results[0].types[0] == 'street_address' && results[0].address_components[1]) {
                                streetname = results[0].address_components[1].long_name;
                            }
                            else if (results[0].types[0] == 'route') {
                                streetname = results[0].address_components[0].long_name;
                            }

                            var markerAddress = results[0].address_components[1].long_name;
                            console.log(markerAddress);
                        }
                    }
                    $scope.pegarLocalizacao = function () {
                        $state.go('tabsController.camera');
                    };

                });
            })
    })




