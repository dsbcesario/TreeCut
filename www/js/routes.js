angular.module('app.routes', [])

.config(function ($stateProvider, $urlRouterProvider) {

  $stateProvider

    .state('tabsController.denuncia', {
      url: '/page2',
      cache: false,
      views: {
        'tab1': {
          templateUrl: 'templates/denuncia.html',
          controller: 'DenunciaCtrl'
        }
      }
    })

    .state('tabsController.notificacoes', {
      url: '/page4',
      views: {
        'tab3': {
          templateUrl: 'templates/notificacoes.html',
          controller: 'notificacoesCtrl'
        }
      }
    })

    .state('tabsController.configuracoes', {
      url: '/pageconfig',
      views: {
        'tab4': {
          templateUrl: 'templates/configuracao.html',
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