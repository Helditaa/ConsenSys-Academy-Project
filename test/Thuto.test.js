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
    const exampleDetails = "timetimetime"

    const validSession = {
        session_uri: exampleSessionURI,
        isRunning: true,
        tutoring_price: 100,
        details: exampleDetails
    }

    // Initialize session and bid counts
    let noSessions = 0;
    let noRequests = 0;

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
            await registry.addSession(validSession.session_uri,
                validSession.isRunning,
                validSession.tutoring_price,
                validSession.details, {
                    from: tutor
                })
            noSessions += 1;
            let session = await registry.sessions(noSessions   - 1)

            assert(session.tutor_Id.toNumber(), 1, "Author Id not set")
            assert(session.session_uri, exampleSessionURI, "session URI not set")
            assert(session.session_requests == validSession.session_requests, "isAuction not set")
            assert(session.isRunning == validSession.isRunning, "isRunning not set")
            assert(session.tutoring_price.toNumber(), validSession.tutoring_price, "sellPrice not set")
            assert(session.details, validSession.details, "sellPrice not set")

            let allsessionInfo = await registry.getSession(noSessions  - 1)
            // console.log("HERE")
            // console.log(allsessionInfo)

        });

        it("Reverts if bad user input", async () => {
            // Should revert if sale method is auction but a price is specified
            await assertRevert(registry.addSession(validSession.session_uri,
                true, validSession.isRunning, validSession.tutoring_price, validSession.details, {
                    from: tutor
                }), EVMRevert)

            // Should revert if sale method is flat price but no price specified
            await assertRevert(registry.addSession(validSession.session_uri,
                validSession.isRunning, 0, validSession.details, {
                    from: tutor
                }), EVMRevert)

            // Should revert if the uri is blank
            await assertRevert(registry.addSession("",
                validSession.isRunning, validSession.tutoring_price, validSession.details, {
                    from: tutor
                }), EVMRevert)

            // Should revert if user is unregistered
            await assertRevert(registry.addSession("",
                validSession.isRunning, validSession.tutoring_price, validSession.details, {
                    from: randomAddress
                }), EVMRevert)
        });
    })

    // Tests for correct request
    context("Make a request", function () {
        it("Can correctly make a request", async () => {
            // Register the student
            await registry.registerUser(exampleUserProfileURI, {
                from: student
            })

            // Register the session: session 2 (index 1)
            await registry.addSession(validSession.session_uri,
                validSession.isRunning,
                0,
                validSession.details, {
                    from: tutor
                })
            noSessions += 1;
            let session = await registry.sessions(noSessions   - 1)

            // Make the request
            await registry.newSession(100, noSessions - 1, {
                from: student
            })
            noRequests += 1;
            let request = await registry.requests(noRequests - 1)

            assert(request.status, "Pending", "request status incorrect")
            assert(request.session_Id, noSessions  - 1, "session ID incorrect")
            assert(request.student_Id, noRequests - 1, "student ID incorrect")

        });

        // it("Can correctly make a sale", async () => {

        //     await registry.addSession(validSession.session_uri,
        //         validSession.isRunning,
        //         validSession.tutoring_price,
        //         validSession.details, {
        //             from: tutor
        //         })
        //     // noSessions  = 3
        //     noSessions += 1;
        //     let session = await registry.sessions(noSessions   - 1)
        //     // Successfully mint a token
        //     let nftTokenBalance = await registry.balanceOf(student)

        //     let balanceBefore = await daiContract.balanceOf(student);
        //     // breaks on line below
        //     await registry.requestSession(100, 2, {
        //         from: student
        //     })

        //     let balanceAfter = await daiContract.balanceOf(student);
        //     assert(balanceAfter,balanceBefore-100,"ERC20 token balance not changed correctly")

        //     noRequests += 1;
        //     let bid = await registry.bids(noRequests - 1)

        //     // should now assert that status is sale
        //     assert(bid.offer.toNumber(), 100, "Bid price incorrect")
        //     assert(bid.status, "Sale", "Bid status incorrect")
        //     assert(bid.session_Id, noSessions  - 1, "session ID incorrect")
        //     assert(bid.student_Id, 1, "student ID incorrect")
        //     let nftTokenBalance2 = await registry.balanceOf(student)
        //     assert(nftTokenBalance2, nftTokenBalance + 1, "NFT balance not correct")
        // })

        it("Reverts if bad user input", async () => {
            // If bids with a non-running auction
            await registry.addSession(validSession.session_uri,
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

    // Tests for correct implementation of request acceptance/rejections or cancellation
    context("Accepting/rejecting/cancelling a request", function () {
        it("Can accept a request", async () => {
            // Allocation of token to student, if token balance is not adjusted then rejects
            let nftTokenBalance = await registry.balanceOf(student)
            await registry.acceptRequest(0, validSession.details, {
                from: tutor
            })
            let bid = await registry.requests(0)
            assert(bid.status, "Accepted", "Bid status not changed")
            let nftTokenBalance2 = await registry.balanceOf(student)
            assert(nftTokenBalance2, nftTokenBalance + 1, "Token balance not set correctly")
        })

        it("Can reject a bid", async () => {
            await registry.addSession(validSession.session_uri,
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
            noRequests += 1;
            await registry.rejectBid(noRequests - 1, {
                from: tutor
            })
            let bid = await registry.bids(noRequests - 1)
            assert(bid.status, "Rejected", "Bid status not changed")
        })

        it("Can cancel a request", async () => {
            await registry.addSession(validSession.session_uri,
                true,
                0,
                validSession.details, {
                    from: tutor
                })
            // Tests if user successfully cancels their bid status
            noSessions += 1;
            let session = await registry.sessions(noSessions   - 1)
            await registry.addSession(103, noSessions - 1, {
                from: student
            })
            noRequests += 1;
            await registry.acceptRequest(noRequests - 1, validSession.details, {
                from: tutor
            })
            let request = await registry.requests(noRequests - 1)
            assert(request.status, "Cancelled", "Bid status not changed")
        })
    })

    // Tests if session status is correctly changed
    context("Changing a sessions status", function () {

        // Sell price should be changed and only the user can do so
        it("Correctly changes sell price", async () => {
            await registry.changeTutoringPrice(noSessions  - 1, 110, {
                from: tutor
            })
            let session = await registry.sessions(noSessions   - 1)
            assert(session.tutoring_price.toNumber(), 110, "Price not changed")
        })

        it("Reverts if unauthorized user modifies sell price", async () => {
            await assertRevert(registry.changeTutoringPrice(noSessions - 1, 109, {
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
            let requestArray = await registry.getRequests(student)

            assert(requestArray.length == noRequests, "Number of bids not correct")
        })

        it("Gets session's bids correctly", async () => {
            let sessionBidArray = await registry.getSessionBids(1)

            let request_Id = sessionBidArray[0].toNumber()

            request = await registry.requests(request_Id)
            assert(ewquest.status, "Pending", "ewquest status not correct")
            assert(ewquest.session_Id, 1, "session ID not correct")
            assert(ewquest.student_Id, 3, "Bid owner ID not correct")

        })

        it("Gets number of sessions correctly", async () => {
            let sessionLength = await registry.getSessionLength()
            // Ensure that number of sessions is equal to total number of sessions
            assert(sessionLength.toNumber() == noSessions , "Number of sessions not correct")
        })

    })

})