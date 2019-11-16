var Thuto = artifacts.require("Thuto");

module.exports = function (deployer) {
    // Deploy the UniCoin Registry contract
    deployer.deploy(Thuto, '0xdde63ac8B515dDbc40f13C9232Fa4A7a8E6A7891');
};