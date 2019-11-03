# Thuto

## What we do?
Thuto is a decentralized platform that serves to connect students to tutors and vice-versa, using a smart contract to provide the interaction between parties, with no centralized data storage. Tutors can add sessions, if they are willing to provide tutoring to students, simiarly, they can choose at anytime to stop running sessions or change their tutoring price. Students are allowed to request to have a session with a specific tutor, add their prefered tutoring options. Both students and tutors can cancel, reject sessions, respectively if they wish to no longer have it. And tutors can accept requests. The payment is made in person, however, students hold Non-Fungible Tokens to attest that theyy have indeep received tutoring in the platform.

## How to set it up?

To run the project:

1) Clone the repo, on an application such as, gitKraken
2) Download [Ganache](https://www.trufflesuite.com/ganache)
3) Install [Homebrew](http://osxdaily.com/2018/03/07/how-install-homebrew-mac-os/)
4) Install [NPM & Node](https://treehouse.github.io/installation-guides/mac/node-mac.html)
5) Install [Truffle](https://www.trufflesuite.com/docs/truffle/getting-started/installation)
6) Install [Mocha](https://puppet.com/docs/pipelines-for-apps/enterprise/application-nodejs-mocha.html) dependency module


## Smart Contract

Ensure that Ganache is opened and the port 8545 is selected.

### Compile Contract

Run
```
$truffle compile
```

### Test Contract

Run
```
$truffle test
```