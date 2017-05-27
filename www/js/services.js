angular.module('app.services', [])

    .service("userService", function ($ionicLoading, $state, gerenciarFunc) {
        this.createLogin = function (email, password) {
            var promise = firebase.auth().createUserWithEmailAndPassword(email, password);
            return promise;
        }
        this.createUser = function (obj) {
            var user = firebase.auth().currentUser;
            var promise = firebase.database().ref('user/' + user.uid).set(obj);
            return promise;
        }
        this.createAdmin = function () {
            var user = firebase.auth().currentUser;
            var obj = {
                uid: user.uid,
                status: false,
                msgStatus: false
            }
            var promise = firebase.database().ref('solicitacaoAdm/' + user.uid).set(obj);
            return promise;
        }

    })

    .service('solicitacaoPoda', function () {
        this.createSolicitacao = function (obj) {
            var promise = firebase.database().ref('solicitacaoPoda/aberto').push(obj);
            return promise;
        }
        this.moverRecusada = function (obj, id) {
            firebase.database().ref('solicitacaoPoda/recusada/' + id).set(obj).then(function () {
                firebase.database().ref('solicitacaoPoda/aberto/' + id).remove().then(function () {
                    console.log('apagou e salvou');
                })
            })
        }
        this.excluirRecusada = function (id) {
            firebase.database().ref('solicitacaoPoda/recusada/' + id).remove().then(function () {
                console.log('excluiu');
            })
        }



    })
    .service('gerenciarFunc', function ($state) {
        this.pesquisarFunc = function (email) {
            var promise = firebase.database().ref('funcionarioADM').orderByChild('email').equalTo(email).once('value');
            return promise;
        }
        this.salvarFunc = function (obj) {
            firebase.database().ref('funcionarioADM').push(obj).then(function () {
                $state.go('gerenciarFuncionario');
            })
        }
        this.editarFunc = function (obj, uid) {
            firebase.database().ref('funcionarioADM/' + uid).set(obj).then(function () {
                console.log('foi');
            })
        }
    })
    .factory('buscarUsuario', function ($q, ionicSuperPopup) {
        return {
            get: function () {


                var defer = $q.defer();
                var user = firebase.auth().currentUser;

                firebase.database().ref('solicitacaoAdm/' + user.uid).on('value', function (data) {

                    if (data.val() != null) {
                        if (data.val().status == true && data.val().msgStatus == false) {
                            defer.resolve(true);
                            ionicSuperPopup.show('Aprovado', 'Você foi aprovado com administrador', 'success')
                            var obj = {
                                uid: user.uid,
                                status: true,
                                msgStatus: true
                            }
                            firebase.database().ref('solicitacaoAdm/' + user.uid).set(obj).then(function () {

                                console.log('msgalterada')

                            })
                        }
                        if (data.val().status == true) {
                            defer.resolve(true);

                        }
                    }
                })
                return defer.promise;
            }
        }
    })

    .factory('buscarLista', function ($q, ionicSuperPopup, $ionicLoading) {
        $ionicLoading.show({

            template: 'Carregando...',
            duration: 30000
        })
        return {
            get: function () {
                var defer = $q.defer();
                var user = firebase.auth().currentUser;
                var lista = []
                firebase.database().ref('solicitacaoPoda').orderByChild('uid').equalTo(user.uid).on('child_added', function (data) {
                    lista.push(data.val());
                    defer.resolve(lista);
                    $ionicLoading.hide();
                })
                return defer.promise;
                
            }
        }
    })

    .factory('buscarListaAberto', function ($q, ionicSuperPopup) {

        return {
            get: function () {
                var defer = $q.defer();
                var user = firebase.auth().currentUser;
                var lista = [];
                firebase.database().ref('solicitacaoPoda/aberto').on('child_removed', function (data) {
                    console.log(data.val());
                })
                firebase.database().ref('solicitacaoPoda/aberto').on('value', function (data) {
                    lista.push(data.val());
                    defer.resolve(data.val());
                })
                return defer.promise;
            }
        }
    })


    .factory('buscarListaPendente', function ($q, ionicSuperPopup) {
        return {
            get: function () {
                var defer = $q.defer();
                var user = firebase.auth().currentUser;
                var lista = []
                firebase.database().ref('solicitacaoPoda/pendente').on('value', function (data) {
                    lista.push(data.val());
                    defer.resolve(lista);
                    console.log(data.val());
                })

            }
        }
    })


    .factory('buscarListaRecusada', function ($q, ionicSuperPopup) {
        return {
            get: function () {
                var defer = $q.defer();
                var user = firebase.auth().currentUser;
                var lista = []
                firebase.database().ref('solicitacaoPoda/recusada').orderByChild('uid').equalTo(user.uid).on('child_added', function (data) {
                    lista.push(data.val());
                    defer.resolve(lista);
                })
                return defer.promise;
            }
        }
    })