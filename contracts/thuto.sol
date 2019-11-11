pragma solidity^0.5.0;



/// @title Thuto smart contract
/// @author Helda Mandlate

/// @dev import contracts from openzeppelin related to ownable and ERC20, ERC721 tokens
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Metadata.sol";
//import "./ERC20.sol";
//import "./IERC20.sol";

//import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
//import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol";

/// @notice contract begins here
contract thuto is ERC721Metadata {
    /// @notice Creates a struct for users of the plaform, needs their Ethereum address and profile URL
    struct User {
        address owned_address;
        string profile_uri;
    }
    /// @notice Creates an array of users that are registered
    User[] public users;

    /// @notice The mapping below maps all users' addresses to their userID
    mapping (address => uint256) public userAddresses ;

    /// @notice Creates session defined type
    enum sessionStatus {Pending, Accepted, Rejected, Cancelled}

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

    /**
    @notice Creates a struct for licencing
    @param student_Id of each tutoring session student
    @param session_Id of the tutoring session being requested
    @param request_Id The request Id for the session
    */
    struct LessonDesign {
        uint256 student_Id;
        uint256 session_Id;
        uint256 request_Id;
    }

    /// @notice Creates an array of accepted lessons
    LessonDesign[] public lessons;
    /// @notice Mapping of licence Id to get the licence owners
    mapping(uint256 => uint256[]) public sessionsOwners;
    /// @notice Mapping of licence Id to get the session Id
    mapping(uint256 => uint256[]) public sessionRequests;

    // Setting up events
    event newSession(
        address indexed _from,
        string _session_uri,
        uint256 _tutoring_price,
        string _details
    );

    event newRequest(
        address indexed _from,
        uint256 indexed _session_Id,
        string _details
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

    event ChangeTutoringPrice(
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
    /// @dev The constructor below reserves tutor 0 for all unregistered users
    /// @param _daiContractAddress DAI contract address
    constructor(address _daiContractAddress) public ERC721Metadata("Thuto Licence", "THUTO"){
        users.push(User(address(0), ""));
        lessons.push(LessonDesign(0, 0, 0));
        daiContract = ERC20(_daiContractAddress);
    }

    /// @notice This function registers a tutor on the platform by taking in their profile URL
    /// @param _profile_uri tutor profile url
    /// @dev If the tutor's address is in position 0 of the userAddresses array, they are unregistered
    /// @dev Create an instance of the tutor and add the Id to their address
    function registerUser(string memory _profile_uri) public {
        require(bytes(_profile_uri).length > 0, "Profile URI should not be empty.");
        require(userAddresses[msg.sender]==0,"Tutor already registered.");
        uint256 id = users.push(User(msg.sender,_profile_uri));
        userAddresses[msg.sender] = id - 1;
    }

    /// @notice This function creates a session on the system, with blank arrays for session requests and owners
    /// @notice since no one has requested a session for or bought a licence yet
    /// @dev The tutor only specifies the flat rate
    /// @dev Add instance to the respective arrays

    function addSession(
        string memory _session_uri,
        bool _isRunning,
        uint256 _tutoring_price, string memory _details) public {
        require(bytes(_session_uri).length > 0, "Session URI should not be empty.");
        require(userAddresses[msg.sender] != 0, "Tutor address is not registered.");
        require(_tutoring_price > 0, "Sell price not specified.");
        require(bytes(_details).length > 0, "Details should not be empty.");

        uint256 _tutor_Id = userAddresses[msg.sender];
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

    /// @notice This function creates a new request for a particular session
    /// @param _details for the session
    /// @param _session_Id is the index for the session Id
    /// @dev lesson Id is added to list of requested sessions
    function requestSession(uint256 _session_Id, string memory _details) public {
        require(sessions[_session_Id].tutor_Id != 0, "Session not enlisted.");
        require(sessions[_session_Id].isRunning, "Session is not running.");
        require(userAddresses[msg.sender] != 0, "Student address is not registered.");
        require(bytes(_details).length > 0, "Details should not be empty.");
        uint256 _id = requests.push(Request(sessionStatus.Pending, _session_Id, userAddresses[msg.sender]));
        sessions[_session_Id].session_requests.push(_id - 1);
        requestOwners[userAddresses[msg.sender]].push(_id - 1);

        emit newRequest(msg.sender, _session_Id, _details);
        
    }
    /**
    @param _id is the request Id
    @notice This function allows the tutor to accept the requests
    @dev parameters of licence design: student_Id, session id, request_Id
    @notice This function allows the tutor to reject the requests
    */
    function acceptRequest(uint256 _id) public {
        uint256 _session_Id = requests[_id].session_Id;
        require(userAddresses[msg.sender] == sessions[_session_Id].tutor_Id, "User not the tutor of this session");
        require(sessions[_session_Id].isRunning, "Session is not running");
        requests[_id].status = sessionStatus.Accepted;


        uint256 _lesson_Id = lessons.push(LessonDesign(requests[_id].student_Id, _session_Id, _id));
        requestOwners[requests[_id].student_Id].push(_lesson_Id);
        sessionRequests[_session_Id].push(_lesson_Id);
        _mint(users[requests[_id].student_Id].owned_address, _lesson_Id);
        emit acceptedRequest(msg.sender,_id);
    }

    /// @notice This function allows the tutor to reject the bids
    /// @param _id is the Request Id
    function rejectRequest(uint256 _id) public {
        uint256 _session_Id = requests[_id].session_Id;
        require(userAddresses[msg.sender] == sessions[_session_Id].tutor_Id, "User not the tutor of this session");
        require(sessions[_session_Id].isRunning, "Session not running");
        requests[_id].status = sessionStatus.Rejected;

        emit rejectedRequest(msg.sender,_id);
    }

    /// @notice This function allows the student to cancel the requests
    /// @param _id is the bid Id
    function cancelRequest(uint256 _id) public {
        //uint256 _session_Id = requests[_id].session_Id;
        // uint256 _session_Id = requests[_id].session_Id;
        uint256 _request_Id = requests[_id].student_Id;

        //uint256 _request_Id = sessions[_id].request_Id;
        require(userAddresses[msg.sender] == requests[_request_Id].student_Id, "Student not the owner of this request");
        requests[_id].status = sessionStatus.Cancelled;

        emit cancelledRequest(msg.sender,_id);
    }


    /// @notice This function allows the tutor to change the sell price
    /// @param _session_Id session id number
    /// @param _tutoring_price for the session
    function changeTutoringPrice(uint256 _session_Id, uint256 _tutoring_price) public {
        require(userAddresses[msg.sender] == sessions[_session_Id].tutor_Id, "User not the tutor of this session");
        sessions[_session_Id].tutoring_price = _tutoring_price;

        emit ChangeTutoringPrice(msg.sender, _session_Id, _tutoring_price);
    }

    /// @notice This function allows the tutor to change the running status
    /// @param _session_Id session id number
    function changeRunningStatus(uint256 _session_Id) public {
        require(userAddresses[msg.sender] == sessions[_session_Id].tutor_Id, "User not the tutor of this session");
        sessions[_session_Id].isRunning = !sessions[_session_Id].isRunning;

        emit ChangeRunningStatus(msg.sender, _session_Id, sessions[_session_Id].isRunning);
    }

    /// @return This function allows anyone to get the list of sessions based on the address of the tutor
    /// @param _address eth address for the tutor
    function getSessions(address _address) public view returns(uint256[] memory) {
        uint256 _tutor_Id = userAddresses[_address];
        return sessionOwners[_tutor_Id];
    }

    /// @return This function allows anyone to get the list of requests based on address of the tutor
    function getRequests(address _address) public view returns(uint256[] memory) {
        uint256 _userAddress = userAddresses[_address];
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
        string memory){
        Session memory _session = sessions[_session_Id];
        return (
        _session.tutor_Id,
        _session.session_uri,
        _session.session_requests,
        _session.isRunning,
        _session.tutoring_price,
        _session.details);
    }

    /// @return get the lessons per owner
    /// @param _address of the account holder
    function getLessonForAddress(address _address) public view returns(uint256[] memory) {
        uint256 _userNumber = userAddresses[_address];
        return requestOwners[_userNumber];
    }

    function getLessons(uint256 _lessonId) public view returns(uint256, uint256, uint256){
        LessonDesign memory _lesson = lessons[_lessonId];
        return (
        _lesson.student_Id,
        _lesson.session_Id,
        _lesson.request_Id);
    }
}