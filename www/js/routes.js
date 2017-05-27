angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
    
  

      .state('tabsController.camera', {
    url: '/page2',
    cache: false,
    views: {
      'tab1': {
        templateUrl: 'templates/camera.html',
        controller: 'cameraCtrl'
      }
    }
  })

  .state('tabsController.localizacao', {
    url: '/page3',
    views: {
      'tab2': {
        templateUrl: 'templates/localizacao.html',
        controller: 'MapCtrl'
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
    abstract:true,
    controller:'menuCtrl'
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

  .state('gerenciarFuncionario', {
    url: '/page14',
    templateUrl: 'templates/gerenciarFuncionario.html',
    controller:'gerenciarFuncCtrl'
  })

  .state('cadastrarFuncionario', {
    url: '/page15',
    templateUrl: 'templates/cadastrarFuncionario.html',
    controller:'cadastroFunc'
    
  })
  


$urlRouterProvider.otherwise('/page5')

});