angular.module('app.controllers', ['ngCordova'])

.controller('localizacaoCtrl', ['$scope', '$stateParams', function ($scope, $stateParams) { }])

.controller('EmailController', function ($scope) {
  $scope.sendFeedback = function () {
    if (window.plugins && window.plugins.emailComposer) {
      window.plugins.emailComposer.showEmailComposerWithCallback(
        function (result) { console.log('Resposta -> ' + result); },
        'Feedback do app',
        'Escreva aqui sua mensagem',
        ['destinatario@email.com'],
        null, null, false, null, null
      );
    }
  };
})

.controller('emailCtrl', function ($cordovaEmailComposer) {
  $cordovaEmailComposer.isAvailable().then(function () {
    const email = {
      to: 'destinatario@email.com',
      subject: 'Poda de Árvore',
      body: 'Escreva aqui sua mensagem',
      isHtml: true
    };
    $cordovaEmailComposer.open(email).then(null, function () { });
  }, function () {
    console.log('E-mail indisponível no momento');
  });
})

.controller('notificacoesCtrl', function ($scope, $firebaseArray, buscarUsuario, solicitacaoPoda, ionicSuperPopup, $ionicModal) {
  $scope.show = false;
  buscarUsuario.get().then(function (data) {
    if (data === true) $scope.show = true;
  });

  const ref = firebase.database().ref('notifications');
  $scope.notifications = $firebaseArray(ref);

  $scope.listaAberta = {};
  firebase.database().ref('solicitacaoPoda/aberto').on('value', (data) => {
    $scope.listaAberta = data.val() || {};
    if (!$scope.$$phase) $scope.$digest();
  });

  $scope.moverRecusada = function (obj, id) {
    const chave = id || (obj && obj.$id);
    const dados = $scope.listaAberta[chave] || obj;
    if (!dados || !chave) return;
    solicitacaoPoda.moverRecusada(dados, chave).then(() => {
      ionicSuperPopup.show('Aviso!', 'Solicitação recusada!', 'error');
    });
  };

  $scope.excluirRecusada = function (id) {
    if (!id) return;
    solicitacaoPoda.excluirRecusada(id).then(() => {
      ionicSuperPopup.show('Aviso!', 'Solicitação excluída!', 'error');
    });
  };

  $ionicModal.fromTemplateUrl('templates/detalhesSolicitacao.html', { scope: $scope, animation: 'slide-in-up' }).then(function (modal) {
    $scope.modal = modal;
  });

  $scope.openModal = function (array) {
    $scope.modal.show();
    $scope.detalhesModal = { endereco: array.endereco, img: array.img, detalhes: array.detalhes };
  };
  $scope.closeModal = function () { $scope.modal.hide(); };
  $scope.$on('$destroy', function () { $scope.modal.remove(); });
})

.controller('configuracoesCtrl', function ($scope, $state, $cordovaCamera, buscarUsuario) {
  $scope.show = false;
  buscarUsuario.get().then(function (data) {
    if (data === true) $scope.show = true;
  });

  $scope.logout = function () {
    firebase.auth().signOut().then(function () {
      $state.go('login');
    }, function (error) {
      console.log(error);
    });
  };

  $scope.pictureProfUrl = '../img/default-profile.png';
  $scope.abrirGaleria = function () {
    const options = {
      destinationType: Camera.DestinationType.FILE_URI,
      sourceType: Camera.PictureSourceType.PHOTOLIBRARY
    };
    $cordovaCamera.getPicture(options).then(function (data) {
      $scope.pictureProfUrl = data;
    }, function (err) { });
  };
})

.controller('menuCtrl', function ($scope, buscarUsuario, buscarLista) {
  $scope.show = false;
  firebase.database().ref('solicitacaoPoda/aberto').on('value', (data) => {
    $scope.listaAberta = data.val();
    if (!$scope.$$phase) $scope.$digest();
  });
  firebase.database().ref('solicitacaoPoda/recusada').on('value', (data) => {
    $scope.listaRecusada = data.val();
    if (!$scope.$$phase) $scope.$digest();
  });
  buscarUsuario.get().then(function (data) {
    if (data === true) $scope.show = true;
  });
  buscarLista.get();
})

.controller('cadastroFunc', function ($scope, gerenciarFunc) {
  const auth = firebase.auth().currentUser;
  $scope.user = { nome: '', senha: '', email: '', uidADM: auth ? auth.uid : '', auth: false };

  $scope.salvarFunc = function (senha) {
    if ($scope.user.senha == senha) {
      gerenciarFunc.pesquisarFunc($scope.user.email).then(function (func) {
        if (func.val() == null) {
          gerenciarFunc.salvarFunc($scope.user);
        } else {
          console.log('E-mail já cadastrado para outro funcionário');
        }
      });
    } else {
      console.log('Senhas não conferem');
    }
  };
})

