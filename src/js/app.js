// App = {
//   web3Provider: null,
//   contracts: {},

//   init: async function() {
//     // Load pets.
//     $.getJSON('../users.json', function(data) {
//       var usersRow = $('#usersRow');
//       var thutoTemplate = $('#thutoTemplate');

//       for (i = 0; i < data.length; i ++) {
//         thutoTemplate.find('.user-name').text(data[i].name);
//         thutoTemplate.find('.user-subject').attr(text(data[i].subject);
//         thutoTemplate.find('.user-details').text(data[i].details);
//         thutoTemplate.find('.user-tutor').text(data[i].tutor);
//         thutoTemplate.find('.user-price').text(data[i].price);

//         usersRow.append(thutoTemplate.html());
//       }
//     });

//     return await App.initWeb3();
//   },

//   initWeb3: async function() {
//     if (window.ethereum) {
//       App.web3Provider = window.ethereum;
//       try {
//         // Request account access
//         await window.ethereum.enable();
//       } catch (error) {
//         // User denied account access...
//         console.error("User denied account access")
//       }
//     }
//     // Legacy dapp browsers...
//     else if (window.web3) {
//       App.web3Provider = window.web3.currentProvider;
//     }
//     // If no injected web3 instance is detected, fall back to Ganache
//     else {
//       App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
//     }
//     web3 = new Web3(App.web3Provider);
//     return App.initContract();
//   },

//   initContract: function() {
//     $.getJSON('thuto.json', function(data) {
//       // Get the necessary contract artifact file and instantiate it with truffle-contract
//       var ThutoArtifact = data;
//       App.contracts.Thuto = TruffleContract(ThutoArtifact);
    
//       // Set the provider for our contract
//       App.contracts.Thuto.setProvider(App.web3Provider);
    
//       // Use our contract to retrieve and mark the adopted pets
//       return App.markAdopted();
//     });

//     return App.bindEvents();
//   },

//   bindEvents: function() {
//     $(document).on('click', '.btn-adopt', App.handleAdopt);
//   },

//   markAdopted: function(users, account) {
//     var thhutoInstance;

//     App.contracts.Thuto.deployed().then(function(instance) {
//       thutoInstance = instance;
    
//       return thutoInstance.getUsers.call();
//     }).then(function(adopters) {
//       for (i = 0; i < adopters.length; i++) {
//         if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
//           $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
//         }
//       }
//     }).catch(function(err) {
//       console.log(err.message);
//     });
//   },

//   handleAdopt: function(event) {
//     event.preventDefault();

//     var petId = parseInt($(event.target).data('id'));

//     /*
//      * Replace me...
//      */
//   }

// };

// $(function() {
//   $(window).load(function() {
//     App.init();
//   });
// });
