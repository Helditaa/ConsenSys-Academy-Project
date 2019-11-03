// Tests helpers
const {
    EVMRevert
} = require('./helpers/EVMRevert');
const {
    assertRevert
} = require('./helpers/assertRevert');
const BigNumber = web3.BigNumber;

// Contracts to be used
const Thuto = artifacts.require("./Thuto.sol");
const Erc20 = artifacts.require("./ERC20.sol");

// Libraries
require("chai") // assertion library
    .use(require("chai-as-promised"))
    .use(require("chai-bignumber")(BigNumber))
    .should();


contract("Thuto", (accounts) => {
    // Setting up different Address Accounts for testing
    const tokenOwner = accounts[0]
    const tutor = accounts[1]
    const student = accounts[2]
    const randomAddress = accounts[3]

    // Creating variables
    const exampleUserProfileURI = "itismeProfile"
    const exampleSessionURI = "SessionitisI"
    const exampleDetails = "timetimetime"

    // Setting up an instance of valid session
    const validSession = {
        session_uri: exampleSessionURI,
        isRunning: true,
        tutoring_price: 150,
        details: exampleDetails
    }

    // Initialize session and request counts
    let noSessions = 0;
    let noRequests = 0;

    before(async function () { 
        // Creates ERC20s to use in testing
        daiContract = await Erc20.new({
            from: tokenOwner
        });

        // Mints tokens in a modified ERC20 for the fund
        await daiContract.mint(student, 10000, {
            from: tokenOwner
        });
        // Deploy an instance of the registry
        registry = await Thuto.new(daiContract.address, {
            from: tutor
        });

    });

    beforeEach(async function () {
    })
    // Tests correct registration of users. Valid user credentials need to be provided.
    context("Register User", function () {
        it("Can register a new user", async () => {
            // Call out registerUser function
            await registry.registerUser(exampleUserProfileURI, {
                from: tutor
            })

            // Get user Id
            let userID = (await registry.userAddresses(tutor)).toNumber()
            assert(userID, 1, "Initial user number not set correctly")

            // Initialize new user
            let newUser = await registry.users(userID)
            assert(newUser.owned_address, tutor, "tutor address not set")
            assert(newUser.profile_uri, exampleUserProfileURI, "Profile URI not set")
        });

        it("Reverts if invalid user added", async () => {
            // Should fail if no user name added
            await assertRevert(registry.registerUser("", {
                from: tutor
            }), EVMRevert)

            // Then check reverts if same user tries to register again
            await assertRevert(registry.registerUser(exampleUserProfileURI, {
                from: tutor
            }), EVMRevert)
        });
    })

    //Tests if tutor can add sessiion correctly. Test ensures that only registered users can add a session, and that session should have the necessary minimum information
    context("Add session", function () {
        it("Can correctly add new session", async () => {
            // Add a session to use in testing
            await registry.addSession(validSession.session_uri,
                validSession.isRunning,
                validSession.tutoring_price,
                validSession.details, {
                    from: tutor
                })
            
            // Increase number of sessions by 1
            noSessions += 1;

            let session = await registry.sessions(noSessions   - 1)

            // Ensure that the following give the correct outcome
            assert(session.tutor_Id.toNumber(), 1, "Author Id not set")
            assert(session.session_uri, exampleSessionURI, "session URI not set")
            assert(session.isRunning == validSession.isRunning, "isRunning for session not set")
            assert(session.tutoring_price.toNumber(), validSession.tutoring_price, "Tutoring price not set")
            assert(session.details, validSession.details, "No details of session specified")

        });

        it("Reverts if bad user input", async () => {
            // Should revert if no tutoring price is specified
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

    // Tests for correct request being made by students for a session provided by the tutor. Only registered users can do so.
    context("Make a request", function () {
        it("Can correctly make a request", async () => {
            // Register the student
            await registry.registerUser(exampleUserProfileURI, {
                from: student
            })

            // Register the session: session 2 (index 1)
            await registry.addSession(validSession.session_uri,
                validSession.isRunning,
                validSession.tutoring_price,
                validSession.details, {
                    from: tutor
                })

            // Increment number of sessions
            noSessions += 1;

            let session = await registry.sessions(noSessions - 1)

            // Make the request
            await registry.requestSession(noSessions - 1, validSession.details, {
                from: student
            })

            noRequests += 1;
            let request = await registry.requests(noRequests - 1)

            assert(request.status, "Pending", "request status incorrect")
            assert(request.session_Id, noSessions  - 1, "session ID incorrect")
            assert(request.student_Id, noRequests - 1, "student ID incorrect")

        });

        it("Reverts if bad user input", async () => {
            // If requests with a non-running session
            await registry.addSession(validSession.session_uri,
                false,
                validSession.tutoring_price,
                validSession.details, {
                    from: tutor
                })
            noSessions += 1;       

            await assertRevert(registry.requestSession( noSessions -1, validSession.details, {
                from: student
            }), EVMRevert)

            // If student is unregistered
            await assertRevert(registry.requestSession( noRequests, validSession.details, {
                from: randomAddress
            }), EVMRevert)

        })
    })

    // Tests for correct implementation of request acceptance/rejections or cancellation sessions. Only students can cancel, only tutors can accept and reject requests.
    context("Accepting/rejecting/cancelling a request", function () {
        it("Can accept a request", async () => {
            await registry.addSession(validSession.session_uri,
                true,
                validSession.tutoring_price,
                validSession.details, {
                    from: tutor
                })
            noSessions += 1;
            
            // Allocation of token to student, if token balance is not adjusted then rejects
            let nftTokenBalance = await registry.balanceOf(student)
            await registry.acceptRequest(0, {
                from: tutor
            })
            let request = await registry.requests(0)
            assert(request.status, "Accepted", "Request status not changed")
            let nftTokenBalanceNew = await registry.balanceOf(student)
            assert(nftTokenBalanceNew, nftTokenBalance + 1, "Token balance not set correctly")

        })

        it("Can reject a request", async () => {
            await registry.addSession(validSession.session_uri,
                true,
                validSession.tutoring_price,
                validSession.details, {
                    from: tutor
                })
            // Rejects request if status is not changed
            noSessions += 1;
            let session = await registry.sessions(noSessions   - 1)
            await registry.requestSession( noSessions - 1, validSession.details, {
                from: student
            })

            noRequests += 1;
            
            await registry.rejectRequest(noRequests - 1, {
                from: tutor
            })
            let request = await registry.requests(noRequests - 1)
            assert(request.status, "Rejected", "Request status not changed")
            
        })

        it("Can cancel a request", async () => {
            await registry.addSession(validSession.session_uri,
                true,
                validSession.tutoring_price,
                validSession.details, {
                    from: tutor
                })
            // Tests if student successfully cancels their request status
            noSessions += 1;
            let session = await registry.sessions(noSessions   - 1)
            await registry.requestSession( noSessions - 1, validSession.details, {
                from: student
            })
            noRequests += 1;
            await registry.cancelRequest(noRequests - 1, {
                from: student
            })
            let request = await registry.requests(noRequests - 1)
            assert(request.status, "Cancelled", "Bid status not changed")
        })
    })

    // Tests if session status is correctly changed if tutor chooses to change tutoring price, or stop running the session
    context("Changing a sessions status", function () {

        // Tutoring price should be changed and only the tutor can do so
        it("Correctly changes tutoring price", async () => {
            await registry.changeTutoringPrice(noSessions  - 1, 200, {
                from: tutor
            })
            let session = await registry.sessions(noSessions   - 1)
            assert(session.tutoring_price.toNumber(), 200, "Price not changed")
        })

        it("Reverts if unauthorized user modifies tutoring price", async () => {
            await assertRevert(registry.changeTutoringPrice(noSessions - 1, 109, {
                from: randomAddress
            }), EVMRevert)
        })

        // Running status should be changed and only by the tutor
        it("Changes running status", async () => {
            await registry.changeRunningStatus(noSessions  - 1, {
                from: tutor
            })
            let session = await registry.sessions(noSessions   - 1)
            assert(session.isRunning == false, "Status not changed")
        })

        it("Reverts if unauthorized user changes status", async () => {
            await assertRevert(registry.changeRunningStatus(noSessions - 1, {
                from: randomAddress
            }), EVMRevert)
        })
    })

    // Get the correct number of session arrays, number of requests, requests to the session  and total number of sessions
    context("'Getter' functions work correctly", function () {
        it("Gets sessions correctly", async () => {
            let sessionArray = await registry.getSessions(tutor)
            //Ensure that number of sessions is equal to total number of sessions
            assert(sessionArray.length == noSessions  , "Number of sessions not correct")
        })

        it("Gets requests correctly", async () => {
            let requestArray = await registry.getRequests(student)
            console.log(noRequests)
            assert(requestArray.length == noRequests + 1, "Number of requests not correct")
        })

        it("Gets number of sessions correctly", async () => {
            let sessionLength = await registry.getSessionLength()
            // Ensure that number of sessions is equal to total number of sessions
            assert(sessionLength.toNumber() == noSessions , "Number of sessions not correct")
        })

    })

})