.controller('gerenciarFuncCtrl', function ($scope) {
  firebase.database().ref('funcionarioADM').on('value', (data) => {
    $scope.listaFunc = data.val();
    if (!$scope.$$phase) $scope.$digest();
  });
})

.controller('loginCtrl', function ($scope, $state, $ionicLoading, ionicSuperPopup, userService, gerenciarFunc) {
  $scope.login = function () { $state.go('tabsController.notificacoes'); };
  $scope.login1 = function () { $state.go('tabsController.camera'); };
  $scope.login2 = function () { $state.go('tabsController.configuracoes'); };

  $scope.user = { email: '', password: '' };
  $scope.entrar = function () {
    if (!$scope.user.email || !$scope.user.password) {
      ionicSuperPopup.show('Aviso!', 'Preencha e-mail e senha!', 'warning');
      return;
    }
    $ionicLoading.show({ template: 'Entrando...', duration: 10000 });
    firebase.auth().signInWithEmailAndPassword($scope.user.email, $scope.user.password)
      .then(function () {
        $ionicLoading.hide();
        return gerenciarFunc.pesquisarFunc($scope.user.email);
      })
      .then(function (func) {
        if (func.val() != null) {
          const id = Object.keys(func.val())[0];
          const obj = func.val()[id];
          if (obj.auth == false) {
            const obj2 = angular.copy(obj);
            obj2.auth = true;
            gerenciarFunc.editarFunc(obj2, id);
            userService.createUser(obj2);
          }
        }
        $state.go('tabsController.notificacoes');
      })
      .catch(function (error) {
        $ionicLoading.hide();
        const code = error.code;
        if (code == 'auth/invalid-email') ionicSuperPopup.show('Erro!', 'E-mail inválido!', 'error');
        else if (code == 'auth/user-disabled') ionicSuperPopup.show('Aviso!', 'Acesso bloqueado!', 'warning');
        else if (code == 'auth/user-not-found') ionicSuperPopup.show('Erro!', 'E-mail não cadastrado!', 'error');
        else if (code == 'auth/wrong-password') ionicSuperPopup.show('Erro!', 'Senha incorreta!', 'error');
        else ionicSuperPopup.show('Erro!', error.message, 'error');
      });
  };
})

.controller('cadastroCtrl', function ($scope, $state, $ionicLoading, ionicSuperPopup, userService) {
  $scope.user = { email: "", nome: "", cidade: "" };
  $scope.tipo = { status: "" };
  $scope.lista = [
    { id: 1, cidade: 'São José do Rio Preto' },
    { id: 2, cidade: 'Olimpia' },
    { id: 3, cidade: 'Mirassol' }
  ];

  $scope.Cadastrar = function (nome, senha) {
    $scope.user.nome = nome;
    const senha1 = document.getElementById('cadastro-input5').value;
    if (senha1 != senha) {
      ionicSuperPopup.show('Erro!', 'As senhas não se correspondem!', 'warning');
      return;
    }
    $ionicLoading.show({ template: 'Cadastrando...', duration: 10000 });
    userService.createLogin($scope.user.email, senha1)
      .then(function () {
        $ionicLoading.hide();
        return userService.createUser($scope.user);
      })
      .then(function () {
        const user = firebase.auth().currentUser;
        return user.updateProfile({ displayName: nome, photoURL: "" });
      })
      .then(function () {
        if ($scope.tipo.status == 1) return userService.createAdmin();
      })
      .then(function () {
        ionicSuperPopup.show('Bem Vindo!', 'Cadastrado com sucesso.', 'success');
        if ($scope.tipo.status == 1) {
          $state.go('tabsController.notificacoes');
        } else {
          $state.go('tabsController.camera');
        }
      })
      .catch(function (error) {
        $ionicLoading.hide();
        const code = error.code;
        if (code == 'auth/email-already-in-use') ionicSuperPopup.show('Erro!', 'E-mail já cadastrado!', 'error');
        else if (code == 'auth/invalid-email') ionicSuperPopup.show('Erro!', 'E-mail inválido!', 'error');
        else if (code == 'auth/weak-password') ionicSuperPopup.show('Erro!', 'Senha muito fraca!', 'warning');
        else ionicSuperPopup.show('Erro!', error.message, 'error');
      });
  };
})

