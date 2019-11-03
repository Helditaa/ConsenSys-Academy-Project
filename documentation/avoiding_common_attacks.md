# Thuto Contract Avoids Attacks

## Decision Data

Use require statements to revert if a certain condition is not met. 

```
    function registerUser(string memory _profile_uri) public {
        require(bytes(_profile_uri).length > 0, "Profile URI should not be empty.");
        require(userAddresses[msg.sender]==0,"Tutor already registered.");
        uint256 id = users.push(User(msg.sender,_profile_uri));
        userAddresses[msg.sender] = id - 1;
    }
```

## TX.Origin Problem

Use of msg.sender to allow only the owner to perform actions

## Gas Limit

Not looping over arrays of undetermined length, and limiting the length of user supplied data

## Overflow and underflow

Tutoring price uint is specified.