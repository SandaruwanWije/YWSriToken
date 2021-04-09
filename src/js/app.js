App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 0,

  init: function() {
    console.log("App initialized...")
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContracts();
  },

  initContracts: function() {
    $.getJSON("YWSriTokenSale.json", function(yWSriTokenSale) {
      App.contracts.YWSriTokenSale = TruffleContract(yWSriTokenSale);
      App.contracts.YWSriTokenSale.setProvider(App.web3Provider);
      App.contracts.YWSriTokenSale.deployed().then(function(yWSriTokenSale) {
        console.log("Dapp Token Sale Address:", yWSriTokenSale.address);
      });
    }).done(function() {
      $.getJSON("YWSriToken.json", function(yWSriToken) {
        App.contracts.YWSriToken = TruffleContract(yWSriToken);
        App.contracts.YWSriToken.setProvider(App.web3Provider);
        App.contracts.YWSriToken.deployed().then(function(yWSriToken) {
          console.log("Dapp Token Address:", yWSriToken.address);
        });

        App.listenForEvents();        
        window.ethereum.on('accountsChanged', function (accounts) {
          App.render()
        })
        return App.render();
      });
    })
  },

  listenForEvents: async function() {
    App.contracts.YWSriTokenSale.deployed().then(function(instance) {
      instance.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
      })
    })
  },

  render: async function() {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader  = $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();
    if(window.ethereum) {
      await ethereum.enable();
    }
    web3.eth.getAccounts((error,accounts) => {
      if (error) {
          console.log(error);
      } else {
        App.account = accounts[0];
        $('#accountAddress').html("Your Account: " + accounts[0]);

        App.contracts.YWSriTokenSale.deployed().then(function(instance) {
          yWSriTokenSaleInstance = instance;
          return yWSriTokenSaleInstance.tokenPrice();
        }).then(function(tokenPrice) {
          App.tokenPrice = tokenPrice;
          $('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
          return yWSriTokenSaleInstance.tokensSold();
        }).then(function(tokensSold) {
          App.tokensSold = tokensSold.toNumber();
          $('.tokens-sold').html(App.tokensSold);          
    
          var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
          $('#progress').css('width', progressPercent + '%');
    
          App.contracts.YWSriToken.deployed().then(function(instance) {
            yWSriTokenInstance = instance;
            return yWSriTokenInstance.balanceOf(App.account);
          }).then(function(balance) {
            $('.YWSriToken-balance').html(balance.toNumber());
            App.loading = false;
            loader.hide();
            content.show();
            return yWSriTokenInstance.balanceOf(yWSriTokenSaleInstance.address);
          }).then(function(tokensAvailable) {
            App.tokensAvailable = tokensAvailable.toNumber();
            $('.tokens-available').html(App.tokensAvailable);
          })
        });
      }
    });    
  },

  buyTokens: function() {
    $('#content').hide();
    $('#loader').show();
    var numberOfTokens = $('#numberOfTokens').val();
    App.contracts.YWSriTokenSale.deployed().then(function(instance) {
      return instance.buyTokens(numberOfTokens, {
        from: App.account,
        value: numberOfTokens * App.tokenPrice,
        gas: 500000 
      });
    }).then(function(result) {
      console.log("Tokens bought...")
      $('form').trigger('reset') 
    });
  }
}

$(function() {
  $(window).load(function() {
    App.init();
  })
});
