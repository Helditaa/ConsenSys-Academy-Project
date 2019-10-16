// Tests helpers
const {
    EVMRevert
} = require('./helpers/EVMRevert');
const {
    assertRevert
} = require('./helpers/assertRevert');
const {
    sendTransaction
} = require('./helpers/sendTransaction');
const advanceBlock = require("./helpers/advanceToBlock");
const {
    increaseTimeTo,
    duration
} = require('./helpers/increaseTime');
const latestTime = require("./helpers/latestTime");
const _ = require("lodash");
const BigNumber = web3.BigNumber;

// Libraries
require("chai")
    .use(require("chai-as-promised"))
    .use(require("chai-bignumber")(BigNumber))
    .should();

// Contracts
const Thuto = artifacts.require("./Thuto.sol");
const Erc20 = artifacts.require("./ERC20.sol");

contract("Thuto", (accounts) => {
    const registryOwner = accounts[0]
    const tokenOwner = accounts[1]
    const tutor = accounts[2]
    const student = accounts[3]
    const randomAddress = accounts[4]

    const exampleUserProfileURI = "zyxwvusrtjbgdfjbguvbdfiugvgf"
    const exampleSessionURI = "abcdeftusudgiusfdhiusbsudhus"

    const validSession = {
        session_uri: exampleSessionURI,
        isAuction: false,
        isRunning: true,
        sellPrice: 100
    }

    // Initialize session and bid counts
    let noSessions = 0;
    let noBids = 0;

    before(async function () {
        // Deploy an instance of the registry
        // Creates ERC20s to use in testing
        daiContract = await Erc20.new({
            from: tokenOwner
        });

        // Mints tokens in a modified ERC20 for the fund
        await daiContract.mint(student, 10000, {
            from: tokenOwner
        });

        let balance = await daiContract.balanceOf(student);
        // Checks that the balance of the fund is correct
        assert.equal(balance.toNumber(), 10000, "Balance not set");
        registry = await Thuto.new(daiContract.address, {
            from: registryOwner
        });

    });

    beforeEach(async function () {

    })
    // Tests correct registration of users
    context("Register User", function () {
        it("Can register a new user", async () => {
            await registry.registerUser(exampleUserProfileURI, {
                from: tutor
            })

            let userNumber = (await registry.userAddresses(tutor)).toNumber()
            assert(userNumber, 1, "Initial user number not set correctly")

            let addedUser = await registry.users(userNumber)
            assert(addedUser.owned_address, tutor, "tutor address not set")
            assert(addedUser.profile_uri, exampleUserProfileURI, "Profile URI not set")
        });
        it("Reverts if invalid user added", async () => {
            // Should fail if no user name added
            await assertRevert(registry.registerUser("", {
                from: tutor
            }), EVMRevert)

            // Then check reverts if same user tries to register
            await assertRevert(registry.registerUser(exampleUserProfileURI, {
                from: tutor
            }), EVMRevert)
        });
    })

    //Tests correct creation of sessions
    context("Create session", function () {
        it("Can correctly add new session", async () => {
            await registry.createSession(validSession.session_uri,
                validSession.isAuction,
                validSession.isRunning,
                validSession.sellPrice, {
                    from: tutor
                })
            noSessions += 1;
            let session = await registry.sessions(noSessions   - 1)

            assert(session.author_Id.toNumber(), 1, "Author Id not set")
            assert(session.session_uri, exampleSessionURI, "session URI not set")
            assert(session.isAuction == validSession.isAuction, "isAuction not set")
            assert(session.isRunning == validSession.isRunning, "isRunning not set")
            assert(session.sell_price.toNumber(), validSession.sellPrice, "sellPrice not set")

            let allsessionInfo = await registry.getSession(noSessions  - 1)
            // console.log("HERE")
            // console.log(allsessionInfo)

        });

        it("Reverts if bad user input", async () => {
            // Should revert if sale method is auction but a price is specified
            await assertRevert(registry.createSession(validSession.session_uri,
                true, validSession.isRunning, validSession.sellPrice, {
                    from: tutor
                }), EVMRevert)

            // Should revert if sale method is flat price but no price specified
            await assertRevert(registry.createSession(validSession.session_uri,
                validSession.isAuction, validSession.isRunning, 0, {
                    from: tutor
                }), EVMRevert)

            // Should revert if the uri is blank
            await assertRevert(registry.createSession("",
                validSession.isAuction, validSession.isRunning, validSession.sellPrice, {
                    from: tutor
                }), EVMRevert)

            // Should revert if user is unregistered
            await assertRevert(registry.createSession("",
                validSession.isAuction, validSession.isRunning, validSession.sellPrice, {
                    from: randomAddress
                }), EVMRevert)
        });
    })

    // Tests for correct bid allocation
    context("Make a bid", function () {
        it("Can correctly create a bid", async () => {
            // Register the student
            await registry.registerUser(exampleUserProfileURI, {
                from: student
            })

            // Register the session: session 2 (index 1)
            await registry.createSession(validSession.session_uri,
                true,
                validSession.isRunning,
                0, {
                    from: tutor
                })
            noSessions += 1;
            let session = await registry.sessions(noSessions   - 1)

            // Make the bid
            await registry.makeBid(100, noSessions - 1, {
                from: student
            })
            noBids += 1;
            let bid = await registry.bids(noBids - 1)

            assert(bid.offer.toNumber(), 100, "Bid price incorrect")
            assert(bid.status, "Pending", "Bid status incorrect")
            assert(bid.session_Id, noSessions  - 1, "session ID incorrect")
            assert(bid.owner_Id, noBids - 1, "student ID incorrect")

        });

        it("Can correctly make a sale", async () => {

            await registry.createSession(validSession.session_uri,
                validSession.isAuction,
                validSession.isRunning,
                validSession.sellPrice, {
                    from: tutor
                })
            // noSessions  = 3
            noSessions += 1;
            let session = await registry.sessions(noSessions   - 1)
            // Successfully mint a token
            let nftTokenBalance = await registry.balanceOf(student)

            // Increasing allowance
            await daiContract.approve(registry.address, 1000000, {
                from: student
            })

            let balanceBefore = await daiContract.balanceOf(student);
            // breaks on line below
            await registry.makeBid(100, 2, {
                from: student
            })

            let balanceAfter = await daiContract.balanceOf(student);
            assert(balanceAfter,balanceBefore-100,"ERC20 token balance not changed correctly")

            noBids += 1;
            let bid = await registry.bids(noBids - 1)

            // should now assert that status is sale
            assert(bid.offer.toNumber(), 100, "Bid price incorrect")
            assert(bid.status, "Sale", "Bid status incorrect")
            assert(bid.session_Id, noSessions  - 1, "session ID incorrect")
            assert(bid.owner_Id, 1, "student ID incorrect")
            let nftTokenBalance2 = await registry.balanceOf(student)
            assert(nftTokenBalance2, nftTokenBalance + 1, "NFT balance not correct")
        })

        it("Reverts if bad user input", async () => {
            // If bids with a non-running auction
            await registry.createSession(validSession.session_uri,
                true,
                false,
                0, {
                    from: tutor
                })
            noSessions += 1;
            let session = await registry.sessions(noSessions   - 1)

            await assertRevert(registry.makeBid(100, noSession - 1, {
                from: student
            }), EVMRevert)

            // If sends incorrect funds to flat-rate session
            await assertRevert(registry.makeBid(101, 0, {
                from: student
            }), EVMRevert)

            // If bidder is unregistered
            await assertRevert(registry.makeBid(100, 1, {
                from: randomAddress
            }), EVMRevert)

            // if session isn't listed
            // need to do this - see line 83 of Thuto.sol

        })
    })

    // Tests for correct implementation of bid acceptance/rejections or cancellation
    context("Accepting/rejecting/cancelling a bid", function () {
        it("Can accept a bid", async () => {
            // Allocation of token to student, if token balance is not adjusted then rejects
            let nftTokenBalance = await registry.balanceOf(student)
            await registry.acceptBid(0, {
                from: tutor
            })
            let bid = await registry.bids(0)
            assert(bid.status, "Accepted", "Bid status not changed")
            let nftTokenBalance2 = await registry.balanceOf(student)
            assert(nftTokenBalance2, nftTokenBalance + 1, "Token balance not set correctly")
        })

        it("Can reject a bid", async () => {
            await registry.createSession(validSession.session_uri,
                true,
                true,
                0, {
                    from: tutor
                })
            // Rejects bid if status is not changed
            noSessions += 1;
            let session = await registry.sessions(noSessions   - 1)
            await registry.makeBid(102, noSessions - 1, {
                from: student
            })
            noBids += 1;
            await registry.rejectBid(noBids - 1, {
                from: tutor
            })
            let bid = await registry.bids(noBids - 1)
            assert(bid.status, "Rejected", "Bid status not changed")
        })

        it("Can cancel a bid", async () => {
            await registry.createSession(validSession.session_uri,
                true,
                true,
                0, {
                    from: tutor
                })
            // Tests if user successfully cancels their bid status
            noSessions += 1;
            let session = await registry.sessions(noSessions   - 1)
            await registry.makeBid(103, noSessions - 1, {
                from: student
            })
            noBids += 1;
            await registry.cancelBid(noBids - 1, {
                from: tutor
            })
            let bid = await registry.bids(noBids - 1)
            assert(bid.status, "Cancelled", "Bid status not changed")
        })
    })

    // Tests if session status is correctly changed
    context("Changing a sessions status", function () {
        it("Can change from auction to sale", async () => {
            await registry.createSession(validSession.session_uri,
                true,
                true,
                0, {
                    from: tutor
                })
            noSessions += 1;
            // Should not go through if status is not changed and a flat price is not allocated
            await registry.changeToSale(noSessions - 1, 107, {
                from: tutor
            })
            let session = await registry.sessions(noSessions   - 1)
            assert(session.isAuction == false, "Auction status not changed")
            assert(session.sell_price.toNumber() == 107, "Price not changed")
        })

        // The correct user should change status
        it("Reverts if unauthorized user modifies auction", async () => {
            await assertRevert(registry.changeToAuction(noSessions - 1, {
                from: student
            }), EVMRevert)
        })

        // Should not allow a price different from 0 if auction is enabled
        it("Can change from sale to auction", async () => {
            await registry.changeToAuction(noSessions  - 1, {
                from: tutor
            })
            let session = await registry.sessions(noSessions   - 1)
            assert(session.isAuction == true, "Auction status not changed")
            assert(session.sell_price.toNumber() == 0, "Price not removed")
        })

        // Only authorized user can change this functionality
        it("Reverts if unauthorized user modifies sale", async () => {
            await assertRevert(registry.changeToSale(noSession - 1, 107, {
                from: student
            }), EVMRevert)
        })

        // Sell price should be changed and only the user can do so
        it("Correctly changes sell price", async () => {
            await registry.changeToSale(noSessions - 1, 109, {
                from: tutor
            })
            await registry.changeSellPrice(noSessions  - 1, 110, {
                from: tutor
            })
            let session = await registry.sessions(noSessions   - 1)
            assert(session.sell_price.toNumber(), 110, "Price not changed")
        })

        it("Reverts if unauthorized user modifies sell price", async () => {
            await assertRevert(registry.changeSellPrice(noSessions - 1, 109, {
                from: student
            }), EVMRevert)
        })

        // Running status should be changed and only by the user
        it("Changes running status", async () => {
            await registry.changeRunningStatus(noSessions  - 1, {
                from: tutor
            })
            let session = await registry.sessions(noSessions   - 1)
            assert(session.isRunning == false, "Status not changed")
        })

        it("Reverts if unauthorized user changes status", async () => {
            await assertRevert(registry.changeRunningStatus(noSessions - 1, {
                from: student
            }), EVMRevert)
        })
    })

    // Get the correct number of session arrays, number of bids, bids to the session  and total number of sessions
    context("'Getter' functions work correctly", function () {
        it("Gets sessions correctly", async () => {
            let sessionArray = await registry.getSessions(tutor)
            //Ensure that number of sessions is equal to total number of sessions
            assert(sessionArray.length == noSessions  , "Number of sessions not correct")
        })

        it("Gets bids correctly", async () => {
            let bidArray = await registry.getBids(student)

            assert(bidArray.length == noBids, "Number of bids not correct")
        })

        it("Gets session's bids correctly", async () => {
            let sessionBidArray = await registry.getSessionBids(1)

            let bid_Id = sessionBidArray[0].toNumber()

            bid = await registry.bids(bid_Id)
            assert(bid.offer.toNumber(), 100, "Bid price not correct")
            assert(bid.status, "Pending", "Bid status not correct")
            assert(bid.session_Id, 1, "session ID not correct")
            assert(bid.owner_Id, 3, "Bid owner ID not correct")

        })

        it("Gets number of sessions correctly", async () => {
            let sessionLength = await registry.getSessionLength()
            // Ensure that number of sessions is equal to total number of sessions
            assert(sessionLength.toNumber() == noSessions , "Number of sessions not correct")
        })

    })

})