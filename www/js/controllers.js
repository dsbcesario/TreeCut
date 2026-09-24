// ===== Tipos de cadastro (conforme o cadastro.html) =====
// 0 = Solicitante (cliente) | 1 = Podador
var TIPO_PODADOR = '1';
angular.module('app.controllers', ['ngCordova'])
.controller('localizacaoCtrl', ['$scope', '$stateParams', function ($scope, $stateParams) {
}])
.controller('EmailController', function ($scope) {
  $scope.sendFeedback = function () {
    if (window.plugins && window.plugins.emailComposer) {
      window.plugins.emailComposer.showEmailComposerWithCallback(
        function (result) {
          console.log('Resposta -> ' + result);
        },
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
.controller('notificacoesCtrl', function ($scope, $http, $firebaseArray, buscarUsuario, solicitacaoPoda, ionicSuperPopup, $ionicModal, $ionicPopup) {
  $scope.userDados = {};
  $scope.currentUid = null;
  $scope.isPodador = false;
  $scope.solicitacao = {
    endereco: '',
    detalhes: '',
    tipoPodador: 'aleatorio',
    podador: null
  };

  // ===== Carrega usuário + tipo, e SÓ DEPOIS monta as listas =====
  function carregarTudo(user) {
    $scope.currentUid = user.uid;
    firebase.database().ref('user/' + user.uid).once('value').then(function (snap) {
      var dados = snap.val() || {};
      $scope.userDados = dados;
      $scope.isPodador = (String(dados.tipo) === TIPO_PODADOR) || (String(dados.tipo).toLowerCase() === 'podador');
      if (!$scope.solicitacao.email1) {
        $scope.solicitacao.email1 = $scope.userDados.email;
      }
      // Agora sim, com o tipo definido, monta as listas
      carregarSolicitacoes();
      if (!$scope.$$phase) $scope.$digest();
    });
  }

  // ===== Monta as listas conforme o papel =====
  // Cliente: só as próprias (separando solicitação x denúncia)
  // Podador: TODAS as solicitações de poda em aberto + as próprias denúncias
  function carregarSolicitacoes() {
    var ref = firebase.database().ref('solicitacaoPoda/aberto');
    ref.off('value'); // remove listeners antigos (evita duplicar ao navegar)
    ref.on('value', function (data) {
      var todas = data.val() || {};
      var minhas = {}, solicitacoes = {}, denuncias = {};
      angular.forEach(todas, function (v, k) {
        if ($scope.isPodador) {
          // Podador: TODAS as solicitações de poda (tem tipoPodador)
          if (v.tipoPodador) {
            solicitacoes[k] = v;
          } else if (v.uid === $scope.currentUid) {
            // Denúncias: só as que ele mesmo fez
            denuncias[k] = v;
          }
          minhas[k] = v;
        } else {
          // Cliente: só as dele
          if (v.uid === $scope.currentUid) {
            minhas[k] = v;
            if (v.tipoPodador) solicitacoes[k] = v;
            else denuncias[k] = v;
          }
        }
      });
      $scope.listaAberta = minhas;
      $scope.listaSolicitacoes = solicitacoes;
      $scope.listaDenuncias = denuncias;
      if (!$scope.$$phase) $scope.$digest();
    });
  }

  // ===== Monta o endereço completo =====
  $scope.enderecoCompleto = function (item) {
    if (!item) return '';
    var partes = [];
    var rua = item.enderecoArvore || item.endereco || '';
    if (rua) partes.push(rua);
    if (item.numero) partes.push('nº ' + item.numero);
    if (item.bairro) partes.push(item.bairro);
    var cidadeUf = (item.cidade || '') + (item.uf ? (item.cidade ? ' - ' : '') + item.uf : '');
    if (cidadeUf) partes.push(cidadeUf);
    if (item.cep) partes.push('CEP ' + item.cep);
    return partes.join(', ');
  };

  // ===== Verifica se a lista tem itens (para o ng-if) =====
  $scope.temItens = function (lista) {
    return lista && Object.keys(lista).length > 0;
  };

  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      $scope.listaAberta = {};
      $scope.listaSolicitacoes = {};
      $scope.listaDenuncias = {};
      return;
    }
    carregarTudo(user);
  });

  // ===== Recarrega sempre que a tela for exibida =====
  $scope.$on('$ionicView.beforeEnter', function () {
    var user = firebase.auth().currentUser;
    if (user) carregarTudo(user);
  });

  // Lista de podadores cadastrados
    // ===== Lista de podadores: lê de user/ filtrando tipo = "1" =====
  $scope.listaPodadores = [];
  firebase.database().ref('user').orderByChild('tipo').equalTo('1').on('value', function (snap) {
    $scope.listaPodadores = [];
    var val = snap.val();
    if (val) {
      angular.forEach(val, function (v, k) {
        $scope.listaPodadores.push({
          $id: k,
          nome: v.nome || 'Podador',
          telefone: v.telefone || '',
          uid: k
        });
      });
    }
    if (!$scope.$$phase) $scope.$digest();
  });

  $scope.escolherPodador = function (tipo) {
    $scope.solicitacao.tipoPodador = tipo;
    if (tipo === 'aleatorio') $scope.solicitacao.podador = null;
  };

  // Busca o endereço pelo CEP
  $scope.buscarCep = function () {
    var cep = ($scope.solicitacao.cep || '').replace(/\D/g, '');
    if (cep.length !== 8) return;
    $http.get('https://viacep.com.br/ws/' + cep + '/json/')
      .then(function (res) {
        var d = res.data;
        if (d.erro) {
          ionicSuperPopup.show('Aviso!', 'CEP não encontrado. Preencha o endereço manualmente.', 'warning');
          return;
        }
        $scope.solicitacao.endereco = d.logradouro;
        $scope.solicitacao.bairro = d.bairro;
        $scope.solicitacao.cidade = d.localidade;
        $scope.solicitacao.uf = d.uf;
      })
      .catch(function () {
        ionicSuperPopup.show('Erro!', 'Não foi possível consultar o CEP. Preencha manualmente.', 'error');
      });
  };

  $scope.enviarSolicitacao = function () {
    const user = firebase.auth().currentUser;
    if (!user) {
      ionicSuperPopup.show('Erro!', 'Faça login primeiro!', 'error');
      return;
    }
    if ($scope.solicitacao.tipoPodador === 'especifico' && !$scope.solicitacao.podador) {
      ionicSuperPopup.show('Aviso!', 'Selecione o podador para a solicitação!', 'warning');
      return;
    }
    const obj = angular.copy($scope.userDados);
    obj.uid = user.uid;
    obj.email = user.email;
    obj.enderecoArvore = $scope.solicitacao.endereco;
    obj.detalhes = $scope.solicitacao.detalhes;
    obj.qtdArvores = $scope.solicitacao.qtdArvores;
    obj.tipoPodador = $scope.solicitacao.tipoPodador || 'aleatorio';
    obj.podador = ($scope.solicitacao.tipoPodador === 'especifico' && $scope.solicitacao.podador)
      ? $scope.solicitacao.podador.nome
      : null;
    obj.status = 'analise';
    obj.data = Date.now();
    solicitacaoPoda.createSolicitacao(obj).then(function () {
      ionicSuperPopup.show('Feito!', 'Solicitação enviada com sucesso!', 'success');
      $scope.solicitacao.detalhes = '';
    });
  };

  // ===== Excluir solicitação em aberto — com confirmação =====
  $scope.excluirAberta = function (chave) {
    if (!chave) return;
    $ionicPopup.confirm({
      title: 'Excluir solicitação',
      template: 'Tem certeza que deseja excluir esta solicitação?',
      okText: 'Excluir',
      okType: 'button-assertive',
      cancelText: 'Cancelar'
    }).then(function (res) {
      if (!res) return;
      firebase.database().ref('solicitacaoPoda/aberto/' + chave).remove().then(function () {
        ionicSuperPopup.show('Excluída!', 'Solicitação excluída com sucesso!', 'success');
      });
    });
  };

  // ===== Podador se marca como responsável pela poda =====
  $scope.aceitarSolicitacao = function (chave, item) {
    console.log('>>> ACEITAR CLICADO | chave:', chave, '| isPodador:', $scope.isPodador);
    if (!chave) return;
    const user = firebase.auth().currentUser;
    if (!user) return;
    try {
      if (!window.confirm('Confirmar que você será o podador responsável por esta solicitação?')) return;
      firebase.database().ref('solicitacaoPoda/aberto/' + chave).once('value').then(function (snap) {
        const atual = snap.val() || {};
        if (atual.status === 'aceita') {
          alert('Esta solicitação já foi aceita por outro podador.');
          return;
        }
        const nomePodador = $scope.userDados.nome || user.displayName || 'Podador';
        return firebase.database().ref('solicitacaoPoda/aberto/' + chave).update({
          status: 'aceita',
          podadorUid: user.uid,
          podador: nomePodador,
          dataAceite: Date.now()
        }).then(function () {
          alert('Você foi marcado como podador desta solicitação!');
        });
      }).catch(function (err) {
        console.error('ERRO AO ACEITAR:', err);
        alert('Erro: ' + err.message);
      });
    } catch (e) {
      console.error('ERRO NO CLIQUE:', e);
      alert('Erro: ' + e.message);
    }
  };

  // ===== Podador desmarca sua aceitação =====
  $scope.desmarcarAceite = function (chave) {
    if (!chave) return;
    firebase.database().ref('solicitacaoPoda/aberto/' + chave).update({
      status: 'analise',
      podadorUid: null,
      podador: null,
      dataAceite: null
    }).then(function () {
      ionicSuperPopup.show('Ok!', 'Aceite removido. A solicitação voltou para análise.', 'success');
    }).catch(function (err) {
      ionicSuperPopup.show('Erro!', err.message, 'error');
    });
  };

  $scope.show = false;
  buscarUsuario.get().then(function (data) {
    if (data === true) $scope.show = true;
  });

  const ref = firebase.database().ref('notifications');
  $scope.notifications = $firebaseArray(ref);

  $scope.excluirRecusada = function (id) {
    if (!id) return;
    solicitacaoPoda.excluirRecusada(id).then(() => {
      ionicSuperPopup.show('Aviso!', 'Solicitação excluída!', 'error');
    });
  };

  $ionicModal.fromTemplateUrl('templates/detalhesSolicitacao.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function (modal) {
    $scope.modal = modal;
  });

  $scope.openModal = function (array) {
    $scope.modal.show();
    $scope.detalhesModal = {
      endereco: array.endereco,
      img: array.img,
      detalhes: array.detalhes
    };
  };
  $scope.closeModal = function () {
    $scope.modal.hide();
  };

  $scope.$on('$destroy', function () {
    $scope.modal.remove();
    firebase.database().ref('solicitacaoPoda/aberto').off('value');
  });
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
.controller('menuCtrl', function ($scope, $state, buscarUsuario, buscarLista) {
  $scope.show = false;
  $scope.currentUid = null;
  function filtrarPorUid(todas) {
    var minhas = {};
    angular.forEach(todas || {}, function (v, k) {
      if (v.uid === $scope.currentUid) minhas[k] = v;
    });
    return minhas;
  }
  firebase.auth().onAuthStateChanged(function (user) {
    $scope.currentUid = user ? user.uid : null;
    firebase.database().ref('solicitacaoPoda/aberto').once('value', function (data) {
      $scope.listaAberta = filtrarPorUid(data.val());
      if (!$scope.$$phase) $scope.$digest();
    });
    firebase.database().ref('solicitacaoPoda/recusada').once('value', function (data) {
      $scope.listaRecusada = filtrarPorUid(data.val());
      if (!$scope.$$phase) $scope.$digest();
    });
  });
  firebase.database().ref('solicitacaoPoda/aberto').on('value', function (data) {
    $scope.listaAberta = filtrarPorUid(data.val());
    if (!$scope.$$phase) $scope.$digest();
  });
  firebase.database().ref('solicitacaoPoda/recusada').on('value', function (data) {
    $scope.listaRecusada = filtrarPorUid(data.val());
    if (!$scope.$$phase) $scope.$digest();
  });
  // ===== Navegação do menu lateral (mesmo padrão do logout) =====
  $scope.abrirPerfil = function () {
    $state.go('tabsController.editarPerfil');
  };
  $scope.abrirSolicitacao = function () {
    $state.go('tabsController.notificacoes');
  };
  $scope.abrirDenuncia = function () {
    $state.go('tabsController.denuncia');
  };
  $scope.abrirSobreNos = function () {
    $state.go('tabsController.configuracoes');
  };
  // ===== Logout (item do menu lateral) =====
  $scope.logout = function () {
    firebase.auth().signOut().then(function () {
      $state.go('login');
    }, function (error) {
      console.log(error);
    });
  };
  buscarUsuario.get().then(function (data) {
    if (data === true) $scope.show = true;
  });
  buscarLista.get();
})
.controller('editarPerfilCtrl', function ($scope, $state, $ionicLoading, ionicSuperPopup) {
  $scope.perfil = {};
  var user = firebase.auth().currentUser;
  if (!user) {
    $state.go('login');
    return;
  }
  firebase.database().ref('user/' + user.uid).once('value').then(function (snap) {
    $scope.perfil = snap.val() || {};
    if (!$scope.$$phase) $scope.$digest();
  });
  $scope.salvarPerfil = function () {
    var user = firebase.auth().currentUser;
    if (!user) return;
    $ionicLoading.show({ template: 'Salvando...', duration: 3000 });
    firebase.database().ref('user/' + user.uid).update($scope.perfil).then(function () {
      $ionicLoading.hide();
      ionicSuperPopup.show('Feito!', 'Perfil atualizado com sucesso!', 'success');
    }).catch(function (err) {
      $ionicLoading.hide();
      ionicSuperPopup.show('Erro!', err.message, 'error');
    });
  };
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
  $scope.login = function () {
    $state.go('tabsController.notificacoes', {}, { reload: true });
  };
  $scope.login1 = function () {
    $state.go('tabsController.denuncia', {}, { reload: true });   // ← era tabsController.camera
  };
  $scope.login2 = function () {
    $state.go('tabsController.configuracoes', {}, { reload: true });
  };
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
        $state.go('tabsController.notificacoes', {}, { reload: true });
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
  $scope.user = { email: "", nome: "", cidade: "", cpf: "", endereco: "", numero: "", bairro: "", cep: "", telefone: "" };
  $scope.tipo = { status: "" };
  $scope.lista = [
    { id: 1, cidade: 'São José do Rio Preto' },
    { id: 2, cidade: 'Olimpia' },
    { id: 3, cidade: 'Mirassol' }
  ];
  $scope.Cadastrar = function (nome, senha) {
    $scope.user.nome = nome;
    // Salva o tipo de cadastro no registro do usuário (0 = solicitante, 1 = podador)
    $scope.user.tipo = $scope.tipo.status;
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
        // ❌ REMOVIDO: criava admin para todo mundo com status == 1 (que hoje é Podador)
        // Se ainda precisar de cadastro de administrador, adicione uma opção
        // "Administrador" no select do cadastro.html com um valor próprio (ex.: "2")
        // e trate aqui: if ($scope.user.tipo === '2') return userService.createAdmin();
      })
      .then(function () {
        ionicSuperPopup.show('Bem Vindo!', 'Cadastrado com sucesso.', 'success');
        return firebase.auth().signOut();
      })
      .then(function () {
        $state.go('login');
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
.controller('esqueciSenhaCtrl', function ($scope, $state, ionicSuperPopup) {
  $scope.email = '';
  $scope.enviar = function () {
    if (!$scope.email) {
      ionicSuperPopup.show('Aviso!', 'Informe seu e-mail!', 'warning');
      return;
    }
    firebase.auth().sendPasswordResetEmail($scope.email)
      .then(function () {
        ionicSuperPopup.show('E-mail enviado!', 'Verifique sua caixa de entrada para redefinir a senha.', 'success');
        $state.go('login');
      })
      .catch(function (error) {
        const code = error.code;
        if (code == 'auth/invalid-email') ionicSuperPopup.show('Erro!', 'E-mail inválido!', 'error');
        else if (code == 'auth/user-not-found') ionicSuperPopup.show('Erro!', 'E-mail não cadastrado!', 'error');
        else ionicSuperPopup.show('Erro!', error.message, 'error');
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
.controller('DenunciaCtrl', function ($scope, $http, $timeout, $cordovaCamera, $rootScope, $state, $ionicModal, $ionicActionSheet, solicitacaoPoda, ionicSuperPopup, $ionicLoading) {
  // ===== Dados da denúncia =====
  $scope.denuncia = {
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: ''
  };
  $scope.mostrarMapa = false;
  $scope.$on('$ionicView.beforeEnter', function () {
    if ($rootScope.formatted_address) {
      $scope.denuncia.endereco = $rootScope.formatted_address;
    }
  });
  // ===== Mostra o mapa embutido na própria página =====
  $scope.voltarLocalizacao = function () {
    $scope.mostrarMapa = true;
    if (!$scope.$$phase) $scope.$digest();
    $timeout(function () {
      $scope.criarMapa();
    }, 150);
  };
  // ===== Cria o mapa manualmente no div inline =====
  $scope.criarMapa = function () {
    var el = document.getElementById('mapa-denuncia');
    if (!el) return;
    if (typeof google === 'undefined' || !google.maps) {
      ionicSuperPopup.show('Erro!', 'O Google Maps não carregou. Verifique sua conexão e recarregue a página.', 'error');
      return;
    }
    $scope.map = new google.maps.Map(el, {
      zoom: 18,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    $scope.centrarMapa();
  };
  // ===== Centraliza na localização atual (marcador arrastável) =====
  $scope.centrarMapa = function () {
    if (!$scope.map) return;
    navigator.geolocation.getCurrentPosition(function (pos) {
      var latLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      $scope.map.setCenter(latLng);
      $scope.marker = new google.maps.Marker({
        map: $scope.map,
        position: latLng,
        draggable: true,
        animation: google.maps.Animation.DROP,
        title: 'Sua localização'
      });
    }, function () {
      // Sem permissão/GPS: mapa abre no centro de Rio Preto com marcador arrastável
      var fallback = new google.maps.LatLng(-20.8113, -49.3758);
      $scope.map.setCenter(fallback);
      $scope.marker = new google.maps.Marker({
        map: $scope.map,
        position: fallback,
        draggable: true,
        title: 'Arraste até o local da denúncia'
      });
      ionicSuperPopup.show('Aviso!', 'Não foi possível obter sua localização. Arraste o marcador até o local da denúncia.', 'warning');
    });
  };
  // ===== Preenche o endereço a partir do ponto marcado no mapa =====
  $scope.usarEnderecoMapa = function () {
    if (!$scope.map || !$scope.marker) {
      ionicSuperPopup.show('Aviso!', 'Aguarde o mapa carregar...', 'warning');
      return;
    }
    var pos = $scope.marker.getPosition();
    var lat = pos.lat();
    var lng = pos.lng();
    // 1º) Tenta o Google Geocoder
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: pos }, function (results, status) {
      console.log('Google Geocoder status:', status);
      if (status === google.maps.GeocoderStatus.OK && results[0]) {
        $scope.preencherEnderecoGoogle(results[0]);
      } else {
        // 2º) Fallback: OpenStreetMap (Nominatim) — gratuito, sem chave
        console.log('Usando fallback OpenStreetMap (status Google: ' + status + ')');
        $scope.buscarEnderecoOpenStreetMap(lat, lng);
      }
    });
  };
  // ===== Preenche a partir do resultado do Google =====
  $scope.preencherEnderecoGoogle = function (resultado) {
    var comp = resultado.address_components || [];
    function parte(tipo) {
      for (var i = 0; i < comp.length; i++) {
        if (comp[i].types.indexOf(tipo) !== -1) return comp[i].long_name;
      }
      return '';
    }
    $scope.denuncia.endereco = parte('route') || resultado.formatted_address;
    $scope.denuncia.numero = parte('street_number');
    $scope.denuncia.bairro = parte('sublocality_level_1') || parte('sublocality');
    $scope.denuncia.cidade = parte('administrative_area_level_2');
    $scope.denuncia.uf = parte('administrative_area_level_1');
    $scope.denuncia.cep = parte('postal_code');
    $scope.fecharMapa();
    // Corrige o CEP na base oficial dos Correios (ViaCEP)
    $scope.corrigirCepPeloEndereco();
    if (!$scope.$$phase) $scope.$digest();
  };
  // ===== Fallback: busca o endereço no OpenStreetMap (sem chave) =====
  $scope.buscarEnderecoOpenStreetMap = function (lat, lng) {
    $http.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        format: 'jsonv2',
        lat: lat,
        lon: lng,
        'accept-language': 'pt-BR'
      }
    }).then(function (res) {
      var a = (res.data && res.data.address) || {};
      $scope.denuncia.endereco = a.road || (res.data && res.data.display_name) || '';
      $scope.denuncia.numero = a.house_number || '';
      $scope.denuncia.bairro = a.suburb || a.neighbourhood || a.village || '';
      $scope.denuncia.cidade = a.city || a.town || a.municipality || '';
      $scope.denuncia.uf = a.state || '';
      $scope.denuncia.cep = a.postcode || '';
      if (!$scope.denuncia.endereco) {
        ionicSuperPopup.show('Erro!', 'Não foi possível obter o endereço deste ponto. Tente arrastar o marcador para uma rua.', 'error');
        return;
      }
      $scope.fecharMapa();
      // Corrige o CEP na base oficial dos Correios (ViaCEP)
      $scope.corrigirCepPeloEndereco();
      if (!$scope.$$phase) $scope.$digest();
    }).catch(function () {
      ionicSuperPopup.show('Erro!', 'Não foi possível obter o endereço deste ponto. Verifique sua conexão.', 'error');
    });
  };
  // ===== CORREÇÃO DO CEP (definitiva): consulta o ViaCEP pela rua + cidade + UF =====
  $scope.corrigirCepPeloEndereco = function () {
    var uf = ($scope.denuncia.uf || '').trim().toUpperCase();
    var cidade = $scope.denuncia.cidade || '';
    var rua = $scope.denuncia.endereco || '';
    if (!uf || !cidade || !rua) return;
    // Limpa o nome da rua: remove acentos, prefixos (Rua, Av, Praça...) e números
    function limpar(texto) {
      return texto
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\b(RUA|AVENIDA|AV|ALAMEDA|PRACA|TRAVESSA|ESTRADA|RODOVIA|VILA)\b/gi, '')
        .replace(/\d+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    var url = 'https://viacep.com.br/ws/' + encodeURIComponent(limpar(uf)) + '/' +
              encodeURIComponent(limpar(cidade)) + '/' +
              encodeURIComponent(limpar(rua)) + '/json/';
    $http.get(url).then(function (res) {
      var lista = res.data;
      if (!angular.isArray(lista) || !lista.length) {
        // Não achou CEP oficial: avisa para conferir manualmente
        ionicSuperPopup.show('Aviso!', 'Não encontramos o CEP oficial desta rua. Confira o campo CEP antes de enviar.', 'warning');
        return;
      }
      if (lista.length === 1) {
        // Só um CEP para a rua: usa direto
        $scope.denuncia.cep = lista[0].cep;
        if (!$scope.denuncia.bairro) $scope.denuncia.bairro = lista[0].bairro || '';
      } else {
        // Vários CEPs (rua longa): deixa o usuário escolher o certo
        $scope.escolherCep(lista);
      }
      if (!$scope.$$phase) $scope.$digest();
    }).catch(function () {
      // Silencioso: se falhar, mantém o CEP que veio do mapa
    });
  };
  // ===== Lista de CEPs para o usuário escolher (quando a rua tem vários) =====
  $scope.escolherCep = function (lista) {
    var botoes = lista.map(function (item) {
      return item.cep + (item.bairro ? ' — ' + item.bairro : '');
    });
    $ionicActionSheet.show({
      title: 'Escolha o CEP correto',
      buttons: botoes,
      cancelText: 'Cancelar',
      buttonClicked: function (index) {
        var item = lista[index];
        $scope.denuncia.cep = item.cep;
        if (!$scope.denuncia.bairro) $scope.denuncia.bairro = item.bairro || '';
        if (!$scope.$$phase) $scope.$digest();
        return true;
      }
    });
  };
  // ===== Esconde o mapa =====
  $scope.fecharMapa = function () {
    $scope.mostrarMapa = false;
    if (!$scope.$$phase) $scope.$digest();
  };
  $scope.pictureUrl = '../img/add_photo.png';
  // ===== Tirar foto com a câmera =====
  $scope.fotografar = function () {
    $cordovaCamera.getPicture({
      destinationType: Camera.DestinationType.DATA_URL,
      encodingType: Camera.EncodingType.JPEG,
      saveToPhotoAlbum: true
    }).then(function (data) {
      $scope.pictureUrl = 'data:image/jpeg;base64,' + data;
    }, function (err) { });
  };
  // ===== Escolher foto da galeria =====
  $scope.abrirGaleria = function () {
    $cordovaCamera.getPicture({
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
      encodingType: Camera.EncodingType.JPEG
    }).then(function (data) {
      $scope.pictureUrl = 'data:image/jpeg;base64,' + data;
    }, function (err) { });
  };
  // ===== Busca o endereço pelo CEP (ViaCEP - gratuito, sem chave) =====
  $scope.buscarCep = function () {
    var cep = ($scope.denuncia.cep || '').replace(/\D/g, '');
    if (cep.length !== 8) return;
    $http.get('https://viacep.com.br/ws/' + cep + '/json/')
      .then(function (res) {
        var d = res.data;
        if (d.erro) {
          ionicSuperPopup.show('Aviso!', 'CEP não encontrado. Preencha o endereço manualmente.', 'warning');
          return;
        }
        $scope.denuncia.endereco = d.logradouro;
        $scope.denuncia.bairro = d.bairro;
        $scope.denuncia.cidade = d.localidade;
        $scope.denuncia.uf = d.uf;
      })
      .catch(function () {
        ionicSuperPopup.show('Erro!', 'Não foi possível consultar o CEP. Preencha manualmente.', 'error');
      });
  };
  $scope.showImages = function (index) {
    $scope.activeSlide = index;
    $scope.showModal('templates/imagemmodal.html');
  };
  $scope.showModal = function (templateUrl) {
    $ionicModal.fromTemplateUrl(templateUrl, {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
      $scope.modal.show();
    });
  };
  $scope.closeModal = function () {
    $scope.modal.hide();
    $scope.modal.remove();
  };
  $scope.obj = { detalhes: "" };
  // ===== Enviar denúncia =====
  $scope.salvar = function () {
    const user = firebase.auth().currentUser;
    if (!user) {
      ionicSuperPopup.show('Erro!', 'Faça login primeiro!', 'error');
      return;
    }
    if (!$scope.denuncia.endereco) {
      ionicSuperPopup.show('Aviso!', 'Informe o endereço da denúncia!', 'warning');
      return;
    }
    $ionicLoading.show({ template: 'Carregando...', duration: 300 });
    const enderecoCompleto = $scope.denuncia.endereco + ($scope.denuncia.numero ? ', ' + $scope.denuncia.numero : '');
    const obj = {
      endereco: enderecoCompleto,
      bairro: $scope.denuncia.bairro,
      cidade: $scope.denuncia.cidade,
      uf: $scope.denuncia.uf,
      cep: $scope.denuncia.cep,
      img: $scope.pictureUrl,
      uid: user.uid,
      detalhes: $scope.obj.detalhes,
      data: Date.now()
    };
    solicitacaoPoda.createSolicitacao(obj).then(function () {
      $ionicLoading.hide();
      ionicSuperPopup.show('Feito!', 'Denúncia enviada com sucesso!', 'success');
      $state.go('tabsController.notificacoes');
    });
  };
  $scope.$on('$destroy', function () {
    if ($scope.modal) $scope.modal.remove();
  });
})
// Faz o textarea crescer sozinho conforme digita
.directive('autoGrow', function () {
  return {
    restrict: 'A',
    link: function (scope, element) {
      function resize() {
        element.css('height', 'auto');
        element.css('height', element[0].scrollHeight + 'px');
      }
      element.on('input', resize);
      scope.$watch(function () { return element.val(); }, resize);
      setTimeout(resize, 0);
    }
  };
});