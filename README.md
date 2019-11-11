# Thuto

## What we do?
Thuto is a decentralized platform that serves to connect students to tutors and vice-versa, using a smart contract to provide the interaction between parties, with no centralized data storage. Tutors can add sessions, if they are willing to provide tutoring to students, simiarly, they can choose at anytime to stop running sessions or change their tutoring price. Students are allowed to request to have a session with a specific tutor, add their prefered tutoring options. Both students and tutors can cancel, reject sessions, respectively if they wish to no longer have it. And tutors can accept requests. The payment is made in person, however, students hold Non-Fungible Tokens to attest that theyy have indeep received tutoring in the platform.

The link to Thuto App Demo is [here](https://www.figma.com/file/yvXw0viPrnAslWhYz3GEZt/Consensys?node-id=35%3A4688)

## How to set it up?

To run the project:

1) Clone the repo, on an application such as, [gitKraken](https://www.gitkraken.com/download)
2) Download [Ganache](https://www.trufflesuite.com/ganache)
3) Install [Homebrew](http://osxdaily.com/2018/03/07/how-install-homebrew-mac-os/)
4) Install [NPM & Node](https://treehouse.github.io/installation-guides/mac/node-mac.html)
5) Install [Truffle](https://www.trufflesuite.com/docs/truffle/getting-started/installation)

Once everyting is set:
Run the code below to install dependencies
```
npm install
```



## Smart Contract

Ensure that Ganache is opened and the port 8545 is selected.

### Compile Contract

Run
```
truffle compile
```

### Test Contract

Run
```
truffle test
```

## Local server set up

Now run

```
npm run dev
```

The front ent is launched, and you should see metamask pop up.
