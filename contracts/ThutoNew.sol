pragma solidity^0.5.0;


/// @title Thuto smart contract
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
    /// @notice Creates a struct for tutors of the plaform, needs their Ethereum address and profile URL
    struct User {
        address owned_address;
        string profile_uri;
    }
    /// @notice Creates an array of tutors that a registered
    Tutor[] public tutors;

    /// @notice The mapping below maps all tutors' addresses to their tutorID
    mapping (address => uint256) public tutorAddresses ;

    /// @notice Creates tutor defined type
    enum sessionStatus {Pending, Accepted, Rejected, Sale, Cancelled}

    /// @notice Creates a struct for all bids, takes in the offer (amount of the bid), one of the enum parameters, session Id and owner Id
    struct Request {
        uint256 offer;
        sessionStatus status;
        uint256 session_Id;
        uint256 owner_Id; /// @dev owner of the bid
    }
    /// @notice Creates an array of bids that have been placed
    Request[] public requests;

    /// @notice The mapping below maps all requesters' IDs to their tutorID
    mapping(uint256 => uint256[]) public requestOwners;

    /// @notice Creates a struct for all sessions
    /// @param tutor_Id The array below will contain all bids received for that session
    /// @param session_uri If the tutor has chosen the auction pricing structure, the below is TRUE
    /// @param session_requests If the auction is still running, the below is TRUE, because the tutor can choose to stop the auction at any point
    /// @param isRunning If both of the booleans above are FALSE, the price below is the flat tutoring rate
    /// @param tutoring_price The value of the tutoring session
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

    /// @notice The mapping below will map the addresses of all the successful bidders' addresses to the ID of their owned tutors, session owners
    mapping(uint256 => uint256[]) public sessionOwners;

    /// @notice Creates a struct for licencing
    /// @param student_Id of each tutoring session buyer
    /// @param session_Id of the tutoring session being payed for
    /// @param request_Id The bid's Id for the session
    struct LicenceDesign {
        uint256 student_Id;
        uint256 session_Id;
        uint256 request_Id;
    }
    /// @notice Creates an array of purchased licences
    LicenceDesign[] public licences;
    /// @notice Mapping of licence Id to get the licence owners
    mapping(uint256 => uint256[]) public licenceOwners;
    /// @notice Mapping of licence Id to get the session Id
    mapping(uint256 => uint256[]) public sessionLicences;

    event newSession(
        address indexed _from,
        string _session_uri,
        uint256 _tutoring_price
    );

    event newRequest(
        address indexed _from,
        uint256 indexed _session_Id,
        uint256 _details
    );

    event acceptedRequest(
        address indexed _from,
        uint256 _id
    );

    event rejectedRequest(
        address indexed _from,
        uint256 _id
    );

    event cancelledRequest(
        address indexed _from,
        uint256 _id
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
    /// @dev The constructor below reserves tutor 0 for all unregistered tutors
    /// @param _daiContractAddress DAI contract address
    constructor(address _daiContractAddress) public ERC721Metadata("UniCoin Licence", "UNIC"){
        tutors.push(Tutor(address(0), ""));
        licences.push(LicenceDesign(0, 0, 0));
        daiContract = ERC20(_daiContractAddress);
    }

    /// @notice This function registers a tutor on the platform by taking in their profile URL
    /// @param _profile_uri tutor profile url
    /// @dev If the tutor's address is in position 0 of the tutorAddresses array, they are unregistered
    /// @dev Create an instance of the tutor and add the Id to their address
    function registerTutor(string memory _profile_uri) public {
        require(bytes(_profile_uri).length > 0, "Profile URI should not be empty.");
        require(tutorAddresses[msg.sender]==0,"Tutor already registered.");
        uint256 id = tutors.push(Tutor(msg.sender,_profile_uri));
        tutorAddresses[msg.sender] = id - 1;
    }

    /// @notice This function creates a session on the system, with blank arrays for session requests and owners
    /// @notice since no one has requested a session for or bought a licence yet
    /// @dev The tutor only specifies the flat rate
    /// @dev Add instance to the respective arrays

    function addSession(
        string memory _session_uri,
        bool _isRunning,
        uint256 _tutoring_price, string _details) public {
        require(bytes(_session_uri).length > 0, "Session URI should not be empty.");
        require(tutorAddresses[msg.sender] != 0, "Tutor address is not registered.");
        require(_tutoring_price > 0, "Sell price not specified.");

        uint256 _tutor_Id = tutorAddresses[msg.sender];
        uint256[] memory _session_requests;
        Session memory _session = Session(
            _tutor_Id,
            _session_uri,
            _session_requests,
            _isRunning,
            _tutoring_price,
            _details);
        uint256 _id = sessions.push(_session);
        sessionOwners[_tutor_Id].push(_id - 1);

        emit newSession(msg.sender,_session_uri, _tutoring_price, _details);
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
    /// @dev parameters of licence design: student_Id, session id, request_Id
    function requestSession(uint256 _session_Id, string _details) public {
        require(sessions[_session_Id].tutor_Id != 0, "Session not enlisted.");
        require(tutorAddresses[msg.sender] != 0, "Student address is not registered.");

        uint256 _licence_Id = licences.push(LicenceDesign( [_id].owner_Id, _session_Id, _id));
        licenceOwners[Reques[_id].owner_Id].push(_licence_Id);
        sessionLicences[_session_Id].push(_licence_Id);
        _mint(tutors[bids[_id].owner_Id].owned_address, _licence_Id);

        emit newRequest(msg.sender, _session_Id, _details);
        }
    }

    /// @notice This function allows the tutor to accept the bids
    /// @dev parameters of licence design: student_Id, session id, request_Id
    /// @notice This function allows the tutor to reject the bids
    /// @param _id is the bid Id
    function acceptRequest(uint256 _id) public {
        uint256 _session_Id = Requests[_id].session_Id;
        require(tutorAddresses[msg.sender] == sessions[_session_Id].tutor_Id, "User not the tutor of this session");
        require(sessions[_session_Id].isRunning, "Session is not running");
        Requests[_id].status = sessionStatus.Accepted;

        uint256 _licence_Id = licences.push(LicenceDesign(Requests[_id].owner_Id, _session_Id, _id));
        licenceOwners[bids[_id].owner_Id].push(_licence_Id);
        sessionLicences[_session_Id].push(_licence_Id);
        _mint(tutors[Requests[_id].owner_Id].owned_address, _licence_Id);

        emit acceptedRequest(msg.sender,_id);
    }

    /// @notice This function allows the tutor to reject the bids
    /// @param _id is the Request Id
    function rejectRequest(uint256 _id) public {
        uint256 _session_Id = requests[_id].session_Id;
        require(tutorAddresses[msg.sender] == sessions[_session_Id].tutor_Id, "User not the tutor of this session");
        require(sessions[_session_Id].isRunning, "Session not running");
        requests[_id].status = sessionStatus.Rejected;

        emit rejectedRequest(msg.sender,_id);
    }

    /// @notice This function allows the tutor to cancel the bids
    /// @param _id is the bid Id
    function cancelRequest(uint256 _id) public {
        uint256 _session_Id = requests[_id].session_Id;
        require(tutorAddresses[msg.sender] == sessions[_session_Id].tutor_Id, "User not the tutor of this session");
        require(sessions[_session_Id].isRunning, "Session not running");
        requests[_id].status = sessionStatus.Cancelled;

        emit cancelledRequest(msg.sender,_id);
    }


    /// @notice This function allows the tutor to change the sell price
    /// @param _session_Id session id number
    /// @param _tutoring_price for the session
    function changeSellPrice(uint256 _session_Id, uint256 _tutoring_price) public {
        require(tutorAddresses[msg.sender] == sessions[_session_Id].tutor_Id, "User not the tutor of this session");
        sessions[_session_Id].tutoring_price = _tutoring_price;

        emit ChangeSellPrice(msg.sender, _session_Id, _tutoring_price);
    }

    /// @notice This function allows the tutor to change the running status
    /// @param _session_Id session id number
    function changeRunningStatus(uint256 _session_Id) public {
        require(tutorAddresses[msg.sender] == sessions[_session_Id].tutor_Id, "User not the tutor of this session");
        sessions[_session_Id].isRunning = !sessions[_session_Id].isRunning;

        emit ChangeRunningStatus(msg.sender, _session_Id, sessions[_session_Id].isRunning);
    }

    /// @return This function allows anyone to get the list of sessions based on the address of the tutor
    /// @param _address eth address for the tutor
    function getSessions(address _address) public view returns(uint256[] memory) {
        uint256 _tutor_Id = tutorAddresses[_address];
        return sessionOwners[_tutor_Id];
    }

    /// @return This function allows anyone to get the list of requests based on address of the tutor
    function getRequests(address _address) public view returns(uint256[] memory) {
        uint256 _userAddress = tutorAddresses[_address];
        return requestOwners[_userAddress];
    }

    /// @return This function allows anyone to get list of requests per session
    /// @param _session_Id session id number
    function getSessionRequests(uint256 _session_Id) public view returns(uint256[] memory) {
        return sessions[_session_Id].session_requests;
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
        uint256,
        string){
        Session memory _session = sessions[_session_Id];
        return (
        _session.tutor_Id,
        _session.session_uri,
        _session.session_requests,
        _session.isRunning,
        _session.tutoring_price,
        _details);
    }

    /// @return get the licences per owner
    /// @param _address of the account holder
    function getLicenceForAddress(address _address) public view returns(uint256[] memory) {
        uint256 _userNumber = tutorAddresses[_address];
        return licenceOwners[_userNumber];
    }

    function getLicence(uint256 _licenceId) public view returns(uint256, uint256, uint256){
        LicenceDesign memory _licence = licences[_licenceId];
        return (
        _licence.student_Id,
        _licence.session_Id,
        _licence.request_Id);
    }
}