angular.module('app.routes', [])

.config(function ($stateProvider, $urlRouterProvider) {

  $stateProvider

    .state('tabsController.editarPerfil', {
      url: '/pageperfil',
      views: {
        'menuContent': {
          templateUrl: 'templates/editarPerfil.html',
          controller: 'editarPerfilCtrl'
        }
      }
    })

    .state('tabsController.denuncia', {
      url: '/page2',
      cache: false,
      views: {
        'menuContent': {
          templateUrl: 'templates/denuncia.html',
          controller: 'DenunciaCtrl'
        }
      }
    })

    .state('tabsController.notificacoes', {
      url: '/page4',
      views: {
        'menuContent': {
          templateUrl: 'templates/notificacoes.html',
          controller: 'notificacoesCtrl'
        }
      }
    })

    .state('tabsController.configuracoes', {
      url: '/pageconfig',
      views: {
        'menuContent': {
          templateUrl: 'templates/sobrenos.html',
          controller: 'configuracoesCtrl'
        }
      }
    })

    .state('tabsController', {
      url: '/page1',
      templateUrl: 'templates/tabsController.html',
      abstract: true,
      controller: 'menuCtrl'
    })

    .state('login', {
      url: '/page5',
      templateUrl: 'templates/login.html',
      controller: 'loginCtrl'
    })

    .state('cadastro', {
      url: '/page6',
      templateUrl: 'templates/cadastro.html',
      controller: 'cadastroCtrl'
    })

    .state('alterarSenha', {
      url: '/page7',
      templateUrl: 'templates/alterarSenha.html',
      controller: 'alterarSenhaCtrl'
    })

    .state('esqueciSenha', {
      url: '/page8',
      templateUrl: 'templates/esqueciSenha.html',
      controller: 'esqueciSenhaCtrl'
    })

    .state('gerenciarFuncionario', {
      url: '/page14',
      templateUrl: 'templates/gerenciarFuncionario.html',
      controller: 'gerenciarFuncCtrl'
    })

    .state('cadastrarFuncionario', {
      url: '/page15',
      templateUrl: 'templates/cadastrarFuncionario.html',
      controller: 'cadastroFunc'
    });

  $urlRouterProvider.otherwise('/page5');

});