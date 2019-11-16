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

If no profile URL is provided then the user will not be able to proceed with the registration. Only when all the conditions are met the following functions will be executed. This ensures that the correct information is provided.

## TX.Origin Problem

Use of msg.sender to allow only the owner to perform actions, meaning, only an authorized entity can see certain features on the platform. For instance, if a user registers to the platform as a tutor, and wants to add sessions, a student can request a session... However, only the same tutor who listed the sessions can view and accept requests. All of this is enabled through msg.sender.

## Gas Limit

Not looping over arrays of undetermined length, and limiting the length of user supplied data. Gas limit ensures that functions dont run continuously, and also, to discourage functions to be called multiple times to slow down the network.

## Overflow and underflow

Tutoring price uint is specified. This will ensure that price is no extremely hig neither a number extremely low. For now there is no minimum or maximum ammount, to allow tutors to be flexible, therefore, this will help avoid such attacks

## Emergency stop 

For users who want to double register to the platform