# Thuto Design Pattern Decisions

The following document outlines the design of the Thuto, students meet tutors platform. Smart contract broken down, the overall design.

## High Level Design

Thuto has the components outlined below, that build out the full stack:
1) Ethereum Smart Contracts for issuing NFT licences for every student who has had a tutoring session
2) IPFS for account management
3) DApp front end and landing page for tutors and students

These components come together to build out the full application. The DEMO can be found on this link:

## Link

## Smart Contract Design
The smart contract allows users to create an account to have full experience. The process of registration is important to collect the user's data from their given email addresses, and their institutions. All details for a user account are stored on IPFS. Each user account is given a unique user number which identifies their account. The only information stored on chain is an array of users and their associated IPFS 'profile_url'.

### Users struct
```
    /// @notice Creates a struct for users of the plaform, needs their Ethereum address and profile URL
    struct User {
        address owned_address;
        string profile_uri;
    }
    /// @notice Creates an array of users that are registered
    User[] public users;

    /// @notice The mapping below maps all users' addresses to their userID
    mapping (address => uint256) public userAddresses ;
    
```
### Requests struct

Requests are stored and processed within the smart contract. A student can make a request to have a tutoring session  and the tutor can choose whether to accept or reject the request. All payments happen in person, during the tutoring session.

```
    /// @notice Creates a struct for all requests for tutoring, one of the enum parameters, session Id and student Id
    struct Request {
        sessionStatus status;
        uint256 session_Id;
        uint256 student_Id;
    }
    /// @notice Creates an array of requests that have been placed
    Request[] public requests;

    /// @notice The mapping below maps all requesters' IDs to their studentId
    mapping(uint256 => uint256[]) public requestOwners;
 ```

### Session struct

All relevant information about the added sessions by the tutors are collected within the smart contract. Different session details are stored, can be running or not, and the tutoring price can be changed.

```
    /**
    @notice Creates a struct for all sessions
    @param tutor_Id The Id of tutors
    @param session_uri session URL
    @param session_requests session requests
    @param isRunning status of the session, True if session is currently running, false if otherwise
    @param tutoring_price The value of the tutoring session
    */
    struct Session {
        uint256 tutor_Id;
        string session_uri;
        uint256[] session_requests;
        bool isRunning;
        uint256 tutoring_price;
        string details;
    }
    /// @notice Creates an array of sessions for every tutoring session available
    Session[] public sessions;

    /// @notice The mapping below will map the addresses of all the successful student addresses to the ID of their owned users, session owners
    mapping(uint256 => uint256[]) public sessionOwners;
    
```

### Non-Fungible Tokens Licences

Each successful tutoring session is represented by the use of NFTs, making each session cryptographically unique. The NFT associates key information about that licences with the owner. For example, the tutoring price, details and unique licence fingerprint.  Using NFT's enables us to leverage existing standards such as Zeppelin Solidity which decreases the surface area of vulnerabilities within our application. Additionally NTFs enable transferability and interoperability with other platforms.

Note that when a licence NFT is created it is associated with exactly one tutor and one student. The tutor gives explicit consent for the student to get a tutoring session.

## Front-End Technology Stack

The front end application is built using React-native, material UI and web3.js.

## Hosting and DevOps

Both the Front end and API are hosted on Zeit.co. CI is done through their built in CI solution. Cloudflare is used for DNS and CDN.