.controller('alterarSenhaCtrl', function ($scope, $state, ionicSuperPopup) {
  $scope.alterar = function (senhaAntiga, novaSenha, confirmar) {
    if (novaSenha != confirmar) {
      ionicSuperPopup.show('Erro!', 'As senhas não se correspondem!', 'warning');
      return;
    }
    const user = firebase.auth().currentUser;
    if (!user) {
      ionicSuperPopup.show('Erro!', 'Nenhum usuário logado!', 'error');
      return;
    }
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, senhaAntiga);
    user.reauthenticateWithCredential(credential)
      .then(() => user.updatePassword(novaSenha))
      .then(function () {
        ionicSuperPopup.show('Sucesso!', 'Senha alterada!', 'success');
        $state.go('login');
      })
      .catch(function (error) {
        ionicSuperPopup.show('Erro!', error.message, 'error');
      });
  };
})

.controller('cadastrarFuncionarioCtrl', function ($scope, gerenciarFunc) {
  const auth = firebase.auth().currentUser;
  $scope.user = { nome: '', senha: '', email: '', uidADM: auth ? auth.uid : '', auth: false };

  $scope.salvarFunc = function (senha) {
    if ($scope.user.senha == senha) {
      gerenciarFunc.pesquisarFunc($scope.user.email).then(function (func) {
        if (func.val() == null) {
          gerenciarFunc.salvarFunc($scope.user);
        } else {
          console.log('E-mail já cadastrado');
        }
      });
    } else {
      console.log('Senhas não conferem');
    }
  };
})

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
    }).then(function (data) {
      $scope.pictureUrl = 'data:image/jpeg;base64,' + data;
    });
  };

  $scope.showImages = function (index) {
    $scope.activeSlide = index;
    $scope.showModal('templates/imagemmodal.html');
  };
  $scope.showModal = function (templateUrl) {
    $ionicModal.fromTemplateUrl(templateUrl, { scope: $scope, animation: 'slide-in-up' }).then(function (modal) {
      $scope.modal = modal;
      $scope.modal.show();
    });
  };
  $scope.closeModal = function () {
    $scope.modal.hide();
    $scope.modal.remove();
  };

  $scope.obj = { detalhes: "" };
  $scope.salvar = function (cidade) {
    const user = firebase.auth().currentUser;
    if (!user) {
      ionicSuperPopup.show('Erro!', 'Faça login primeiro!', 'error');
      return;
    }
    $ionicLoading.show({ template: 'Carregando...', duration: 300 });
    const obj = { endereco: cidade, img: $scope.pictureUrl, uid: user.uid, detalhes: $scope.obj.detalhes };
    solicitacaoPoda.createSolicitacao(obj).then(function () {
      $ionicLoading.hide();
      ionicSuperPopup.show('Feito!', 'Solicitação enviada com sucesso!', 'success');
      $state.go('tabsController.notificacoes');
    });
  };
})

.controller('MapCtrl', function ($scope, $ionicLoading, $cordovaGeolocation, $rootScope, $state) {
  $ionicLoading.show({ template: 'Carregando...', duration: 300 });

  $scope.mapCreated = function (map) { $scope.map = map; };

  $scope.pegarLocalizacao = function () {
    $state.go('tabsController.camera');
  };

  $scope.centerOnMe = function () {
    if (!$scope.map) { return; }
    $scope.loading = $ionicLoading.show({ content: 'Capturando localização atual...', showBackdrop: false, duration: 3000 });
    navigator.geolocation.getCurrentPosition(function (pos) {
      $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
      $scope.loading.hide();
    }, function (error) {
      alert('Impossível carregar localização: ' + error.message);
    });
  };

  const watchOptions = { timeout: 3000, enableHighAccuracy: false };
  let marker;
  let streetname;
  const watch = $cordovaGeolocation.watchPosition(watchOptions, $scope);
  watch.then(null, function (err) { }, function (position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    $scope.map.setCenter(new google.maps.LatLng(lat, lng));
    google.maps.event.addListenerOnce($scope.map, 'idle', function () {
      if (marker) marker.setMap(null);
      marker = new google.maps.Marker({
        map: $scope.map,
        animation: google.maps.Animation.DROP,
        position: new google.maps.LatLng(lat, lng)
      });
    });
    const geocoder = new google.maps.Geocoder();
    const latlng = new google.maps.LatLng(lat, lng);
    geocoder.geocode({ 'latLng': latlng }, function (results, status) {
      if (status == google.maps.GeocoderStatus.OK && results[1]) {
        $rootScope.formatted_address = results[0].address_components[1].long_name + ", " + results[1].formatted_address;
        if (results[0].types[0] == 'street_address' && results[0].address_components[1]) {
          streetname = results[0].address_components[1].long_name;
        } else if (results[0].types[0] == 'route') {
          streetname = results[0].address_components[0].long_name;
        }
      }
    });
  });
});