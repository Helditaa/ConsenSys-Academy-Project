pragma solidity^0.5.0;


/// @title thuto smart contract
/// @author Helda Mandlate

/// @dev import contracts from openzeppelin related to ownable and ERC20, ERC721 tokens
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol";

// import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/ownership/Ownable.sol";
// import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
// import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol";

/// @notice contract begins here
contract thuto is ERC721Metadata {
    /// @notice Creates a struct for users of the plaform, needs their Ethereum address and profile URL
    struct User {
        address owned_address;
        string profile_uri;
    }
    /// @notice Creates an array of users that a registered
    User[] public users;

    /// @notice The mapping below maps all users' addresses to their userID
    mapping (address => uint256) public userAddresses ;

    /// @notice Creates user defined type
    enum bidStatus {Pending, Accepted, Rejected, Sale, Cancelled}

    /// @notice Creates a struct for all bids, takes in the offer (amount of the bid), one of the enum parameters, session Id and owner Id
    struct Bid {
        uint256 offer;
        bidStatus status;
        uint256 session_Id;
        uint256 owner_Id; /// @dev owner of the bid
    }
    /// @notice Creates an array of bids that have been placed
    Bid[] public bids;

    /// @notice The mapping below maps all bidders' IDs to their userID
    mapping(uint256 => uint256[]) public bidOwners;

    /// @notice Creates a struct for all sessions
    /// @param tutor_Id The array below will contain all bids received for that session
    /// @param session_uri If the tutor has chosen the auction pricing structure, the below is TRUE
    /// @param session_bids If the auction is still running, the below is TRUE, because the tutor can choose to stop the auction at any point
    /// @param isAuction If both of the booleans above are FALSE, the price below is the flat tutoring rate
    /// @param isRunning If both of the booleans above are FALSE, the price below is the flat tutoring rate
    /// @param tutoring_price The value of the tutoring session
    struct Session {
        uint256 tutor_Id;
        string session_uri;
        uint256[] session_bids;
        bool isAuction;
        bool isRunning;
        uint256 tutoring_price;
    }
    /// @notice Creates an array of sessions for every tutoring session available
    Session[] public sessions;

    /// @notice The mapping below will map the addresses of all the successful bidders' addresses to the ID of their owned tutors, session owners
    mapping(uint256 => uint256[]) public sessionOwners;

    /// @notice Creates a struct for licencing
    /// @param student_Id of each tutoring session buyer
    /// @param session_Id of the tutoring session being payed for
    /// @param bid_Id The bid's Id for the session
    struct LicenceDesign {
        uint256 student_Id;
        uint256 session_Id;
        uint256 bid_Id;
    }
    /// @notice Creates an array of purchased licences
    LicenceDesign[] public licences;
    /// @notice Mapping of licence Id to get the licence owners
    mapping(uint256 => uint256[]) public licenceOwners;
    /// @notice Mapping of licence Id to get the session Id
    mapping(uint256 => uint256[]) public sessionLicences;

    event NewSession(
        address indexed _from,
        string _session_uri,
        bool _isAuction,
        uint256 _tutoring_price
    );

    event NewBid(
        address indexed _from,
        uint256 indexed _session_Id,
        uint256 _offer
    );

    event AcceptedBid(
        address indexed _from,
        uint256 _id
    );

    event RejectedBid(
        address indexed _from,
        uint256 _id
    );

    event CancelledBid(
        address indexed _from,
        uint256 _id
    );

    event ChangeToSale(
        address indexed _from,
        uint256 indexed _session_Id,
        uint256 _tutoring_price
    );

    event ChangeToAuction(
        address indexed _from,
        uint256 indexed _session_Id
    );

    event ChangeSellPrice(
        address indexed _from,
        uint256 indexed _session_Id,
        uint256 _tutoring_price
    );

    event ChangeRunningStatus(
        address indexed _from,
        uint256 indexed _session_Id,
        bool _isRunning
    );

    /// @dev ERC20 is now daiContract
    ERC20 daiContract;
    /// @dev The constructor below reserves user 0 for all unregistered users
    /// @param _daiContractAddress DAI contract address
    constructor(address _daiContractAddress) public ERC721Metadata("UniCoin Licence", "UNIC"){
        users.push(User(address(0), ""));
        licences.push(LicenceDesign(0, 0, 0));
        daiContract = ERC20(_daiContractAddress);
    }

    /// @notice This function registers a user on the platform by taking in their profile URL
    /// @param _profile_uri user profile url
    /// @dev If the user's address is in position 0 of the userAddresses array, they are unregistered
    /// @dev Create an instance of the user and add the Id to their address
    function registerUser(string memory _profile_uri) public {
        require(bytes(_profile_uri).length > 0, "Profile URI should not be empty.");
        require(userAddresses[msg.sender]==0,"User already registered.");
        uint256 id = users.push(User(msg.sender,_profile_uri));
        userAddresses[msg.sender] = id - 1;
    }

    /// @notice This function creates a session on the system, with blank arrays for session bids and owners
    /// @notice since no one has bidded for or bought a licence yet
    /// @dev The tutor only specifies the flat rate if they have chosen not to auction the work
    /// @dev Add instance to the respective arrays

    function addSession(
        string memory _session_uri,
        bool _isAuction,
        bool _isRunning,
        uint256 _tutoring_price) public {
        require(bytes(_session_uri).length > 0, "Session URI should not be empty.");
        require(userAddresses[msg.sender] != 0, "User address is not registered.");
        if(_isAuction) {
            require(_tutoring_price == 0, "Should not specify sell price for auction.");
        }
        else {
            require(_tutoring_price > 0, "Sell price not specified.");
        }
        uint256 _tutor_Id = userAddresses[msg.sender];
        uint256[] memory _session_bids;
        Session memory _session = Session(
            _tutor_Id,
            _session_uri,
            _session_bids,
            _isAuction,
            _isRunning,
            _tutoring_price);
        uint256 _id = sessions.push(_session);
        sessionOwners[_tutor_Id].push(_id - 1);

        emit NewSession(msg.sender,_session_uri, _isAuction, _tutoring_price);
    }

    /// @notice This function creates a new bid for a particular session
    /// @param _offer for the session
    /// @param _session_Id is the index for the session Id
    /// @dev The bidder should only be able to submit a bid if the session's pricing structure is an auction and the auction is running
    /// @dev By default the bid will have a status of Pending until it is accepted or rejected by the author
    /// @dev If the author has specified a flat rate, the student doesn't submit a bid but just sends the funds
    /// @dev The funds sent should match the sale price specified by the author
    /// @dev This 'bid' has a status of sale because the author does not need to evaluate and accept/reject these bids
    /// @dev Transfer Dai from student to tutor
    /// @dev parameters of licence design: student_Id, session id, bid_id
    function makeBid(uint256 _offer, uint256 _session_Id) public {
        require(sessions[_session_Id].tutor_Id != 0, "Session not enlisted.");
        require(userAddresses[msg.sender] != 0, "Bidder address is not registered.");
        if(sessions[_session_Id].isAuction) {
            require(sessions[_session_Id].isRunning, "Auction is not running.");
            uint256 _id = bids.push(Bid(_offer, bidStatus.Pending, _session_Id, userAddresses[msg.sender]));
            sessions[_session_Id].session_bids.push(_id - 1);
            bidOwners[userAddresses[msg.sender]].push(_id - 1);

            emit NewBid(msg.sender, _session_Id, _offer);
        }
        if(!sessions[_session_Id].isAuction) {
            require(_offer == sessions[_session_Id].tutoring_price, "Incorrect funds sent.");
            uint256 _id = bids.push(Bid(_offer, bidStatus.Sale, _session_Id, userAddresses[msg.sender])) - 1;
            sessions[_session_Id].session_bids.push(_id);
            bidOwners[userAddresses[msg.sender]].push(_id);

            require(daiContract.allowance(msg.sender, address(this)) >= _offer, "Insufficient fund allowance");
            address tutorAddress = users[sessions[_session_Id].tutor_Id].owned_address;
            require(daiContract.transferFrom(msg.sender, tutorAddress, _offer), "dai Transfer failed");

            uint256 _licence_Id = licences.push(LicenceDesign(bids[_id].owner_Id, _session_Id, _id));
            licenceOwners[bids[_id].owner_Id].push(_licence_Id);
            sessionLicences[_session_Id].push(_licence_Id);
            _mint(users[bids[_id].owner_Id].owned_address, _licence_Id);

            emit NewBid(msg.sender, _session_Id, _offer);
        }
    }

    /// @notice This function allows the tutor to accept the bids
    /// @dev parameters of licence design: student_Id, session id, bid_id
    /// @notice This function allows the tutor to reject the bids
    /// @param _id is the bid Id
    function acceptBid(uint256 _id) public {
        uint256 _session_Id = bids[_id].session_Id;
        require(userAddresses[msg.sender] == sessions[_session_Id].tutor_Id, "User not the tutor of this session");
        require(sessions[_session_Id].isAuction, "Session not an auction");
        require(sessions[_session_Id].isRunning, "Auction is not running");
        bids[_id].status = bidStatus.Accepted;

        uint256 _licence_Id = licences.push(LicenceDesign(bids[_id].owner_Id, _session_Id, _id));
        licenceOwners[bids[_id].owner_Id].push(_licence_Id);
        sessionLicences[_session_Id].push(_licence_Id);
        _mint(users[bids[_id].owner_Id].owned_address, _licence_Id);

        emit AcceptedBid(msg.sender,_id);
    }

    /// @notice This function allows the tutor to reject the bids
    /// @param _id is the bid Id
    function rejectBid(uint256 _id) public {
        uint256 _session_Id = bids[_id].session_Id;
        require(userAddresses[msg.sender] == sessions[_session_Id].tutor_Id, "User not the tutor of this session");
        require(sessions[_session_Id].isAuction, "Session not an auction");
        require(sessions[_session_Id].isRunning, "Auction not running");
        bids[_id].status = bidStatus.Rejected;

        emit RejectedBid(msg.sender,_id);
    }

    /// @notice This function allows the tutor to cancel the bids
    /// @param _id is the bid Id
    function cancelBid(uint256 _id) public {
        uint256 _session_Id = bids[_id].session_Id;
        require(userAddresses[msg.sender] == sessions[_session_Id].tutor_Id, "User not the tutor of this session");
        // || userAddresses[msg.sender] == bids[_id].owner_Id, "User not the tutor of this session");
        require(sessions[_session_Id].isAuction, "Session not an auction");
        require(sessions[_session_Id].isRunning, "Auction not running");
        bids[_id].status = bidStatus.Cancelled;

        emit CancelledBid(msg.sender,_id);
    }

    /// @notice This function allows the tutor to change from an auction to a sale
    /// @param _session_Id session id number
    /// @param _tutoring_price for the session
    function changeToSale(uint256 _session_Id, uint256 _tutoring_price) public {
        require(userAddresses[msg.sender] == sessions[_session_Id].tutor_Id, "User not the tutor of this session");
        require(sessions[_session_Id].isAuction, "Session not an auction");
        sessions[_session_Id].tutoring_price = _tutoring_price;
        sessions[_session_Id].isAuction = false;

        emit ChangeToSale(msg.sender, _session_Id, _tutoring_price);
    }

    /// @notice This function allows the tutor to change from a sale to an auction
    /// @param _session_Id session id number
    function changeToAuction(uint256 _session_Id) public {
        require(userAddresses[msg.sender] == sessions[_session_Id].tutor_Id, "User not the tutor of this session");
        require(!sessions[_session_Id].isAuction, "Session is already on auction");
        sessions[_session_Id].tutoring_price = 0;
        sessions[_session_Id].isAuction = true;

        emit ChangeToAuction(msg.sender, _session_Id);
    }

    /// @notice This function allows the tutor to change the sell price
    /// @param _session_Id session id number
    /// @param _tutoring_price for the session
    function changeSellPrice(uint256 _session_Id, uint256 _tutoring_price) public {
        require(userAddresses[msg.sender] == sessions[_session_Id].tutor_Id, "User not the tutor of this session");
        require(!sessions[_session_Id].isAuction, "Session is on auction.");
        sessions[_session_Id].tutoring_price = _tutoring_price;

        emit ChangeSellPrice(msg.sender, _session_Id, _tutoring_price);

    }

    /// @notice This function allows the tutor to change the running status
    /// @param _session_Id session id number
    function changeRunningStatus(uint256 _session_Id) public {
        require(userAddresses[msg.sender] == sessions[_session_Id].tutor_Id, "User not the tutor of this session");
        sessions[_session_Id].isRunning = !sessions[_session_Id].isRunning;

        emit ChangeRunningStatus(msg.sender, _session_Id, sessions[_session_Id].isRunning);
    }

    /// @return This function allows anyone to get the list of sessions based on the address of the tutor
    /// @param _address eth address for the user
    function getSessions(address _address) public view returns(uint256[] memory) {
        uint256 _tutor_Id = userAddresses[_address];
        return sessionOwners[_tutor_Id];
    }

    /// @return This function allows anyone to get the list of bids based on address of the user
    function getBids(address _address) public view returns(uint256[] memory) {
        uint256 _userAddress = userAddresses[_address];
        return bidOwners[_userAddress];
    }

    /// @return This function allows anyone to get list of bids per session
    /// @param _session_Id session id number
    function getSessionBids(uint256 _session_Id) public view returns(uint256[] memory) {
        return sessions[_session_Id].session_bids;
    }

    /// @return This function allows the return of the total number of sessions
    function getSessionLength() public view returns(uint count) {
        return sessions.length;
    }

    /// @return Returns information about a spesific session ID
    /// @param _session_Id session id number
    function getSession(uint256 _session_Id) public view returns(
        uint256,
        string memory,
        uint256[] memory,
        bool,
        bool,
        uint256){
        Session memory _session = sessions[_session_Id];
        return (
        _session.tutor_Id,
        _session.session_uri,
        _session.session_bids,
        _session.isAuction,
        _session.isRunning,
        _session.tutoring_price);
    }

    /// @return get the licences per owner
    /// @param _address of the account holder
    function getLicenceForAddress(address _address) public view returns(uint256[] memory) {
        uint256 _userNumber = userAddresses[_address];
        return licenceOwners[_userNumber];
    }

    function getLicence(uint256 _licenceId) public view returns(uint256, uint256, uint256){
        LicenceDesign memory _licence = licences[_licenceId];
        return (
        _licence.student_Id,
        _licence.session_Id,
        _licence.bid_Id);
    }
}