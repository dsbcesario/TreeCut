angular.module('app.services', [])

.service('userService', function () {
  this.createLogin = (email, password) => firebase.auth().createUserWithEmailAndPassword(email, password);

  this.createUser = (obj) => {
    const user = firebase.auth().currentUser;
    if (!user) return Promise.reject(new Error('Usuário não autenticado'));
    return firebase.database().ref('user/' + user.uid).set(obj);
  };

  this.createAdmin = () => {
    const user = firebase.auth().currentUser;
    if (!user) return Promise.reject(new Error('Usuário não autenticado'));
    const obj = { uid: user.uid, status: false, msgStatus: false };
    return firebase.database().ref('solicitacaoAdm/' + user.uid).set(obj);
  };
})

.service('solicitacaoPoda', function () {
  this.createSolicitacao = (obj) => firebase.database().ref('solicitacaoPoda/aberto').push(obj);

  this.moverRecusada = (obj, id) =>
    firebase.database().ref('solicitacaoPoda/recusada/' + id).set(obj)
      .then(() => firebase.database().ref('solicitacaoPoda/aberto/' + id).remove());

  this.excluirRecusada = (id) =>
    firebase.database().ref('solicitacaoPoda/recusada/' + id).remove();
})

.service('gerenciarFunc', function ($state) {
  this.pesquisarFunc = (email) =>
    firebase.database().ref('funcionarioADM').orderByChild('email').equalTo(email).once('value');

  this.salvarFunc = (obj) =>
    firebase.database().ref('funcionarioADM').push(obj).then(() => $state.go('gerenciarFuncionario'));

  this.editarFunc = (obj, uid) => firebase.database().ref('funcionarioADM/' + uid).set(obj);
})

.factory('buscarUsuario', function ($q, ionicSuperPopup) {
  return {
    get() {
      const defer = $q.defer();
      const user = firebase.auth().currentUser;
      if (!user) { defer.reject('Usuário não autenticado'); return defer.promise; }
      const ref = firebase.database().ref('solicitacaoAdm/' + user.uid);
      ref.on('value', (data) => {
        const val = data.val();
        if (val != null) {
          if (val.status === true && val.msgStatus === false) {
            ionicSuperPopup.show('Aprovado', 'Você foi aprovado como administrador', 'success');
            firebase.database().ref('solicitacaoAdm/' + user.uid).set({ uid: user.uid, status: true, msgStatus: true });
          }
          defer.resolve(true);
          ref.off('value');
        }
      });
      return defer.promise;
    }
  };
})

.factory('buscarLista', function ($q, $ionicLoading) {
  return {
    get() {
      const defer = $q.defer();
      const user = firebase.auth().currentUser;
      if (!user) { defer.reject('Usuário não autenticado'); return defer.promise; }
      $ionicLoading.show({ template: 'Carregando...', duration: 30000 });
      const lista = [];
      const ref = firebase.database().ref('solicitacaoPoda/aberto').orderByChild('uid').equalTo(user.uid);
      ref.on('child_added', (data) => {
        lista.push(data.val());
        defer.resolve(lista);
        $ionicLoading.hide();
      });
      return defer.promise;
    }
  };
})

.factory('buscarListaAberto', function ($q) {
  return {
    get() {
      const defer = $q.defer();
      const lista = [];
      firebase.database().ref('solicitacaoPoda/aberto').on('child_added', (data) => {
        lista.push(data.val());
        defer.resolve(lista);
      });
      return defer.promise;
    }
  };
})

.factory('buscarListaPendente', function ($q) {
  return {
    get() {
      const defer = $q.defer();
      const lista = [];
      firebase.database().ref('solicitacaoPoda/pendente').on('child_added', (data) => {
        lista.push(data.val());
        defer.resolve(lista);
      });
      return defer.promise;
    }
  };
})

.factory('buscarListaRecusada', function ($q) {
  return {
    get() {
      const defer = $q.defer();
      const user = firebase.auth().currentUser;
      if (!user) { defer.reject('Usuário não autenticado'); return defer.promise; }
      const lista = [];
      firebase.database().ref('solicitacaoPoda/recusada').orderByChild('uid').equalTo(user.uid).on('child_added', (data) => {
        lista.push(data.val());
        defer.resolve(lista);
      });
      return defer.promise;
    }
  };
});