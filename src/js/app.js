App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    // var acc = account;
    //Load pets.
    // $.getJSON('../pets.json', function(data) {
    //   var petsRow = $('#petsRow');
    //   var petTemplate = $('#petTemplate');
    //   var acc = account;
      

    //   for (i = 0; i < data.length; i ++) {
    //     // petTemplate.find('.panel-title').text(data[i].tutor);
    //     petTemplate.find('.pet-tutor').text(data[i].tutor);
    //     petTemplate.find('.pet-subject').text(data[i].subject);
    //     petTemplate.find('.pet-price').text(data[i].price);
    //     petTemplate.find('.pet-details').text(data[i].details);
    //     petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
    //     petTemplate.find('.eth-address').text('acc');


    //     petsRow.append(petTemplate.html());
    //   }

    // });

    return await App.initWeb3();
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    //   App.web3Provider = new Web3(new Web3.providers.HttpProvider(
    //     'https://ropsten.infura.io/v3/f2c16624595d499a9cf349778d23c745'
    // ));
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      // App.web3Provider = web3.currentProvider;
    //   App.web3Provider = new Web3(new Web3.providers.HttpProvider(
    //     'https://ropsten.infura.io/v3/f2c16624595d499a9cf349778d23c745'
    // ));
    }
    // web3 = new Web3(App.web3Provider);
    // web3 = new Web3(web3.currentProvider);
    web3 = new Web3(new Web3.providers.HttpProvider(
      'https://ropsten.infura.io/v3/f2c16624595d499a9cf349778d23c745'
  ));

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('thuto.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var ThutoArtifact = data;
      App.contracts.Thuto = TruffleContract(ThutoArtifact);

      // Set the provider for our contract
      App.contracts.Thuto.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets
      return App.markRegistered();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleRegister);
  },

  markRegistered: function(registeredUsers, account) {
    var thutoInstance;

    App.contracts.Thuto.deployed().then(function(instance) {
      thutoInstance = instance;

      return thutoInstance.getUsers.call();
    }).then(function(registeredUsers) {
      for (i = 0; i < registeredUsers.length; i++) {
        if (registeredUsers[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Registered').attr('disabled', true);
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleRegister: function(event) {
    event.preventDefault();

    var _profile_uri = parseInt($(event.target).data('id'));

    var thutoInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Thuto.deployed().then(function(instance) {
        thutoInstance = instance;

        // Execute a transaction by sending account
        return thutoInstance.registerUser(_profile_uri, {from: account});
      }).then(function(result) {
        return App.markRegistered();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
