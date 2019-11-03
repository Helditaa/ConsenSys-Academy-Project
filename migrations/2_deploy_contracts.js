var Thuto = artifacts.require("Thuto");

module.exports = function (deployer) {
    // Deploy the UniCoin Registry contract
    deployer.deploy(Thuto, '0x5A5dFbb5D3d3350Cc2c8332aaBaf272Ae60808b8');
};