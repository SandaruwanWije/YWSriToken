var YWSriToken = artifacts.require("./YWSriToken.sol");
var YWSriTokenSale = artifacts.require("./YWSriTokenSale.sol");

module.exports = function(deployer) {
  deployer.deploy(YWSriToken, 1000000).then(function() {
    // Token price is 0.001 Ether
    var tokenPrice = 1000000000000000;
    return deployer.deploy(YWSriTokenSale, YWSriToken.address, tokenPrice);
  });
};
